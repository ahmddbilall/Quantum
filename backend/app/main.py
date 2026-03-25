import asyncio
import logging
from contextlib import asynccontextmanager

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import SessionLocal
from app.api.api_v1.api import api_router
from app.services.embedding_service import EmbeddingService
from app.services.sentiment_service import sentiment_service
from apscheduler.triggers.cron import CronTrigger
from app.services.rag.backfill import backfill_embeddings

logger = logging.getLogger(__name__)


async def _run_scheduled_sentiment_job() -> None:
    async with SessionLocal() as session:
        try:
            result = await sentiment_service.run_pending_sentiment_job(
                session,
                batch_size=settings.SENTIMENT_JOB_BATCH_SIZE,
                max_articles=settings.SENTIMENT_JOB_MAX_ARTICLES,
            )
            logger.info(
                "Scheduled sentiment job done processed=%s updated=%s failed=%s skipped=%s",
                result.get("processed", 0),
                result.get("updated", 0),
                result.get("failed", 0),
                result.get("skipped", 0),
            )
        except Exception:
            logger.exception("Scheduled sentiment job failed")


@asynccontextmanager
async def lifespan(_app: FastAPI):
    scheduler = AsyncIOScheduler(timezone="UTC")

    if settings.EMBEDDING_WARMUP_ON_STARTUP:
        logger.info("Embedding warmup started")
        try:
            await EmbeddingService.warmup()
            logger.info("Embedding warmup completed")
        except Exception:
            logger.exception("Embedding warmup failed")

    if settings.SENTIMENT_JOB_ENABLED:
        # Kick off an immediate run on startup so sentiment labeling starts right away.
        asyncio.create_task(_run_scheduled_sentiment_job())

        scheduler.add_job(
            _run_scheduled_sentiment_job,
            trigger="interval",
            minutes=settings.SENTIMENT_JOB_INTERVAL_MINUTES,
            max_instances=1,
            coalesce=True,
            id="sentiment-analysis-job",
            replace_existing=True,
        )
        scheduler.start()
        logger.info(
            "Sentiment scheduler started interval=%s minutes",
            settings.SENTIMENT_JOB_INTERVAL_MINUTES,
        )

    scheduler.add_job(
        backfill_embeddings,
        trigger=CronTrigger(minute="*/30"),
        id="embedding_backfill_job",
        replace_existing=True,
        misfire_grace_time=120
    )
    if not scheduler.running:
        scheduler.start()
        logger.info("Scheduler started for embedding backfill job")

    yield

    if scheduler.running:
        scheduler.shutdown(wait=False)

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
