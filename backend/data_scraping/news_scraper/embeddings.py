"""
Embedding processor for generating vector embeddings for news articles using BAAI/bge-base-en-v1.5.
"""
import asyncio
import logging
from typing import List, Dict, Any, Optional
import torch
from sentence_transformers import SentenceTransformer
import numpy as np
from datetime import datetime
import re

from .config import EMBEDDING_CONFIG, CONTENT_CONFIG
from .database import db_manager

logger = logging.getLogger(__name__)

class BGEEmbeddingProcessor:
    """Handles generation and storage of vector embeddings using BAAI/bge-base-en-v1.5."""
    
    def __init__(self):
        self.model = None
        self.device = None
        self.processed_count = 0
        self.failed_count = 0
        self.gpu_available = torch.cuda.is_available()
        
        
    async def initialize(self):
        """Initialize the BGE embedding model."""
        try:
            # Determine device
            if EMBEDDING_CONFIG['device'] == 'auto':
                self.device = 'cuda' if torch.cuda.is_available() else 'cpu'
            else:
                self.device = EMBEDDING_CONFIG['device']
            
            logger.info(f"Initializing BGE model on device: {self.device}")
            if self.device == 'cuda':
                gpu_name = torch.cuda.get_device_name(0)
                gpu_memory = torch.cuda.get_device_properties(0).total_memory / 1e9
                logger.info(f"GPU: {gpu_name} ({gpu_memory:.1f} GB)")
            else:
                logger.info("Using CPU for embeddings")

            # Load the model
            self.model = SentenceTransformer(
                EMBEDDING_CONFIG['model_name'],
                device=self.device
            )
            
            # Set model to evaluation mode for inference
            self.model.eval()
            
            # GPU-specific optimizations
            if self.device == 'cuda':
                # Enable mixed precision for faster inference
                torch.backends.cudnn.benchmark = True
                # Pre-allocate GPU memory for better performance
                torch.cuda.empty_cache()
            
            logger.info(f"BGE model {EMBEDDING_CONFIG['model_name']} loaded successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize BGE model: {e}")
            raise
    
    def prepare_text_for_embedding(self, title: str, content: str, summary: str = None, tags: List[str] = None) -> str:
        """Prepare text for embedding generation."""
        # For BGE model, we use a specific format for better performance
        parts = []
        
        if title:
            parts.append(f"Title: {title}")
        
        if summary:
            parts.append(f"Summary: {summary}")
            
        if tags:
            tags_str = ", ".join(tags)
            parts.append(f"Tags: {tags_str}")
        
        if content:
            # Truncate content if too long (BGE has max length of 512 tokens)
            max_content_length = CONTENT_CONFIG['max_content_length']
            if len(content) > max_content_length:
                content = content[:max_content_length] + "..."
            parts.append(f"Content: {content}")
        
        text = "\n\n".join(parts)
        
        # BGE models work better with reasonable length text
        # Truncate if too long (roughly estimate tokens as words * 1.3)
        max_chars = EMBEDDING_CONFIG['max_length'] * 4  # Rough estimate
        if len(text) > max_chars:
            text = text[:max_chars] + "..."
            logger.debug(f"Truncated text to {len(text)} characters")
        
        return text
    
    async def generate_embedding(self, text: str) -> Optional[List[float]]:
        """Generate embedding for given text using BGE model."""
        try:
            if not self.model:
                logger.error("BGE model not initialized")
                return None
            
            # BGE models benefit from this instruction prefix for retrieval tasks
            # Add instruction for better embedding quality
            if not text.startswith("Represent this document for retrieval:"):
                text = f"Represent this document for retrieval: {text}"
            
            # Generate embedding
            with torch.no_grad():
                embedding = self.model.encode(
                    text,
                    normalize_embeddings=EMBEDDING_CONFIG['normalize_embeddings'],
                    convert_to_tensor=False,
                    show_progress_bar=False
                )
            
            # Convert to list if numpy array
            if isinstance(embedding, np.ndarray):
                embedding = embedding.tolist()
            
            logger.debug(f"Generated BGE embedding with {len(embedding)} dimensions")
            return embedding
            
        except Exception as e:
            logger.error(f"Error generating BGE embedding: {e}")
            return None
    
    async def generate_batch_embeddings(self, texts: List[str]) -> List[Optional[List[float]]]:
        """Generate embeddings for a batch of texts."""
        try:
            if not self.model:
                logger.error("BGE model not initialized")
                return [None] * len(texts)
            
            # Add instruction prefix to all texts
            prefixed_texts = [
                f"Represent this document for retrieval: {text}" 
                if not text.startswith("Represent this document for retrieval:") 
                else text 
                for text in texts
            ]
            
            batch_size = EMBEDDING_CONFIG['batch_size']
            if self.device == 'cuda':
                # Check GPU memory and adjust batch size dynamically
                gpu_memory_gb = torch.cuda.get_device_properties(0).total_memory / 1e9
                if gpu_memory_gb < 6:  # Less than 6GB GPU
                    batch_size = min(batch_size, 16)
                elif gpu_memory_gb < 12:  # Less than 12GB GPU
                    batch_size = min(batch_size, 32)
                # else use default batch_size for high-end GPUs
            
            
            # Generate batch embeddings
            with torch.no_grad():
                embeddings = self.model.encode(
                    prefixed_texts,
                    normalize_embeddings=EMBEDDING_CONFIG['normalize_embeddings'],
                    convert_to_tensor=False,
                    show_progress_bar=False,
                    batch_size=batch_size
                )
            
            # Convert to list of lists
            if isinstance(embeddings, np.ndarray):
                embeddings = embeddings.tolist()
            
            logger.debug(f"Generated {len(embeddings)} BGE embeddings in batch")
            return embeddings
            
        except Exception as e:
            logger.error(f"Error generating batch BGE embeddings: {e}")
            return [None] * len(texts)
    
    async def process_article_embedding(self, article: Dict[str, Any]) -> bool:
        """Process embedding for a single article."""
        try:
            article_id = article['id']
            title = article.get('title', '')
            content = article.get('content', '')
            summary = article.get('summary', '')
            tags = article.get('tags', [])
            
            # Prepare text for embedding
            text = self.prepare_text_for_embedding(title, content, summary, tags)
            
            if not text.strip():
                logger.warning(f"No text to embed for article {article_id}")
                return False
            
            # Generate embedding
            embedding = await self.generate_embedding(text)
            
            if embedding:
                # Save embedding to database
                await db_manager.update_article_embedding(article_id, embedding)
                self.processed_count += 1
                logger.debug(f"Processed BGE embedding for article {article_id}")
                return True
            else:
                logger.error(f"Failed to generate BGE embedding for article {article_id}")
                self.failed_count += 1
                return False
                
        except Exception as e:
            logger.error(f"Error processing BGE embedding for article {article.get('id', 'unknown')}: {e}")
            self.failed_count += 1
            return False
    
    async def process_batch_embeddings(self, articles: List[Dict[str, Any]]) -> Dict[str, int]:
        """Process embeddings for a batch of articles efficiently."""
        if not articles:
            return {'processed': 0, 'failed': 0}
        
        logger.info(f"Processing BGE embeddings for {len(articles)} articles")
        
        # Prepare all texts
        texts = []
        article_ids = []
        
        for article in articles:
            title = article.get('title', '')
            content = article.get('content', '')
            summary = article.get('summary', '')
            tags = article.get('tags', [])
            
            text = self.prepare_text_for_embedding(title, content, summary, tags)
            if text.strip():
                texts.append(text)
                article_ids.append(article['id'])
        
        if not texts:
            logger.warning("No valid texts to process")
            return {'processed': 0, 'failed': 0}
        
        # Process in batches
        batch_size = EMBEDDING_CONFIG['batch_size']
        processed = 0
        failed = 0
        
        for i in range(0, len(texts), batch_size):
            batch_texts = texts[i:i + batch_size]
            batch_ids = article_ids[i:i + batch_size]
            
            # Generate batch embeddings
            embeddings = await self.generate_batch_embeddings(batch_texts)
            
            # Save embeddings to database
            for article_id, embedding in zip(batch_ids, embeddings):
                if embedding:
                    try:
                        await db_manager.update_article_embedding(article_id, embedding)
                        processed += 1
                    except Exception as e:
                        logger.error(f"Failed to save embedding for article {article_id}: {e}")
                        failed += 1
                else:
                    failed += 1
            
            logger.info(f"Processed batch {i//batch_size + 1}: {len([e for e in embeddings if e])}/{len(embeddings)} successful")
        
        self.processed_count += processed
        self.failed_count += failed
        
        return {
            'processed': processed,
            'failed': failed,
            'total': len(articles)
        }
    
    async def process_unprocessed_articles(self, limit: int = 100) -> Dict[str, int]:
        """Process embeddings for unprocessed articles."""
        try:
            logger.info("Starting BGE embedding processing for unprocessed articles")
            
            # Get unprocessed articles
            articles = await db_manager.get_unprocessed_articles(limit)
            
            if not articles:
                logger.info("No unprocessed articles found")
                return {'processed': 0, 'failed': 0, 'total': 0}
            
            # Reset counters
            self.processed_count = 0
            self.failed_count = 0
            
            # Process embeddings efficiently
            result = await self.process_batch_embeddings(articles)
            
            logger.info(f"BGE embedding processing completed: {result}")
            return result
            
        except Exception as e:
            logger.error(f"Error in BGE embedding processing: {e}")
            return {
                'processed': self.processed_count,
                'failed': self.failed_count,
                'error': str(e)
            }
    
    async def generate_query_embedding(self, query: str) -> Optional[List[float]]:
        """Generate embedding for a search query."""
        try:
            # For search queries, use a different instruction prefix
            query_text = f"Represent this query for retrieving relevant documents: {query}"
            
            # Generate embedding
            embedding = await self.generate_embedding(query_text)
            return embedding
            
        except Exception as e:
            logger.error(f"Error generating query embedding: {e}")
            return None
    
    async def search_similar_articles(self, query: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Search for articles similar to the query."""
        try:
            # Generate query embedding
            query_embedding = await self.generate_query_embedding(query)
            
            if not query_embedding:
                logger.error("Failed to generate query embedding")
                return []
            
            # Search in database
            articles = await db_manager.search_articles(query_embedding, limit)
            
            logger.info(f"Found {len(articles)} similar articles for query: {query}")
            return articles
            
        except Exception as e:
            logger.error(f"Error searching similar articles: {e}")
            return []
    
    async def cleanup(self):
        """Cleanup resources."""
        if hasattr(self, 'model') and self.model:
            # Clear CUDA cache if using GPU
            if self.device == 'cuda':
                torch.cuda.empty_cache()
        logger.info("BGE embedding processor cleaned up")

# Global embedding processor instance
embedding_processor = BGEEmbeddingProcessor()

class EmbeddingService:
    """Service for managing embedding operations using BGE model."""
    
    @staticmethod
    async def initialize():
        """Initialize embedding service."""
        await embedding_processor.initialize()
    
    @staticmethod
    async def process_embeddings(limit: int = 100) -> Dict[str, int]:
        """Process embeddings for unprocessed articles."""
        return await embedding_processor.process_unprocessed_articles(limit)
    
    @staticmethod
    async def search_articles(query: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Search for similar articles."""
        return await embedding_processor.search_similar_articles(query, limit)
    
    @staticmethod
    async def cleanup():
        """Cleanup embedding service."""
        await embedding_processor.cleanup()
