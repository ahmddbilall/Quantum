"""phase 3 news pipeline canonical schema

Revision ID: 20260321_phase3
Revises: 
Create Date: 2026-03-21 00:00:00.000000
"""

from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = "20260321_phase3"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS vector")

    op.execute(
        """
        CREATE TABLE IF NOT EXISTS news_sources (
            id SERIAL PRIMARY KEY,
            name VARCHAR(100) NOT NULL UNIQUE,
            base_url TEXT,
            source_type VARCHAR(20) NOT NULL DEFAULT 'web',
            is_active BOOLEAN NOT NULL DEFAULT TRUE,
            scrape_interval_minutes INTEGER NOT NULL DEFAULT 360,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
        """
    )

    op.execute(
        """
        ALTER TABLE news_sources
            ADD COLUMN IF NOT EXISTS source_type VARCHAR(20) NOT NULL DEFAULT 'web',
            ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE,
            ADD COLUMN IF NOT EXISTS scrape_interval_minutes INTEGER NOT NULL DEFAULT 360,
            ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        """
    )

    op.execute(
        """
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
        )
        """
    )

    op.execute(
        """
        ALTER TABLE articles
            ADD COLUMN IF NOT EXISTS source_id INTEGER REFERENCES news_sources(id) ON DELETE SET NULL,
            ADD COLUMN IF NOT EXISTS scraped_at TIMESTAMPTZ DEFAULT NOW(),
            ADD COLUMN IF NOT EXISTS ingestion_meta JSONB DEFAULT '{}'::jsonb,
            ADD COLUMN IF NOT EXISTS content_hash VARCHAR(64)
        """
    )

    op.execute("CREATE INDEX IF NOT EXISTS ix_articles_source_id ON articles(source_id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_articles_scraped_at ON articles(scraped_at DESC)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_articles_content_hash ON articles(content_hash)")
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_scraping_runs_source_started ON scraping_runs(source_id, started_at DESC)"
    )


def downgrade() -> None:
    # Destructive rollback intentionally omitted for production safety.
    pass
