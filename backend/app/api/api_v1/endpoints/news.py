from datetime import datetime
from typing import Any, List, Optional
from uuid import UUID

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api import deps
from app.models.user import User
from app.schemas.article import (
    ArticleDetail,
    ArticleSummary,
    BookmarkActionResponse,
    NewsFeedResponse,
    NewsSyncRequest,
    NewsSyncResponse,
)
from app.services.news_service import MARKET_NEWS_SOURCES, news_service
from app.services.recommendation_service import recommendation_service

router = APIRouter()


def _parse_sources(source: Optional[str]) -> Optional[List[str]]:
    if not source:
        return None
    parsed = [item.strip() for item in source.split(",") if item.strip()]
    return parsed or None


def _to_article_detail_payload(article: Any) -> dict:
    payload = news_service._to_summary(article)
    payload["content"] = article.content
    return payload


@router.get("/feed", response_model=NewsFeedResponse)
async def get_news_feed(
    db: AsyncSession = Depends(deps.get_db),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    category: Optional[str] = Query(default=None),
    source: Optional[str] = Query(default=None),
    search_query: Optional[str] = Query(default=None),
    q: Optional[str] = Query(default=None),
    start_date: Optional[datetime] = Query(default=None),
    end_date: Optional[datetime] = Query(default=None),
) -> Any:
    sources = _parse_sources(source)

    query_value = search_query or q
    return await news_service.get_feed(
        db,
        page=page,
        limit=limit,
        category=category,
        sources=sources,
        search_query=query_value,
        start_date=start_date,
        end_date=end_date,
    )


@router.get("/news-feed", response_model=NewsFeedResponse)
async def get_news_feed_page(
    db: AsyncSession = Depends(deps.get_db),
    current_user: Optional[User] = Depends(deps.get_optional_current_user),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    category: Optional[str] = Query(default=None),
    source: Optional[str] = Query(default=None),
    search_query: Optional[str] = Query(default=None),
    q: Optional[str] = Query(default=None),
    start_date: Optional[datetime] = Query(default=None),
    end_date: Optional[datetime] = Query(default=None),
    exclude_article_ids: Optional[str] = Query(default=None),
) -> Any:
    query_value = search_query or q

    # When a search query is active, use the standard text/vector feed
    if query_value:
        return await news_service.get_feed(
            db,
            page=page,
            limit=limit,
            category=category,
            sources=_parse_sources(source),
            exclude_sources=MARKET_NEWS_SOURCES,
            search_query=query_value,
            start_date=start_date,
            end_date=end_date,
        )

    # Otherwise use the recommendation engine (works for anon + logged-in)
    return await recommendation_service.get_recommended_feed(
        db,
        user=current_user,
        page=page,
        limit=limit,
        category=category,
        sources=_parse_sources(source),
        exclude_sources=MARKET_NEWS_SOURCES,
        exclude_article_ids=exclude_article_ids,
    )


@router.get("/market-news", response_model=NewsFeedResponse)
async def get_market_news_page(
    db: AsyncSession = Depends(deps.get_db),
    current_user: Optional[User] = Depends(deps.get_optional_current_user),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    category: Optional[str] = Query(default=None),
    source: Optional[str] = Query(default=None),
    search_query: Optional[str] = Query(default=None),
    q: Optional[str] = Query(default=None),
    start_date: Optional[datetime] = Query(default=None),
    end_date: Optional[datetime] = Query(default=None),
    exclude_article_ids: Optional[str] = Query(default=None),
) -> Any:
    query_value = search_query or q

    if query_value:
        return await news_service.get_feed(
            db,
            page=page,
            limit=limit,
            category=category,
            sources=_parse_sources(source),
            include_sources=MARKET_NEWS_SOURCES,
            search_query=query_value,
            start_date=start_date,
            end_date=end_date,
        )

    return await recommendation_service.get_recommended_feed(
        db,
        user=current_user,
        page=page,
        limit=limit,
        category=category,
        sources=_parse_sources(source),
        include_sources=MARKET_NEWS_SOURCES,
        exclude_article_ids=exclude_article_ids,
    )


@router.post("/bookmark/{article_id}", response_model=BookmarkActionResponse)
async def add_bookmark(
    article_id: UUID,
    db: AsyncSession = Depends(deps.get_db),
    current_user=Depends(deps.get_current_active_user),
) -> Any:
    success = await news_service.add_bookmark(db, current_user, article_id)
    if not success:
        raise HTTPException(status_code=404, detail="Article not found")

    return BookmarkActionResponse(
        success=True,
        message="Bookmark saved",
        article_id=article_id,
    )


@router.delete("/bookmark/{article_id}", response_model=BookmarkActionResponse)
async def remove_bookmark(
    article_id: UUID,
    db: AsyncSession = Depends(deps.get_db),
    current_user=Depends(deps.get_current_active_user),
) -> Any:
    removed = await news_service.remove_bookmark(db, current_user, article_id)
    if not removed:
        raise HTTPException(status_code=404, detail="Bookmark not found")

    return BookmarkActionResponse(
        success=True,
        message="Bookmark removed",
        article_id=article_id,
    )


