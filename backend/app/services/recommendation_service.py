"""Simplified News Recommendation Service enforcing explicit 70/30 source splits."""

from __future__ import annotations

import math
from collections import Counter
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from uuid import UUID

from sqlalchemy import and_, or_, func, select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.article import Article, ArticleEmbedding
from app.models.interaction import Bookmark
from app.models.user import User
from app.services.news_service import NewsService

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
DISCOVERY_RATIO = 0.20

class RecommendationService:
    """Stateless recommendation engine operating directly on the database."""

    async def get_recommended_feed(
        self,
        db: AsyncSession,
        *,
        user: Optional[User] = None,
        page: int = 1,
        limit: int = 20,
        category: Optional[str] = None,
        sources: Optional[List[str]] = None,
        exclude_sources: Optional[List[str]] = None,
        include_sources: Optional[List[str]] = None,
        exclude_article_id: Optional[UUID] = None,
        exclude_article_ids: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Return a simplified feed strictly conforming to 70% preference SQL filtering."""
        
        prefs = self._get_preferences(user)
        is_explicit_filter = bool(category and category.lower() != "all") or bool(sources)
        has_user_prefs = bool(user and (prefs["categories"] or prefs["sources"]))
        
        if is_explicit_filter:
            pref_limit = limit
            disc_limit = 0
            pref_cats = [category.lower()] if category and category.lower() != "all" else []
            pref_srcs = [s.lower() for s in sources] if sources else []
            disc_cats = []
            disc_srcs = []
        elif has_user_prefs:
            pref_limit = max(1, int(limit * (1 - DISCOVERY_RATIO)))
            disc_limit = limit - pref_limit
            pref_cats = [c.lower() for c in prefs["categories"]]
            pref_srcs = [s.lower() for s in prefs["sources"]]
            disc_cats = pref_cats
            disc_srcs = pref_srcs
        else:
            pref_limit = 0
            disc_limit = limit
            pref_cats = []
            pref_srcs = []
            disc_cats = []
            disc_srcs = []
            
        base_filters = self._base_filters(
            exclude_sources=exclude_sources,
            include_sources=include_sources,
            exclude_article_id=exclude_article_id,
            exclude_article_ids=exclude_article_ids,
        )
        
        articles: List[Article] = []
        
        # --- Preferred Query (70% or 100%) ---
        if pref_limit > 0:
            f = list(base_filters)
            pref_conds = []
            if pref_cats:
                pref_conds.append(func.lower(Article.category).in_(pref_cats))
            if pref_srcs:
                pref_conds.append(func.lower(Article.source).in_(pref_srcs))
            if pref_conds:
                f.append(and_(*pref_conds))
                
            stmt = (
                select(Article)
                .where(and_(*f) if f else True)
                .order_by(Article.published_at.desc().nullslast())
                .limit(pref_limit)
            )
            # Offset is irrelevant since exclude_article_ids handles true pagination
            pref_articles = list((await db.execute(stmt)).scalars().all())
            articles.extend(pref_articles)
            
        # --- Discovery Query (30% or 100%) ---
        disc_articles = []
        if disc_limit > 0:
            f = list(base_filters)
            if articles:
                f.append(Article.id.notin_([a.id for a in articles]))
                
            disc_conds = []
            if disc_cats:
                disc_conds.append(~func.lower(Article.category).in_(disc_cats))
            if disc_srcs:
                disc_conds.append(~func.lower(Article.source).in_(disc_srcs))
            if disc_conds:
                f.append(or_(*disc_conds))
                
            stmt = (
                select(Article)
                .where(and_(*f) if f else True)
                .order_by(Article.views.desc().nullslast(), Article.published_at.desc().nullslast())
                .limit(disc_limit)
            )
            disc_articles = list((await db.execute(stmt)).scalars().all())
            
        if articles and disc_articles:
            articles = self._interleave(articles, disc_articles)
        elif not articles:
            articles = disc_articles

        # Top up to requested page size when preference/discovery filters return too few rows.
        if len(articles) < limit:
            topup_filters = list(base_filters)
            if articles:
                topup_filters.append(Article.id.notin_([a.id for a in articles]))

            topup_stmt = (
                select(Article)
                .where(and_(*topup_filters) if topup_filters else True)
                .order_by(Article.published_at.desc().nullslast())
                .limit(limit - len(articles))
            )
            topup_articles = list((await db.execute(topup_stmt)).scalars().all())
            if topup_articles:
                articles.extend(topup_articles)

        # Calculate actual total count matching the filters
        count_filters = list(base_filters)
        if is_explicit_filter:
            count_conds = []
            if pref_cats:
                count_conds.append(func.lower(Article.category).in_(pref_cats))
            if pref_srcs:
                count_conds.append(func.lower(Article.source).in_(pref_srcs))
            if count_conds:
                count_filters.append(and_(*count_conds))
        
        # Execute actual count query to get real total
        count_stmt = select(func.count(Article.id)).where(and_(*count_filters) if count_filters else True)
        total = int((await db.execute(count_stmt)).scalar_one())
        has_more = ((page - 1) * limit + len(articles)) < total
        
        return {
            "items": [NewsService._to_summary(a) for a in articles],
            "page": page,
            "limit": limit,
            "total": total,
            "has_more": has_more,
        }

    async def get_featured_news(
        self,
        db: AsyncSession,
        *,
        user: Optional[User] = None,
        limit: int = 10,
    ) -> List[Dict[str, Any]]:
        """Return simple top headlines with 70/30 split."""
        prefs = self._get_preferences(user)
        has_user_prefs = bool(user and (prefs["categories"] or prefs["sources"]))
        
        if has_user_prefs:
            pref_limit = max(1, int(limit * (1 - DISCOVERY_RATIO)))
            disc_limit = limit - pref_limit
            pref_cats = [c.lower() for c in prefs["categories"]]
            pref_srcs = [s.lower() for s in prefs["sources"]]
        else:
            pref_limit = 0
            disc_limit = limit
            pref_cats = []
            pref_srcs = []
            
        articles: List[Article] = []
        
        if pref_limit > 0:
            pref_conds = []
            if pref_cats:
                pref_conds.append(func.lower(Article.category).in_(pref_cats))
            if pref_srcs:
                pref_conds.append(func.lower(Article.source).in_(pref_srcs))
                
            stmt = (
                select(Article)
                .where(and_(*pref_conds))
                .order_by(Article.views.desc().nullslast(), Article.published_at.desc().nullslast())
                .limit(pref_limit)
            )
            articles.extend(list((await db.execute(stmt)).scalars().all()))
            
        if disc_limit > 0:
            f = []
            if articles:
                f.append(Article.id.notin_([a.id for a in articles]))
            disc_conds = []
            if pref_cats:
                disc_conds.append(~func.lower(Article.category).in_(pref_cats))
            if pref_srcs:
                disc_conds.append(~func.lower(Article.source).in_(pref_srcs))
            if disc_conds:
                f.append(or_(*disc_conds))
                
            stmt = (
                select(Article)
                .where(and_(*f) if f else True)
                .order_by(Article.views.desc().nullslast(), Article.published_at.desc().nullslast())
                .limit(disc_limit)
            )
            disc_articles = list((await db.execute(stmt)).scalars().all())
            articles = self._interleave(articles, disc_articles) if articles else disc_articles
            
        return [NewsService._to_summary(a) for a in articles]

    async def get_related_articles(
        self,
        db: AsyncSession,
        article_id: UUID,
        *,
        limit: int = 6,
    ) -> List[Dict[str, Any]]:
        """Remains unchanged: purely embedding similarity for currently read articles."""
        embedding_row = (
            await db.execute(
                select(ArticleEmbedding.embedding).where(
                    ArticleEmbedding.article_id == article_id
                )
            )
        ).scalar_one_or_none()

        if embedding_row is None:
            source_article = (
                await db.execute(
                    select(Article.category).where(Article.id == article_id)
                )
            ).scalar_one_or_none()

            filters = [Article.id != article_id]
            if source_article:
                filters.append(func.lower(Article.category) == source_article.lower())

            stmt = (
                select(Article)
                .where(and_(*filters))
                .order_by(Article.published_at.desc().nullslast())
                .limit(limit)
            )
            articles = (await db.execute(stmt)).scalars().all()
            return [NewsService._to_summary(a) for a in articles]

        source_embedding = embedding_row

        statement = (
            select(Article)
            .join(ArticleEmbedding, ArticleEmbedding.article_id == Article.id)
            .where(Article.id != article_id)
            .order_by(
                ArticleEmbedding.embedding.cosine_distance(source_embedding)
            )
            .limit(limit)
        )

        articles = (await db.execute(statement)).scalars().all()
        return [NewsService._to_summary(a) for a in articles]

    @staticmethod
    def _get_preferences(user: Optional[User]) -> Dict[str, Any]:
        """Extract preference dict with safe defaults."""
        if user is None:
            return {"categories": [], "sources": [], "watchlist": []}
        
        prefs = {}
        if isinstance(user.preferences, dict):
            prefs = user.preferences
        elif hasattr(user.preferences, "model_dump"):
            prefs = user.preferences.model_dump()
        elif hasattr(user.preferences, "dict"):
            prefs = user.preferences.dict()
            
        return {
            "categories": prefs.get("categories") or [],
            "sources": prefs.get("sources") or [],
            "watchlist": prefs.get("watchlist") or [],
        }

    @staticmethod
    def _base_filters(
        *,
        exclude_sources: Optional[List[str]] = None,
        include_sources: Optional[List[str]] = None,
        exclude_article_id: Optional[UUID] = None,
        exclude_article_ids: Optional[str] = None,
    ) -> List:
        """Build common WHERE filters reused across tiers."""
        filters: list = []
        if exclude_sources:
            filters.append(~func.lower(Article.source).in_([s.lower() for s in exclude_sources]))
        if include_sources:
            filters.append(func.lower(Article.source).in_([s.lower() for s in include_sources]))
        if exclude_article_id:
            filters.append(Article.id != exclude_article_id)
        if exclude_article_ids:
            try:
                ids_list = [UUID(id.strip()) for id in exclude_article_ids.split(",") if id.strip()]
                if ids_list:
                    filters.append(Article.id.notin_(ids_list))
            except Exception:
                pass
        return filters

    @staticmethod
    def _interleave(
        primary: List[Article],
        discovery: List[Article],
    ) -> List[Article]:
        """Interleave discovery articles into the primary list."""
        if not discovery:
            return primary
        if not primary:
            return discovery

        result: List[Article] = []
        d_idx = 0
        insert_every = max(2, len(primary) // max(len(discovery), 1))

        for i, article in enumerate(primary):
            result.append(article)
            if d_idx < len(discovery) and (i + 1) % insert_every == 0:
                result.append(discovery[d_idx])
                d_idx += 1

        while d_idx < len(discovery):
            result.append(discovery[d_idx])
            d_idx += 1

        return result

recommendation_service = RecommendationService()
