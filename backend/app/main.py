import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.api_v1.api import api_router
from app.services.embedding_service import EmbeddingService


logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(_app: FastAPI):
    if settings.EMBEDDING_WARMUP_ON_STARTUP:
        logger.info("Embedding warmup started")
        try:
            await EmbeddingService.warmup()
            logger.info("Embedding warmup completed")
        except Exception:
            logger.exception("Embedding warmup failed")
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan,
)

# Set all CORS enabled origins
if settings.BACKEND_CORS_ORIGINS:
    # AnyHttpUrl string conversion may include a trailing slash, while Origin headers do not.
    normalized_origins = [str(origin).rstrip("/") for origin in settings.BACKEND_CORS_ORIGINS]
    app.add_middleware(
        CORSMiddleware,
        allow_origins=normalized_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
async def root():
    return {"message": "Welcome to Quantum API"}
