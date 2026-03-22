"""add search performance indexes and pg_trgm

Revision ID: 20260323_search_perf
Revises: 20260321_phase3
Create Date: 2026-03-23 00:00:00.000000
"""

from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = "20260323_search_perf"
down_revision: Union[str, None] = "20260321_phase3"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS pg_trgm")

    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_articles_source_lower ON articles (LOWER(source))"
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_articles_category_lower ON articles (LOWER(category))"
    )

    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_articles_title_trgm ON articles USING gin (title gin_trgm_ops)"
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_articles_summary_trgm ON articles USING gin (summary gin_trgm_ops)"
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_articles_content_trgm ON articles USING gin (content gin_trgm_ops)"
    )


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS ix_articles_content_trgm")
    op.execute("DROP INDEX IF EXISTS ix_articles_summary_trgm")
    op.execute("DROP INDEX IF EXISTS ix_articles_title_trgm")
    op.execute("DROP INDEX IF EXISTS ix_articles_category_lower")
    op.execute("DROP INDEX IF EXISTS ix_articles_source_lower")
