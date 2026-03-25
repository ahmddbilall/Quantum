import logging
from app.core.database import SessionLocal
from sqlalchemy import text
from app.services.embedding_service import EmbeddingService

logger = logging.getLogger(__name__)

async def backfill_embeddings(batch_size: int = 100):
    async with SessionLocal() as db:
        try:
            sql_select = text("""
                SELECT a.id, a.title, a.summary, a.tags, a.content
                FROM articles a
                LEFT JOIN article_embeddings ae ON ae.article_id = a.id
                WHERE ae.article_id IS NULL
                LIMIT :batch_size
            """)
            result = await db.execute(sql_select, {"batch_size": batch_size})
            rows = result.fetchall()

            if not rows:
                return

            sql_insert = text("""
                INSERT INTO article_embeddings (article_id, embedding)
                VALUES (:article_id, cast(:embedding as vector))
            """)

            embedded_count = 0
            for r in rows:
                title = r.title or ""
                summary = r.summary or ""
                tags = r.tags or []
                content = r.content or ""
                
                text_to_embed = (
                    f"Title: {title}\nSummary: {summary}\n"
                    f"Tags: {', '.join(tags)}\nContent: {content}"
                )
                
                embedding = EmbeddingService.encode_query(text_to_embed)
                
                await db.execute(sql_insert, {
                    "article_id": r.id,
                    "embedding": str(embedding)
                })
                embedded_count += 1
                
            await db.commit()
            if embedded_count > 0:
                logger.info(f"Embedded {embedded_count} articles")
        except Exception:
            await db.rollback()
