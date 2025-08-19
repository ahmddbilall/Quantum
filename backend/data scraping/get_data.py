"""
Migration script for legacy news scraping functions.

This file provides backward compatibility and migration path to the new news_scraper package.
The old CSV-based scraping functions have been replaced with a robust PostgreSQL-based system.

Usage:
    # Use the new system
    python run_scraper.py run-once
    
    # Or programmatically
    from news_scraper import NewsScraperManager
    manager = NewsScraperManager()
    await manager.run_once()
"""

import warnings
import asyncio
import sys
import os

# Add the current directory to Python path
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, current_dir)

# Issue deprecation warning
warnings.warn(
    "get_data.py functions are deprecated. Use the new news_scraper package instead.",
    DeprecationWarning,
    stacklevel=2
)

def show_migration_message():
    """Show migration instructions to users."""
    print("=" * 60)
    print("MIGRATION NOTICE")
    print("=" * 60)
    print("The old get_data.py scraping functions have been replaced with")
    print("a new robust news scraping system that includes:")
    print()
    print("✓ PostgreSQL database storage")
    print("✓ Vector embeddings for AI/RAG")
    print("✓ Automated scheduling")
    print("✓ Better error handling")
    print("✓ Performance monitoring")
    print("✓ Multi-source scraping")
    print()
    print("To use the new system:")
    print()
    print("1. Install dependencies:")
    print("   pip install -r news_scraper/requirements.txt")
    print()
    print("2. Setup database (see README.md for details)")
    print()
    print("3. Configure environment:")
    print("   cp .env.example .env")
    print("   # Edit .env with your settings")
    print()
    print("4. Run the scraper:")
    print("   python run_scraper.py run-once")
    print()
    print("For more information, see README.md")
    print("=" * 60)

# Legacy wrapper functions that show migration message
def Aljazeera():
    """Legacy Al Jazeera scraper - DEPRECATED"""
    show_migration_message()
    print("\nTo scrape Al Jazeera with the new system:")
    print("python run_scraper.py scrape --source aljazeera")
    
    # Optionally run the new scraper
    try:
        from news_scraper import NewsScraperManager
        print("\nWould you like to run the new Al Jazeera scraper? (y/n): ", end="")
        response = input().lower().strip()
        if response in ['y', 'yes']:
            async def run_new_scraper():
                manager = NewsScraperManager()
                result = await manager.scrape_source('aljazeera')
                print(f"\nScraping completed: {result}")
            
            asyncio.run(run_new_scraper())
    except ImportError:
        print("\nNew scraper not available. Please install dependencies first.")

def BBC():
    """Legacy BBC scraper - DEPRECATED"""
    show_migration_message()
    print("\nTo scrape BBC with the new system:")
    print("python run_scraper.py scrape --source bbc")
    
    # Optionally run the new scraper
    try:
        from news_scraper import NewsScraperManager
        print("\nWould you like to run the new BBC scraper? (y/n): ", end="")
        response = input().lower().strip()
        if response in ['y', 'yes']:
            async def run_new_scraper():
                manager = NewsScraperManager()
                result = await manager.scrape_source('bbc')
                print(f"\nScraping completed: {result}")
            
            asyncio.run(run_new_scraper())
    except ImportError:
        print("\nNew scraper not available. Please install dependencies first.")

def TheGardians():
    """Legacy Guardian scraper - DEPRECATED"""
    show_migration_message()
    print("\nTo scrape The Guardian with the new system:")
    print("python run_scraper.py scrape --source guardian")
    
    # Optionally run the new scraper
    try:
        from news_scraper import NewsScraperManager
        print("\nWould you like to run the new Guardian scraper? (y/n): ", end="")
        response = input().lower().strip()
        if response in ['y', 'yes']:
            async def run_new_scraper():
                manager = NewsScraperManager()
                result = await manager.scrape_source('guardian')
                print(f"\nScraping completed: {result}")
            
            asyncio.run(run_new_scraper())
    except ImportError:
        print("\nNew scraper not available. Please install dependencies first.")

def Crypto():
    """Legacy Crypto scraper - DEPRECATED"""
    show_migration_message()
    print("\nTo scrape Crypto news with the new system:")
    print("python run_scraper.py scrape --source crypto")
    
    # Optionally run the new scraper
    try:
        from news_scraper import NewsScraperManager
        print("\nWould you like to run the new Crypto scraper? (y/n): ", end="")
        response = input().lower().strip()
        if response in ['y', 'yes']:
            async def run_new_scraper():
                manager = NewsScraperManager()
                result = await manager.scrape_source('crypto')
                print(f"\nScraping completed: {result}")
            
            asyncio.run(run_new_scraper())
    except ImportError:
        print("\nNew scraper not available. Please install dependencies first.")

def run_all_scrapers():
    """Run all scrapers with the new system."""
    show_migration_message()
    print("\nTo run all scrapers with the new system:")
    print("python run_scraper.py run-once")
    
    try:
        from news_scraper import NewsScraperManager
        print("\nWould you like to run all scrapers now? (y/n): ", end="")
        response = input().lower().strip()
        if response in ['y', 'yes']:
            async def run_all():
                manager = NewsScraperManager()
                result = await manager.run_once()
                print(f"\nAll scraping completed: {result}")
            
            asyncio.run(run_all())
    except ImportError:
        print("\nNew scraper not available. Please install dependencies first.")

if __name__ == "__main__":
    """
    If this file is run directly, show migration information and 
    optionally run the new system.
    """
    show_migration_message()
    
    print("\nAvailable options:")
    print("1. Run all scrapers once")
    print("2. Scrape Al Jazeera only")
    print("3. Scrape BBC only") 
    print("4. Scrape The Guardian only")
    print("5. Scrape Crypto news only")
    print("6. Show new system commands")
    print("0. Exit")
    
    choice = input("\nSelect an option (0-6): ").strip()
    
    if choice == "1":
        run_all_scrapers()
    elif choice == "2":
        Aljazeera()
    elif choice == "3":
        BBC()
    elif choice == "4":
        TheGardians()
    elif choice == "5":
        Crypto()
    elif choice == "6":
        print("\nNew system commands:")
        print("python run_scraper.py run           # Run continuously")
        print("python run_scraper.py run-once      # Run once")
        print("python run_scraper.py scrape --source SOURCE")
        print("python run_scraper.py embeddings    # Process embeddings")
        print("python run_scraper.py search --query 'your query'")
        print("python run_scraper.py recent --limit 20")
    elif choice == "0":
        print("Goodbye!")
    else:
        print("Invalid choice. Please run the script again.")




