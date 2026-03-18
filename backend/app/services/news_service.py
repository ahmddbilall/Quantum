from __future__ import annotations

from collections import Counter
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from uuid import UUID

import httpx
from sqlalchemy import and_, delete, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.article import Article, ArticleEmbedding
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


class NewsService:
    async def get_feed(
        self,
        db: AsyncSession,
        *,
        page: int,
        limit: int,
        category: Optional[str] = None,
        sources: Optional[List[str]] = None,
        search_query: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
    ) -> NewsFeedResponse:
        filters = []

        if category and category.lower() != "all":
            filters.append(func.lower(Article.category) == category.lower())

        if sources:
            normalized_sources = [source.strip().lower() for source in sources if source.strip()]
            if normalized_sources:
                filters.append(func.lower(Article.source).in_(normalized_sources))

        if start_date:
            filters.append(Article.published_at >= self._as_utc(start_date))
        if end_date:
            filters.append(Article.published_at <= self._as_utc(end_date))

        offset = (page - 1) * limit

        if search_query:
            query_embedding = await EmbeddingService.encode_query(search_query)
            if query_embedding:
                return await self._vector_feed(
                    db,
                    filters=filters,
                    query_embedding=query_embedding,
                    page=page,
                    limit=limit,
                    offset=offset,
                )
            return await self._text_feed(
                db,
                filters=filters,
                search_query=search_query,
                page=page,
                limit=limit,
                offset=offset,
            )

        statement = select(Article)
        if filters:
            statement = statement.where(and_(*filters))

        total_statement = select(func.count(Article.id))
        if filters:
            total_statement = total_statement.where(and_(*filters))

        total = int((await db.execute(total_statement)).scalar_one())

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

    async def get_article(self, db: AsyncSession, article_id: UUID) -> Optional[Article]:
        article = (
            await db.execute(select(Article).where(Article.id == article_id))
        ).scalars().first()
        if not article:
            return None

        article.views = (article.views or 0) + 1
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

        summary = (item.get("description") or "").strip() or None
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

            embedding = await EmbeddingService.encode_document(self._embedding_text(title, summary, content))
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

        embedding = await EmbeddingService.encode_document(self._embedding_text(title, summary, content))
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
        statement = select(Article).join(ArticleEmbedding, ArticleEmbedding.article_id == Article.id)
        total_statement = select(func.count(Article.id)).join(
            ArticleEmbedding, ArticleEmbedding.article_id == Article.id
        )

        if filters:
            condition = and_(*filters)
            statement = statement.where(condition)
            total_statement = total_statement.where(condition)

        total = int((await db.execute(total_statement)).scalar_one())

        statement = (
            statement.order_by(ArticleEmbedding.embedding.cosine_distance(query_embedding))
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
        total_statement = select(func.count(Article.id)).where(text_match)

        if filters:
            condition = and_(*filters)
            statement = statement.where(condition)
            total_statement = total_statement.where(condition)

        total = int((await db.execute(total_statement)).scalar_one())

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

    @staticmethod
    def _assign_if_changed(obj: Any, field_name: str, value: Any) -> bool:
        current_value = getattr(obj, field_name)
        if current_value == value:
            return False
        setattr(obj, field_name, value)
        return True

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
    def _embedding_text(title: str, summary: Optional[str], content: Optional[str]) -> str:
        short_content = (content or "")[:800]
        return f"Title: {title}\nSummary: {summary or ''}\nContent: {short_content}"

    @staticmethod
    def _to_summary(article: Article):
        return {
            "id": article.id,
            "title": article.title,
            "summary": article.summary,
            "url": article.url,
            "source": article.source,
            "category": article.category,
            "published_at": article.published_at,
            "image_url": article.image_url,
            "author": article.author,
            "language": article.language or "en",
            "views": article.views or 0,
            "sentiment_score": article.sentiment_score,
            "sentiment_label": article.sentiment_label,
            "tags": article.tags or [],
        }


news_service = NewsService()
