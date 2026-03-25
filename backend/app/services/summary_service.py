from __future__ import annotations

import asyncio
import logging
import re
import time
from datetime import datetime, timezone
from typing import Dict, Optional

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.article import Article
from app.services.rag.llm_router import llm_router


class SummaryService:
    """Async summarization pipeline for articles missing summary text."""

    def __init__(self) -> None:
        self._logger = logging.getLogger(__name__)
        self._job_lock = asyncio.Lock()
        self._model_rate_lock = asyncio.Lock()
        self._last_model_call_monotonic: Optional[float] = None

    async def _wait_for_model_window(self) -> None:
        min_interval = max(0, int(settings.SUMMARIZATION_PRIMARY_MIN_INTERVAL_SECONDS))

        async with self._model_rate_lock:
            if min_interval > 0 and self._last_model_call_monotonic is not None:
                elapsed = time.monotonic() - self._last_model_call_monotonic
                wait_seconds = max(0.0, min_interval - elapsed)
                if wait_seconds > 0:
                    self._logger.info(
                        "Summary model rate limit sleep_seconds=%.2f",
                        wait_seconds,
                    )
                    await asyncio.sleep(wait_seconds)
            # Timestamp is set right before launching both model calls together.
            self._last_model_call_monotonic = time.monotonic()

    @staticmethod
    def _clean_summary(raw: str) -> str:
        text = (raw or "").strip()
        if not text:
            return ""

        text = re.sub(r"```[\s\S]*?```", "", text)
        text = re.sub(r"\[([^\]]+)\]\((https?://[^\s)]+)\)", r"\1", text)
        text = re.sub(r"https?://\S+", "", text)
        text = re.sub(r"\s+", " ", text).strip()

        if not text:
            return ""

        sentences = [
            s.strip()
            for s in re.split(r"(?<=[.!?])\s+", text)
            if s.strip()
        ]

        if not sentences:
            return ""

        trimmed = sentences[:4]
        return "\n".join(trimmed)

    @staticmethod
    def _build_prompt(article: Article) -> list[dict]:
        content = (article.content or article.summary or "").strip()
        content = content[:8000]

        user_prompt = (
            "Summarize this news article in exactly 3 to 4 short lines.\n"
            "Rules:\n"
            "1) Keep it factual and concise.\n"
            "2) No bullet points, no markdown, no headings.\n"
            "3) No URLs, no references, no citations.\n"
            "4) Avoid repetition.\n\n"
            f"Title: {article.title}\n"
            f"Source: {article.source}\n"
            f"Category: {article.category or 'general'}\n"
            f"Published: {article.published_at.isoformat() if article.published_at else 'unknown'}\n\n"
            f"Content:\n{content}"
        )

        system_prompt = (
            "You are a precise news summarizer. "
            "Return only the summary text and follow formatting rules exactly."
        )

        return [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ]

    async def _generate_summaries(self, article: Article) -> tuple[str, str]:
        messages = self._build_prompt(article)

        await self._wait_for_model_window()

        primary_task = asyncio.create_task(
            llm_router.call_primary(messages, temperature=0.2)
        )
        secondary_task = asyncio.create_task(llm_router.call_secondary(messages, temperature=0.2))
        primary_result, secondary_result = await asyncio.gather(
            primary_task,
            secondary_task,
            return_exceptions=True,
        )

        primary_text = ""
        secondary_text = ""

        if isinstance(primary_result, Exception):
            self._logger.warning(
                "Primary summarization failed article_id=%s error=%r",
                article.id,
                primary_result,
            )
        else:
            primary_text = self._clean_summary(primary_result or "")

        if isinstance(secondary_result, Exception):
            self._logger.info(
                "Secondary summarization unavailable article_id=%s error=%r",
                article.id,
                secondary_result,
            )
        else:
            secondary_text = self._clean_summary(secondary_result or "")

        return primary_text, secondary_text

    async def run_pending_summary_job(
        self,
        db: AsyncSession,
        *,
        batch_size: int = 30,
        max_articles: Optional[int] = None,
    ) -> Dict[str, int]:
        """Generate summaries for pending articles asynchronously until exhausted."""
        if self._job_lock.locked():
            return {
                "processed": 0,
                "updated": 0,
                "failed": 0,
                "skipped": 1,
            }

        processed = 0
        updated = 0
        failed = 0

        async with self._job_lock:
            while True:
                if max_articles is not None and processed >= max_articles:
                    break

                effective_batch_size = batch_size
                if max_articles is not None:
                    effective_batch_size = min(batch_size, max_articles - processed)

                pending_statement = (
                    select(Article)
                    .where(
                        or_(
                            Article.summary.is_(None),
                            func.length(func.trim(Article.summary)) == 0,
                        )
                    )
                    .order_by(Article.published_at.desc().nullslast(), Article.id.desc())
                    .limit(effective_batch_size)
                )
                articles = list((await db.execute(pending_statement)).scalars().all())

                if not articles:
                    break

                for article in articles:
                    processed += 1
                    try:
                        primary_summary, secondary_summary = await self._generate_summaries(article)

                        if not primary_summary:
                            failed += 1
                            continue

                        article.summary = primary_summary

                        ingestion_meta = dict(article.ingestion_meta or {})
                        ingestion_meta["summary_generation"] = {
                            "primary_model": settings.PRIMARY_MODEL_NAME,
                            "primary_generated_at": datetime.now(timezone.utc).isoformat(),
                            "secondary_model_called": bool(settings.SECONDARY_MODEL_URL),
                            "secondary_generated": bool(secondary_summary),
                        }
                        article.ingestion_meta = ingestion_meta

                        db.add(article)
                        updated += 1
                    except Exception:
                        self._logger.exception(
                            "Summary generation failed for article_id=%s source=%s",
                            article.id,
                            article.source,
                        )
                        failed += 1

                await db.commit()

        return {
            "processed": processed,
            "updated": updated,
            "failed": failed,
            "skipped": 0,
        }


summary_service = SummaryService()
