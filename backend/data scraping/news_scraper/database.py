"""
Database models and connection management for news scraping system.
"""
import asyncpg
import asyncio
import logging
from typing import Optional, Dict, Any, List
from datetime import datetime
import json
import os
from contextlib import asynccontextmanager

logger = logging.getLogger(__name__)

class DatabaseManager:
    def __init__(self, connection_string: str):
        self.connection_string = connection_string
        self.pool = None
    
    async def initialize(self):
        """Initialize database connection pool and create tables."""
        try:
            self.pool = await asyncpg.create_pool(
                self.connection_string,
                min_size=5,
                max_size=20,
                command_timeout=60
            )
            await self.create_tables()
            logger.info("Database initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize database: {e}")
            raise
    
    async def close(self):
        """Close database connection pool."""
        if self.pool:
            await self.pool.close()
            logger.info("Database connection pool closed")
    
    @asynccontextmanager
    async def get_connection(self):
        """Get database connection from pool."""
        async with self.pool.acquire() as connection:
            yield connection
    
    async def create_tables(self):
        """Create necessary database tables."""
        create_tables_sql = """
        -- Enable pgvector extension for vector storage
        CREATE EXTENSION IF NOT EXISTS vector;
        
        -- News sources table
        CREATE TABLE IF NOT EXISTS news_sources (
            id SERIAL PRIMARY KEY,
            name VARCHAR(100) NOT NULL UNIQUE,
            base_url VARCHAR(255) NOT NULL,
            scraper_type VARCHAR(50) NOT NULL,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        -- News articles table
        CREATE TABLE IF NOT EXISTS news_articles (
            id SERIAL PRIMARY KEY,
            source_id INTEGER REFERENCES news_sources(id),
            title TEXT NOT NULL,
            url TEXT NOT NULL UNIQUE,
            published_date TIMESTAMP,
            content TEXT,
            summary TEXT,
            main_image_url TEXT,
            author VARCHAR(255),
            category VARCHAR(100),
            tags TEXT[], -- Array of tags
            scraped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            is_processed BOOLEAN DEFAULT FALSE,
            embedding vector(768), -- BAAI/bge-base-en-v1.5 embedding dimension
            metadata JSONB DEFAULT '{}'::jsonb
        );
        
        -- Scraping logs table
        CREATE TABLE IF NOT EXISTS scraping_logs (
            id SERIAL PRIMARY KEY,
            source_id INTEGER REFERENCES news_sources(id),
            status VARCHAR(20) NOT NULL, -- success, error, warning
            message TEXT,
            articles_scraped INTEGER DEFAULT 0,
            articles_failed INTEGER DEFAULT 0,
            started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            completed_at TIMESTAMP,
            error_details JSONB DEFAULT '{}'::jsonb
        );
        
        -- Create indexes for better performance
        CREATE INDEX IF NOT EXISTS idx_articles_source_id ON news_articles(source_id);
        CREATE INDEX IF NOT EXISTS idx_articles_published_date ON news_articles(published_date);
        CREATE INDEX IF NOT EXISTS idx_articles_url ON news_articles(url);
        CREATE INDEX IF NOT EXISTS idx_articles_scraped_at ON news_articles(scraped_at);
        CREATE INDEX IF NOT EXISTS idx_articles_embedding ON news_articles USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
        CREATE INDEX IF NOT EXISTS idx_logs_source_status ON scraping_logs(source_id, status);
        """
        
        async with self.get_connection() as conn:
            await conn.execute(create_tables_sql)
        
        # Insert default news sources
        await self.insert_default_sources()
        logger.info("Database tables created successfully")
    
    async def insert_default_sources(self):
        """Insert default news sources."""
        sources = [
            ('Al Jazeera', 'https://www.aljazeera.com', 'aljazeera'),
            ('BBC', 'https://www.bbc.com', 'bbc'),
            ('The Guardian', 'https://www.theguardian.com', 'guardian'),
            ('Crypto News', 'https://cryptoslate.com', 'crypto')
        ]
        
        async with self.get_connection() as conn:
            for name, base_url, scraper_type in sources:
                await conn.execute("""
                    INSERT INTO news_sources (name, base_url, scraper_type)
                    VALUES ($1, $2, $3)
                    ON CONFLICT (name) DO NOTHING
                """, name, base_url, scraper_type)
    
    async def insert_article(self, article_data: Dict[str, Any]) -> Optional[int]:
        """Insert a new article into the database."""
        try:
            async with self.get_connection() as conn:
                article_id = await conn.fetchval("""
                    INSERT INTO news_articles (
                        source_id, title, url, published_date, content, 
                        summary, main_image_url, author, category, tags, metadata
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                    ON CONFLICT (url) DO UPDATE SET
                        title = EXCLUDED.title,
                        content = EXCLUDED.content,
                        summary = EXCLUDED.summary,
                        main_image_url = EXCLUDED.main_image_url,
                        updated_at = CURRENT_TIMESTAMP
                    RETURNING id
                """, 
                    article_data['source_id'],
                    article_data['title'],
                    article_data['url'],
                    article_data.get('published_date'),
                    article_data['content'],
                    article_data.get('summary'),
                    article_data.get('main_image_url'),
                    article_data.get('author'),
                    article_data.get('category'),
                    article_data.get('tags', []),
                    json.dumps(article_data.get('metadata', {}))
                )
                return article_id
        except Exception as e:
            logger.error(f"Failed to insert article {article_data.get('url', 'unknown')}: {e}")
            return None
    
    async def update_article_embedding(self, article_id: int, embedding: List[float]):
        """Update article with vector embedding."""
        try:
            async with self.get_connection() as conn:
                await conn.execute("""
                    UPDATE news_articles 
                    SET embedding = $1, is_processed = TRUE, updated_at = CURRENT_TIMESTAMP
                    WHERE id = $2
                """, embedding, article_id)
                logger.debug(f"Updated embedding for article {article_id}")
        except Exception as e:
            logger.error(f"Failed to update embedding for article {article_id}: {e}")
    
    async def get_source_id(self, source_name: str) -> Optional[int]:
        """Get source ID by name."""
        try:
            async with self.get_connection() as conn:
                return await conn.fetchval(
                    "SELECT id FROM news_sources WHERE name = $1", source_name
                )
        except Exception as e:
            logger.error(f"Failed to get source ID for {source_name}: {e}")
            return None
    
    async def log_scraping_activity(self, source_id: int, status: str, 
                                  message: str = None, articles_scraped: int = 0, 
                                  articles_failed: int = 0, error_details: Dict = None):
        """Log scraping activity."""
        try:
            async with self.get_connection() as conn:
                await conn.execute("""
                    INSERT INTO scraping_logs (
                        source_id, status, message, articles_scraped, 
                        articles_failed, completed_at, error_details
                    ) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, $6)
                """, 
                    source_id, status, message, articles_scraped, 
                    articles_failed, json.dumps(error_details or {})
                )
        except Exception as e:
            logger.error(f"Failed to log scraping activity: {e}")
    
    async def get_existing_urls(self, source_id: int, limit: int = 1000) -> set:
        """Get existing URLs for a source to avoid duplicates."""
        try:
            async with self.get_connection() as conn:
                rows = await conn.fetch("""
                    SELECT url FROM news_articles 
                    WHERE source_id = $1 
                    ORDER BY scraped_at DESC 
                    LIMIT $2
                """, source_id, limit)
                return {row['url'] for row in rows}
        except Exception as e:
            logger.error(f"Failed to get existing URLs for source {source_id}: {e}")
            return set()
    
    async def get_unprocessed_articles(self, limit: int = 100) -> List[Dict]:
        """Get articles that need embedding processing."""
        try:
            async with self.get_connection() as conn:
                rows = await conn.fetch("""
                    SELECT id, title, content, summary 
                    FROM news_articles 
                    WHERE is_processed = FALSE AND content IS NOT NULL
                    ORDER BY scraped_at DESC
                    LIMIT $1
                """, limit)
                return [dict(row) for row in rows]
        except Exception as e:
            logger.error(f"Failed to get unprocessed articles: {e}")
            return []
    
    async def get_recent_articles(self, limit: int = 50) -> List[Dict]:
        """Get recent articles for API responses."""
        try:
            async with self.get_connection() as conn:
                rows = await conn.fetch("""
                    SELECT a.id, a.title, a.url, a.published_date, a.summary,
                           a.main_image_url, a.author, a.category, a.tags,
                           s.name as source_name
                    FROM news_articles a
                    JOIN news_sources s ON a.source_id = s.id
                    WHERE a.content IS NOT NULL
                    ORDER BY a.published_date DESC, a.scraped_at DESC
                    LIMIT $1
                """, limit)
                return [dict(row) for row in rows]
        except Exception as e:
            logger.error(f"Failed to get recent articles: {e}")
            return []
    
    async def search_articles(self, query_embedding: List[float], limit: int = 10) -> List[Dict]:
        """Search articles using vector similarity."""
        try:
            async with self.get_connection() as conn:
                rows = await conn.fetch("""
                    SELECT a.id, a.title, a.url, a.published_date, a.summary,
                           a.main_image_url, a.content, s.name as source_name,
                           1 - (a.embedding <=> $1) as similarity
                    FROM news_articles a
                    JOIN news_sources s ON a.source_id = s.id
                    WHERE a.embedding IS NOT NULL
                    ORDER BY a.embedding <=> $1
                    LIMIT $2
                """, query_embedding, limit)
                return [dict(row) for row in rows]
        except Exception as e:
            logger.error(f"Failed to search articles: {e}")
            return []

# Database connection string from environment
DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql://username:password@localhost/newsdb')

# Global database manager instance
db_manager = DatabaseManager(DATABASE_URL)
