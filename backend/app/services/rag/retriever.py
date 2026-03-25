from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
import logging
from app.services.embedding_service import EmbeddingService
from app.services.rag.state import MetadataFilters

logger = logging.getLogger(__name__)

async def hybrid_search(
    query: str,
    filters: MetadataFilters,
    db: AsyncSession,
    top_k: int = 5
) -> list[dict]:
    try:
        logger.info(
            "RAG retriever hybrid_search start query_len=%s top_k=%s filters=%s",
            len(query or ""),
            top_k,
            filters,
        )
        query_vector = await EmbeddingService.encode_query(query)
        if not query_vector:
            logger.warning("RAG retriever hybrid_search no_query_vector query_len=%s", len(query or ""))
            return []

        params = {"query_vector": str(query_vector), "top_k": top_k}
        where_clauses = ["1=1"]

        if filters.get("source"):
            where_clauses.append("a.source ILIKE :source")
            params["source"] = f"%{filters['source']}%"
        
        if filters.get("category"):
            where_clauses.append("a.category ILIKE :category")
            params["category"] = f"%{filters['category']}%"
        
        if filters.get("date_range") is not None:
            days = filters["date_range"]
            where_clauses.append(f"a.published_at >= NOW() - INTERVAL '{days} days'")

        if filters.get("article_id"):
            where_clauses.append("a.id = CAST(:article_id AS uuid)")
            params["article_id"] = str(filters["article_id"])

        where_sql = " AND ".join(where_clauses)

        sql = f"""
        SELECT 
            a.id, a.title, a.url, a.source, 
            a.category, a.published_at, a.summary,
            ae.embedding <=> cast(:query_vector as vector) AS distance
        FROM article_embeddings ae
        JOIN articles a ON ae.article_id = a.id
        WHERE {where_sql}
        ORDER BY ae.embedding <=> cast(:query_vector as vector) ASC
        LIMIT :top_k
        """

        result = await db.execute(text(sql), params)
        rows = result.fetchall()
        logger.info("RAG retriever hybrid_search done rows=%s", len(rows))

        return [
            {
                "id": str(r.id),
                "title": r.title,
                "url": r.url,
                "source": r.source,
                "published_at": r.published_at.isoformat() if r.published_at else None,
                "snippet": r.summary[:300] if r.summary else ""
            }
            for r in rows
        ]
    except Exception:
        logger.exception("RAG retriever hybrid_search failed")
        raise
