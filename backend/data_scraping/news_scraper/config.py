"""Configuration settings for the news scraping system."""

from pathlib import Path
from typing import Dict
import logging
import os

import torch
from dotenv import load_dotenv


_logger = logging.getLogger(__name__)

SCRAPER_DIR = Path(__file__).resolve().parent
DATA_SCRAPING_DIR = SCRAPER_DIR.parent
BACKEND_DIR = DATA_SCRAPING_DIR.parent


def _load_environment_files() -> None:
    """Load environment files in override order.

    Priority (last wins):
    1) backend/.env
    2) backend/data_scraping/.env
    3) backend/data_scraping/news_scraper/.env
    """
    for env_path in (
        BACKEND_DIR / ".env",
        DATA_SCRAPING_DIR / ".env",
        SCRAPER_DIR / ".env",
    ):
        if env_path.exists():
            load_dotenv(env_path, override=True)


def _normalize_database_url(raw_url: str) -> str:
    """Normalize SQLAlchemy style postgres URLs for asyncpg usage."""
    url = (raw_url or "").strip()
    if not url:
        return ""

    # asyncpg expects postgresql://, not postgresql+asyncpg://
    if url.startswith("postgresql+asyncpg://"):
        return url.replace("postgresql+asyncpg://", "postgresql://", 1)
    return url


def _build_database_url_from_postgres_env() -> str:
    """Build URL from backend POSTGRES_* variables if available."""
    host = os.getenv("POSTGRES_SERVER", "").strip()
    user = os.getenv("POSTGRES_USER", "").strip()
    password = os.getenv("POSTGRES_PASSWORD", "")
    db_name = os.getenv("POSTGRES_DB", "").strip()
    port = os.getenv("POSTGRES_PORT", "5432").strip() or "5432"

    if host and user and db_name:
        return f"postgresql://{user}:{password}@{host}:{port}/{db_name}"
    return ""


def _resolve_database_url() -> str:
    """Resolve DB URL from shared backend env first, then scraper overrides."""
    explicit_database_url = _normalize_database_url(os.getenv("DATABASE_URL", ""))
    if explicit_database_url:
        return explicit_database_url

    sqlalchemy_url = _normalize_database_url(os.getenv("SQLALCHEMY_DATABASE_URI", ""))
    if sqlalchemy_url:
        return sqlalchemy_url

    postgres_env_url = _build_database_url_from_postgres_env()
    if postgres_env_url:
        return postgres_env_url

    return "postgresql://postgres:password@localhost:5432/quantum"


def _resolve_embedding_model_path() -> str:
    """Resolve local BGE model path with backend-compatible defaults."""
    configured = os.getenv("EMBEDDING_MODEL_PATH", "").strip()
    if configured:
        configured_path = Path(configured)
        if configured_path.exists():
            return str(configured_path)
        _logger.warning("Configured EMBEDDING_MODEL_PATH does not exist: %s", configured)

    candidates = (
        BACKEND_DIR / "bge_model" / "bge-base-en-v1.5",
        DATA_SCRAPING_DIR / "models" / "bge-base-en-v1.5",
    )
    for candidate in candidates:
        if candidate.exists():
            return str(candidate)

    # Remote fallback if local model is missing.
    return "BAAI/bge-base-en-v1.5"


def _csv_env(name: str, default: list[str]) -> list[str]:
    """Read comma-separated env var into a clean list."""
    raw = os.getenv(name, "")
    if raw and raw.strip():
        return [item.strip() for item in raw.split(",") if item.strip()]
    return default


_load_environment_files()

_resolved_device = os.getenv("EMBEDDING_DEVICE", "auto").strip().lower() or "auto"
if _resolved_device == "auto":
    _resolved_device = "cuda" if torch.cuda.is_available() else "cpu"

_default_batch_size = "32" if _resolved_device == "cuda" else "8"

# Database Configuration
DATABASE_CONFIG = {
    "url": _resolve_database_url(),
    "pool_size": {
        "min": int(os.getenv("DB_POOL_MIN", "5")),
        "max": int(os.getenv("DB_POOL_MAX", "20")),
    },
}

# Embedding Configuration
EMBEDDING_CONFIG = {
    "model_name": _resolve_embedding_model_path(),
    "dimensions": 768,
    "max_length": 512,
    "normalize_embeddings": True,
    "device": _resolved_device,
    "batch_size": int(os.getenv("EMBEDDING_BATCH_SIZE", _default_batch_size)),
    "trust_remote_code": False,
}


