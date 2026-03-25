#!/usr/bin/env python3
"""
Main entry point for the News Scraper System.

This script provides a command-line interface to run the news scraping system.
It can be used to run the system once, continuously, or perform specific operations.

Examples:
    python run_scraper.py run              # Run continuously
    python run_scraper.py run-once         # Run once
    python run_scraper.py scrape --source aljazeera  # Scrape specific source
    python run_scraper.py embeddings       # Process embeddings
    python run_scraper.py search --query "cryptocurrency"  # Search articles
    python run_scraper.py recent --limit 20  # Get recent articles
"""

import sys
import os
import asyncio
import logging
import platform

# Add the current directory to the path so we can import news_scraper
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, current_dir)

try:
    from news_scraper.manager import main
    from news_scraper.database import db_manager
except ImportError as e:
    print(f"Error importing news_scraper: {e}")
    print("Make sure you have installed all dependencies:")
    print("pip install -r ../requirements.txt")
    sys.exit(1)


async def _bootstrap_news_sources() -> None:
    """Ensure default sources exist when news_sources is empty."""
    await db_manager.initialize()
    await db_manager.ensure_default_sources_if_empty()


async def _bootstrap_and_run() -> None:
    await _bootstrap_news_sources()
    await main()

if __name__ == '__main__':
    # Set up basic logging before running
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    # Fix for Windows: aiodns requires SelectorEventLoop
    if platform.system() == 'Windows':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    
    try:
        asyncio.run(_bootstrap_and_run())
    except KeyboardInterrupt:
        print("\nOperation interrupted by user")
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)
