"""
News Scraper Package - Robust news scraping system with PostgreSQL and vector embeddings.

This package provides a comprehensive solution for scraping news from multiple sources,
storing them in PostgreSQL database, and generating vector embeddings for RAG-based chat.

Main Components:
- Database management with PostgreSQL and pgvector
- Configurable scrapers for different news sources
- Vector embedding generation using OpenAI
- Automated scheduling and error handling
- Performance monitoring and logging

Usage:
    from news_scraper import NewsScraperManager
    
    manager = NewsScraperManager()
    await manager.run_once()  # Run scraping once
    await manager.run_continuous()  # Run continuously with scheduler
"""

from .manager import NewsScraperManager, news_manager
from .scheduler import SchedulerService
from .database import db_manager, DatabaseManager
from .embeddings import EmbeddingService
from .config import get_config
from .logging_utils import setup_logging

__version__ = "1.0.0"
__author__ = "News Scraper Team"

# Main exports
__all__ = [
    'NewsScraperManager',
    'news_manager',
    'SchedulerService',
    'db_manager',
    'DatabaseManager',
    'EmbeddingService',
    'get_config',
    'setup_logging'
]

# Package metadata
PACKAGE_INFO = {
    'name': 'news_scraper',
    'version': __version__,
    'description': 'Robust news scraping system with PostgreSQL and vector embeddings',
    'features': [
        'Multi-source news scraping',
        'PostgreSQL database storage',
        'Vector embeddings for RAG',
        'Automated scheduling',
        'Error handling and monitoring',
        'Performance logging'
    ],
    'supported_sources': [
        'Al Jazeera',
        'BBC',
        'The Guardian',
        'Crypto News (RSS feeds)'
    ]
}
