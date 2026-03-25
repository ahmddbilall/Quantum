from __future__ import annotations

import asyncio
import logging
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.article import Article
from app.services.news_service import MARKET_NEWS_SOURCES


class SentimentService:
    """Async sentiment scoring pipeline for articles missing sentiment values."""

    FINANCE_MODEL_ID = "ProsusAI/finbert"
    GENERAL_MODEL_ID = "lxyuan/distilbert-base-multilingual-cased-sentiments-student"

    def __init__(self) -> None:
        self._logger = logging.getLogger(__name__)
        configured_model_dir = settings.SENTIMENT_MODEL_DIR
        if configured_model_dir:
            self._models_dir = Path(configured_model_dir).resolve()
        else:
            self._models_dir = Path(__file__).resolve().parents[1] / "sentiment" / "models"
        self._models_dir.mkdir(parents=True, exist_ok=True)

        self._finbert_classifier = None
        self._general_classifier = None
        self._finbert_lock = asyncio.Lock()
        self._general_lock = asyncio.Lock()
        self._job_lock = asyncio.Lock()

    @staticmethod
    def _model_cache_subdir(model_id: str) -> str:
        return model_id.replace("/", "__")

    @staticmethod
    def _model_dir_is_populated(path: Path) -> bool:
        if not path.exists() or not path.is_dir():
            return False
        return any(path.iterdir())

    async def _load_classifier(self, model_id: str):
        from transformers import AutoModelForSequenceClassification, AutoTokenizer, pipeline

        model_dir = self._models_dir / model_id.replace("/", "__")
        model_dir.mkdir(parents=True, exist_ok=True)

        def _build_pipeline():
            local_available = self._model_dir_is_populated(model_dir)
            model_path = str(model_dir) if local_available else model_id
            tokenizer = AutoTokenizer.from_pretrained(
                model_path,
                cache_dir=str(model_dir),
                local_files_only=local_available,
            )
            model = AutoModelForSequenceClassification.from_pretrained(
                model_path,
                cache_dir=str(model_dir),
                local_files_only=local_available,
            )
            return pipeline(
                "text-classification",
                model=model,
                tokenizer=tokenizer,
                device=-1,
            )

        self._logger.info("Loading sentiment model '%s' into %s", model_id, model_dir)
        classifier = await asyncio.to_thread(_build_pipeline)
        self._logger.info("Loaded sentiment model '%s'", model_id)
        return classifier

    async def _download_model(self, model_id: str, max_retries: int = 3) -> str:
        import os
        
        target_dir = self._models_dir / self._model_cache_subdir(model_id)
        target_dir.mkdir(parents=True, exist_ok=True)

        def _download() -> str:
            from huggingface_hub import snapshot_download
            
            # Use hf-xet protocol for more reliable downloads (via hf_transfer)
            os.environ["HF_HUB_ENABLE_HF_TRANSFER"] = "1"

            return snapshot_download(
                repo_id=model_id,
                local_dir=str(target_dir),
                local_dir_use_symlinks=False,
                resume_download=True,
            )

        self._logger.info("Downloading sentiment model '%s' to %s (using hf-xet)", model_id, target_dir)
        
        for attempt in range(max_retries):
            try:
                downloaded_path = await asyncio.to_thread(_download)
                self._logger.info("Downloaded sentiment model '%s'", model_id)
                return downloaded_path
            except Exception as e:
                if attempt < max_retries - 1:
                    wait_time = 2 ** attempt  # Exponential backoff: 1s, 2s, 4s
                    self._logger.warning(
                        "Download attempt %d/%d failed for '%s': %s. Retrying in %ds...",
                        attempt + 1,
                        max_retries,
                        model_id,
                        str(e),
                        wait_time,
                    )
                    await asyncio.sleep(wait_time)
                else:
                    self._logger.error(
                        "Download failed after %d attempts for model '%s': %s",
                        max_retries,
                        model_id,
                        str(e),
                    )
                    raise

    async def download_models(self) -> Dict[str, str]:
        finbert_path, general_path = await asyncio.gather(
            self._download_model(self.FINANCE_MODEL_ID),
            self._download_model(self.GENERAL_MODEL_ID),
        )
        return {
            self.FINANCE_MODEL_ID: finbert_path,
            self.GENERAL_MODEL_ID: general_path,
        }

    async def warmup_models(self) -> None:
        await asyncio.gather(
            self._get_finbert_classifier(),
            self._get_general_classifier(),
        )

    async def _get_finbert_classifier(self):
        if self._finbert_classifier is not None:
            return self._finbert_classifier

        async with self._finbert_lock:
            if self._finbert_classifier is None:
                self._finbert_classifier = await self._load_classifier(self.FINANCE_MODEL_ID)

        return self._finbert_classifier

    async def _get_general_classifier(self):
        if self._general_classifier is not None:
            return self._general_classifier

        async with self._general_lock:
            if self._general_classifier is None:
                self._general_classifier = await self._load_classifier(self.GENERAL_MODEL_ID)

        return self._general_classifier

    async def _get_classifier_for_source(self, source: str):
        normalized_source = (source or "").strip().lower()
        if normalized_source in MARKET_NEWS_SOURCES:
            return await self._get_finbert_classifier()
        return await self._get_general_classifier()

    @staticmethod
    def _extract_scores(raw_output: Any) -> Dict[str, float]:
        if not isinstance(raw_output, list) or not raw_output:
            return {}

        if isinstance(raw_output[0], list):
            candidates = raw_output[0]
        else:
            candidates = raw_output

        scores: Dict[str, float] = {}
        for item in candidates:
            if not isinstance(item, dict):
                continue
            label = str(item.get("label", "")).strip().lower()
            score = float(item.get("score", 0.0) or 0.0)
            if "positive" in label:
                scores["positive"] = max(scores.get("positive", 0.0), score)
            elif "negative" in label:
                scores["negative"] = max(scores.get("negative", 0.0), score)
            elif "neutral" in label:
                scores["neutral"] = max(scores.get("neutral", 0.0), score)

        return scores

    @staticmethod
    def _to_signed_score(label_scores: Dict[str, float]) -> Optional[float]:
        if not label_scores:
            return None

        pos = label_scores.get("positive", 0.0)
        neg = label_scores.get("negative", 0.0)
        neu = label_scores.get("neutral", 0.0)

        if pos == 0.0 and neg == 0.0 and neu > 0.0:
            return 0.0

        signed = pos - neg

        # Compress aggressive model confidence while keeping sign.
        if signed > 1.0:
            signed = 1.0
        elif signed < -1.0:
            signed = -1.0

        return signed

    async def _score_text(self, classifier, text: Optional[str]) -> Optional[float]:
        normalized = (text or "").strip()
        if not normalized:
            return None

        sample = normalized[:4000]

        def _infer():
            return classifier(
                sample,
                truncation=True,
                max_length=512,
                top_k=None,
            )

        raw_output = await asyncio.to_thread(_infer)
        label_scores = self._extract_scores(raw_output)
        return self._to_signed_score(label_scores)

    @staticmethod
    def _finalize_sentiment(title_score: Optional[float], content_score: Optional[float]) -> Tuple[str, float]:
        weighted_sum = 0.0
        total_weight = 0.0

        if title_score is not None:
            weighted_sum += 0.4 * title_score
            total_weight += 0.4

        if content_score is not None:
            weighted_sum += 0.6 * content_score
            total_weight += 0.6

        if total_weight == 0:
            return "neutral", 0.0

        combined = weighted_sum / total_weight

        if combined > 0.05:
            label = "positive"
        elif combined < -0.05:
            label = "negative"
        else:
            label = "neutral"

        confidence = min(1.0, abs(combined))
        return label, round(confidence, 6)

    async def run_pending_sentiment_job(
        self,
        db: AsyncSession,
        *,
        batch_size: int = 50,
        max_articles: Optional[int] = None,
    ) -> Dict[str, int]:
        """Score all pending articles asynchronously until exhaustion or max limit."""
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
                            Article.sentiment_score.is_(None),
                            Article.sentiment_label.is_(None),
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
                        classifier = await self._get_classifier_for_source(article.source)
                        title_score, content_score = await asyncio.gather(
                            self._score_text(classifier, article.title),
                            self._score_text(classifier, article.content or article.summary),
                        )
                        label, score = self._finalize_sentiment(title_score, content_score)

                        article.sentiment_label = label
                        article.sentiment_score = score
                        db.add(article)
                        updated += 1
                    except Exception:
                        self._logger.exception(
                            "Sentiment scoring failed for article_id=%s source=%s",
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


sentiment_service = SentimentService()
