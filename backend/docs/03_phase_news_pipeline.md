# Phase 3: News Scraping Pipeline (Revised Plan)

## Objective

Build a production-ready news ingestion pipeline using the existing scraper code in `backend/data_scraping` plus API-based ingestion, both running independently from FastAPI request handling while writing into the main application schema used by `app/models/article.py` and `app/services/news_service.py`.

## 1. Codebase Investigation Summary (Current State)

### 1.1 What is already implemented in `backend/data_scraping`

1. Fully async scraper framework with retries, rate limiting, source-specific parsers (`base_scraper.py`, `scrapers.py`).
2. Multi-source scraping:
   - Web sources: Al Jazeera, BBC, Guardian.
   - RSS/crypto sources: NewsBTC, CryptoSlate, AMBCrypto, Blockonomi, Decrypt, CNBC Crypto.
3. Background scheduling loops (`scheduler.py`): scrape loop, embedding loop, cleanup loop.
4. Embedding pipeline using local BGE model (`embeddings.py`, 768 dims).
5. CLI manager (`run_scraper.py`, `manager.py`) for continuous and one-shot runs.
6. Logging/metrics/error tracking utilities (`logging_utils.py`).

### 1.2 Current integration gaps

1. Scraper DB layer currently writes to separate tables (`news_articles`, `news_sources`, `scraping_logs`) in `data_scraping/news_scraper/database.py`.
2. Main backend/API currently reads from canonical app tables (`articles`, `article_embeddings`) in `schema.sql` and ORM models.
3. Result: without alignment, scraper data and API feed data are split.

## 2. Non-Blocking Runtime Architecture (Required)

## 2.1 Execution model

1. Run ingestion pipeline as a dedicated worker process, separate from FastAPI process.
2. Worker owns its own asyncio event loop and DB pool.
3. Worker runs independent async loops for:
   - source scraping ingestion
   - API-based news ingestion
   - embedding processing
   - cleanup/retention
4. FastAPI serves requests only; it does not run ingestion loops in request thread.

## 2.2 Why this satisfies requirement

1. Scraping/API-ingestion/embedding continue in background independently.
2. API latency is isolated from scraping jobs.
3. Worker can be restarted/scaled without touching web server.

## 2.3 Planned run modes

1. `python backend/data_scraping/run_scraper.py run` -> continuous worker.
2. `python backend/data_scraping/run_scraper.py run-once` -> manual batch (scrape + API ingestion + embeddings).
3. `python backend/data_scraping/run_scraper.py scrape --source <name>` -> source-only scrape.
4. `python backend/data_scraping/run_scraper.py api-news` -> API-only ingestion.
5. `python backend/data_scraping/run_scraper.py embeddings` -> embeddings-only processing.

## 3. Data Model Strategy (Single Source of Truth)

## 3.1 Canonical tables to keep

1. `articles` (main content + metadata)
2. `article_embeddings` (pgvector)

## 3.2 New operational tables to add

1. `news_sources` -> source registry/configuration.
2. `scraping_runs` -> per-run audit/status.

## 3.3 Planned updates to `articles`

1. Add `source_id` FK to `news_sources`.
2. Add `scraped_at` for ingestion timestamp.
3. Add `ingestion_meta` JSONB for source/raw metadata.
4. Add `content_hash` for stronger dedupe/change detection.

## 4. Phase 3 Detailed Implementation Plan

## 4.1 Milestone A - Schema alignment

1. Update `backend/schema.sql` with all Phase 3 DDL additions (listed below).
2. Keep existing `articles` + `article_embeddings`; do not create parallel `news_articles` table.
3. Seed `news_sources` table with configured sources.

## 4.2 Milestone B - Scraper DB adapter refactor

1. Refactor `data_scraping/news_scraper/database.py` to write to canonical app tables:
   - insert/update into `articles`
   - embedding writes into `article_embeddings`
2. Replace `is_processed` logic with `NOT EXISTS` in `article_embeddings`.
3. Keep URL dedupe and add hash-based no-op update logic.

## 4.3 Milestone C - Background worker hardening

1. Keep current loop architecture (scrape/embedding/cleanup).
2. Add run-level records in `scraping_runs` (start/end/status/counters).
3. Add lock guard (single active worker instance).
4. Add structured retry/backoff per source.

## 4.4 Milestone D - API compatibility and feed freshness

1. No breaking changes to existing `/news/feed`, `/news/{id}`, bookmarks endpoints.
2. Ensure newly scraped rows map to current API fields (`source`, `category`, `tags`, sentiment fields, etc).
3. Keep vector search behavior intact through `article_embeddings`.

