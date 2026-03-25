import json
import os
import re
import logging
from sqlalchemy.ext.asyncio import AsyncSession
from app.services.rag.state import GraphState
from app.services.rag.llm_router import llm_router
from app.services.rag.retriever import hybrid_search

logger = logging.getLogger(__name__)


def _sanitize_citation_style(text: str) -> str:
    if not text:
        return text

    cleaned = text

    # Convert common "(Source: [n] ... )" style into plain [n].
    cleaned = re.sub(r"\(\s*Source\s*:\s*\[(\d+)\][^\)]*\)", r"[\1]", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"\(\s*Source\s*:\s*(\d+)[^\)]*\)", r"[\1]", cleaned, flags=re.IGNORECASE)

    # Handle malformed variants without a closing parenthesis.
    cleaned = re.sub(r"\(\s*Source\s*:\s*\[(\d+)\][^\n]*", r"[\1]", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"\(\s*Source\s*:\s*(\d+)[^\n]*", r"[\1]", cleaned, flags=re.IGNORECASE)

    # Normalize accidental duplicated forms like [1]1, [1] 1, [1][1] into [1].
    cleaned = re.sub(r"\[(\d+)\]\s*\1(?!\d)", r"[\1]", cleaned)
    cleaned = re.sub(r"\[(\d+)\]\s*\[\s*\1\s*\]", r"[\1]", cleaned)

    # Ensure open citation brackets are closed if model outputs something like "[3".
    cleaned = re.sub(r"\[(\d+)(?!\])", r"[\1]", cleaned)

    # Drop leaked trailing references/sources sections if the model outputs them.
    cleaned = re.sub(
        r"(?is)\n\s*(?:#{1,6}\s*)?(?:references|sources)\s*:\s*.*$",
        "",
        cleaned,
    )
    cleaned = re.sub(
        r"(?is)\b(?:references|sources)\s*:\s*(?:\[\d+\][^\n]*)$",
        "",
        cleaned,
    )

    return re.sub(r"\s+", " ", cleaned).strip()


async def analyze_query(state: GraphState) -> dict:
    try:
        user_msg = [m for m in state["messages"] if m.type == "human"][-1].content
        logger.info("RAG node analyze_query start content_len=%s", len(user_msg or ""))

        system_prompt = (
            "You are a query analyzer for a news search system.\n"
            "Extract metadata filters from the user's question.\n"
            "Return ONLY valid JSON with these optional keys:\n"
            "  category (string or null): news category if mentioned\n"
            "    e.g. 'market', 'technology', 'crypto'\n"
            "  source (string or null): news source if mentioned\n"
            "    e.g. 'bloomberg', 'newsbtc', 'bbc'\n"
            "  date_range (integer or null): number of days if a\n"
            "    time range is mentioned\n"
            "    e.g. 'last week' = 7, 'today' = 1, 'this month' = 30\n"
            "Do NOT extract the main search topic — only metadata.\n"
            "Return null for any filter not explicitly mentioned.\n"
            "Return only raw JSON. No markdown, no code fences."
        )

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_msg}
        ]

        response_text = await llm_router.call_both(messages)

        cleaned = response_text.strip()
        if cleaned.startswith("```json"):
            cleaned = cleaned[7:]
        elif cleaned.startswith("```"):
            cleaned = cleaned[3:]
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]
        cleaned = cleaned.strip()

        try:
            parsed = json.loads(cleaned)
        except Exception:
            parsed = {}
            logger.warning(
                "RAG node analyze_query json_parse_failed response_preview=%r",
                cleaned[:200],
            )

        existing_filters = state.get("filters", {})
        merged_filters = {
            **existing_filters,
            **{k: v for k, v in parsed.items() if v is not None},
        }

        logger.info("RAG node analyze_query done filters=%s", merged_filters)
        return {"filters": merged_filters}
    except Exception:
        logger.exception("RAG node analyze_query failed")
        raise

