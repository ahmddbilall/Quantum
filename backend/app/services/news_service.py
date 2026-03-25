from __future__ import annotations

from collections import Counter
from datetime import datetime, timezone
import logging
import time
from typing import Any, Dict, List, Optional
from uuid import UUID

import httpx
from sqlalchemy import and_, delete, func, or_, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.article import Article, ArticleEmbedding, NewsSource
from app.models.interaction import Bookmark
from app.models.user import User
from app.schemas.article import NewsFeedResponse, NewsSyncResponse
from app.services.embedding_service import EmbeddingService


POSITIVE_WORDS = {
    "surge",
    "gain",
    "growth",
    "record",
    "strong",
    "optimistic",
    "breakthrough",
    "improve",
    "rally",
}

NEGATIVE_WORDS = {
    "drop",
    "decline",
    "loss",
    "crash",
    "weak",
    "concern",
    "risk",
    "fall",
    "lawsuit",
}

STOPWORDS = {
    "the",
    "a",
    "an",
    "in",
    "on",
    "at",
    "of",
    "to",
    "for",
    "and",
    "or",
    "with",
    "from",
    "by",
    "is",
    "are",
    "be",
    "as",
    "that",
    "this",
}

MARKET_NEWS_SOURCES = [
    "newsbtc",
    "cryptoslate",
    "ambcrypto",
    "blockonomi",
    "decrypt",
    "cnbc_crypto",
]


