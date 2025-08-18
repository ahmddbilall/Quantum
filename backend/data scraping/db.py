import asyncpg
from asyncpg.pool import Pool
from typing import Optional, List, Dict, Any, AsyncIterator
from contextlib import asynccontextmanager
import os

# --- Connection Setup ---
async def create_pool() -> Pool:
    """Create a connection pool to AWS Aurora PostgreSQL."""
    db_params = {
        'host': os.getenv('DB_HOST'),
        'port': int(os.getenv('DB_PORT', 5432)),
        'user': os.getenv('DB_USER'),
        'password': os.getenv('DB_PASSWORD'),
        'database': os.getenv('DB_NAME'),
    }
    return await asyncpg.create_pool(**db_params)


@asynccontextmanager
async def get_conn(pool: Pool) -> AsyncIterator[asyncpg.Connection]:
    """Async context manager to acquire and release DB connection."""
    async with pool.acquire() as conn:
        yield conn


# --- CRUD: NewsArticles ---
async def create_news_article(
    pool: Pool,
    source: str,
    date: str,
    title: str,
    content: str,
    summary: Optional[str] = None,
    sentiment: Optional[str] = None,
    category: Optional[str] = None,
    cluster_id: Optional[int] = None,
    vector_embedding: Optional[List[float]] = None
) -> None:
    async with get_conn(pool) as conn:
        await conn.execute("""
            INSERT INTO NewsArticles 
            (source, date, title, content, summary, sentiment, category, cluster_id, vector_embedding)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            ON CONFLICT (source, title, date) DO NOTHING
        """, source, date, title, content, summary, sentiment, category, cluster_id, vector_embedding)


async def get_news_article(pool: Pool, article_id: int) -> Optional[Dict[str, Any]]:
    async with get_conn(pool) as conn:
        row = await conn.fetchrow("SELECT * FROM NewsArticles WHERE article_id = $1", article_id)
        return dict(row) if row else None


async def get_all_news_articles(pool: Pool) -> List[Dict[str, Any]]:
    async with get_conn(pool) as conn:
        rows = await conn.fetch("SELECT * FROM NewsArticles ORDER BY date DESC")
        return [dict(row) for row in rows]


async def update_news_article(
    pool: Pool,
    article_id: int,
    **updates: Optional[Any]
) -> None:
    fields = []
    values = []

    for idx, (key, value) in enumerate(updates.items(), start=1):
        if value is not None:
            fields.append(f"{key} = ${idx}")
            values.append(value)

    if not fields:
        return  # Nothing to update

    values.append(article_id)
    sql = f"""
        UPDATE NewsArticles
        SET {', '.join(fields)}
        WHERE article_id = ${len(values)}
    """

    async with get_conn(pool) as conn:
        await conn.execute(sql, *values)


async def delete_news_article(pool: Pool, article_id: int) -> None:
    async with get_conn(pool) as conn:
        await conn.execute("DELETE FROM NewsArticles WHERE article_id = $1", article_id)


# --- CRUD: Users ---
async def create_user(
    pool: Pool,
    username: str,
    email: str,
    preferences: Optional[str] = None
) -> None:
    async with get_conn(pool) as conn:
        await conn.execute("""
            INSERT INTO Users (username, email, preferences)
            VALUES ($1, $2, $3)
        """, username, email, preferences)
