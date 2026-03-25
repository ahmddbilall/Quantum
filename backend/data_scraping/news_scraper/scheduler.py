"""Scheduler for automated news scraping and processing."""

import asyncio
import logging
import os
import signal
import sys
import tempfile
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

from .config import NEWS_SOURCES, SCHEDULER_CONFIG
from .api_news_service import APINewsService
from .database import db_manager
from .embeddings import EmbeddingService
from .scrapers import create_scraper

logger = logging.getLogger(__name__)

# Worker lock to ensure only one instance runs
WORKER_LOCK_FILE = str(Path(tempfile.gettempdir()) / "quantum_scraper_worker.lock")


def _parse_delete_count(command_tag: str) -> int:
    """Parse asyncpg command tag like 'DELETE 12' and return affected row count."""
    try:
        parts = (command_tag or "").split()
        if len(parts) == 2 and parts[0].upper() == "DELETE":
            return int(parts[1])
    except (ValueError, TypeError):
        pass
    return 0


class NewsScrapingScheduler:
    """Scheduler for automated news scraping and processing."""

    def __init__(self):
        self.running = False
        self.tasks: List[asyncio.Task] = []
        self.scraping_task: Optional[asyncio.Task] = None
        self.api_news_task: Optional[asyncio.Task] = None
        self.embedding_task: Optional[asyncio.Task] = None
        self.cleanup_task: Optional[asyncio.Task] = None

        self.worker_lock_acquired = False
        self.last_run_successful = False
        self.last_run_time: Optional[datetime] = None

    async def initialize(self):
        """Initialize the scheduler."""
        logger.info("Initializing news scraping scheduler")
        await db_manager.initialize()
        await APINewsService.initialize()
        await EmbeddingService.initialize()
        logger.info("Scheduler initialized successfully")

    async def cleanup(self):
        """Cleanup scheduler resources."""
        logger.info("Cleaning up scheduler")

        for task in self.tasks:
            if not task.done():
                task.cancel()

        if self.tasks:
            await asyncio.gather(*self.tasks, return_exceptions=True)
            self.tasks.clear()

        await APINewsService.cleanup()
        await EmbeddingService.cleanup()
        await db_manager.close()

        logger.info("Scheduler cleanup completed")

    def _acquire_worker_lock(self) -> bool:
        """Acquire exclusive worker lock to prevent multiple instances."""
        current_pid = os.getpid()

        def _pid_is_running(pid: int) -> bool:
            if pid <= 0:
                return False
            try:
                os.kill(pid, 0)
                return True
            except ProcessLookupError:
                return False
            except PermissionError:
                # Process exists but belongs to another user/session.
                return True
            except OSError:
                return False

        def _read_lock_pid() -> int:
            try:
                content = Path(WORKER_LOCK_FILE).read_text(encoding="utf-8").strip()
                return int(content)
            except Exception:
                return -1

        def _write_lock_pid(lock_fd: int) -> None:
            os.write(lock_fd, f"{current_pid}\n".encode("utf-8"))

        try:
            lock_fd = os.open(WORKER_LOCK_FILE, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o644)
            _write_lock_pid(lock_fd)
            os.close(lock_fd)
            self.worker_lock_acquired = True
            logger.info("Worker lock acquired: %s (pid=%s)", WORKER_LOCK_FILE, current_pid)
            return True
        except FileExistsError:
            existing_pid = _read_lock_pid()
            if existing_pid > 0 and _pid_is_running(existing_pid):
                logger.warning(
                    "Worker lock already exists: %s (active pid=%s)",
                    WORKER_LOCK_FILE,
                    existing_pid,
                )
                return False

            logger.warning(
                "Removing stale worker lock: %s (stale pid=%s)",
                WORKER_LOCK_FILE,
                existing_pid,
            )
            try:
                os.unlink(WORKER_LOCK_FILE)
            except FileNotFoundError:
                pass
            except Exception as exc:
                logger.warning("Failed to remove stale worker lock: %s", exc)
                return False

            try:
                lock_fd = os.open(WORKER_LOCK_FILE, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o644)
                _write_lock_pid(lock_fd)
                os.close(lock_fd)
                self.worker_lock_acquired = True
                logger.info("Worker lock acquired after stale cleanup: %s (pid=%s)", WORKER_LOCK_FILE, current_pid)
                return True
            except Exception as exc:
                logger.warning("Could not acquire worker lock after stale cleanup: %s", exc)
                return False
        except Exception as exc:
            logger.warning("Could not acquire worker lock (%s). Continuing: %s", WORKER_LOCK_FILE, exc)
            return True

    def _release_worker_lock(self) -> None:
        """Release worker lock."""
        if not self.worker_lock_acquired:
            return
        try:
            os.unlink(WORKER_LOCK_FILE)
            self.worker_lock_acquired = False
            logger.info("Worker lock released")
        except FileNotFoundError:
            self.worker_lock_acquired = False
        except Exception as exc:
            logger.warning("Error releasing worker lock: %s", exc)

    async def scrape_all_sources(self) -> Dict[str, Any]:
        """Scrape all configured news sources."""
        logger.info("Starting scraping cycle for all sources")
        results: Dict[str, Dict[str, Any]] = {}
        cycle_start = datetime.now(timezone.utc)

        for source_name, source_config in NEWS_SOURCES.items():
            try:
                logger.info("Scraping source: %s", source_name)
                scraper = create_scraper(source_name, source_config)

                async with scraper:
                    result = await scraper.scrape_all()
                    results[source_name] = result

                logger.info(
                    "Completed %s: %s scraped, %s failed",
                    source_name,
                    result.get("scraped", 0),
                    result.get("failed", 0),
                )

                await asyncio.sleep(2)
            except Exception as exc:
                logger.exception("Error scraping %s: %s", source_name, exc)
                results[source_name] = {"error": str(exc), "scraped": 0, "failed": 0}

        total_scraped = sum(item.get("scraped", 0) for item in results.values())
        total_failed = sum(item.get("failed", 0) for item in results.values())

        self.last_run_time = datetime.now(timezone.utc)
        self.last_run_successful = total_failed == 0

        logger.info(
            "Scraping cycle completed: %s scraped, %s failed",
            total_scraped,
            total_failed,
        )

        return {
            "total_scraped": total_scraped,
            "total_failed": total_failed,
            "results": results,
            "timestamp": cycle_start.isoformat(),
            "duration_seconds": (datetime.now(timezone.utc) - cycle_start).total_seconds(),
        }

    async def process_embeddings(self) -> Dict[str, int]:
        """Process embeddings for unprocessed articles."""
        logger.info("Starting embedding processing cycle")
        try:
            result = await EmbeddingService.process_embeddings(limit=200)
            logger.info(
                "Embedding processing completed: %s processed, %s failed",
                result.get("processed", 0),
                result.get("failed", 0),
            )
            return result
        except Exception as exc:
            logger.exception("Error in embedding processing: %s", exc)
            return {"processed": 0, "failed": 0, "error": str(exc)}

    async def process_api_news(self) -> Dict[str, Any]:
        """Fetch general/world news via API and upsert into articles."""
        logger.info("Starting API news ingestion cycle")
        try:
            result = await APINewsService.fetch_and_store_news()
            logger.info(
                "API news ingestion completed: %s upserted, %s failed, %s fetched",
                result.get("upserted", 0),
                result.get("failed", 0),
                result.get("total_fetched", 0),
            )
            return result
        except Exception as exc:
            logger.exception("Error in API news ingestion: %s", exc)
            return {
                "processed": 0,
                "upserted": 0,
                "failed": 0,
                "error": str(exc),
            }

    async def cleanup_old_data(self) -> Dict[str, int]:
        """Cleanup old scraping runs and logs (retain last 30 days)."""
        logger.info("Starting data cleanup cycle")
        try:
            cutoff_date = datetime.now(timezone.utc) - timedelta(days=30)
            async with db_manager.get_connection() as conn:
                command_tag = await conn.execute(
                    """
                    DELETE FROM scraping_runs
                    WHERE completed_at IS NOT NULL
                      AND completed_at < $1
                    """,
                    cutoff_date,
                )
            deleted_count = _parse_delete_count(command_tag)
            logger.info("Data cleanup completed: deleted %s old scraping runs", deleted_count)
            return {"cleaned": deleted_count}
        except Exception as exc:
            logger.exception("Error in data cleanup: %s", exc)
            return {"cleaned": 0, "error": str(exc)}

    async def scraping_loop(self):
        """Main scraping loop - runs immediately on startup, then at intervals."""
        if SCHEDULER_CONFIG["run_on_startup"]:
            logger.info("Running initial scraping cycle on startup")
            try:
                await self.scrape_all_sources()
            except Exception as exc:
                logger.exception("Error in initial scraping cycle: %s", exc)
        
        while self.running:
            try:
                interval_minutes = SCHEDULER_CONFIG["scraping_interval_minutes"]
                logger.info("Next scraping cycle in %s minutes", interval_minutes)
                await asyncio.sleep(interval_minutes * 60)
                
                if self.running:  # Check again before scraping
                    await self.scrape_all_sources()
            except asyncio.CancelledError:
                logger.info("Scraping loop cancelled")
                break
            except Exception as exc:
                logger.exception("Error in scraping loop: %s", exc)
                await asyncio.sleep(300)

    async def embedding_loop(self):
        """Embedding processing loop - runs immediately on startup, then at intervals."""
        if SCHEDULER_CONFIG["run_on_startup"]:
            logger.info("Running initial embedding cycle on startup")
            try:
                await self.process_embeddings()
            except Exception as exc:
                logger.exception("Error in initial embedding cycle: %s", exc)
        
        while self.running:
            try:
                interval_minutes = SCHEDULER_CONFIG["embedding_interval_minutes"]
                logger.debug("Next embedding cycle in %s minutes", interval_minutes)
                await asyncio.sleep(interval_minutes * 60)
                
                if self.running:  # Check again before processing
                    await self.process_embeddings()
            except asyncio.CancelledError:
                logger.info("Embedding loop cancelled")
                break
            except Exception as exc:
                logger.exception("Error in embedding loop: %s", exc)
                await asyncio.sleep(300)

    async def api_news_loop(self):
        """API news ingestion loop - runs independently on its own interval."""
        if SCHEDULER_CONFIG["run_on_startup"]:
            logger.info("Running initial API news ingestion cycle on startup")
            try:
                await self.process_api_news()
            except Exception as exc:
                logger.exception("Error in initial API news cycle: %s", exc)

        while self.running:
            try:
                interval_minutes = SCHEDULER_CONFIG["api_news_interval_minutes"]
                logger.info("Next API news cycle in %s minutes", interval_minutes)
                await asyncio.sleep(interval_minutes * 60)

                if self.running:
                    await self.process_api_news()
            except asyncio.CancelledError:
                logger.info("API news loop cancelled")
                break
            except Exception as exc:
                logger.exception("Error in API news loop: %s", exc)
                await asyncio.sleep(300)

    async def cleanup_loop(self):
        """Data cleanup loop - runs on a longer interval."""
        if SCHEDULER_CONFIG["run_on_startup"]:
            logger.info("Running initial cleanup cycle on startup")
            try:
                await self.cleanup_old_data()
            except Exception as exc:
                logger.exception("Error in initial cleanup cycle: %s", exc)
        
        while self.running:
            try:
                interval_hours = SCHEDULER_CONFIG["cleanup_interval_hours"]
                logger.info("Next cleanup cycle in %s hours", interval_hours)
                await asyncio.sleep(interval_hours * 3600)
                
                if self.running:  # Check again before cleanup
                    await self.cleanup_old_data()
            except asyncio.CancelledError:
                logger.info("Cleanup loop cancelled")
                break
            except Exception as exc:
                logger.exception("Error in cleanup loop: %s", exc)
                await asyncio.sleep(3600)

    async def start(self):
        """Start the scheduler with all tasks running in parallel.
        
        This starts independent background tasks:
        1. Scraping loop - fetches new articles at configured intervals
        2. API news loop - fetches general/world news from external API
        3. Embedding loop - processes embeddings for articles without them
        4. Cleanup loop - removes old scraping records periodically
        
        All tasks run concurrently and independently.
        """
        if self.running:
            logger.warning("Scheduler is already running")
            return

        if not self._acquire_worker_lock():
            raise RuntimeError("Could not acquire worker lock. Another scraper instance may be running.")

        logger.info("Starting news scraping scheduler with independent parallel tasks")
        self.running = True

        # Create all tasks to run concurrently
        self.scraping_task = asyncio.create_task(self.scraping_loop())
        self.api_news_task = asyncio.create_task(self.api_news_loop())
        self.embedding_task = asyncio.create_task(self.embedding_loop())
        self.cleanup_task = asyncio.create_task(self.cleanup_loop())

        self.tasks = [
            self.scraping_task,
            self.api_news_task,
            self.embedding_task,
            self.cleanup_task,
        ]
        
        logger.info("Scheduler started - running 4 parallel tasks:")
        logger.info("  • Scraping loop: every %d minutes", 
                   SCHEDULER_CONFIG["scraping_interval_minutes"])
        logger.info("  • API news loop: every %d minutes", 
                   SCHEDULER_CONFIG["api_news_interval_minutes"])
        logger.info("  • Embedding loop: every %d minutes", 
                   SCHEDULER_CONFIG["embedding_interval_minutes"])
        logger.info("  • Cleanup loop: every %d hours", 
                   SCHEDULER_CONFIG["cleanup_interval_hours"])
        logger.info("All tasks started successfully and running in parallel")

    async def stop(self):
        """Stop the scheduler."""
        if not self.running:
            logger.warning("Scheduler is not running")
            self._release_worker_lock()
            return

        logger.info("Stopping news scraping scheduler")
        self.running = False

        for task in self.tasks:
            if not task.done():
                task.cancel()

        if self.tasks:
            await asyncio.gather(*self.tasks, return_exceptions=True)

        self._release_worker_lock()
        logger.info("Scheduler stopped successfully")

    async def run_once(self) -> Dict[str, Any]:
        """Run scraping, API news ingestion, and embedding processing once."""
        logger.info("Running one-time scraping and processing")
        scraping_result = await self.scrape_all_sources()
        await asyncio.sleep(2)
        api_news_result = await self.process_api_news()
        await asyncio.sleep(1)
        embedding_result = await self.process_embeddings()
        logger.info("One-time processing completed")
        return {
            "scraping": scraping_result,
            "api_news": api_news_result,
            "embeddings": embedding_result,
        }

    def get_status(self) -> Dict[str, Any]:
        """Get scheduler runtime status for diagnostics."""
        return {
            "running": self.running,
            "last_run_successful": self.last_run_successful,
            "last_run_time": self.last_run_time.isoformat() if self.last_run_time else None,
            "lock_file": WORKER_LOCK_FILE,
            "lock_acquired": self.worker_lock_acquired,
        }


