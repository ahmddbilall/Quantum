-- Quantum canonical database bootstrap
-- This file is the single-source SQL to create the full schema for a fresh setup.

BEGIN;

-- Required extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Users
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR NOT NULL UNIQUE,
    hashed_password VARCHAR NOT NULL,
    full_name VARCHAR,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_superuser BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    preferences JSONB NOT NULL DEFAULT '{}'::JSONB,
    profile JSONB NOT NULL DEFAULT '{}'::JSONB
);

CREATE INDEX IF NOT EXISTS ix_users_email ON users (email);

-- News sources
CREATE TABLE IF NOT EXISTS news_sources (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    base_url TEXT,
    source_type VARCHAR(20) NOT NULL DEFAULT 'web',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    scrape_interval_minutes INTEGER NOT NULL DEFAULT 360,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_news_sources_name ON news_sources (name);

-- Articles
CREATE TABLE IF NOT EXISTS articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id INTEGER REFERENCES news_sources(id) ON DELETE SET NULL,
    title VARCHAR NOT NULL,
    summary TEXT,
    content TEXT,
    url VARCHAR NOT NULL UNIQUE,
    source VARCHAR NOT NULL,
    category VARCHAR,
    published_at TIMESTAMPTZ,
    image_url VARCHAR,
    author VARCHAR,
    language VARCHAR NOT NULL DEFAULT 'en',
    views INTEGER NOT NULL DEFAULT 0,
    sentiment_score FLOAT,
    sentiment_label VARCHAR,
    tags TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
    scraped_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ingestion_meta JSONB NOT NULL DEFAULT '{}'::JSONB,
    content_hash VARCHAR(64)
);

CREATE INDEX IF NOT EXISTS ix_articles_url ON articles (url);
CREATE INDEX IF NOT EXISTS ix_articles_source ON articles (source);
CREATE INDEX IF NOT EXISTS ix_articles_source_id ON articles (source_id);
CREATE INDEX IF NOT EXISTS ix_articles_category ON articles (category);
CREATE INDEX IF NOT EXISTS ix_articles_published_at ON articles (published_at);
CREATE INDEX IF NOT EXISTS ix_articles_scraped_at ON articles (scraped_at DESC);
CREATE INDEX IF NOT EXISTS ix_articles_content_hash ON articles (content_hash);

-- Case-insensitive filter indexes
CREATE INDEX IF NOT EXISTS ix_articles_source_lower ON articles (LOWER(source));
CREATE INDEX IF NOT EXISTS ix_articles_category_lower ON articles (LOWER(category));

-- Fallback text-search indexes for ILIKE matching
CREATE INDEX IF NOT EXISTS ix_articles_title_trgm ON articles USING gin (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS ix_articles_summary_trgm ON articles USING gin (summary gin_trgm_ops);
CREATE INDEX IF NOT EXISTS ix_articles_content_trgm ON articles USING gin (content gin_trgm_ops);

-- Article embeddings (pgvector)
CREATE TABLE IF NOT EXISTS article_embeddings (
    article_id UUID PRIMARY KEY REFERENCES articles(id) ON DELETE CASCADE,
    embedding vector(768) NOT NULL
);

CREATE INDEX IF NOT EXISTS ix_article_embeddings_embedding
    ON article_embeddings
    USING hnsw (embedding vector_cosine_ops);

-- Scraping runs
CREATE TABLE IF NOT EXISTS scraping_runs (
    id BIGSERIAL PRIMARY KEY,
    source_id INTEGER REFERENCES news_sources(id) ON DELETE SET NULL,
    run_type VARCHAR(20) NOT NULL DEFAULT 'scrape',
    status VARCHAR(20) NOT NULL,
    message TEXT,
    articles_found INTEGER NOT NULL DEFAULT 0,
    articles_inserted INTEGER NOT NULL DEFAULT 0,
    articles_updated INTEGER NOT NULL DEFAULT 0,
    articles_failed INTEGER NOT NULL DEFAULT 0,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    error_details JSONB NOT NULL DEFAULT '{}'::JSONB
);

CREATE INDEX IF NOT EXISTS ix_scraping_runs_source_started
    ON scraping_runs (source_id, started_at DESC);

-- Chats
CREATE TABLE IF NOT EXISTS chats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_chats_user_id ON chats (user_id);

-- Messages
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_id UUID REFERENCES chats(id) ON DELETE CASCADE,
    role VARCHAR NOT NULL,
    content TEXT NOT NULL,
    sources JSONB NOT NULL DEFAULT '[]'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_messages_chat_id ON messages (chat_id);
CREATE INDEX IF NOT EXISTS ix_messages_created_at ON messages (created_at);

-- Bookmarks
CREATE TABLE IF NOT EXISTS bookmarks (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, article_id)
);

-- Watchlist
CREATE TABLE IF NOT EXISTS watchlist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    symbol VARCHAR NOT NULL,
    asset_type VARCHAR NOT NULL,
    name VARCHAR,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_watchlist_user_id ON watchlist (user_id);

-- Market quotes
CREATE TABLE IF NOT EXISTS market_quotes (
    symbol VARCHAR PRIMARY KEY,
    price FLOAT NOT NULL,
    change FLOAT NOT NULL,
    change_percent FLOAT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMIT;
