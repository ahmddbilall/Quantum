"""
Main news scraper manager - entry point for the news scraping system.
"""
import asyncio
import logging
import sys
import argparse
import platform
from typing import Dict, Any, Optional
from datetime import datetime

from .config import get_config
from .logging_utils import setup_logging, perf_logger, error_tracker, metrics_tracker
from .scheduler import SchedulerService, setup_signal_handlers
from .database import db_manager
from .embeddings import EmbeddingService

# Setup logging first
setup_logging()

logger = logging.getLogger(__name__)



class NewsScraperManager:
    """Main manager for the news scraping system."""
    
    def __init__(self):
        self.config = get_config()
        self.initialized = False
    
    async def initialize(self):
        """Initialize the news scraper system."""
        if self.initialized:
            return
        
        logger.info("Initializing News Scraper System")
        perf_logger.start_timer('system_initialization')
        
        try:
            # Initialize scheduler service
            await SchedulerService.initialize()
            
            self.initialized = True
            duration = perf_logger.end_timer('system_initialization')
            logger.info(f"News Scraper System initialized successfully in {duration:.2f} seconds")
            
        except Exception as e:
            error_tracker.log_error(e, {'operation': 'system_initialization'})
            logger.error(f"Failed to initialize News Scraper System: {e}")
            raise
    
    async def cleanup(self):
        """Cleanup the news scraper system."""
        if not self.initialized:
            return
        
        logger.info("Cleaning up News Scraper System")
        
        try:
            await SchedulerService.cleanup()
            self.initialized = False
            logger.info("News Scraper System cleaned up successfully")
            
        except Exception as e:
            error_tracker.log_error(e, {'operation': 'system_cleanup'})
            logger.error(f"Error during system cleanup: {e}")
    
    async def run_continuous(self):
        """Run the system continuously with scheduler."""
        if not self.initialized:
            await self.initialize()
        
        logger.info("Starting continuous news scraping")
        
        try:
            # Setup signal handlers
            setup_signal_handlers()
            
            # Start the scheduler
            await SchedulerService.start()
            
            # Keep the system running
            logger.info("News scraping system is running continuously. Press Ctrl+C to stop.")
            
            # Wait indefinitely
            while True:
                await asyncio.sleep(3600)  # Check every hour
                
        except KeyboardInterrupt:
            logger.info("Received interrupt signal, shutting down...")
        except Exception as e:
            error_tracker.log_error(e, {'operation': 'continuous_run'})
            logger.error(f"Error in continuous run: {e}")
        finally:
            await SchedulerService.stop()
            await self.cleanup()
    
    async def run_once(self) -> Dict[str, Any]:
        """Run scraping, API ingestion, and embedding processing once."""
        if not self.initialized:
            await self.initialize()
        
        logger.info("Running one-time scraping and processing")
        perf_logger.start_timer('run_once')
        
        try:
            result = await SchedulerService.run_once()
            
            duration = perf_logger.end_timer('run_once', {
                'articles_scraped': result.get('scraping', {}).get('total_scraped', 0),
                'api_news_upserted': result.get('api_news', {}).get('upserted', 0),
                'embeddings_processed': result.get('embeddings', {}).get('processed', 0)
            })
            
            logger.info(f"One-time run completed in {duration:.2f} seconds")
            return result
            
        except Exception as e:
            error_tracker.log_error(e, {'operation': 'run_once'})
            logger.error(f"Error in one-time run: {e}")
            raise
        finally:
            await self.cleanup()
    
    async def scrape_source(self, source_name: str) -> Dict[str, Any]:
        """Scrape a specific news source."""
        if not self.initialized:
            await self.initialize()
        
        logger.info(f"Scraping specific source: {source_name}")
        perf_logger.start_timer(f'scrape_{source_name}')
        
        try:
            result = await SchedulerService.scrape_source(source_name)
            
            duration = perf_logger.end_timer(f'scrape_{source_name}', {
                'source': source_name,
                'articles_scraped': result.get('scraped', 0),
                'articles_failed': result.get('failed', 0)
            })
            
            logger.info(f"Source {source_name} scraped in {duration:.2f} seconds")
            return result
            
        except Exception as e:
            error_tracker.log_error(e, {'operation': 'scrape_source', 'source': source_name})
            logger.error(f"Error scraping source {source_name}: {e}")
            raise
        finally:
            await self.cleanup()
    
    async def process_embeddings(self) -> Dict[str, int]:
        """Process embeddings for unprocessed articles."""
        if not self.initialized:
            await self.initialize()
        
        logger.info("Processing embeddings")
        perf_logger.start_timer('process_embeddings')
        
        try:
            result = await SchedulerService.process_embeddings()
            
            duration = perf_logger.end_timer('process_embeddings', {
                'embeddings_processed': result.get('processed', 0),
                'embeddings_failed': result.get('failed', 0)
            })
            
            logger.info(f"Embeddings processed in {duration:.2f} seconds")
            return result
            
        except Exception as e:
            error_tracker.log_error(e, {'operation': 'process_embeddings'})
            logger.error(f"Error processing embeddings: {e}")
            raise
        finally:
            await self.cleanup()

    async def process_api_news(self) -> Dict[str, Any]:
        """Process API-based general/world news ingestion."""
        if not self.initialized:
            await self.initialize()

        logger.info("Processing API news pipeline")
        perf_logger.start_timer('process_api_news')

        try:
            result = await SchedulerService.process_api_news()

            duration = perf_logger.end_timer('process_api_news', {
                'api_news_upserted': result.get('upserted', 0),
                'api_news_failed': result.get('failed', 0)
            })

            logger.info(f"API news processed in {duration:.2f} seconds")
            return result

        except Exception as e:
            error_tracker.log_error(e, {'operation': 'process_api_news'})
            logger.error(f"Error processing API news: {e}")
            raise
        finally:
            await self.cleanup()
    
    async def search_articles(self, query: str, limit: int = 10) -> Dict[str, Any]:
        """Search for articles using semantic search."""
        if not self.initialized:
            await self.initialize()
        
        logger.info(f"Searching articles for query: {query}")
        perf_logger.start_timer('search_articles')
        
        try:
            articles = await EmbeddingService.search_articles(query, limit)
            
            duration = perf_logger.end_timer('search_articles', {
                'query': query,
                'results_count': len(articles)
            })
            
            result = {
                'query': query,
                'articles': articles,
                'count': len(articles),
                'search_time': duration
            }
            
            logger.info(f"Search completed in {duration:.2f} seconds, found {len(articles)} articles")
            return result
            
        except Exception as e:
            error_tracker.log_error(e, {'operation': 'search_articles', 'query': query})
            logger.error(f"Error searching articles: {e}")
            raise
        finally:
            await self.cleanup()
    
    async def get_recent_articles(self, limit: int = 50) -> Dict[str, Any]:
        """Get recent articles."""
        if not self.initialized:
            await self.initialize()
        
        logger.info(f"Getting {limit} recent articles")
        
        try:
            articles = await db_manager.get_recent_articles(limit)
            
            result = {
                'articles': articles,
                'count': len(articles),
                'timestamp': datetime.now().isoformat()
            }
            
            logger.info(f"Retrieved {len(articles)} recent articles")
            return result
            
        except Exception as e:
            error_tracker.log_error(e, {'operation': 'get_recent_articles'})
            logger.error(f"Error getting recent articles: {e}")
            raise
        finally:
            await self.cleanup()
    
    def get_system_stats(self) -> Dict[str, Any]:
        """Get system statistics."""
        return {
            'initialized': self.initialized,
            'error_stats': error_tracker.get_error_stats(),
            'active_sessions': metrics_tracker.get_active_sessions(),
            'config': {
                'environment': self.config['environment'],
                'debug': self.config['debug'],
                'sources': list(self.config['sources'].keys())
            },
            'timestamp': datetime.now().isoformat()
        }



