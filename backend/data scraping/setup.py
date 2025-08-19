#!/usr/bin/env python3
"""
Setup script for the News Scraper System.

This script helps set up the news scraping system by:
1. Installing required dependencies
2. Setting up the database schema
3. Creating configuration files
4. Running initial tests

Usage:
    python setup.py [--install-deps] [--setup-db] [--create-config] [--test]
"""

import sys
import os
import subprocess
import argparse
import asyncio
import logging
from pathlib import Path

# Setup basic logging
logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')
logger = logging.getLogger(__name__)

def install_dependencies():
    """Install required Python dependencies."""
    logger.info("Installing dependencies...")
    
    requirements_file = Path(__file__).parent / "news_scraper" / "requirements.txt"
    
    if not requirements_file.exists():
        logger.error(f"Requirements file not found: {requirements_file}")
        return False
    
    try:
        subprocess.run([
            sys.executable, "-m", "pip", "install", "-r", str(requirements_file)
        ], check=True)
        logger.info("Dependencies installed successfully!")
        return True
    except subprocess.CalledProcessError as e:
        logger.error(f"Failed to install dependencies: {e}")
        return False

def create_config():
    """Create configuration files from templates."""
    logger.info("Creating configuration files...")
    
    env_example = Path(__file__).parent / ".env.example"
    env_file = Path(__file__).parent / ".env"
    
    if env_example.exists() and not env_file.exists():
        try:
            with open(env_example, 'r') as src, open(env_file, 'w') as dst:
                dst.write(src.read())
            logger.info(f"Created {env_file}")
            logger.info("Please edit .env file with your actual configuration values")
            return True
        except Exception as e:
            logger.error(f"Failed to create .env file: {e}")
            return False
    else:
        if env_file.exists():
            logger.info(".env file already exists")
        else:
            logger.error(".env.example file not found")
        return False

async def setup_database():
    """Setup database schema."""
    logger.info("Setting up database...")
    
    try:
        # Import after dependencies are installed
        from news_scraper.database import db_manager
        
        await db_manager.initialize()
        logger.info("Database setup completed successfully!")
        await db_manager.close()
        return True
        
    except ImportError as e:
        logger.error(f"Failed to import database module: {e}")
        logger.error("Make sure dependencies are installed first")
        return False
    except Exception as e:
        logger.error(f"Failed to setup database: {e}")
        logger.error("Make sure your DATABASE_URL in .env is correct and PostgreSQL is running")
        return False

async def test_system():
    """Run basic system tests."""
    logger.info("Running system tests...")
    
    try:
        from news_scraper import NewsScraperManager
        
        # Test initialization
        manager = NewsScraperManager()
        await manager.initialize()
        
        # Test database connection
        stats = manager.get_system_stats()
        if stats['initialized']:
            logger.info("✓ System initialization test passed")
        else:
            logger.error("✗ System initialization test failed")
            return False
        
        # Test configuration
        if stats['config']['sources']:
            logger.info(f"✓ Found {len(stats['config']['sources'])} configured sources")
        else:
            logger.error("✗ No sources configured")
            return False
        
        await manager.cleanup()
        logger.info("✓ All tests passed!")
        return True
        
    except ImportError as e:
        logger.error(f"Failed to import news_scraper: {e}")
        return False
    except Exception as e:
        logger.error(f"System test failed: {e}")
        return False

def show_usage_instructions():
    """Show usage instructions after setup."""
    print("\n" + "="*60)
    print("NEWS SCRAPER SETUP COMPLETED!")
    print("="*60)
    print("\nNext steps:")
    print("\n1. Configure your environment:")
    print("   - Edit .env file with your database and API credentials")
    print("   - Set up PostgreSQL database")
    print("   - Get OpenAI API key for embeddings")
    
    print("\n2. Run the scraper:")
    print("   python run_scraper.py run-once    # Run once")
    print("   python run_scraper.py run         # Run continuously")
    
    print("\n3. Available commands:")
    print("   python run_scraper.py scrape --source aljazeera")
    print("   python run_scraper.py embeddings")
    print("   python run_scraper.py search --query 'your query'")
    print("   python run_scraper.py recent --limit 20")
    
    print("\n4. For help:")
    print("   python run_scraper.py --help")
    print("   See README.md for detailed documentation")
    print("\n" + "="*60)

async def main():
    parser = argparse.ArgumentParser(description='Setup News Scraper System')
    parser.add_argument('--install-deps', action='store_true', help='Install dependencies')
    parser.add_argument('--setup-db', action='store_true', help='Setup database')
    parser.add_argument('--create-config', action='store_true', help='Create configuration files')
    parser.add_argument('--test', action='store_true', help='Run system tests')
    parser.add_argument('--all', action='store_true', help='Run all setup steps')
    
    args = parser.parse_args()
    
    # If no specific args, run all steps
    if not any([args.install_deps, args.setup_db, args.create_config, args.test]):
        args.all = True
    
    success = True
    
    if args.all or args.install_deps:
        if not install_dependencies():
            success = False
    
    if args.all or args.create_config:
        if not create_config():
            success = False
    
    if args.all or args.setup_db:
        if not await setup_database():
            success = False
    
    if args.all or args.test:
        if not await test_system():
            success = False
    
    if success:
        logger.info("Setup completed successfully!")
        show_usage_instructions()
    else:
        logger.error("Setup completed with errors. Please check the logs above.")
        sys.exit(1)

if __name__ == '__main__':
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nSetup interrupted by user")
    except Exception as e:
        logger.error(f"Setup failed: {e}")
        sys.exit(1)
