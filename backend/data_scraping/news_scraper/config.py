"""
Configuration settings for the news scraping system.
"""

from typing import Dict, List
import logging
import torch
from dotenv import load_dotenv
import os

# Load .env from the current directory (news_scraper)
load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))
# Database Configuration
DATABASE_CONFIG = {
    'url': os.getenv('DATABASE_URL', 'postgresql://username:password@localhost/newsdb'),
    'pool_size': {
        'min': int(os.getenv('DB_POOL_MIN', '5')),
        'max': int(os.getenv('DB_POOL_MAX', '20'))
    }
}

# Embedding Configuration - Using open-source BAAI/bge-base-en-v1.5

# Resolve backend dir (one level up), then models
ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..','..'))
DEFAULT_MODEL_PATH = os.path.join(ROOT_DIR, 'models', 'bge-base-en-v1.5')
MODEL_PATH = os.getenv('EMBEDDING_MODEL_PATH', DEFAULT_MODEL_PATH)

EMBEDDING_CONFIG = {
    'model_name': MODEL_PATH,
    'dimensions': 768,
    'max_length': 512,
    'normalize_embeddings': True,
    'device': 'cuda' if torch.cuda.is_available() else 'cpu',  # Will be set to 'cuda' if available, 'cpu' otherwise
    'batch_size': 32,  # Increased for GPU (will auto-adjust based on device)
    'trust_remote_code': False
}
if torch.cuda.is_available():
    EMBEDDING_CONFIG['device'] = 'cuda'
    EMBEDDING_CONFIG['batch_size'] = 32  # GPU can handle larger batches
    print(f"🚀 GPU detected: {torch.cuda.get_device_name(0)}")
else:
    EMBEDDING_CONFIG['device'] = 'cpu'
    EMBEDDING_CONFIG['batch_size'] = 8   # Smaller batches for CPU
    print("💻 Using CPU for embeddings")



# Scraping Configuration
SCRAPING_CONFIG = {
    'user_agent': (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/115.0.0.0 Safari/537.36"
    ),
    'timeout': 30,
    'delay_between_requests': 3,  # seconds
    'max_retries': 3,
    'max_articles_per_source': 50,  # Limit per scraping session
    'concurrent_requests': 5,
}

# News Source Configurations
NEWS_SOURCES = {
    'aljazeera': {
        'name': 'Al Jazeera',
        'base_urls': [
            'https://www.aljazeera.com/opinions/',
            'https://www.aljazeera.com/us-canada/',
            'https://www.aljazeera.com/tag/explainer/'
        ],
        'headers': {
            'Accept-Language': 'en-US,en;q=0.9',
            'Referer': 'https://www.aljazeera.com/',
        }
    },
    'bbc': {
        'name': 'BBC',
        'base_urls': [
            'https://www.bbc.com/news',
            'https://www.bbc.com/innovation'
        ],
        'headers': {
            'Accept-Language': 'en-US,en;q=0.9',
            'Referer': 'https://www.bbc.com/',
        }
    },
    'guardian': {
        'name': 'The Guardian',
        'base_urls': [
            'https://www.theguardian.com/international',
            'https://www.theguardian.com/uk/technology'
        ],
        'headers': {
            'Accept-Language': 'en-US,en;q=0.9',
            'Referer': 'https://www.theguardian.com/',
        }
    },
    
    'newsbtc': {
        'name': 'NewsBTC',
        'rss_feeds': ['https://www.newsbtc.com/feed/']
    },
    'cryptoslate': {
        'name': 'CryptoSlate',
        'rss_feeds': ['https://cryptoslate.com/feed/']
    },
    'ambcrypto': {
        'name': 'AMBCrypto',
        'rss_feeds': ['https://ambcrypto.com/feed/']
    },
    'blockonomi': {
        'name': 'Blockonomi',
        'rss_feeds': ['https://blockonomi.com/feed/']
    },
    'decrypt': {
        'name': 'Decrypt',
        'rss_feeds': ['https://decrypt.co/feed']
    },
    'cnbc_crypto': {
        'name': 'CNBC Crypto',
        'rss_feeds': ['https://www.cnbc.com/id/100003114/device/rss/rss.html']
    }
}

# Logging Configuration
LOGGING_CONFIG = {
    'level': logging.INFO,
    'format': '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    'handlers': {
        'file': {
            'filename': 'logs/news_scraper.log',
            'max_bytes': 10 * 1024 * 1024,  # 10MB
            'backup_count': 5
        },
        'console': {
            'enabled': True
        }
    }
}

# Scheduler Configuration (for automatic scraping)
SCHEDULER_CONFIG = {
    'scraping_interval': int(os.getenv('SCRAPING_INTERVAL_HOURS', '6')),  # hours
    'embedding_interval': int(os.getenv('EMBEDDING_INTERVAL_MINUTES', '30')),  # minutes
    'cleanup_interval': int(os.getenv('CLEANUP_INTERVAL_DAYS', '7')),  # days
}

# Image Processing Configuration
IMAGE_CONFIG = {
    'max_size': 1024 * 1024,  # 1MB max
    'allowed_formats': ['jpg', 'jpeg', 'png', 'webp'],
    'default_image': '/static/images/default-news.jpg'
}

# Content Processing Configuration
CONTENT_CONFIG = {
    'min_content_length': 100,  # Minimum content length to be considered valid
    'max_content_length': 50000,  # Maximum content length
    'summary_length': 200,  # Target summary length in words
    'extract_keywords': True,
    'language': 'en'
}

# Rate Limiting Configuration
RATE_LIMIT_CONFIG = {
    'requests_per_minute': {
        'aljazeera': 30,
        'bbc': 30,
        'guardian': 30,
        'crypto': 40  # RSS feeds can handle more
    },
    'backoff_strategy': 'exponential',
    'max_backoff_time': 300  # 5 minutes
}

# Error Handling Configuration
ERROR_CONFIG = {
    'max_consecutive_failures': 5,
    'failure_cooldown_minutes': 30,
    'alert_on_failure_count': 10,
    'email_alerts': {
        'enabled': os.getenv('EMAIL_ALERTS_ENABLED', 'false').lower() == 'true',
        'smtp_server': os.getenv('SMTP_SERVER', ''),
        'smtp_port': int(os.getenv('SMTP_PORT', '587')),
        'username': os.getenv('SMTP_USERNAME', ''),
        'password': os.getenv('SMTP_PASSWORD', ''),
        'recipients': os.getenv('ALERT_RECIPIENTS', '').split(',')
    }
}

# Development/Production Configuration
DEBUG = os.getenv('DEBUG', 'false').lower() == 'true'
ENVIRONMENT = os.getenv('ENVIRONMENT', 'development')

def get_config():
    """Get complete configuration dictionary."""
    return {
        'database': DATABASE_CONFIG,
        'embedding': EMBEDDING_CONFIG,
        'scraping': SCRAPING_CONFIG,
        'sources': NEWS_SOURCES,
        'logging': LOGGING_CONFIG,
        'scheduler': SCHEDULER_CONFIG,
        'image': IMAGE_CONFIG,
        'content': CONTENT_CONFIG,
        'rate_limit': RATE_LIMIT_CONFIG,
        'error': ERROR_CONFIG,
        'debug': DEBUG,
        'environment': ENVIRONMENT
    }
