import os
import logging
from langgraph.graph import StateGraph, END
from sqlalchemy.ext.asyncio import AsyncSession
from app.services.rag.state import GraphState
from app.services.rag.nodes import (
    analyze_query, make_retrieve_node, generate_answer, check_hallucination
)

logger = logging.getLogger(__name__)

def route_after_hallucination(state: GraphState) -> str:
    max_retries = int(os.getenv("RAG_MAX_RETRIES", "2"))
    if state["hallucination_check"] == "no" and state["retry_count"] < max_retries:
        return "generate_answer"
    return END

def build_rag_graph(db: AsyncSession):
    logger.info("RAG graph build start")
    graph = StateGraph(GraphState)

    graph.add_node("analyze_query", analyze_query)
    graph.add_node("retrieve_documents", make_retrieve_node(db))
    graph.add_node("generate_answer", generate_answer)
    graph.add_node("check_hallucination", check_hallucination)

    graph.set_entry_point("analyze_query")
    graph.add_edge("analyze_query", "retrieve_documents")
    graph.add_edge("retrieve_documents", "generate_answer")
    graph.add_edge("generate_answer", "check_hallucination")
    graph.add_conditional_edges("check_hallucination", route_after_hallucination)

    compiled = graph.compile()
    logger.info("RAG graph build done")
    return compiled