scheduler = NewsScrapingScheduler()


class SchedulerService:
    """Service for managing the news scraping scheduler."""

    @staticmethod
    async def initialize():
        await scheduler.initialize()

    @staticmethod
    async def start():
        await scheduler.start()

    @staticmethod
    async def stop():
        await scheduler.stop()

    @staticmethod
    async def cleanup():
        await scheduler.cleanup()

    @staticmethod
    async def run_once() -> Dict[str, Any]:
        return await scheduler.run_once()

    @staticmethod
    async def scrape_source(source_name: str) -> Dict[str, Any]:
        if source_name not in NEWS_SOURCES:
            return {"error": f"Unknown source: {source_name}", "scraped": 0, "failed": 0}

        try:
            scraper = create_scraper(source_name, NEWS_SOURCES[source_name])
            async with scraper:
                result = await scraper.scrape_all()
            logger.info("Manual scraping of %s completed: %s", source_name, result)
            return result
        except Exception as exc:
            logger.exception("Error in manual scraping of %s: %s", source_name, exc)
            return {"error": str(exc), "scraped": 0, "failed": 0}

    @staticmethod
    async def process_embeddings() -> Dict[str, int]:
        return await scheduler.process_embeddings()

    @staticmethod
    async def process_api_news() -> Dict[str, Any]:
        return await scheduler.process_api_news()

    @staticmethod
    def get_status() -> Dict[str, Any]:
        return scheduler.get_status()


def setup_signal_handlers():
    """Setup signal handlers for graceful shutdown."""

    def signal_handler(signum, frame):
        logger.info("Received signal %s, initiating graceful shutdown", signum)
        try:
            loop = asyncio.get_running_loop()
            loop.create_task(SchedulerService.stop())
        except RuntimeError:
            pass
        sys.exit(0)

    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