## 4.6 Backend API Surface (Added)

1. Public read endpoints (no auth):
   - `GET /api/v1/news/feed`
   - `GET /api/v1/news/{article_id}`
   - `GET /api/v1/news/categories`
   - `GET /api/v1/news/sources`
2. Authenticated user endpoints:
   - `GET /api/v1/news/bookmarks`
   - `POST /api/v1/news/bookmark/{article_id}`
   - `DELETE /api/v1/news/bookmark/{article_id}`
3. Superuser/admin operations:
   - `POST /api/v1/news/sync` (manual NewsAPI pull)
   - `POST /api/v1/worker/trigger-scrape` (manual worker trigger)
4. Worker observability:
   - `GET /api/v1/worker/health`
   - `GET /api/v1/worker/status`

## 4.7 API Query Parameters for Feed

1. `page` (default 1)
2. `limit` (default 20, max 100)
3. `category`
4. `source` (comma-separated)
5. `q` or `search_query`
6. `start_date`
7. `end_date`

## 4.5 Milestone E - Operations and reliability

1. Health checks for worker status and last successful run.
2. Monitoring metrics: scrape count, embed count, failures, run duration.
3. Retention policy for `scraping_runs` and logs.

## 5. Planned `schema.sql` Changes

## 5.1 New tables

1. `news_sources`
2. `scraping_runs`

## 5.2 Alter existing table

1. `articles`
   - `source_id INTEGER NULL REFERENCES news_sources(id)`
   - `scraped_at TIMESTAMPTZ DEFAULT NOW()`
   - `ingestion_meta JSONB DEFAULT '{}'::jsonb`
   - `content_hash VARCHAR(64)`

## 5.3 New indexes

1. `ix_articles_source_id`
2. `ix_articles_scraped_at`
3. `ix_articles_content_hash`
4. `ix_scraping_runs_source_started`

## 6. SQL Update Query to Run (Phase 3 Migration)

```sql
BEGIN;

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
    error_details JSONB NOT NULL DEFAULT '{}'::jsonb
);

ALTER TABLE articles
    ADD COLUMN IF NOT EXISTS source_id INTEGER REFERENCES news_sources(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS scraped_at TIMESTAMPTZ DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS ingestion_meta JSONB NOT NULL DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS content_hash VARCHAR(64);

CREATE INDEX IF NOT EXISTS ix_articles_source_id ON articles(source_id);
CREATE INDEX IF NOT EXISTS ix_articles_scraped_at ON articles(scraped_at DESC);
CREATE INDEX IF NOT EXISTS ix_articles_content_hash ON articles(content_hash);
CREATE INDEX IF NOT EXISTS ix_scraping_runs_source_started ON scraping_runs(source_id, started_at DESC);

INSERT INTO news_sources (name, base_url, source_type)
VALUES
    ('aljazeera', 'https://www.aljazeera.com', 'web'),
    ('bbc', 'https://www.bbc.com', 'web'),
    ('guardian', 'https://www.theguardian.com', 'web'),
    ('newsbtc', 'https://www.newsbtc.com/feed/', 'rss'),
    ('cryptoslate', 'https://cryptoslate.com/feed/', 'rss'),
    ('ambcrypto', 'https://ambcrypto.com/feed/', 'rss'),
    ('blockonomi', 'https://blockonomi.com/feed/', 'rss'),
    ('decrypt', 'https://decrypt.co/feed', 'rss'),
    ('cnbc_crypto', 'https://www.cnbc.com/id/100003114/device/rss/rss.html', 'rss')
ON CONFLICT (name) DO UPDATE
SET
    base_url = EXCLUDED.base_url,
    source_type = EXCLUDED.source_type,
    is_active = TRUE,
    updated_at = NOW();

COMMIT;
```

## 7. Acceptance Criteria for Phase 3

1. Worker runs continuously without blocking FastAPI thread.
2. Scraped articles appear in `/news/feed` from canonical `articles` table.
3. Vector search works for scraped content via `article_embeddings`.
4. Duplicate URLs are not reinserted; changed content is updated.
5. Failures are recorded in `scraping_runs` and logs for debugging.

## 8. Delivery Order

1. Apply schema migration and update `schema.sql`.
2. Refactor scraper DB adapter to canonical tables.
3. Validate one-shot run (`run-once`) end-to-end.
4. Enable continuous background worker mode.
5. Add operational checks and retention cleanup.
