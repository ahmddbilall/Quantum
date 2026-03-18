from datetime import datetime
from typing import Any, List, Optional
from uuid import UUID

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api import deps
from app.schemas.article import (
    ArticleDetail,
    ArticleSummary,
    BookmarkActionResponse,
    NewsFeedResponse,
    NewsSyncRequest,
    NewsSyncResponse,
)
from app.services.news_service import news_service

router = APIRouter()


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
    sources: Optional[List[str]] = None
    if source:
        sources = [item.strip() for item in source.split(",") if item.strip()]

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


@router.get("/{article_id}", response_model=ArticleDetail)
async def get_news_article(
    article_id: UUID,
    db: AsyncSession = Depends(deps.get_db),
) -> Any:
    article = await news_service.get_article(db, article_id)
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    return article
