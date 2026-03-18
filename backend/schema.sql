-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR NOT NULL UNIQUE,
    hashed_password VARCHAR NOT NULL,
    full_name VARCHAR,
    is_active BOOLEAN DEFAULT TRUE,
    is_superuser BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    preferences JSONB DEFAULT '{}',
    profile JSONB DEFAULT '{}'
);

-- Articles Table
CREATE TABLE IF NOT EXISTS articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR NOT NULL,
    summary TEXT,
    content TEXT,
    url VARCHAR NOT NULL UNIQUE,
    source VARCHAR NOT NULL,
    category VARCHAR,
    published_at TIMESTAMP WITH TIME ZONE,
    image_url VARCHAR,
    author VARCHAR,
    language VARCHAR DEFAULT 'en',
    views INTEGER DEFAULT 0,
    sentiment_score FLOAT,
    sentiment_label VARCHAR,
    tags TEXT[] DEFAULT '{}'::TEXT[]
);

CREATE INDEX IF NOT EXISTS ix_articles_url ON articles (url);
CREATE INDEX IF NOT EXISTS ix_articles_source ON articles (source);
CREATE INDEX IF NOT EXISTS ix_articles_category ON articles (category);
CREATE INDEX IF NOT EXISTS ix_articles_published_at ON articles (published_at);

-- Article Embeddings Table
CREATE TABLE IF NOT EXISTS article_embeddings (
    article_id UUID PRIMARY KEY REFERENCES articles(id) ON DELETE CASCADE,
    embedding vector(768) NOT NULL
);

CREATE INDEX IF NOT EXISTS ix_article_embeddings_embedding ON article_embeddings USING hnsw (embedding vector_cosine_ops);

-- Chats Table
CREATE TABLE IF NOT EXISTS chats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_chats_user_id ON chats (user_id);

-- Messages Table
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_id UUID REFERENCES chats(id) ON DELETE CASCADE,
    role VARCHAR NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_messages_chat_id ON messages (chat_id);
CREATE INDEX IF NOT EXISTS ix_messages_created_at ON messages (created_at);

-- Bookmarks Table
CREATE TABLE IF NOT EXISTS bookmarks (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (user_id, article_id)
);

-- Watchlist Table
CREATE TABLE IF NOT EXISTS watchlist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    symbol VARCHAR NOT NULL,
    asset_type VARCHAR NOT NULL,
    name VARCHAR,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_watchlist_user_id ON watchlist (user_id);

-- Market Quotes Table
CREATE TABLE IF NOT EXISTS market_quotes (
    symbol VARCHAR PRIMARY KEY,
    price FLOAT NOT NULL,
    change FLOAT NOT NULL,
    change_percent FLOAT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
