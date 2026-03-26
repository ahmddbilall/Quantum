import os
import logging
import json
from datetime import datetime
from typing import Any, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Header, Response, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from langchain_core.messages import HumanMessage, AIMessage

from app.api import deps
from app.schemas.chat import (
    ChatHistoryResponse,
    ChatMessageHistoryItem,
    ChatMessageRequest,
    ChatMessageResponse,
    ChatSummaryResponse,
    CreateChatRequest,
    RAGQueryRequest,
    RAGQueryResponse,
    SourceCitation,
    UpdateChatRequest,
    UpdateSecondaryModelRequest,
)
from app.services.rag.graph import build_rag_graph
from app.services.rag.llm_router import llm_router

logger = logging.getLogger(__name__)
router = APIRouter()


async def _get_owned_chat_or_404(
    db: AsyncSession,
    chat_id: UUID,
    user_id: UUID,
) -> Any:
    check_sql = text("""
        SELECT id, user_id, title, created_at, updated_at
        FROM chats
        WHERE id = :chat_id
    """)
    result = await db.execute(check_sql, {"chat_id": str(chat_id)})
    chat = result.mappings().first()

    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    if str(chat["user_id"]) != str(user_id):
        raise HTTPException(status_code=403, detail="Forbidden")
    return chat


async def _load_langchain_history(
    db: AsyncSession,
    chat_id: UUID,
    limit: int,
) -> list[Any]:
    history_sql = text("""
        SELECT role, content
        FROM messages
        WHERE chat_id = :chat_id
        ORDER BY created_at ASC
        LIMIT :limit
    """)
    history_result = await db.execute(
        history_sql,
        {"chat_id": str(chat_id), "limit": limit},
    )
    db_messages = history_result.fetchall()

    lc_messages = []
    for message in db_messages:
        if message.role == "user":
            lc_messages.append(HumanMessage(content=message.content))
        else:
            lc_messages.append(AIMessage(content=message.content))
    return lc_messages


async def _ensure_message_sources_column(db: AsyncSession) -> None:
    # Safe in repeated calls; required so citation sources persist per assistant message.
    await db.execute(
        text(
            """
            ALTER TABLE messages
            ADD COLUMN IF NOT EXISTS sources JSONB NOT NULL DEFAULT '[]'::jsonb
            """
        )
    )


def _build_sources(result_state: dict) -> list[SourceCitation]:
    sources: list[SourceCitation] = []
    seen = set()
    for article in result_state.get("retrieved_articles", []):
        if article["id"] in seen:
            continue
        seen.add(article["id"])
        parsed_article_id: Optional[UUID] = None
        try:
            parsed_article_id = UUID(article["id"])
        except (ValueError, TypeError):
            parsed_article_id = None

        sources.append(
            SourceCitation(
                article_id=parsed_article_id,
                title=article["title"],
                url=article["url"],
                source=article["source"],
            )
        )
    return sources


@router.get("/chats", response_model=list[ChatSummaryResponse])
async def list_chats(
    limit: int = 50,
    db: AsyncSession = Depends(deps.get_db),
    current_user: Any = Depends(deps.get_current_active_user),
) -> Any:
    limit = max(1, min(limit, 100))
    sql = text("""
        SELECT id, title, created_at, updated_at
        FROM chats
        WHERE user_id = :user_id
        ORDER BY updated_at DESC, created_at DESC
        LIMIT :limit
    """)
    result = await db.execute(
        sql,
        {"user_id": str(current_user.id), "limit": limit},
    )
    rows = result.fetchall()
    return [
        ChatSummaryResponse(
            id=row.id,
            title=row.title or "New Chat",
            created_at=row.created_at,
            updated_at=row.updated_at,
        )
        for row in rows
    ]


