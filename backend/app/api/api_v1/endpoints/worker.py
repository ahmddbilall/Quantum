"""Worker health and control endpoints for the background news pipeline."""

from __future__ import annotations

import os
import subprocess
import sys
import tempfile
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.api import deps
from app.services.sentiment_service import sentiment_service
from app.services.summary_service import summary_service

router = APIRouter(tags=["worker"])

TRIGGER_COOLDOWN_SECONDS = 60
WORKER_LOCK_FILE_NAME = "quantum_scraper_worker.lock"
_last_triggered_at: Optional[datetime] = None


def _worker_lock_file() -> Path:
    return Path(tempfile.gettempdir()) / WORKER_LOCK_FILE_NAME


def _is_worker_running() -> bool:
    return _worker_lock_file().exists()


def _worker_uptime_seconds() -> int:
    lock_file = _worker_lock_file()
    if not lock_file.exists():
        return 0
    try:
        now_epoch = datetime.now(timezone.utc).timestamp()
        return max(0, int(now_epoch - lock_file.stat().st_mtime))
    except OSError:
        return 0


def _scraper_entrypoint() -> Path:
    backend_root = Path(__file__).resolve().parents[4]
    return backend_root / "data_scraping" / "run_scraper.py"


async def _latest_scraping_run(db: AsyncSession) -> Optional[Dict[str, Any]]:
    try:
        result = await db.execute(
            text(
                """
                SELECT status, started_at, completed_at, articles_inserted, articles_updated, articles_failed
                FROM scraping_runs
                ORDER BY COALESCE(completed_at, started_at) DESC
                LIMIT 1
                """
            )
        )
        row = result.mappings().first()
        return dict(row) if row else None
    except Exception:
        return None


async def _scraped_articles_24h(db: AsyncSession) -> int:
    try:
        result = await db.execute(
            text(
                """
                SELECT COALESCE(SUM(COALESCE(articles_inserted, 0) + COALESCE(articles_updated, 0)), 0)
                FROM scraping_runs
                WHERE started_at >= (NOW() - INTERVAL '24 hours')
                """
            )
        )
        return int(result.scalar_one() or 0)
    except Exception:
        return 0


@router.get("/health")
async def get_worker_health(db: AsyncSession = Depends(deps.get_db)) -> Dict[str, Any]:
    """Return lightweight worker health information."""
    now = datetime.now(timezone.utc)
    running = _is_worker_running()

    latest = await _latest_scraping_run(db)
    last_run_at = None
    last_run_successful = False

    if latest:
        last_run_at = latest.get("completed_at") or latest.get("started_at")
        last_run_successful = (latest.get("status") or "").lower() == "success"

    if running:
        health_status = "healthy"
    elif latest is None:
        health_status = "dormant"
    elif last_run_successful:
        health_status = "healthy"
    else:
        health_status = "degraded"

    return {
        "status": health_status,
        "is_running": running,
        "last_run_successful": last_run_successful,
        "last_run_time": last_run_at.isoformat() if last_run_at else None,
        "timestamp": now.isoformat(),
    }


@router.get("/status")
async def get_worker_status(db: AsyncSession = Depends(deps.get_db)) -> Dict[str, Any]:
    """Return detailed worker runtime and recent run metrics."""
    now = datetime.now(timezone.utc)
    running = _is_worker_running()
    latest = await _latest_scraping_run(db)
    scraped_24h = await _scraped_articles_24h(db)

    last_run_at = None
    last_run_successful = False
    latest_status = None
    latest_counts = {
        "articles_inserted": 0,
        "articles_updated": 0,
        "articles_failed": 0,
    }

    if latest:
        last_run_at = latest.get("completed_at") or latest.get("started_at")
        last_run_successful = (latest.get("status") or "").lower() == "success"
        latest_status = latest.get("status")
        latest_counts = {
            "articles_inserted": int(latest.get("articles_inserted") or 0),
            "articles_updated": int(latest.get("articles_updated") or 0),
            "articles_failed": int(latest.get("articles_failed") or 0),
        }

    time_since_last_run = (
        (now - last_run_at).total_seconds() if last_run_at else None
    )

    return {
        "is_running": running,
        "lock_file": str(_worker_lock_file()),
        "last_run_time": last_run_at.isoformat() if last_run_at else None,
        "last_run_successful": last_run_successful,
        "last_run_status": latest_status,
        "time_since_last_run_seconds": time_since_last_run,
        "uptime_seconds": _worker_uptime_seconds(),
        "scraped_articles_24h": scraped_24h,
        "latest_counts": latest_counts,
        "timestamp": now.isoformat(),
    }