class NewsService:
    def __init__(self):
        self._logger = logging.getLogger(__name__)
        self._cached_totals = {}
        self._cached_query_embeddings = {}
        self._cached_semantic_results = {}
        self._cache_lock = None

    @staticmethod
    def _normalize_search_query(search_query: Optional[str]) -> str:
        return (search_query or "").strip().lower()

    @staticmethod
    def _build_filter_key(
        *,
        category: Optional[str],
        normalized_sources: List[str],
        normalized_include: List[str],
        normalized_exclude: List[str],
        start_date: Optional[datetime],
        end_date: Optional[datetime],
    ) -> str:
        return ":".join(
            [
                (category or "").strip().lower(),
                ",".join(sorted(normalized_sources)),
                ",".join(sorted(normalized_include)),
                ",".join(sorted(normalized_exclude)),
                str(start_date or ""),
                str(end_date or ""),
            ]
        )

    def _get_cached_query_embedding(self, normalized_query: str) -> Optional[List[float]]:
        import time

        if not normalized_query:
            return None

        cached = self._cached_query_embeddings.get(normalized_query)
        if not cached:
            return None

        embedding, cache_time = cached
        if time.time() - cache_time > 300:
            self._cached_query_embeddings.pop(normalized_query, None)
            return None
        return embedding

    def _set_cached_query_embedding(self, normalized_query: str, embedding: List[float]) -> None:
        import time

        if not normalized_query:
            return
        self._cached_query_embeddings[normalized_query] = (embedding, time.time())

    def _get_cached_semantic_response(self, cache_key: str) -> Optional[NewsFeedResponse]:
        import time

        cached = self._cached_semantic_results.get(cache_key)
        if not cached:
            return None

        response, cache_time = cached
        if time.time() - cache_time > 120:
            self._cached_semantic_results.pop(cache_key, None)
            return None

        return response

    def _set_cached_semantic_response(
        self,
        cache_key: str,
        response: NewsFeedResponse,
    ) -> None:
        import time

        self._cached_semantic_results[cache_key] = (response, time.time())

    async def _get_fast_total(self, db: AsyncSession, cache_key: str, filters: List[Any]) -> int:
        import time
        import asyncio
        if self._cache_lock is None:
            self._cache_lock = asyncio.Lock()
        
        current_time = time.time()
        if cache_key in self._cached_totals:
            count, cache_time = self._cached_totals[cache_key]
            if current_time - cache_time < 300:
                return count

        async with self._cache_lock:
            if cache_key in self._cached_totals:
                count, cache_time = self._cached_totals[cache_key]
                if current_time - cache_time < 300:
                    return count
            
            stmt = select(func.count(Article.id))
            if filters:
                stmt = stmt.where(and_(*filters))
                
            total = int((await db.execute(stmt)).scalar_one())
            self._cached_totals[cache_key] = (total, current_time)
            return total

    async def get_ranked_categories(
        self,
        db: AsyncSession,
        *,
        limit: int = 10,
        include_sources: Optional[List[str]] = None,
        exclude_sources: Optional[List[str]] = None,
        include_all: bool = True,
    ) -> List[str]:
        """Return top categories by article count, optionally source-filtered."""
        category_key = func.lower(func.trim(Article.category))
        filters = [
            Article.category.isnot(None),
            func.length(func.trim(Article.category)) > 0,
        ]

        normalized_include = self._normalize_sources(include_sources)
        normalized_exclude = self._normalize_sources(exclude_sources)

        if normalized_include:
            filters.append(func.lower(Article.source).in_(normalized_include))

        if normalized_exclude:
            filters.append(~func.lower(Article.source).in_(normalized_exclude))

        statement = (
            select(category_key.label("category_key"), func.count(Article.id).label("article_count"))
            .where(and_(*filters))
            .group_by(category_key)
            .order_by(func.count(Article.id).desc(), category_key.asc())
            .limit(limit)
        )

        rows = (await db.execute(statement)).all()

        # Multiple raw category keys can normalize to the same display label (e.g. "News").
        # Keep unique labels while preserving ranking order.
        categories: List[str] = []
        seen = set()
        for row in rows:
            if row.article_count <= 0:
                continue
            normalized = self._sanitize_category(row.category_key)
            lowered = normalized.lower()
            if lowered in seen:
                continue
            seen.add(lowered)
            categories.append(normalized)

        if include_all:
            return ["all", *categories]
        return categories

    async def get_categories(self, db: AsyncSession) -> List[str]:
        """Get all unique categories from articles table."""
        result = await db.execute(
            select(Article.category)
            .where(Article.category.isnot(None))
            .distinct()
            .order_by(Article.category)
        )
        categories = result.scalars().all()
        normalized_categories: List[str] = []
        seen = set()
        for cat in categories:
            normalized = self._sanitize_category(cat)
            lowered = normalized.lower()
            if lowered in seen:
                continue
            seen.add(lowered)
            normalized_categories.append(normalized)
        return normalized_categories

    async def get_sources(
        self,
        db: AsyncSession,
        *,
        include_sources: Optional[List[str]] = None,
        exclude_sources: Optional[List[str]] = None,
    ) -> List[str]:
        """Get all unique sources from news_sources table."""
        filters = [NewsSource.is_active == True]

        normalized_include = self._normalize_sources(include_sources)
        normalized_exclude = self._normalize_sources(exclude_sources)

        if normalized_include:
            filters.append(func.lower(NewsSource.name).in_(normalized_include))

        if normalized_exclude:
            filters.append(~func.lower(NewsSource.name).in_(normalized_exclude))

        result = await db.execute(
            select(NewsSource.name)
            .where(and_(*filters))
            .order_by(NewsSource.name)
        )
        sources = result.scalars().all()
        
        normalized_sources: List[str] = []
        seen = set()
        for src in sources:
            if not src or not src.strip():
                continue
            clean = src.strip()
            lowered = clean.lower()
            if lowered in seen:
                continue
            seen.add(lowered)
            normalized_sources.append(clean)
            
        return normalized_sources

    async def get_feed(
        self,
        db: AsyncSession,
        *,
        page: int,
        limit: int,
        category: Optional[str] = None,
        sources: Optional[List[str]] = None,
        include_sources: Optional[List[str]] = None,
        exclude_sources: Optional[List[str]] = None,
        search_query: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
    ) -> NewsFeedResponse:
        filters = []
        effective_sources: List[str] = []
        normalized_sources = self._normalize_sources(sources)
        normalized_include = self._normalize_sources(include_sources)
        normalized_exclude = self._normalize_sources(exclude_sources)

        if category and category.lower() != "all":
            filters.append(func.lower(Article.category) == category.lower())

        if normalized_sources:
            if normalized_include:
                normalized_sources = [
                    source for source in normalized_sources if source in normalized_include
                ]

            if normalized_exclude:
                normalized_sources = [
                    source for source in normalized_sources if source not in normalized_exclude
                ]

            if not normalized_sources:
                return NewsFeedResponse(items=[], page=page, limit=limit, total=0, has_more=False)

            filters.append(func.lower(Article.source).in_(normalized_sources))
            effective_sources = normalized_sources
        elif normalized_include:
            filters.append(func.lower(Article.source).in_(normalized_include))
            effective_sources = normalized_include

        if normalized_exclude:
            filters.append(~func.lower(Article.source).in_(normalized_exclude))

        if start_date:
            filters.append(Article.published_at >= self._as_utc(start_date))
        if end_date:
            filters.append(Article.published_at <= self._as_utc(end_date))

        offset = (page - 1) * limit

        normalized_query = self._normalize_search_query(search_query)
        filter_key = self._build_filter_key(
            category=category,
            normalized_sources=normalized_sources,
            normalized_include=normalized_include,
            normalized_exclude=normalized_exclude,
            start_date=start_date,
            end_date=end_date,
        )

        if normalized_query:
            request_start = time.perf_counter()
            embedding_ms = 0.0
            query_embedding = self._get_cached_query_embedding(normalized_query)
            if query_embedding is None:
                embedding_start = time.perf_counter()
                query_embedding = await EmbeddingService.encode_query(normalized_query)
                embedding_ms = (time.perf_counter() - embedding_start) * 1000
                if query_embedding:
                    self._set_cached_query_embedding(normalized_query, query_embedding)

            semantic_mode = "vector" if query_embedding else "text"
            if semantic_mode == "text":
                self._logger.warning(
                    "search fallback=text query='%s' reason=embedding_unavailable",
                    normalized_query,
                )
            semantic_cache_key = (
                f"semantic:{semantic_mode}:{normalized_query}:{filter_key}:{page}:{limit}"
            )
            cached_response = self._get_cached_semantic_response(semantic_cache_key)
            if cached_response:
                total_ms = (time.perf_counter() - request_start) * 1000
                self._logger.info(
                    "search mode=%s cache=hit query='%s' page=%s limit=%s total_ms=%.1f",
                    semantic_mode,
                    normalized_query,
                    page,
                    limit,
                    total_ms,
                )
                return cached_response

            if query_embedding:
                db_start = time.perf_counter()
                response = await self._vector_feed(
                    db,
                    filters=filters,
                    query_embedding=query_embedding,
                    page=page,
                    limit=limit,
                    offset=offset,
                )
                db_ms = (time.perf_counter() - db_start) * 1000
            else:
                db_start = time.perf_counter()
                response = await self._text_feed(
                    db,
                    filters=filters,
                    search_query=normalized_query,
                    page=page,
                    limit=limit,
                    offset=offset,
                )
                db_ms = (time.perf_counter() - db_start) * 1000

            self._set_cached_semantic_response(semantic_cache_key, response)
            total_ms = (time.perf_counter() - request_start) * 1000
            self._logger.info(
                "search mode=%s cache=miss query='%s' page=%s limit=%s embedding_ms=%.1f db_ms=%.1f total_ms=%.1f items=%s",
                semantic_mode,
                normalized_query,
                page,
                limit,
                embedding_ms,
                db_ms,
                total_ms,
                len(response.items),
            )
            return response

        cache_key = f"total:{filter_key}:"
        total = await self._get_fast_total(db, cache_key, filters)

        statement = select(Article)
        if filters:
            statement = statement.where(and_(*filters))

        if len(effective_sources) > 1:
            return await self._balanced_source_feed(
                db,
                filters=filters,
                page=page,
                limit=limit,
                total=total,
                offset=offset,
            )

        statement = (
            statement.order_by(Article.published_at.desc().nullslast(), Article.id.desc())
            .offset(offset)
            .limit(limit)
        )

        items = (await db.execute(statement)).scalars().all()
        return NewsFeedResponse(
            items=[self._to_summary(article) for article in items],
            page=page,
            limit=limit,
            total=total,
            has_more=(offset + len(items)) < total,
        )

    async def _balanced_source_feed(
        self,
        db: AsyncSession,
        *,
        filters: List[Any],
        page: int,
        limit: int,
        total: int,
        offset: int,
    ) -> NewsFeedResponse:
        """Return feed interleaved by source for fair multi-source pagination."""
        source_key = func.lower(Article.source)
        published_sort = Article.published_at.desc().nullslast()

        ranked_statement = select(
            Article.id.label("article_id"),
            source_key.label("source_key"),
            func.row_number()
            .over(partition_by=source_key, order_by=(published_sort, Article.id.desc()))
            .label("source_rank"),
            func.max(Article.published_at)
            .over(partition_by=source_key)
            .label("source_latest"),
        )

        if filters:
            ranked_statement = ranked_statement.where(and_(*filters))

        ranked_subquery = ranked_statement.subquery()

        ordered_ids_statement = (
            select(ranked_subquery.c.article_id)
            .order_by(
                ranked_subquery.c.source_rank.asc(),
                ranked_subquery.c.source_latest.desc().nullslast(),
                ranked_subquery.c.source_key.asc(),
                ranked_subquery.c.article_id.desc(),
            )
            .offset(offset)
            .limit(limit)
        )

        ordered_ids = list((await db.execute(ordered_ids_statement)).scalars().all())

        if not ordered_ids:
            return NewsFeedResponse(
                items=[],
                page=page,
                limit=limit,
                total=total,
                has_more=(offset + len(ordered_ids)) < total,
            )

        articles_statement = select(Article).where(Article.id.in_(ordered_ids))
        fetched_articles = (await db.execute(articles_statement)).scalars().all()
        article_by_id = {article.id: article for article in fetched_articles}
        ordered_articles = [article_by_id[item_id] for item_id in ordered_ids if item_id in article_by_id]

        return NewsFeedResponse(
            items=[self._to_summary(article) for article in ordered_articles],
            page=page,
            limit=limit,
            total=total,
            has_more=(offset + len(ordered_articles)) < total,
        )

    async def get_article(self, db: AsyncSession, article_id: UUID) -> Optional[Article]:
        article = (
            await db.execute(select(Article).where(Article.id == article_id))
        ).scalars().first()
        if not article:
            return None

        article.views = (article.views or 0) + 1
        normalized_category = self._sanitize_category(
            article.category,
            title=article.title,
        )
        if article.category != normalized_category:
            article.category = normalized_category

        db.add(article)
        await db.commit()
        await db.refresh(article)
        return article

    async def add_bookmark(self, db: AsyncSession, user: User, article_id: UUID) -> bool:
        article = (
            await db.execute(select(Article.id).where(Article.id == article_id))
        ).scalar_one_or_none()
        if not article:
            return False

        existing = (
            await db.execute(
                select(Bookmark).where(
                    and_(Bookmark.user_id == user.id, Bookmark.article_id == article_id)
                )
            )
        ).scalars().first()
        if existing:
            return True

        db.add(Bookmark(user_id=user.id, article_id=article_id))
        await db.commit()
        return True

    async def remove_bookmark(self, db: AsyncSession, user: User, article_id: UUID) -> bool:
        result = await db.execute(
            delete(Bookmark).where(
                and_(Bookmark.user_id == user.id, Bookmark.article_id == article_id)
            )
        )
        await db.commit()
        return result.rowcount > 0

    async def list_bookmarks(self, db: AsyncSession, user: User) -> List[Article]:
        statement = (
            select(Article)
            .join(Bookmark, Bookmark.article_id == Article.id)
            .where(Bookmark.user_id == user.id)
            .order_by(Bookmark.created_at.desc())
        )
        return (await db.execute(statement)).scalars().all()

    async def sync_from_newsapi(
        self,
        db: AsyncSession,
        *,
        categories: Optional[List[str]] = None,
        page_size: int = 30,
    ) -> NewsSyncResponse:
        api_key = settings.NEWS_API_KEY
        if not api_key:
            raise ValueError("NEWS_API_KEY is not configured")

        categories = categories or ["business", "technology", "science", "health", "general"]

        fetched = 0
        inserted = 0
        updated = 0
        skipped = 0
        embedded = 0

        async with httpx.AsyncClient(timeout=30) as client:
            for category in categories:
                response = await client.get(
                    "https://newsapi.org/v2/top-headlines",
                    params={
                        "apiKey": api_key,
                        "language": "en",
                        "category": category,
                        "pageSize": page_size,
                    },
                )
                response.raise_for_status()

                payload = response.json()
                articles = payload.get("articles", [])
                fetched += len(articles)

                for item in articles:
                    upsert_result = await self._upsert_newsapi_article(db, item, category)
                    if upsert_result == "inserted":
                        inserted += 1
                    elif upsert_result == "inserted_embedded":
                        inserted += 1
                        embedded += 1
                    elif upsert_result == "updated":
                        updated += 1
                    elif upsert_result == "updated_embedded":
                        updated += 1
                        embedded += 1
                    else:
                        skipped += 1

        return NewsSyncResponse(
            fetched=fetched,
            inserted=inserted,
            updated=updated,
            skipped=skipped,
            embedded=embedded,
        )

    async def _upsert_newsapi_article(
        self,
        db: AsyncSession,
        item: Dict[str, Any],
        default_category: str,
    ) -> str:
        url = (item.get("url") or "").strip()
        title = (item.get("title") or "").strip()
        if not url or not title:
            return "skipped"

        existing = (
            await db.execute(select(Article).where(Article.url == url))
        ).scalars().first()

        summary = None
        content = (item.get("content") or "").strip() or summary
        source_name = ((item.get("source") or {}).get("name") or "Unknown").strip()
        published_at = self._parse_newsapi_datetime(item.get("publishedAt"))
        image_url = item.get("urlToImage")
        author = item.get("author")
        tags = self._extract_tags(f"{title} {summary or ''}")
        sentiment_score, sentiment_label = self._sentiment(summary or title)

        if existing:
            changed = False
            changed = self._assign_if_changed(existing, "title", title) or changed
            changed = self._assign_if_changed(existing, "summary", summary) or changed
            changed = self._assign_if_changed(existing, "content", content) or changed
            changed = self._assign_if_changed(existing, "source", source_name) or changed
            changed = self._assign_if_changed(existing, "category", default_category.title()) or changed
            changed = self._assign_if_changed(existing, "published_at", published_at) or changed
            changed = self._assign_if_changed(existing, "image_url", image_url) or changed
            changed = self._assign_if_changed(existing, "author", author) or changed
            changed = self._assign_if_changed(existing, "tags", tags) or changed
            changed = self._assign_if_changed(existing, "sentiment_score", sentiment_score) or changed
            changed = self._assign_if_changed(existing, "sentiment_label", sentiment_label) or changed

            db.add(existing)
            await db.commit()

            if not changed:
                return "skipped"

            embedding = await EmbeddingService.encode_document(self._embedding_text(title, summary, content, tags))
            if embedding:
                await self._upsert_embedding(db, existing.id, embedding)
                return "updated_embedded"
            return "updated"

        article = Article(
            title=title,
            summary=summary,
            content=content,
            url=url,
            source=source_name,
            category=default_category.title(),
            published_at=published_at,
            image_url=image_url,
            author=author,
            language="en",
            tags=tags,
            sentiment_score=sentiment_score,
            sentiment_label=sentiment_label,
        )

        db.add(article)
        await db.commit()
        await db.refresh(article)

        embedding = await EmbeddingService.encode_document(self._embedding_text(title, summary, content, tags))
        if embedding:
            await self._upsert_embedding(db, article.id, embedding)
            return "inserted_embedded"

        return "inserted"

    async def _upsert_embedding(self, db: AsyncSession, article_id: UUID, embedding: List[float]) -> None:
        existing = (
            await db.execute(
                select(ArticleEmbedding).where(ArticleEmbedding.article_id == article_id)
            )
        ).scalars().first()

        if existing:
            existing.embedding = embedding
            db.add(existing)
        else:
            db.add(ArticleEmbedding(article_id=article_id, embedding=embedding))

        await db.commit()

    async def _vector_feed(
        self,
        db: AsyncSession,
        *,
        filters: List[Any],
        query_embedding: List[float],
        page: int,
        limit: int,
        offset: int,
    ) -> NewsFeedResponse:
        distance_expr = ArticleEmbedding.embedding.cosine_distance(query_embedding).label("distance")
        candidate_statement = (
            select(Article.id.label("article_id"), distance_expr)
            .join(ArticleEmbedding, ArticleEmbedding.article_id == Article.id)
        )

        if filters:
            condition = and_(*filters)
            candidate_statement = candidate_statement.where(condition)

        await db.execute(text("SET LOCAL hnsw.ef_search = 48;"))

        candidate_statement = (
            candidate_statement.order_by(
                distance_expr,
                Article.published_at.desc().nullslast(),
                Article.id.desc(),
            )
            .offset(offset)
            .limit(limit + 1)
        )

        candidate_rows = (await db.execute(candidate_statement)).all()
        has_more = len(candidate_rows) > limit
        candidate_rows = candidate_rows[:limit]
        ordered_ids = [row.article_id for row in candidate_rows]

        if not ordered_ids:
            return NewsFeedResponse(
                items=[],
                page=page,
                limit=limit,
                total=offset,
                has_more=False,
            )

        article_statement = select(Article).where(Article.id.in_(ordered_ids))
        fetched_articles = (await db.execute(article_statement)).scalars().all()
        article_by_id = {article.id: article for article in fetched_articles}
        items = [article_by_id[item_id] for item_id in ordered_ids if item_id in article_by_id]

        estimated_total = offset + len(items) + (1 if has_more else 0)

        return NewsFeedResponse(
            items=[self._to_summary(article) for article in items],
            page=page,
            limit=limit,
            total=estimated_total,
            has_more=has_more,
        )

    async def _text_feed(
        self,
        db: AsyncSession,
        *,
        filters: List[Any],
        search_query: str,
        page: int,
        limit: int,
        offset: int,
    ) -> NewsFeedResponse:
        text_match = or_(
            Article.title.ilike(f"%{search_query}%"),
            Article.summary.ilike(f"%{search_query}%"),
            Article.content.ilike(f"%{search_query}%"),
        )

        statement = select(Article).where(text_match)

        if filters:
            condition = and_(*filters)
            statement = statement.where(condition)

        statement = (
            statement.order_by(Article.published_at.desc().nullslast(), Article.id.desc())
            .offset(offset)
            .limit(limit + 1)
        )

        items = (await db.execute(statement)).scalars().all()
        has_more = len(items) > limit
        items = items[:limit]
        estimated_total = offset + len(items) + (1 if has_more else 0)

        return NewsFeedResponse(
            items=[self._to_summary(article) for article in items],
            page=page,
            limit=limit,
            total=estimated_total,
            has_more=has_more,
        )

    @staticmethod
    def _assign_if_changed(obj: Any, field_name: str, value: Any) -> bool:
        current_value = getattr(obj, field_name)
        if current_value == value:
            return False
        setattr(obj, field_name, value)
        return True

    @staticmethod
    def _normalize_sources(sources: Optional[List[str]]) -> List[str]:
        if not sources:
            return []
        normalized = [source.strip().lower() for source in sources if source and source.strip()]
        return list(dict.fromkeys(normalized))

    @staticmethod
    def _as_utc(value: datetime) -> datetime:
        if value.tzinfo is None:
            return value.replace(tzinfo=timezone.utc)
        return value.astimezone(timezone.utc)

    @staticmethod
    def _parse_newsapi_datetime(value: Optional[str]) -> Optional[datetime]:
        if not value:
            return None
        try:
            if value.endswith("Z"):
                value = value.replace("Z", "+00:00")
            dt = datetime.fromisoformat(value)
            if dt.tzinfo is None:
                return dt.replace(tzinfo=timezone.utc)
            return dt.astimezone(timezone.utc)
        except ValueError:
            return None

    @staticmethod
    def _extract_tags(text: str, max_tags: int = 5) -> List[str]:
        words = [word.lower() for word in text.split()]
        cleaned = ["".join(ch for ch in word if ch.isalnum()) for word in words]
        candidates = [w for w in cleaned if len(w) > 3 and w not in STOPWORDS]
        common = Counter(candidates).most_common(max_tags)
        return [tag for tag, _ in common]

    @staticmethod
    def _sentiment(text: str) -> tuple[float, str]:
        words = ["".join(ch for ch in word.lower() if ch.isalnum()) for word in text.split()]
        pos = sum(1 for word in words if word in POSITIVE_WORDS)
        neg = sum(1 for word in words if word in NEGATIVE_WORDS)
        total = max(pos + neg, 1)
        score = (pos - neg) / total

        if score > 0.2:
            label = "positive"
        elif score < -0.2:
            label = "negative"
        else:
            label = "neutral"

        return score, label

    @staticmethod
    def _embedding_text(title: str, summary: Optional[str], content: Optional[str], tags: Optional[List[str]] = None) -> str:
        short_content = (content or "")[:800]
        tags_str = ", ".join(tags) if tags else ""
        return f"Title: {title}\nSummary: {summary or ''}\nTags: {tags_str}\nContent: {short_content}"

    @staticmethod
    def _to_summary(article: Article):
        return {
            "id": article.id,
            "title": article.title,
            "summary": article.summary,
            "url": article.url,
            "original_url": article.url,
            "source": article.source,
            "category": NewsService._sanitize_category(
                article.category,
                title=article.title,
            ),
            "published_at": article.published_at,
            "image_url": article.image_url,
            "author": article.author,
            "language": article.language or "en",
            "views": article.views or 0,
            "sentiment_score": article.sentiment_score,
            "sentiment_label": article.sentiment_label,
            "tags": article.tags or [],
        }

    @staticmethod
    def _sanitize_category(
        category: Optional[str],
        *,
        title: Optional[str] = None,
    ) -> str:
        value = (category or "").strip()
        if not value:
            return "News"

        if len(value) > 60:
            return "News"

        generic = {
            "news",
            "latest",
            "latest news",
            "article",
            "articles",
            "story",
            "stories",
        }
        if value.lower() in generic:
            return "News"

        if title:
            def fingerprint(text: str) -> str:
                return "".join(ch.lower() for ch in text if ch.isalnum())

            if fingerprint(value) == fingerprint(title):
                return "News"

        return value


news_service = NewsService()
