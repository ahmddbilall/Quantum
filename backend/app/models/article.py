from sqlalchemy import Column, String, Text, DateTime, Integer, Float, ForeignKey, func, ARRAY, Boolean, Index
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from pgvector.sqlalchemy import Vector
from app.core.database import Base
import uuid


class NewsSource(Base):
    __tablename__ = "news_sources"

    id = Column(Integer, primary_key=True)
    name = Column(String(100), unique=True, nullable=False, index=True)
    base_url = Column(Text, nullable=True)
    source_type = Column(String(20), default='web', nullable=False)  # 'web', 'rss', 'api'
    is_active = Column(Boolean, default=True, nullable=False)
    scrape_interval_minutes = Column(Integer, default=360)
    created_at = Column(DateTime(timezone=True), default=func.now())
    updated_at = Column(DateTime(timezone=True), default=func.now(), onupdate=func.now())

    # Relationships
    articles = relationship("Article", back_populates="news_source")


class Article(Base):
    __tablename__ = "articles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String, nullable=False)
    summary = Column(Text, nullable=True)
    content = Column(Text, nullable=True)
    url = Column(String, unique=True, index=True, nullable=False)
    source = Column(String, index=True, nullable=False)
    category = Column(String, index=True)
    published_at = Column(DateTime(timezone=True), index=True)
    image_url = Column(String, nullable=True)
    author = Column(String, nullable=True)
    language = Column(String, default='en')
    views = Column(Integer, default=0)
    sentiment_score = Column(Float, nullable=True)
    sentiment_label = Column(String, nullable=True)  # positive, negative, neutral
    tags = Column(ARRAY(String), default=[])
    source_id = Column(Integer, ForeignKey("news_sources.id", ondelete="SET NULL"), nullable=True, index=True)
    scraped_at = Column(DateTime(timezone=True), default=func.now())
    ingestion_meta = Column(JSONB, default=dict)
    content_hash = Column(String(64), nullable=True, index=True)

    # Relationships
    embedding = relationship("ArticleEmbedding", back_populates="article", uselist=False, cascade="all, delete-orphan")
    news_source = relationship("NewsSource", back_populates="articles")


class ArticleEmbedding(Base):
    __tablename__ = "article_embeddings"

    article_id = Column(UUID(as_uuid=True), ForeignKey("articles.id", ondelete="CASCADE"), primary_key=True)
    embedding = Column(Vector(768), nullable=False)

    __table_args__ = (
        Index(
            "ix_article_embeddings_embedding",
            "embedding",
            postgresql_using="hnsw",
            postgresql_with={"m": 16, "ef_construction": 64},
            postgresql_ops={"embedding": "vector_cosine_ops"},
        ),
    )

    # Relationships
    article = relationship("Article", back_populates="embedding")
