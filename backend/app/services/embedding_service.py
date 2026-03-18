import asyncio
from functools import partial
from pathlib import Path
from typing import List, Optional

from fastapi.concurrency import run_in_threadpool

from app.core.config import settings


class EmbeddingService:
    """Lazy-loading singleton wrapper around the sentence-transformers model."""

    _model = None
    _lock = asyncio.Lock()

    @classmethod
    async def _load_model(cls):
        if cls._model is not None:
            return cls._model

        async with cls._lock:
            if cls._model is not None:
                return cls._model

            from sentence_transformers import SentenceTransformer

            configured_path = settings.EMBEDDING_MODEL_PATH
            default_local_path = Path(__file__).resolve().parents[2] / "bge_model" / "bge-base-en-v1.5"

            model_path = configured_path
            if not model_path and default_local_path.exists():
                model_path = str(default_local_path)
            if not model_path:
                model_path = "BAAI/bge-base-en-v1.5"

            cls._model = await run_in_threadpool(SentenceTransformer, model_path)
            return cls._model

    @staticmethod
    def _to_list(embedding) -> List[float]:
        if hasattr(embedding, "tolist"):
            return embedding.tolist()
        return list(embedding)

    @classmethod
    async def encode_document(cls, text: str) -> Optional[List[float]]:
        text = (text or "").strip()
        if not text:
            return None

        try:
            model = await cls._load_model()
            encoded = await run_in_threadpool(
                partial(
                    model.encode,
                    f"Represent this document for retrieval: {text}",
                    normalize_embeddings=True,
                )
            )
            return cls._to_list(encoded)
        except Exception:
            return None

    @classmethod
    async def encode_query(cls, text: str) -> Optional[List[float]]:
        text = (text or "").strip()
        if not text:
            return None

        try:
            model = await cls._load_model()
            encoded = await run_in_threadpool(
                partial(
                    model.encode,
                    f"Represent this query for retrieving relevant documents: {text}",
                    normalize_embeddings=True,
                )
            )
            return cls._to_list(encoded)
        except Exception:
            return None
