"""
Database models and connection management for news scraping system.
"""

from __future__ import annotations

import asyncpg
import hashlib
import json
import logging
import re
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from .config import DATABASE_CONFIG

logger = logging.getLogger(__name__)


class DatabaseManager:
    def __init__(self, connection_string: str):
        self.connection_string = (connection_string or "").strip()
        self.pool: Optional[asyncpg.Pool] = None

    async def initialize(self):
        """Initialize database connection pool and create tables."""
        try:
            if not self.connection_string:
                raise RuntimeError(
                    "Database connection string is empty. "
                    "Set DATABASE_URL or POSTGRES_* env vars."
                )

            min_size = int(DATABASE_CONFIG["pool_size"]["min"])
            max_size = int(DATABASE_CONFIG["pool_size"]["max"])

            self.pool = await asyncpg.create_pool(
                self.connection_string,
                min_size=min_size,
                max_size=max_size,
                command_timeout=60,
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
        if not self.pool:
            raise RuntimeError("Database pool is not initialized")

        async with self.pool.acquire() as connection:
            yield connection

    async def create_tables(self):
        """
        Ensure the canonical backend schema pieces required by scraping exist.
        This keeps scraping writes aligned with the main API tables.
        """
        create_tables_sql = """
        CREATE EXTENSION IF NOT EXISTS vector;

        CREATE TABLE IF NOT EXISTS news_sources (
            id SERIAL PRIMARY KEY,
            name VARCHAR(100) NOT NULL UNIQUE,
            base_url TEXT,
            source_type VARCHAR(20) NOT NULL DEFAULT 'web',
            is_active BOOLEAN NOT NULL DEFAULT TRUE,
            scrape_interval_minutes INTEGER NOT NULL DEFAULT 360,
            created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        );

        ALTER TABLE news_sources
            ADD COLUMN IF NOT EXISTS source_type VARCHAR(20) NOT NULL DEFAULT 'web',
            ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE,
            ADD COLUMN IF NOT EXISTS scrape_interval_minutes INTEGER NOT NULL DEFAULT 360,
            ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;

        CREATE TABLE IF NOT EXISTS scraping_runs (
            id BIGSERIAL PRIMARY KEY,
            source_id INTEGER REFERENCES news_sources(id) ON DELETE SET NULL,
            run_type VARCHAR(20) NOT NULL DEFAULT 'scrape',
            status VARCHAR(20) NOT NULL,
            message TEXT,
            articles_found INTEGER DEFAULT 0,
            articles_inserted INTEGER DEFAULT 0,
            articles_updated INTEGER DEFAULT 0,
            articles_failed INTEGER DEFAULT 0,
            started_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            completed_at TIMESTAMPTZ,
            error_details JSONB DEFAULT '{}'::jsonb
        );

        ALTER TABLE articles
            ADD COLUMN IF NOT EXISTS source_id INTEGER REFERENCES news_sources(id) ON DELETE SET NULL,
            ADD COLUMN IF NOT EXISTS scraped_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            ADD COLUMN IF NOT EXISTS ingestion_meta JSONB DEFAULT '{}'::jsonb,
            ADD COLUMN IF NOT EXISTS content_hash VARCHAR(64);

        CREATE INDEX IF NOT EXISTS idx_articles_source_id ON articles(source_id);
        CREATE INDEX IF NOT EXISTS idx_articles_scraped_at ON articles(scraped_at DESC);
        CREATE INDEX IF NOT EXISTS idx_articles_content_hash ON articles(content_hash);
        CREATE INDEX IF NOT EXISTS idx_scraping_runs_source_started ON scraping_runs(source_id, started_at DESC);
        CREATE INDEX IF NOT EXISTS ix_article_embeddings_embedding ON article_embeddings USING hnsw (embedding vector_cosine_ops);
        """

        async with self.get_connection() as conn:
            await conn.execute(create_tables_sql)

        await self.insert_default_sources()
        logger.info("Database tables ensured successfully")

    async def insert_default_sources(self):
        """Insert or update default news sources."""
        sources = [
            ("aljazeera", "https://www.aljazeera.com", "web"),
            ("bbc", "https://www.bbc.com", "web"),
            ("guardian", "https://www.theguardian.com", "web"),
            ("newsbtc", "https://www.newsbtc.com/feed/", "rss"),
            ("cryptoslate", "https://cryptoslate.com/feed/", "rss"),
            ("ambcrypto", "https://ambcrypto.com/feed/", "rss"),
            ("blockonomi", "https://blockonomi.com/feed/", "rss"),
            ("decrypt", "https://decrypt.co/feed", "rss"),
            (
                "cnbc_crypto",
                "https://www.cnbc.com/id/100003114/device/rss/rss.html",
                "rss",
            ),
        ]

        async with self.get_connection() as conn:
            for name, base_url, source_type in sources:
                await conn.execute(
                    """
                    INSERT INTO news_sources (name, base_url, source_type)
                    VALUES ($1, $2, $3)
                    ON CONFLICT (name) DO UPDATE
                    SET
                        base_url = EXCLUDED.base_url,
                        source_type = EXCLUDED.source_type,
                        is_active = TRUE,
                        updated_at = CURRENT_TIMESTAMP
                    """,
                    name,
                    base_url,
                    source_type,
                )

    async def get_source_id(self, source_name: str) -> Optional[int]:
        """Get source ID by name."""
        try:
            async with self.get_connection() as conn:
                return await conn.fetchval(
                    "SELECT id FROM news_sources WHERE name = $1",
                    source_name,
                )
        except Exception as e:
            logger.error(f"Failed to get source ID for {source_name}: {e}")
            return None

    async def get_source_name(self, source_id: int) -> Optional[str]:
        """Get source name by ID."""
        try:
            async with self.get_connection() as conn:
                return await conn.fetchval(
                    "SELECT name FROM news_sources WHERE id = $1",
                    source_id,
                )
        except Exception as e:
            logger.error(f"Failed to get source name for {source_id}: {e}")
            return None

    async def get_or_create_source(
        self, source_name: str, source_type: Optional[str] = None, base_url: Optional[str] = None
    ) -> Optional[int]:
        """Get source ID by name, or create it if it doesn't exist.
        
        If source exists, returns its ID and existing source_type unchanged.
        If source is new and source_type not provided, intelligently detects type.
        """
        try:
            source_name = source_name.strip().lower() if source_name else "unknown"
            
            async with self.get_connection() as conn:
                # First, try to get existing source and return its current type
                existing = await conn.fetchrow(
                    "SELECT id, source_type FROM news_sources WHERE LOWER(name) = $1",
                    source_name,
                )
                
                if existing:
                    return existing['id']
                
                # For new sources, determine source_type if not provided
                if not source_type:
                    # Intelligently detect type based on source characteristics
                    source_type = self._detect_source_type(source_name, base_url)
                
                # If not found, insert new source
                new_id = await conn.fetchval(
                    """
                    INSERT INTO news_sources (name, base_url, source_type, is_active)
                    VALUES ($1, $2, $3, TRUE)
                    RETURNING id
                    """,
                    source_name,
                    base_url or "",
                    source_type,
                )
                
                if new_id:
                    logger.info(f"Created new source '{source_name}' with type '{source_type}'")
                return new_id
        except Exception as e:
            logger.error(f"Failed to get or create source '{source_name}': {e}")
            return None

    def _detect_source_type(self, source_name: str, base_url: Optional[str] = None) -> str:
        """Intelligently detect source type based on name and URL."""
        source_lower = source_name.lower()
        
        # Check for known RSS-based sources
        rss_sources = {
            'newsbtc', 'cryptoslate', 'ambcrypto', 'blockonomi', 
            'decrypt', 'cnbc_crypto', 'coindesk', 'cointelegraph'
        }
        
        if source_lower in rss_sources or 'crypto' in source_lower:
            return 'rss'
        
        # Check for known web scrapers
        web_sources = {'bbc', 'aljazeera', 'guardian', 'cnn', 'reuters', 'bbc news'}
        if source_lower in web_sources:
            return 'web'
        
        # If URL provided, try to detect from domain
        if base_url:
            url_lower = base_url.lower()
            if 'rss' in url_lower or 'feed' in url_lower:
                return 'rss'
        
        # Default to 'web' for general news sources from APIs
        return 'web'

    async def insert_article(
        self,
        article_data: Dict[str, Any],
        return_action: bool = False,
    ) -> Optional[Any]:
        """Insert or update an article in canonical `articles` table.
        
        If source_name is provided, will automatically get or create the source
        and use its source_id. The 'source' column is kept for backward compatibility.
        """
        try:
            published_date = article_data.get("published_date")
            if published_date and isinstance(published_date, datetime):
                if published_date.tzinfo is None:
                    published_date = published_date.replace(tzinfo=timezone.utc)
                else:
                    published_date = published_date.astimezone(timezone.utc)

            # Get or create source and retrieve source_id
            source_name = article_data.get("source", "unknown")
            source_type = article_data.get("source_type")  # None will trigger auto-detection
            base_url = article_data.get("source_url")
            
            source_id = await self.get_or_create_source(source_name, source_type, base_url)
            if not source_id:
                logger.warning(f"Failed to get or create source: {source_name}")
                source_id = None
            content = article_data.get("content") or ""
            content_hash = (
                hashlib.sha256(content.encode("utf-8")).hexdigest()
                if content
                else None
            )


            category = article_data.get("category")
            if source_name.lower() in {"ambcrypto", "blockonomi"}:
                normalized_category = (category or "").strip().lower()
                if normalized_category in {
                    "",
                    "news",
                    "latest",
                    "latest news",
                    "crypto news",
                    "cryptocurrency news",
                }:
                    category = "Cryptocurrency"

            title = (article_data.get("title") or "").strip()

            def _fingerprint(value: Optional[str]) -> str:
                if not value:
                    return ""
                return re.sub(r"[^a-z0-9]+", "", value.lower())

            if isinstance(category, str):
                category = category.strip()
                if not category or len(category) > 60:
                    category = "News"

            if category and title and _fingerprint(category) == _fingerprint(title):
                category = "News"
            
            # Ensure source_name is set for category normalization
            if not source_name:
                source_name = await self.get_source_name(source_id) if source_id else "unknown"

            async with self.get_connection() as conn:
                row = await conn.fetchrow(
                    """
                    INSERT INTO articles (
                        source_id,
                        title,
                        summary,
                        content,
                        url,
                        source,
                        category,
                        published_at,
                        image_url,
                        author,
                        language,
                        tags,
                        sentiment_score,
                        sentiment_label,
                        scraped_at,
                        ingestion_meta,
                        content_hash
                    ) VALUES (
                        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, CURRENT_TIMESTAMP, $15, $16
                    )
                    ON CONFLICT (url) DO UPDATE SET
                        source_id = COALESCE(EXCLUDED.source_id, articles.source_id),
                        title = EXCLUDED.title,
                        summary = EXCLUDED.summary,
                        content = EXCLUDED.content,
                        source = EXCLUDED.source,
                        category = EXCLUDED.category,
                        published_at = EXCLUDED.published_at,
                        image_url = EXCLUDED.image_url,
                        author = EXCLUDED.author,
                        language = EXCLUDED.language,
                        tags = EXCLUDED.tags,
                        scraped_at = CURRENT_TIMESTAMP,
                        ingestion_meta = EXCLUDED.ingestion_meta,
                        content_hash = EXCLUDED.content_hash
                          WHERE articles.content_hash IS DISTINCT FROM EXCLUDED.content_hash
                              OR COALESCE(articles.category, '') IS DISTINCT FROM COALESCE(EXCLUDED.category, '')
                    RETURNING id, (xmax = 0) AS inserted
                    """,
                    source_id,
                    article_data["title"],
                    article_data.get("summary"),
                    content,
                    article_data["url"],
                    source_name,
                    category,
                    published_date,
                    article_data.get("main_image_url"),
                    article_data.get("author"),
                    article_data.get("language", "en"),
                    article_data.get("tags", []),
                    article_data.get("sentiment_score"),
                    article_data.get("sentiment_label"),
                    json.dumps(article_data.get("metadata", {})),
                    content_hash,
                )
                payload: Optional[Dict[str, Any]] = None
                if row:
                    payload = {
                        "id": str(row["id"]),
                        "action": "inserted" if bool(row["inserted"]) else "updated",
                    }
                else:
                    existing_id = await conn.fetchval(
                        "SELECT id FROM articles WHERE url = $1",
                        article_data["url"],
                    )
                    if existing_id:
                        payload = {"id": str(existing_id), "action": "unchanged"}

                if return_action:
                    return payload
                return payload["id"] if payload else None
        except Exception as e:
            logger.error(
                f"Failed to insert article {article_data.get('url', 'unknown')}: {e}"
            )
            return None

    async def update_article_embedding(self, article_id: Any, embedding: List[float]):
        """Upsert embedding into canonical `article_embeddings` table."""
        try:
            async with self.get_connection() as conn:
                # Convert embedding list to JSON string for pgvector
                embedding_json = json.dumps(embedding)
                await conn.execute(
                    """
                    INSERT INTO article_embeddings (article_id, embedding)
                    VALUES ($1::uuid, $2::vector)
                    ON CONFLICT (article_id) DO UPDATE
                    SET embedding = EXCLUDED.embedding
                    """,
                    str(article_id),
                    embedding_json,
                )
                logger.debug(f"Updated embedding for article {article_id}")
        except Exception as e:
            logger.error(f"Failed to update embedding for article {article_id}: {e}")

    async def log_scraping_activity(
        self,
        source_id: Optional[int],
        status: str,
        message: str = None,
        articles_scraped: int = 0,
        articles_failed: int = 0,
        error_details: Dict = None,
        articles_updated: int = 0,
    ):
        """Log scraping activity to `scraping_runs`."""
        try:
            async with self.get_connection() as conn:
                await conn.execute(
                    """
                    INSERT INTO scraping_runs (
                        source_id,
                        run_type,
                        status,
                        message,
                        articles_found,
                        articles_inserted,
                        articles_updated,
                        articles_failed,
                        started_at,
                        completed_at,
                        error_details
                    ) VALUES (
                        $1, 'scrape', $2, $3, $4, $5, $6, $7,
                        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, $8
                    )
                    """,
                    source_id,
                    status,
                    message,
                    articles_scraped + articles_updated + articles_failed,
                    articles_scraped,
                    articles_updated,
                    articles_failed,
                    json.dumps(error_details or {}),
                )
        except Exception as e:
            logger.error(f"Failed to log scraping activity: {e}")

    async def get_existing_urls(self, source_id: int, limit: int = 1000) -> set[str]:
        """Get existing URLs for a source to avoid duplicates."""
        try:
            async with self.get_connection() as conn:
                rows = await conn.fetch(
                    """
                    SELECT a.url
                    FROM articles a
                    LEFT JOIN news_sources ns ON ns.id = $1
                    WHERE a.source_id = $1
                       OR (
                           a.source_id IS NULL
                           AND ns.name IS NOT NULL
                           AND lower(a.source) = lower(ns.name)
                       )
                    ORDER BY COALESCE(a.scraped_at, a.published_at) DESC
                    LIMIT $2
                    """,
                    source_id,
                    limit,
                )
                return {row["url"] for row in rows}
        except Exception as e:
            logger.error(f"Failed to get existing URLs for source {source_id}: {e}")
            return set()

    async def get_unprocessed_articles(self, limit: int = 100) -> List[Dict[str, Any]]:
        """Get articles without embeddings."""
        try:
            async with self.get_connection() as conn:
                rows = await conn.fetch(
                    """
                    SELECT a.id, a.title, a.content, a.summary
                    FROM articles a
                    LEFT JOIN article_embeddings ae ON ae.article_id = a.id
                    WHERE ae.article_id IS NULL
                      AND a.content IS NOT NULL
                    ORDER BY COALESCE(a.scraped_at, a.published_at) DESC
                    LIMIT $1
                    """,
                    limit,
                )
                return [dict(row) for row in rows]
        except Exception as e:
            logger.error(f"Failed to get unprocessed articles: {e}")
            return []

    async def get_recent_articles(self, limit: int = 50) -> List[Dict[str, Any]]:
        """Get recent articles for API responses."""
        try:
            async with self.get_connection() as conn:
                rows = await conn.fetch(
                    """
                    SELECT a.id,
                           a.title,
                           a.url,
                           a.published_at AS published_date,
                           a.summary,
                           a.image_url AS main_image_url,
                           a.author,
                           a.category,
                           a.tags,
                           COALESCE(ns.name, a.source) AS source_name
                    FROM articles a
                    LEFT JOIN news_sources ns ON ns.id = a.source_id
                    WHERE a.content IS NOT NULL
                    ORDER BY a.published_at DESC NULLS LAST, a.scraped_at DESC
                    LIMIT $1
                    """,
                    limit,
                )
                return [dict(row) for row in rows]
        except Exception as e:
            logger.error(f"Failed to get recent articles: {e}")
            return []

    async def search_articles(
        self,
        query_embedding: List[float],
        limit: int = 10,
    ) -> List[Dict[str, Any]]:
        """Search articles using vector similarity."""
        try:
            # Convert query embedding to JSON string for pgvector
            query_embedding_json = json.dumps(query_embedding)
            async with self.get_connection() as conn:
                rows = await conn.fetch(
                    """
                    SELECT a.id,
                           a.title,
                           a.url,
                           a.published_at AS published_date,
                           a.summary,
                           a.image_url AS main_image_url,
                           a.content,
                           COALESCE(ns.name, a.source) AS source_name,
                           1 - (ae.embedding <=> $1::vector) AS similarity
                    FROM article_embeddings ae
                    JOIN articles a ON a.id = ae.article_id
                    LEFT JOIN news_sources ns ON ns.id = a.source_id
                    ORDER BY ae.embedding <=> $1::vector
                    LIMIT $2
                    """,
                    query_embedding_json,
                    limit,
                )
                return [dict(row) for row in rows]
        except Exception as e:
            logger.error(f"Failed to search articles: {e}")
            return []


DATABASE_URL = DATABASE_CONFIG["url"]

# Global database manager instance
db_manager = DatabaseManager(DATABASE_URL)