# API News Ingestion Configuration
API_NEWS_CONFIG = {
    "enabled": os.getenv("API_NEWS_ENABLED", "true").lower() == "true",
    "api_key": os.getenv("NEWS_API_KEY", os.getenv("NEWSAPI_KEY", "")).strip(),
    "base_url": os.getenv("NEWS_API_BASE_URL", "https://newsapi.org/v2/everything").strip(),
    "request_timeout_seconds": int(os.getenv("API_NEWS_TIMEOUT_SECONDS", "30")),
    "page_size": int(os.getenv("API_NEWS_PAGE_SIZE", "40")),
    "lookback_days": int(os.getenv("API_NEWS_LOOKBACK_DAYS", "2")),
    "language": os.getenv("API_NEWS_LANGUAGE", "en").strip(),
    "sort_by": os.getenv("API_NEWS_SORT_BY", "publishedAt").strip(),
    "domains": _csv_env(
        "API_NEWS_DOMAINS",
        [
            "reuters.com",
            "apnews.com",
            "nytimes.com",
            "washingtonpost.com",
            "wsj.com",
            "bloomberg.com",
            "cnn.com",
            "abcnews.go.com",
            "cbsnews.com",
            "npr.org",
            "euronews.com",
            "dw.com",
            "france24.com",
            "thehill.com",
            "time.com",
        ],
    ),
    "exclude_domains": _csv_env(
        "API_NEWS_EXCLUDE_DOMAINS",
        [
            "bbc.com",
            "aljazeera.com",
            "theguardian.com",
            "newsbtc.com",
            "cryptoslate.com",
            "ambcrypto.com",
            "blockonomi.com",
            "decrypt.co",
            "cnbc.com",
        ],
    ),
    "topics": [
        {
            "name": "general_world",
            "query": "world OR international OR global affairs",
            "category": "World",
            "tags": ["World", "International"],
        },
        {
            "name": "war_conflict",
            "query": "war OR conflict OR military OR ceasefire OR invasion",
            "category": "War",
            "tags": ["War", "Conflict", "Geopolitics"],
        },
        {
            "name": "geopolitics",
            "query": "geopolitics OR diplomacy OR sanctions OR foreign policy",
            "category": "Geopolitics",
            "tags": ["Geopolitics", "Diplomacy"],
        },
        {
            "name": "global_economy",
            "query": "economy OR inflation OR recession OR central bank",
            "category": "Economy",
            "tags": ["Economy", "Markets"],
        },
        {
            "name": "technology_policy",
            "query": "technology OR AI regulation OR cyber security policy",
            "category": "Technology",
            "tags": ["Technology", "Policy"],
        },
    ],
}



# Scraping Configuration
SCRAPING_CONFIG = {
    "user_agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/115.0.0.0 Safari/537.36"
    ),
    "timeout": int(os.getenv("SCRAPING_TIMEOUT_SECONDS", "30")),
    "delay_between_requests": float(os.getenv("SCRAPING_DELAY_SECONDS", "3")),
    "max_retries": int(os.getenv("SCRAPING_MAX_RETRIES", "3")),
    "max_articles_per_source": int(os.getenv("MAX_ARTICLES_PER_SOURCE", "50")),
    "concurrent_requests": int(os.getenv("SCRAPING_CONCURRENT_REQUESTS", "5")),
}

# News Source Configurations
NEWS_SOURCES = {
    "aljazeera": {
        "name": "Al Jazeera",
        "base_urls": [
            "https://www.aljazeera.com/opinions/",
            "https://www.aljazeera.com/us-canada/",
            "https://www.aljazeera.com/tag/explainer/",
        ],
        "headers": {
            "Accept-Language": "en-US,en;q=0.9",
            "Referer": "https://www.aljazeera.com/",
        },
    },
    "bbc": {
        "name": "BBC",
        "base_urls": [
            "https://www.bbc.com/news",
            "https://www.bbc.com/innovation",
        ],
        "headers": {
            "Accept-Language": "en-US,en;q=0.9",
            "Referer": "https://www.bbc.com/",
        },
    },
    "guardian": {
        "name": "The Guardian",
        "base_urls": [
            "https://www.theguardian.com/international",
            "https://www.theguardian.com/uk/technology",
        ],
        "headers": {
            "Accept-Language": "en-US,en;q=0.9",
            "Referer": "https://www.theguardian.com/",
        },
    },
    "newsbtc": {
        "name": "NewsBTC",
        "rss_feeds": ["https://www.newsbtc.com/feed/"],
    },
    "cryptoslate": {
        "name": "CryptoSlate",
        "rss_feeds": ["https://cryptoslate.com/feed/"],
    },
    "ambcrypto": {
        "name": "AMBCrypto",
        "rss_feeds": ["https://ambcrypto.com/feed/"],
    },
    "blockonomi": {
        "name": "Blockonomi",
        "rss_feeds": ["https://blockonomi.com/feed/"],
    },
    "decrypt": {
        "name": "Decrypt",
        "rss_feeds": ["https://decrypt.co/feed"],
    },
    "cnbc_crypto": {
        "name": "CNBC Crypto",
        "rss_feeds": ["https://www.cnbc.com/id/100003114/device/rss/rss.html"],
    },
}

