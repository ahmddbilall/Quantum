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

# Add the current directory to the path so we can import news_scraper
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, current_dir)

try:
    from news_scraper.manager import main
except ImportError as e:
    print(f"Error importing news_scraper: {e}")
    print("Make sure you have installed all dependencies:")
    print("pip install -r news_scraper/requirements.txt")
    sys.exit(1)

if __name__ == '__main__':
    # Set up basic logging before running
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nOperation interrupted by user")
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)
