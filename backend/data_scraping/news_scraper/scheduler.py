"""
Scheduler for automated news scraping and processing.
"""
import asyncio
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Any
import signal
import sys

from .config import SCHEDULER_CONFIG, NEWS_SOURCES
from .database import db_manager
from .scrapers import create_scraper
from .embeddings import EmbeddingService

logger = logging.getLogger(__name__)

class NewsScrapingScheduler:
    """Scheduler for automated news scraping and processing."""
    
    def __init__(self):
        self.running = False
        self.tasks = []
        self.scraping_task = None
        self.embedding_task = None
        self.cleanup_task = None
        
    async def initialize(self):
        """Initialize the scheduler."""
        logger.info("Initializing news scraping scheduler")
        
        # Initialize database
        await db_manager.initialize()
        
        # Initialize embedding service
        await EmbeddingService.initialize()
        
        logger.info("Scheduler initialized successfully")
    
    async def cleanup(self):
        """Cleanup scheduler resources."""
        logger.info("Cleaning up scheduler")
        
        # Cancel all tasks
        for task in self.tasks:
            if not task.done():
                task.cancel()
        
        # Wait for tasks to complete
        if self.tasks:
            await asyncio.gather(*self.tasks, return_exceptions=True)
        
        # Cleanup services
        await EmbeddingService.cleanup()
        await db_manager.close()
        
        logger.info("Scheduler cleanup completed")
    
    async def scrape_all_sources(self) -> Dict[str, Any]:
        """Scrape all configured news sources."""
        logger.info("Starting scraping cycle for all sources")
        results = {}
        
        for source_name, source_config in NEWS_SOURCES.items():
            try:
                logger.info(f"Scraping {source_name}")
                
                # Create and run scraper
                scraper = create_scraper(source_name, source_config)
                
                async with scraper:
                    result = await scraper.scrape_all()
                    results[source_name] = result
                    
                    logger.info(f"Completed {source_name}: "
                               f"{result.get('scraped', 0)} articles scraped, "
                               f"{result.get('failed', 0)} failed")
                
                # Add delay between sources
                await asyncio.sleep(5)
                
            except Exception as e:
                logger.error(f"Error scraping {source_name}: {e}")
                results[source_name] = {'error': str(e), 'scraped': 0, 'failed': 0}
        
        # Summary
        total_scraped = sum(r.get('scraped', 0) for r in results.values())
        total_failed = sum(r.get('failed', 0) for r in results.values())
        
        logger.info(f"Scraping cycle completed: {total_scraped} total articles scraped, "
                   f"{total_failed} total failed")
        
        return {
            'total_scraped': total_scraped,
            'total_failed': total_failed,
            'results': results,
            'timestamp': datetime.now().isoformat()
        }
    
    async def process_embeddings(self) -> Dict[str, int]:
        """Process embeddings for unprocessed articles."""
        logger.info("Starting embedding processing cycle")
        
        try:
            result = await EmbeddingService.process_embeddings(limit=200)
            
            logger.info(f"Embedding processing completed: "
                       f"{result.get('processed', 0)} processed, "
                       f"{result.get('failed', 0)} failed")
            
            return result
            
        except Exception as e:
            logger.error(f"Error in embedding processing: {e}")
            return {'processed': 0, 'failed': 0, 'error': str(e)}
    
    async def cleanup_old_data(self) -> Dict[str, int]:
        """Cleanup old data and logs."""
        logger.info("Starting data cleanup cycle")
        
        try:
            # This would implement cleanup logic
            # For now, just log the attempt
            logger.info("Data cleanup cycle completed")
            return {'cleaned': 0}
            
        except Exception as e:
            logger.error(f"Error in data cleanup: {e}")
            return {'cleaned': 0, 'error': str(e)}
    
    async def scraping_loop(self):
        """Main scraping loop."""
        while self.running:
            try:
                await self.scrape_all_sources()
                
                # Wait for next scraping cycle
                interval_hours = SCHEDULER_CONFIG['scraping_interval']
                wait_seconds = interval_hours * 3600
                
                logger.info(f"Waiting {interval_hours} hours until next scraping cycle")
                await asyncio.sleep(wait_seconds)
                
            except asyncio.CancelledError:
                logger.info("Scraping loop cancelled")
                break
            except Exception as e:
                logger.error(f"Error in scraping loop: {e}")
                # Wait a bit before retrying
                await asyncio.sleep(300)  # 5 minutes
    
    async def embedding_loop(self):
        """Embedding processing loop."""
        while self.running:
            try:
                await self.process_embeddings()
                
                # Wait for next embedding cycle
                interval_minutes = SCHEDULER_CONFIG['embedding_interval']
                wait_seconds = interval_minutes * 60
                
                logger.debug(f"Waiting {interval_minutes} minutes until next embedding cycle")
                await asyncio.sleep(wait_seconds)
                
            except asyncio.CancelledError:
                logger.info("Embedding loop cancelled")
                break
            except Exception as e:
                logger.error(f"Error in embedding loop: {e}")
                await asyncio.sleep(300)  # 5 minutes
    
    async def cleanup_loop(self):
        """Data cleanup loop."""
        while self.running:
            try:
                await self.cleanup_old_data()
                
                # Wait for next cleanup cycle
                interval_days = SCHEDULER_CONFIG['cleanup_interval']
                wait_seconds = interval_days * 24 * 3600
                
                logger.info(f"Waiting {interval_days} days until next cleanup cycle")
                await asyncio.sleep(wait_seconds)
                
            except asyncio.CancelledError:
                logger.info("Cleanup loop cancelled")
                break
            except Exception as e:
                logger.error(f"Error in cleanup loop: {e}")
                await asyncio.sleep(3600)  # 1 hour
    
    async def start(self):
        """Start the scheduler."""
        if self.running:
            logger.warning("Scheduler is already running")
            return
        
        logger.info("Starting news scraping scheduler")
        self.running = True
        
        # Start background tasks
        self.scraping_task = asyncio.create_task(self.scraping_loop())
        self.embedding_task = asyncio.create_task(self.embedding_loop())
        self.cleanup_task = asyncio.create_task(self.cleanup_loop())
        
        self.tasks = [self.scraping_task, self.embedding_task, self.cleanup_task]
        
        logger.info("Scheduler started successfully")
    
    async def stop(self):
        """Stop the scheduler."""
        if not self.running:
            logger.warning("Scheduler is not running")
            return
        
        logger.info("Stopping news scraping scheduler")
        self.running = False
        
        # Cancel tasks
        for task in self.tasks:
            if not task.done():
                task.cancel()
        
        # Wait for tasks to complete
        if self.tasks:
            await asyncio.gather(*self.tasks, return_exceptions=True)
        
        logger.info("Scheduler stopped successfully")
    
    async def run_once(self) -> Dict[str, Any]:
        """Run scraping and embedding processing once."""
        logger.info("Running one-time scraping and processing")
        
        results = {}
        
        # Run scraping
        scraping_result = await self.scrape_all_sources()
        results['scraping'] = scraping_result
        
        # Wait a bit before processing embeddings
        await asyncio.sleep(10)
        
        # Run embedding processing
        embedding_result = await self.process_embeddings()
        results['embeddings'] = embedding_result
        
        logger.info("One-time processing completed")
        return results