# Logging Configuration
LOGGING_CONFIG = {
    "level": logging.INFO,
    "format": "%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    "handlers": {
        "file": {
            "filename": str(DATA_SCRAPING_DIR / "logs" / "news_scraper.log"),
            "max_bytes": 10 * 1024 * 1024,
            "backup_count": 5,
        },
        "console": {"enabled": True},
    },
}

# Scheduler Configuration (for automatic scraping)
# Default to shorter intervals for more frequent updates
# Can be overridden via environment variables
SCHEDULER_CONFIG = {
    # Scraping interval in minutes (default: 10 minutes)
    "scraping_interval_minutes": int(os.getenv("SCRAPING_INTERVAL_MINUTES", "10")),
    # Embedding interval in minutes (default: 10 minutes)
    "embedding_interval_minutes": int(os.getenv("EMBEDDING_INTERVAL_MINUTES", "10")),
    # API ingestion interval in minutes (default: 15 minutes)
    "api_news_interval_minutes": int(os.getenv("API_NEWS_INTERVAL_MINUTES", "15")),
    # Cleanup interval in hours (default: 24 hours)
    "cleanup_interval_hours": int(os.getenv("CLEANUP_INTERVAL_HOURS", "24")),
    # Run immediately on startup before waiting for first interval
    "run_on_startup": os.getenv("RUN_ON_STARTUP", "true").lower() == "true",
}

# Image Processing Configuration
IMAGE_CONFIG = {
    "max_size": 1024 * 1024,
    "allowed_formats": ["jpg", "jpeg", "png", "webp"],
    "default_image": "/static/images/default-news.jpg",
}

# Content Processing Configuration
CONTENT_CONFIG = {
    "min_content_length": 100,
    "max_content_length": 50000,
    "summary_length": 200,
    "extract_keywords": True,
    "language": "en",
}

# Rate Limiting Configuration
RATE_LIMIT_CONFIG = {
    "requests_per_minute": {
        "aljazeera": 30,
        "bbc": 30,
        "guardian": 30,
        "crypto": 40,
    },
    "backoff_strategy": "exponential",
    "max_backoff_time": 300,
}

# Error Handling Configuration
ERROR_CONFIG = {
    "max_consecutive_failures": 5,
    "failure_cooldown_minutes": 30,
    "alert_on_failure_count": 10,
    "email_alerts": {
        "enabled": os.getenv("EMAIL_ALERTS_ENABLED", "false").lower() == "true",
        "smtp_server": os.getenv("SMTP_SERVER", ""),
        "smtp_port": int(os.getenv("SMTP_PORT", "587")),
        "username": os.getenv("SMTP_USERNAME", ""),
        "password": os.getenv("SMTP_PASSWORD", ""),
        "recipients": [
            recipient.strip()
            for recipient in os.getenv("ALERT_RECIPIENTS", "").split(",")
            if recipient.strip()
        ],
    },
}

# Development/Production Configuration
DEBUG = os.getenv("DEBUG", "false").lower() == "true"
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")

def get_config():
    """Get complete configuration dictionary."""
    return {
        "database": DATABASE_CONFIG,
        "embedding": EMBEDDING_CONFIG,
        "api_news": API_NEWS_CONFIG,
        "scraping": SCRAPING_CONFIG,
        "sources": NEWS_SOURCES,
        "logging": LOGGING_CONFIG,
        "scheduler": SCHEDULER_CONFIG,
        "image": IMAGE_CONFIG,
        "content": CONTENT_CONFIG,
        "rate_limit": RATE_LIMIT_CONFIG,
        "error": ERROR_CONFIG,
        "debug": DEBUG,
        "environment": ENVIRONMENT,
    }
