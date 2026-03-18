from sqlalchemy import Column, String, Text, DateTime, Integer, Float, ForeignKey, func, ARRAY
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from pgvector.sqlalchemy import Vector
from app.core.database import Base
import uuid

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
    sentiment_label = Column(String, nullable=True) # positive, negative, neutral
    tags = Column(ARRAY(String), default=[])

    # Relationships
    embedding = relationship("ArticleEmbedding", back_populates="article", uselist=False, cascade="all, delete-orphan")

class ArticleEmbedding(Base):
    __tablename__ = "article_embeddings"

    article_id = Column(UUID(as_uuid=True), ForeignKey("articles.id", ondelete="CASCADE"), primary_key=True)
    embedding = Column(Vector(768), nullable=False)

    # Relationships
    article = relationship("Article", back_populates="embedding")
