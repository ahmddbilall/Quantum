"""API-based news ingestion service for general and world news coverage."""

from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional
from urllib.parse import urlparse

import httpx

from .config import API_NEWS_CONFIG
from .database import db_manager
from .cleaning import cleaning_service

logger = logging.getLogger(__name__)


class APINewsService:
    """Fetches non-scraped general/world news from external APIs and stores it."""

    @classmethod
    async def initialize(cls) -> None:
        """Initialize API ingestion service."""
        if not API_NEWS_CONFIG.get("enabled", True):
            logger.info("API news ingestion is disabled by configuration")
            return

        if not API_NEWS_CONFIG.get("api_key"):
            logger.warning(
                "API news ingestion enabled but NEWS_API_KEY is missing. "
                "Pipeline will skip until key is configured."
            )
            return

        logger.info("API news ingestion service initialized")

    @classmethod
    async def cleanup(cls) -> None:
        """Cleanup API ingestion resources."""
        return

    @classmethod
    async def fetch_and_store_news(cls) -> Dict[str, Any]:
        """Fetch and upsert general/world news from API provider."""
        if not API_NEWS_CONFIG.get("enabled", True):
            return {
                "enabled": False,
                "processed": 0,
                "upserted": 0,
                "failed": 0,
                "message": "API news ingestion disabled",
            }

        api_key = API_NEWS_CONFIG.get("api_key", "")
        if not api_key:
            return {
                "enabled": False,
                "processed": 0,
                "upserted": 0,
                "failed": 0,
                "message": "Missing NEWS_API_KEY / NEWSAPI_KEY",
            }

        base_url = API_NEWS_CONFIG["base_url"]
        timeout_seconds = int(API_NEWS_CONFIG["request_timeout_seconds"])
        page_size = int(API_NEWS_CONFIG["page_size"])
        lookback_days = int(API_NEWS_CONFIG["lookback_days"])
        language = API_NEWS_CONFIG["language"]
        sort_by = API_NEWS_CONFIG["sort_by"]
        domains = API_NEWS_CONFIG.get("domains", [])
        exclude_domains = API_NEWS_CONFIG.get("exclude_domains", [])
        topics = API_NEWS_CONFIG.get("topics", [])

        from_date = (datetime.now(timezone.utc) - timedelta(days=lookback_days)).date().isoformat()

        upserted = 0
        inserted = 0
        updated = 0
        unchanged = 0
        failed = 0
        processed = 0
        total_fetched = 0
        seen_urls: set[str] = set()
        source_names: set[str] = set()

        async with httpx.AsyncClient(timeout=timeout_seconds) as client:
            for topic in topics:
                params = {
                    "apiKey": api_key,
                    "q": topic.get("query", "world"),
                    "language": language,
                    "sortBy": sort_by,
                    "pageSize": page_size,
                    "from": from_date,
                    "searchIn": "title,description",
                }

                if domains:
                    params["domains"] = ",".join(domains)
                if exclude_domains:
                    params["excludeDomains"] = ",".join(exclude_domains)

                try:
                    response = await client.get(base_url, params=params)
                    response.raise_for_status()
                    payload = response.json()
                    api_articles = payload.get("articles", []) or []
                    total_fetched += len(api_articles)
                except Exception as exc:
                    logger.error(
                        "Failed API news fetch for topic %s: %s",
                        topic.get("name", "unknown"),
                        exc,
                    )
                    failed += 1
                    continue

                for item in api_articles:
                    url = (item.get("url") or "").strip()
                    title = (item.get("title") or "").strip()
                    if not url or not title or url in seen_urls:
                        continue

                    seen_urls.add(url)

                    source_name = cls._normalize_source_name(
                        ((item.get("source") or {}).get("name") or "").strip(),
                        url,
                    )
                    source_names.add(source_name)

                    summary = (item.get("description") or "").strip() or None
                    
                    # Fetch and clean the full content
                    try:
                        logger.debug(f"Fetching full article for {url}")
                        # Some sites verify User-Agent, so we merge it here
                        headers = {
                            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
                        }
                        
                        resp = await client.get(url, follow_redirects=True, headers=headers)
                        if resp.status_code == 200:
                            raw_html = resp.text
                            cleaned_content = await cleaning_service.clean_article_html(raw_html, url)
                            
                            if cleaned_content:
                                content = cleaned_content
                            else:
                                logger.info(f"Skipping {url} because it failed intel cleaning (paywall/stub)")
                                processed += 1
                                failed += 1
                                continue
                        else:
                            logger.info(f"Skipping {url} due to HTTP {resp.status_code}")
                            processed += 1
                            failed += 1
                            continue
                            
                    except Exception as exc:
                        logger.warning(f"Failed to fetch full content for {url}: {exc}")
                        processed += 1
                        failed += 1
                        continue

                    published_date = cls._parse_datetime(item.get("publishedAt"))

                    article_data = {
                        "source": source_name,
                        "title": title,
                        "url": url,
                        "published_date": published_date,
                        "content": content,
                        "summary": summary,
                        "main_image_url": item.get("urlToImage"),
                        "author": item.get("author"),
                        "category": topic.get("category", "World"),
                        "tags": topic.get("tags", []),
                        "language": language,
                        "metadata": {
                            "provider": "newsapi",
                            "topic": topic.get("name", "general"),
                            "query": topic.get("query", ""),
                        },
                    }
                    
                    # Don't set source_type here - let database manager detect it
                    # based on whether source exists in news_sources table
                    
                    processed += 1
                    result = await db_manager.insert_article(article_data, return_action=True)
                    if not result:
                        failed += 1
                        continue

                    action = result.get("action")
                    if action == "inserted":
                        inserted += 1
                        upserted += 1
                    elif action == "updated":
                        updated += 1
                        upserted += 1
                    elif action == "unchanged":
                        unchanged += 1
                    else:
                        upserted += 1

        return {
            "enabled": True,
            "processed": processed,
            "upserted": upserted,
            "inserted": inserted,
            "updated": updated,
            "unchanged": unchanged,
            "failed": failed,
            "total_fetched": total_fetched,
            "topics_processed": len(topics),
            "sources_found": sorted(source_names),
        }

    @staticmethod
    def _parse_datetime(value: Optional[str]) -> Optional[datetime]:
        if not value:
            return None

        try:
            cleaned = value.replace("Z", "+00:00") if value.endswith("Z") else value
            dt = datetime.fromisoformat(cleaned)
            if dt.tzinfo is None:
                return dt.replace(tzinfo=timezone.utc)
            return dt.astimezone(timezone.utc)
        except Exception:
            return None

    @staticmethod
    def _normalize_source_name(source_name: str, url: str) -> str:
        if source_name:
            return source_name

        try:
            hostname = (urlparse(url).hostname or "unknown").lower()
            if hostname.startswith("www."):
                hostname = hostname[4:]
            return hostname
        except Exception:
            return "unknown"