def make_retrieve_node(db: AsyncSession):
    async def retrieve_documents(state: GraphState) -> dict:
        try:
            user_msg = [m for m in state["messages"] if m.type == "human"][-1].content
            top_k = int(os.getenv("RAG_TOP_K", "5"))
            filters = state.get("filters", {})
            logger.info(
                "RAG node retrieve_documents start top_k=%s filters=%s",
                top_k,
                filters,
            )
            articles = await hybrid_search(user_msg, filters, db, top_k)
            logger.info("RAG node retrieve_documents done article_count=%s", len(articles))
            return {"retrieved_articles": articles}
        except Exception:
            logger.exception("RAG node retrieve_documents failed")
            raise
    return retrieve_documents


async def generate_answer(state: GraphState) -> dict:
    try:
        retrieved_articles = state.get("retrieved_articles", [])
        logger.info(
            "RAG node generate_answer start article_count=%s",
            len(retrieved_articles),
        )
        context = "\n\n".join([
            f"[{i+1}] {a['title']} ({a['source']}, {a['published_at']})\n"
            f"URL: {a['url']}\n{a['snippet']}"
            for i, a in enumerate(retrieved_articles)
        ])

        system_msg = (
            "You are Llama, a helpful news analyst AI. Your name is "
            "Llama 3.1. Answer the user's question using ONLY the "
            "provided news articles below. Use short clear paragraphs. "
            "When you make a claim from an article, cite ONLY with "
            "square-bracket numbers like [1], [2], [3]. Do not write "
            "'Source:', do not include article titles in the paragraph, "
            "and do not include raw URLs in the paragraph. Never output "
            "malformed citations; every opening bracket must be closed, "
            "for example [2]. If the articles do not contain enough "
            "information to answer, say so clearly. "
            "Provide a slightly fuller response by default: around 6 to 9 "
            "sentences total in 2 to 3 short paragraphs, unless the user "
            "explicitly asks for a brief answer. "
            "Do not invent facts. If asked your name or what model "
            "you are, always say Llama 3.1."
        )

        messages_for_llm = [{"role": "system", "content": system_msg}]
        for m in state["messages"]:
            role = "user" if m.type == "human" else "assistant"
            messages_for_llm.append({"role": role, "content": m.content})
            
        final_user_msg = (
            f"Relevant news articles:\n\n{context}\n\n"
            "Now answer the question.\n"
            "Formatting rules:\n"
            "1) Write a slightly detailed answer (6-9 sentences in 2-3 short paragraphs).\n"
            "2) Use citations as [n] only, where n is the article number above.\n"
            "3) Do not include article titles, source labels, or URLs in the body text.\n"
            "4) Do not output a references section in plain text."
        )
        messages_for_llm.append({"role": "user", "content": final_user_msg})

        generation = await llm_router.call_both(messages_for_llm)
        generation = _sanitize_citation_style(generation)
        logger.info("RAG node generate_answer done generation_len=%s", len(generation or ""))
        return {"generation": generation}
    except Exception:
        logger.exception("RAG node generate_answer failed")
        raise


async def check_hallucination(state: GraphState) -> dict:
    try:
        summary = "\n".join([
            f"- {a['title']}: {a['snippet']}"
            for a in state.get("retrieved_articles", [])
        ])[:2000]

        system_msg = "You are a strict fact-checking assistant."
        user_msg = (
            "Is the following answer fully supported by the "
            "provided articles? Reply ONLY with the word 'yes' "
            "or the word 'no'. Nothing else.\n"
            f"Answer: {state.get('generation', '')}\n"
            f"Articles: {summary}"
        )

        messages = [
            {"role": "system", "content": system_msg},
            {"role": "user", "content": user_msg}
        ]

        check_response = await llm_router.call_both(messages)
        check_response = check_response.strip().lower()

        is_yes = "yes" if check_response.startswith('y') else "no"
        retry_count = state.get("retry_count", 0) + 1
        logger.info(
            "RAG node check_hallucination done verdict=%s retry_count=%s raw_response=%r",
            is_yes,
            retry_count,
            check_response[:64],
        )

        return {
            "hallucination_check": is_yes,
            "retry_count": retry_count
        }
    except Exception:
        logger.exception("RAG node check_hallucination failed")
        raise
