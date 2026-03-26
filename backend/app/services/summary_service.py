from __future__ import annotations

import asyncio
import logging
import re
import time
from datetime import datetime, timezone
from typing import Dict, Optional

from groq import AsyncGroq
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
        self._key_rate_lock = asyncio.Lock()
        self._last_key_call_monotonic: Dict[str, float] = {}
        self._last_combined_call_monotonic: Optional[float] = None
        self._primary_clients: Dict[str, AsyncGroq] = {}

    def _summary_primary_keys(self) -> list[str]:
        return [key for key in settings.SUMMARIZATION_PRIMARY_API_KEYS if key and key.strip()]

    @staticmethod
    def _format_messages(messages: list[dict]) -> list[dict]:
        formatted = []
        for message in messages:
            role = message.get("role")
            if role not in {"system", "user", "assistant"}:
                role = "user"
            formatted.append({"role": role, "content": message.get("content", "")})
        return formatted

    def _get_primary_client(self, api_key: str) -> AsyncGroq:
        client = self._primary_clients.get(api_key)
        if client is not None:
            return client

        created = AsyncGroq(api_key=api_key)
        self._primary_clients[api_key] = created
        return created

    async def _call_primary_with_api_key(
        self,
        *,
        api_key: str,
        messages: list[dict],
        temperature: float,
    ) -> str:
        client = self._get_primary_client(api_key)
        response = await client.chat.completions.create(
            model=settings.PRIMARY_MODEL_NAME or "llama-3.1-8b-instant",
            messages=self._format_messages(messages),
            temperature=temperature,
            max_completion_tokens=1024,
            top_p=1,
            stream=False,
        )
        if not response.choices:
            return ""
        return response.choices[0].message.content or ""

    @staticmethod
    def _combined_interval_seconds() -> int:
        return max(0, int(settings.SUMMARIZATION_COMBINED_INTERVAL_SECONDS))

    @staticmethod
    def _per_key_interval_seconds() -> int:
        return max(0, int(settings.SUMMARIZATION_PRIMARY_MIN_INTERVAL_SECONDS))

    def _combined_ready(self) -> bool:
        if self._last_combined_call_monotonic is None:
            return True
        elapsed = time.monotonic() - self._last_combined_call_monotonic
        return elapsed >= self._combined_interval_seconds()

    def _seconds_until_combined(self) -> float:
        if self._last_combined_call_monotonic is None:
            return 0.0
        elapsed = time.monotonic() - self._last_combined_call_monotonic
        return max(0.0, self._combined_interval_seconds() - elapsed)

    async def _wait_for_key_cooldown(self, api_key: str) -> None:
        min_interval = self._per_key_interval_seconds()
        if min_interval <= 0:
            return

        async with self._key_rate_lock:
            last_call = self._last_key_call_monotonic.get(api_key)
            if last_call is not None:
                elapsed = time.monotonic() - last_call
                wait_seconds = max(0.0, min_interval - elapsed)
                if wait_seconds > 0:
                    self._logger.info(
                        "Summary key cooldown sleep_seconds=%.2f",
                        wait_seconds,
                    )
                    await asyncio.sleep(wait_seconds)

            self._last_key_call_monotonic[api_key] = time.monotonic()

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

    async def _generate_combined_summaries(
        self,
        *,
        article: Article,
        primary_api_key: str,
    ) -> tuple[str, str]:
        messages = self._build_prompt(article)

        await self._wait_for_key_cooldown(primary_api_key)
        self._last_combined_call_monotonic = time.monotonic()

        primary_task = asyncio.create_task(
            self._call_primary_with_api_key(
                api_key=primary_api_key,
                messages=messages,
                temperature=0.2,
            )
        )
        summary_prompt_text = "\n\n".join(message.get("content", "") for message in messages if message.get("content"))
        secondary_task = asyncio.create_task(
            llm_router.call_secondary_summary(summary_prompt_text, temperature=0.2)
        )

        def _discard_secondary_result(task: asyncio.Task) -> None:
            try:
                _ = task.result()
                self._logger.info(
                    "Secondary summary result discarded article_id=%s",
                    article.id,
                )
            except Exception as exc:
                self._logger.info(
                    "Secondary summary discard failed article_id=%s error=%r",
                    article.id,
                    exc,
                )

        primary_text = ""
        try:
            primary_result = await primary_task
            primary_text = self._clean_summary(primary_result or "")
        except Exception as exc:
            self._logger.warning(
                "Primary summarization failed article_id=%s error=%r",
                article.id,
                exc,
            )

        if primary_text:
            secondary_task.add_done_callback(_discard_secondary_result)
            return primary_text, ""

        secondary_text = ""
        try:
            secondary_result = await secondary_task
            secondary_text = self._clean_summary(secondary_result or "")
        except Exception as exc:
            self._logger.info(
                "Secondary summarization unavailable article_id=%s error=%r",
                article.id,
                exc,
            )

        return primary_text, secondary_text

    async def _generate_primary_only_summary(
        self,
        *,
        article: Article,
        primary_api_key: str,
    ) -> str:
        await self._wait_for_key_cooldown(primary_api_key)
        output = await self._call_primary_with_api_key(
            api_key=primary_api_key,
            messages=self._build_prompt(article),
            temperature=0.2,
        )
        return self._clean_summary(output)

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

        primary_keys = self._summary_primary_keys()
        if not primary_keys:
            self._logger.warning("Summary job skipped: SUMMARIZATION_PRIMARY_API_KEYS is empty")
            return {
                "processed": 0,
                "updated": 0,
                "failed": 0,
                "skipped": 1,
            }

        combined_key = primary_keys[0]
        silent_primary_keys = primary_keys[1:]

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

                cursor = 0
                dispatched = 0

                if cursor < len(articles) and self._combined_ready():
                    article = articles[cursor]
                    cursor += 1
                    dispatched += 1
                    processed += 1
                    try:
                        primary_summary, secondary_summary = await self._generate_combined_summaries(
                            article=article,
                            primary_api_key=combined_key,
                        )

                        if not primary_summary:
                            failed += 1
                        else:
                            article.summary = primary_summary
                            ingestion_meta = dict(article.ingestion_meta or {})
                            ingestion_meta["summary_generation"] = {
                                "mode": "combined",
                                "primary_model": settings.PRIMARY_MODEL_NAME,
                                "primary_generated_at": datetime.now(timezone.utc).isoformat(),
                                "secondary_model_called": True,
                                "secondary_generated": bool(secondary_summary),
                            }
                            article.ingestion_meta = ingestion_meta
                            db.add(article)
                            updated += 1
                    except Exception:
                        self._logger.exception(
                            "Summary combined generation failed for article_id=%s source=%s",
                            article.id,
                            article.source,
                        )
                        failed += 1

                for key in silent_primary_keys:
                    if cursor >= len(articles):
                        break

                    article = articles[cursor]
                    cursor += 1
                    dispatched += 1
                    processed += 1
                    try:
                        primary_summary = await self._generate_primary_only_summary(
                            article=article,
                            primary_api_key=key,
                        )

                        if not primary_summary:
                            failed += 1
                            continue

                        article.summary = primary_summary
                        ingestion_meta = dict(article.ingestion_meta or {})
                        ingestion_meta["summary_generation"] = {
                            "mode": "primary_only",
                            "primary_model": settings.PRIMARY_MODEL_NAME,
                            "primary_generated_at": datetime.now(timezone.utc).isoformat(),
                            "secondary_model_called": False,
                            "secondary_generated": False,
                        }
                        article.ingestion_meta = ingestion_meta
                        db.add(article)
                        updated += 1
                    except Exception:
                        self._logger.exception(
                            "Summary primary-only generation failed for article_id=%s source=%s",
                            article.id,
                            article.source,
                        )
                        failed += 1

                if dispatched == 0:
                    await asyncio.sleep(self._seconds_until_combined())
                    continue

                await db.commit()

        return {
            "processed": processed,
            "updated": updated,
            "failed": failed,
            "skipped": 0,
        }


summary_service = SummaryService()