# Global manager instance
news_manager = NewsScraperManager()

async def main():
    """Main entry point for the news scraper."""
    parser = argparse.ArgumentParser(description='News Scraper System')
    parser.add_argument('command', choices=[
        'run', 'run-once', 'scrape', 'embeddings', 'api-news', 'search', 'recent'
    ], help='Command to execute')
    parser.add_argument('--source', help='Specific source to scrape (for scrape command)')
    parser.add_argument('--query', help='Search query (for search command)')
    parser.add_argument('--limit', type=int, default=10, help='Limit for results')
    
    args = parser.parse_args()
    
    try:
        if args.command == 'run':
            # Run continuously
            await news_manager.run_continuous()
            
        elif args.command == 'run-once':
            # Run once
            result = await news_manager.run_once()
            print(f"Results: {result}")
            
        elif args.command == 'scrape':
            # Scrape specific source
            if not args.source:
                logger.error("--source argument required for scrape command")
                sys.exit(1)
            
            result = await news_manager.scrape_source(args.source)
            print(f"Results: {result}")
            
        elif args.command == 'embeddings':
            # Process embeddings
            result = await news_manager.process_embeddings()
            print(f"Results: {result}")

        elif args.command == 'api-news':
            # Process API news ingestion
            result = await news_manager.process_api_news()
            print(f"Results: {result}")
            
        elif args.command == 'search':
            # Search articles
            if not args.query:
                logger.error("--query argument required for search command")
                sys.exit(1)
            
            result = await news_manager.search_articles(args.query, args.limit)
            print(f"Found {result['count']} articles:")
            for article in result['articles']:
                print(f"- {article['title']} (similarity: {article.get('similarity', 'N/A')})")
            
        elif args.command == 'recent':
            # Get recent articles
            result = await news_manager.get_recent_articles(args.limit)
            print(f"Recent {result['count']} articles:")
            for article in result['articles']:
                print(f"- {article['title']} ({article['source_name']})")
        
    except KeyboardInterrupt:
        logger.info("Operation interrupted by user")
    except Exception as e:
        logger.error(f"Error in main: {e}")
        sys.exit(1)

if __name__ == '__main__':
    # Fix for Windows: aiodns requires SelectorEventLoop
    if platform.system() == 'Windows':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    
    asyncio.run(main())