@router.get("/bookmarks", response_model=List[ArticleSummary])
async def get_bookmarks(
    db: AsyncSession = Depends(deps.get_db),
    current_user=Depends(deps.get_current_active_user),
) -> Any:
    return await news_service.list_bookmarks(db, current_user)


@router.post("/sync", response_model=NewsSyncResponse)
async def sync_news(
    request: NewsSyncRequest,
    db: AsyncSession = Depends(deps.get_db),
    _current_user=Depends(deps.get_current_superuser),
) -> Any:
    try:
        return await news_service.sync_from_newsapi(
            db,
            categories=request.categories,
            page_size=request.page_size,
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    except httpx.HTTPError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"News provider request failed: {str(exc)}",
        ) from exc


@router.get("/categories", response_model=List[str])
async def get_news_categories(
    db: AsyncSession = Depends(deps.get_db),
) -> Any:
    """Get all available news categories."""
    return await news_service.get_categories(db)


@router.get("/sources", response_model=List[str])
async def get_news_sources(
    db: AsyncSession = Depends(deps.get_db),
) -> Any:
    """Get all available news sources."""
    return await news_service.get_sources(db)


@router.get("/news-feed/sources", response_model=List[str])
async def get_news_feed_sources(
    db: AsyncSession = Depends(deps.get_db),
) -> Any:
    return await news_service.get_sources(db, exclude_sources=MARKET_NEWS_SOURCES)


@router.get("/news-feed/categories", response_model=List[str])
async def get_news_feed_categories(
    db: AsyncSession = Depends(deps.get_db),
) -> Any:
    return await news_service.get_ranked_categories(
        db,
        limit=10,
        exclude_sources=MARKET_NEWS_SOURCES,
        include_all=True,
    )


@router.get("/market-news/sources", response_model=List[str])
async def get_market_news_sources(
    db: AsyncSession = Depends(deps.get_db),
) -> Any:
    return await news_service.get_sources(db, include_sources=MARKET_NEWS_SOURCES)


@router.get("/article/{article_id}", response_model=ArticleDetail)
async def get_article_detail(
    article_id: UUID,
    db: AsyncSession = Depends(deps.get_db),
) -> Any:
    article = await news_service.get_article(db, article_id)
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    return _to_article_detail_payload(article)


# ── Recommendation Endpoints ──────────────────────────────────────────
# NOTE: These must be defined BEFORE the catch-all /{article_id} route
# so that FastAPI does not try to parse "recommendations" etc. as a UUID.

@router.get("/recommendations", response_model=NewsFeedResponse)
async def get_recommendations(
    db: AsyncSession = Depends(deps.get_db),
    current_user: Optional[User] = Depends(deps.get_optional_current_user),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    category: Optional[str] = Query(default=None),
    source: Optional[str] = Query(default=None),
    exclude_article_id: Optional[UUID] = Query(default=None),
    exclude_article_ids: Optional[str] = Query(default=None),
    feed_context: str = Query(default="general"),
) -> Any:
    """Personalised news recommendations (works for anonymous & logged-in users)."""
    include_srcs = MARKET_NEWS_SOURCES if feed_context == "market" else None
    exclude_srcs = MARKET_NEWS_SOURCES if feed_context == "general" else None

    return await recommendation_service.get_recommended_feed(
        db,
        user=current_user,
        page=page,
        limit=limit,
        category=category,
        sources=_parse_sources(source),
        exclude_sources=exclude_srcs,
        include_sources=include_srcs,
        exclude_article_id=exclude_article_id,
        exclude_article_ids=exclude_article_ids,
    )


@router.get("/article/{article_id}/related", response_model=List[ArticleSummary])
async def get_related_articles(
    article_id: UUID,
    db: AsyncSession = Depends(deps.get_db),
    limit: int = Query(default=6, ge=1, le=20),
) -> Any:
    """Return articles most similar to the given article by embedding."""
    return await recommendation_service.get_related_articles(
        db, article_id, limit=limit
    )


@router.get("/featured", response_model=List[ArticleSummary])
async def get_featured_news(
    db: AsyncSession = Depends(deps.get_db),
    current_user: Optional[User] = Depends(deps.get_optional_current_user),
    limit: int = Query(default=10, ge=1, le=50),
) -> Any:
    """Trending / featured articles for the home page."""
    return await recommendation_service.get_featured_news(
        db, user=current_user, limit=limit
    )


# ── Catch-all (must be LAST) ─────────────────────────────────────────

@router.get("/{article_id}", response_model=ArticleDetail)
async def get_news_article(
    article_id: UUID,
    db: AsyncSession = Depends(deps.get_db),
) -> Any:
    article = await news_service.get_article(db, article_id)
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    return _to_article_detail_payload(article)