@router.post("/chats", response_model=ChatSummaryResponse, status_code=status.HTTP_201_CREATED)
async def create_chat(
    request: CreateChatRequest,
    db: AsyncSession = Depends(deps.get_db),
    current_user: Any = Depends(deps.get_current_active_user),
) -> Any:
    title = (request.title or "").strip() or "New Chat"
    sql = text("""
        INSERT INTO chats (id, user_id, title, created_at, updated_at)
        VALUES (gen_random_uuid(), :user_id, :title, NOW(), NOW())
        RETURNING id, title, created_at, updated_at
    """)
    result = await db.execute(sql, {"user_id": str(current_user.id), "title": title})
    await db.commit()
    row = result.fetchone()
    return ChatSummaryResponse(
        id=row.id,
        title=row.title,
        created_at=row.created_at,
        updated_at=row.updated_at,
    )


@router.patch("/chats/{chat_id}", response_model=ChatSummaryResponse)
async def update_chat(
    chat_id: UUID,
    request: UpdateChatRequest,
    db: AsyncSession = Depends(deps.get_db),
    current_user: Any = Depends(deps.get_current_active_user),
) -> Any:
    await _get_owned_chat_or_404(db, chat_id, current_user.id)
    title = request.title.strip() or "New Chat"
    sql = text("""
        UPDATE chats
        SET title = :title, updated_at = NOW()
        WHERE id = :chat_id
        RETURNING id, title, created_at, updated_at
    """)
    result = await db.execute(sql, {"chat_id": str(chat_id), "title": title})
    await db.commit()
    row = result.fetchone()
    return ChatSummaryResponse(
        id=row.id,
        title=row.title,
        created_at=row.created_at,
        updated_at=row.updated_at,
    )


@router.delete("/chats/{chat_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_chat(
    chat_id: UUID,
    db: AsyncSession = Depends(deps.get_db),
    current_user: Any = Depends(deps.get_current_active_user),
) -> Response:
    await _get_owned_chat_or_404(db, chat_id, current_user.id)
    sql = text("DELETE FROM chats WHERE id = :chat_id")
    await db.execute(sql, {"chat_id": str(chat_id)})
    await db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/chats/{chat_id}/messages", response_model=ChatHistoryResponse)
async def get_chat_messages(
    chat_id: UUID,
    db: AsyncSession = Depends(deps.get_db),
    current_user: Any = Depends(deps.get_current_active_user),
) -> Any:
    await _get_owned_chat_or_404(db, chat_id, current_user.id)
    await _ensure_message_sources_column(db)
    sql = text("""
        SELECT id, role, content, created_at, sources
        FROM messages
        WHERE chat_id = :chat_id
        ORDER BY created_at ASC
    """)
    result = await db.execute(sql, {"chat_id": str(chat_id)})
    rows = result.fetchall()
    return ChatHistoryResponse(
        chat_id=chat_id,
        messages=[
            ChatMessageHistoryItem(
                id=row.id,
                role=row.role,
                content=row.content,
                created_at=row.created_at,
                sources=row.sources or [],
            )
            for row in rows
        ],
    )

