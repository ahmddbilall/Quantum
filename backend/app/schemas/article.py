from datetime import datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, Field


class ArticleSummary(BaseModel):
    id: UUID
    title: str
    summary: Optional[str] = None
    url: str
    original_url: Optional[str] = None
    source: str
    category: Optional[str] = None
    published_at: Optional[datetime] = None
    image_url: Optional[str] = None
    author: Optional[str] = None
    language: str = "en"
    views: int = 0
    sentiment_score: Optional[float] = None
    sentiment_label: Optional[str] = None
    tags: List[str] = Field(default_factory=list)

    class Config:
        from_attributes = True


class ArticleDetail(ArticleSummary):
    content: Optional[str] = None


class NewsFeedResponse(BaseModel):
    items: List[ArticleSummary]
    page: int
    limit: int
    total: int
    has_more: bool


class BookmarkActionResponse(BaseModel):
    success: bool
    message: str
    article_id: UUID


class NewsSyncRequest(BaseModel):
    categories: Optional[List[str]] = None
    page_size: int = Field(default=30, ge=1, le=100)


class NewsSyncResponse(BaseModel):
    fetched: int
    inserted: int
    updated: int
    skipped: int
    embedded: int