# Global scheduler instance
scheduler = NewsScrapingScheduler()

class SchedulerService:
    """Service for managing the news scraping scheduler."""
    
    @staticmethod
    async def initialize():
        """Initialize the scheduler service."""
        await scheduler.initialize()
    
    @staticmethod
    async def start():
        """Start the scheduler."""
        await scheduler.start()
    
    @staticmethod
    async def stop():
        """Stop the scheduler."""
        await scheduler.stop()
    
    @staticmethod
    async def run_once() -> Dict[str, Any]:
        """Run scraping and processing once."""
        return await scheduler.run_once()
    
    @staticmethod
    async def scrape_source(source_name: str) -> Dict[str, Any]:
        """Scrape a specific source."""
        if source_name not in NEWS_SOURCES:
            return {'error': f'Unknown source: {source_name}'}
        
        try:
            source_config = NEWS_SOURCES[source_name]
            scraper = create_scraper(source_name, source_config)
            
            async with scraper:
                result = await scraper.scrape_all()
                logger.info(f"Manual scraping of {source_name} completed: {result}")
                return result
                
        except Exception as e:
            logger.error(f"Error in manual scraping of {source_name}: {e}")
            return {'error': str(e), 'scraped': 0, 'failed': 0}
    
    @staticmethod
    async def process_embeddings() -> Dict[str, int]:
        """Process embeddings manually."""
        return await scheduler.process_embeddings()
    
    @staticmethod
    async def cleanup():
        """Cleanup scheduler resources."""
        await scheduler.cleanup()

def setup_signal_handlers():
    """Setup signal handlers for graceful shutdown."""
    def signal_handler(signum, frame):
        logger.info(f"Received signal {signum}, initiating graceful shutdown")
        asyncio.create_task(SchedulerService.stop())
        sys.exit(0)
    
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