@router.post("/chat/{chat_id}/message", response_model=ChatMessageResponse)
async def chat_message(
    chat_id: UUID,
    request: ChatMessageRequest,
    db: AsyncSession = Depends(deps.get_db),
    current_user: Any = Depends(deps.get_current_active_user)
) -> Any:
    try:
        logger.info(
            "RAG chat_message start chat_id=%s user_id=%s content_len=%s article_id=%s",
            chat_id,
            current_user.id,
            len(request.content or ""),
            request.article_id,
        )
        await _get_owned_chat_or_404(db, chat_id, current_user.id)
        await _ensure_message_sources_column(db)

        limit = int(os.getenv("RAG_HISTORY_LIMIT", "20"))
        lc_messages = await _load_langchain_history(db, chat_id, limit)
        lc_messages.append(HumanMessage(content=request.content))

        insert_user_msg = text("""
            INSERT INTO messages (id, chat_id, role, content, sources, created_at)
            VALUES (gen_random_uuid(), :chat_id, 'user', :content, '[]'::jsonb, NOW())
        """)
        await db.execute(insert_user_msg, {"chat_id": str(chat_id), "content": request.content})

        update_chat_sql = text("""
            UPDATE chats
            SET updated_at = NOW(),
                title = CASE
                    WHEN title IS NULL OR title = '' OR title = 'New Chat' THEN :fallback_title
                    ELSE title
                END
            WHERE id = :chat_id
        """)
        await db.execute(
            update_chat_sql,
            {
                "chat_id": str(chat_id),
                "fallback_title": request.content[:60].strip() or "New Chat",
            },
        )
        await db.commit()

        initial_state = {
            "messages": lc_messages,
            "filters": {"article_id": str(request.article_id)} if request.article_id else {},
            "retrieved_articles": [],
            "generation": "",
            "hallucination_check": "",
            "retry_count": 0
        }

        rag_graph = build_rag_graph(db)
        result_state = await rag_graph.ainvoke(initial_state)

        generation = result_state.get("generation", "")
        logger.info(
            "RAG chat_message graph_done chat_id=%s generation_len=%s retrieved_articles=%s retry_count=%s",
            chat_id,
            len(generation or ""),
            len(result_state.get("retrieved_articles", [])),
            result_state.get("retry_count", 0),
        )

        sources = _build_sources(result_state)
        serialized_sources = json.dumps([
            source.model_dump(mode="json") for source in sources
        ])

        insert_asst_msg = text("""
            INSERT INTO messages (id, chat_id, role, content, sources, created_at)
            VALUES (gen_random_uuid(), :chat_id, 'assistant', :content, CAST(:sources AS JSONB), NOW())
            RETURNING id, created_at
        """)
        asst_result = await db.execute(
            insert_asst_msg,
            {
                "chat_id": str(chat_id),
                "content": generation,
                "sources": serialized_sources,
            },
        )
        msg_row = asst_result.fetchone()
        await db.commit()

        return ChatMessageResponse(
            message_id=msg_row.id,
            content=generation,
            role="assistant",
            model="Quantum RAG",
            sources=sources,
            created_at=msg_row.created_at
        )
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.exception(
            "RAG chat_message failed chat_id=%s user_id=%s article_id=%s error_type=%s error=%r",
            chat_id,
            current_user.id,
            request.article_id,
            type(e).__name__,
            e,
        )
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/query", response_model=RAGQueryResponse)
async def rag_query(
    request: RAGQueryRequest,
    db: AsyncSession = Depends(deps.get_db),
    _current_user: Optional[Any] = Depends(deps.get_optional_current_user),
) -> Any:
    try:
        logger.info(
            "RAG query start article_id=%s content_len=%s",
            request.article_id,
            len(request.content or ""),
        )
        initial_state = {
            "messages": [HumanMessage(content=request.content)],
            "filters": {"article_id": str(request.article_id)} if request.article_id else {},
            "retrieved_articles": [],
            "generation": "",
            "hallucination_check": "",
            "retry_count": 0,
        }

        rag_graph = build_rag_graph(db)
        result_state = await rag_graph.ainvoke(initial_state)

        logger.info(
            "RAG query graph_done generation_len=%s retrieved_articles=%s retry_count=%s",
            len(result_state.get("generation", "") or ""),
            len(result_state.get("retrieved_articles", [])),
            result_state.get("retry_count", 0),
        )

        return RAGQueryResponse(
            content=result_state.get("generation", ""),
            model="Quantum RAG",
            sources=_build_sources(result_state),
        )
    except Exception as e:
        logger.exception(
            "RAG query failed article_id=%s error_type=%s error=%r",
            request.article_id,
            type(e).__name__,
            e,
        )
        raise HTTPException(status_code=500, detail="Internal server error")

@router.patch("/config")
async def update_config(
    request: UpdateSecondaryModelRequest,
    x_admin_key: str = Header(None)
):
    admin_key = os.getenv("SENTIMENT_ADMIN_KEY")
    if not admin_key or x_admin_key != admin_key:
        raise HTTPException(status_code=403, detail="Forbidden")

    llm_router.update_secondary_url(request.llama_model_url)
    return {"status": "ok", "message": "Secondary model URL updated"}