@router.post("/trigger-scrape")
async def trigger_immediate_scrape(
    source: Optional[str] = Query(None, description="Specific source to scrape"),
    db: AsyncSession = Depends(deps.get_db),
    _current_user=Depends(deps.get_current_superuser),
) -> Dict[str, Any]:
    """Trigger a one-shot scraper process without blocking API requests."""
    global _last_triggered_at

    if _is_worker_running():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Worker is already running. Avoid overlapping manual runs.",
        )

    now = datetime.now(timezone.utc)
    if _last_triggered_at and (now - _last_triggered_at).total_seconds() < TRIGGER_COOLDOWN_SECONDS:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Please wait {TRIGGER_COOLDOWN_SECONDS} seconds between manual triggers",
        )

    source_name = source.strip().lower() if source and source.strip() else None
    if source_name:
        exists = await db.execute(
            text("SELECT 1 FROM news_sources WHERE LOWER(name) = :name LIMIT 1"),
            {"name": source_name},
        )
        if exists.scalar_one_or_none() is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Unknown source")

    entrypoint = _scraper_entrypoint()
    if not entrypoint.exists():
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Scraper entrypoint not found: {entrypoint}",
        )

    command = [sys.executable, str(entrypoint)]
    run_mode = "run-once"
    if source_name:
        command.extend(["scrape", "--source", source_name])
        run_mode = "scrape-source"
    else:
        command.append("run-once")

    creationflags = 0
    if os.name == "nt":
        creationflags = (
            getattr(subprocess, "CREATE_NEW_PROCESS_GROUP", 0)
            | getattr(subprocess, "DETACHED_PROCESS", 0)
        )

    try:
        process = subprocess.Popen(
            command,
            cwd=str(entrypoint.parent),
            stdin=subprocess.DEVNULL,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            creationflags=creationflags,
        )
    except OSError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to start scraper process: {str(exc)}",
        ) from exc

    _last_triggered_at = now

    return {
        "message": "Scraper trigger accepted",
        "mode": run_mode,
        "source": source_name,
        "pid": process.pid,
        "timestamp": now.isoformat(),
    }


@router.post("/trigger-sentiment")
async def trigger_sentiment_job(
    batch_size: int = Query(default=50, ge=1, le=500),
    max_articles: Optional[int] = Query(default=None, ge=1, le=200000),
    db: AsyncSession = Depends(deps.get_db),
    _current_user=Depends(deps.get_current_superuser),
) -> Dict[str, Any]:
    """Run async sentiment scoring for articles missing sentiment fields."""
    now = datetime.now(timezone.utc)
    result = await sentiment_service.run_pending_sentiment_job(
        db,
        batch_size=batch_size,
        max_articles=max_articles,
    )

    return {
        "message": "Sentiment analysis job completed",
        "batch_size": batch_size,
        "max_articles": max_articles,
        **result,
        "timestamp": now.isoformat(),
    }


@router.post("/trigger-summary")
async def trigger_summary_job(
    batch_size: int = Query(default=30, ge=1, le=500),
    max_articles: Optional[int] = Query(default=None, ge=1, le=200000),
    db: AsyncSession = Depends(deps.get_db),
    _current_user=Depends(deps.get_current_superuser),
) -> Dict[str, Any]:
    """Run async summarization for articles missing summary fields."""
    now = datetime.now(timezone.utc)
    result = await summary_service.run_pending_summary_job(
        db,
        batch_size=batch_size,
        max_articles=max_articles,
    )

    return {
        "message": "Summary generation job completed",
        "batch_size": batch_size,
        "max_articles": max_articles,
        **result,
        "timestamp": now.isoformat(),
    }
