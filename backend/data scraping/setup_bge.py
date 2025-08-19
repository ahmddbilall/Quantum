#!/usr/bin/env python3
"""
Quick setup script for BGE embeddings and PostgreSQL database.
"""

import subprocess
import sys
import os
import asyncio
import logging

logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')
logger = logging.getLogger(__name__)

def check_and_setup_gpu():
    """Check for GPU availability and set up CUDA PyTorch if needed."""
    logger.info("Checking GPU setup...")
    
    try:
        import torch
        
        if torch.cuda.is_available():
            gpu_name = torch.cuda.get_device_name(0)
            gpu_memory = torch.cuda.get_device_properties(0).total_memory / 1e9
            logger.info(f"✓ GPU detected: {gpu_name} ({gpu_memory:.1f} GB)")
            logger.info(f"✓ CUDA version: {torch.version.cuda}")
            return True
        else:
            logger.warning("⚠️  No GPU detected or CUDA not available")
            logger.info("Installing CPU-only version - performance will be slower")
            return False
            
    except ImportError:
        logger.info("PyTorch not installed yet - will install with GPU support")
        return False

def install_dependencies():
    """Install required dependencies for BGE model."""
    logger.info("Installing BGE embedding dependencies...")
    
    gpu_available = False
    try:
        result = subprocess.run(['nvidia-smi'], capture_output=True)
        gpu_available = result.returncode == 0
    except FileNotFoundError:
        pass
    
    if gpu_available:
        logger.info("NVIDIA GPU detected - installing PyTorch with CUDA support")
        dependencies = [
            "--index-url https://download.pytorch.org/whl/cu118 torch torchvision torchaudio",
            "sentence-transformers",
            "transformers",
            "numpy",
            "asyncpg",
            "aiohttp",
            "beautifulsoup4",
            "newspaper3k",
            "feedparser",
            "python-dotenv",
            "psycopg2-binary"
        ]
    else:
        logger.info("No GPU detected - installing CPU-only version")
        dependencies = [
            "sentence-transformers",
            "torch",
            "transformers",
            "numpy",
            "asyncpg",
            "aiohttp",
            "beautifulsoup4",
            "newspaper3k",
            "feedparser",
            "python-dotenv",
            "psycopg2-binary"
        ]
        
    for dep in dependencies:
        try:
            logger.info(f"Installing {dep}...")
            if dep.startswith("--index-url"):
                # Special handling for PyTorch with CUDA
                subprocess.run(f"{sys.executable} -m pip install {dep}", 
                             shell=True, check=True, capture_output=True)
            else:
                subprocess.run([sys.executable, "-m", "pip", "install", dep], 
                             check=True, capture_output=True)
        except subprocess.CalledProcessError as e:
            logger.error(f"Failed to install {dep}: {e}")
            return False
    
    logger.info("✓ All dependencies installed successfully!")
    return True

def test_bge_model():
    """Test BGE model loading and embedding generation."""
    logger.info("Testing BGE model...")
    
    try:
        from sentence_transformers import SentenceTransformer
        
        # Load the model (this will download it on first use)
        logger.info("Loading BAAI/bge-base-en-v1.5 model (this may take a few minutes on first run)...")
        model = SentenceTransformer('BAAI/bge-base-en-v1.5')
        
        # Test embedding generation
        test_text = "This is a test sentence for embedding generation."
        embedding = model.encode(test_text)
        
        logger.info(f"✓ BGE model loaded successfully!")
        logger.info(f"✓ Generated embedding with {len(embedding)} dimensions")
        
        return True
        
    except Exception as e:
        logger.error(f"✗ BGE model test failed: {e}")
        return False

def create_env_file():
    """Create .env file with BGE-specific configuration."""
    env_content = """# News Scraper Configuration for BGE Model
DATABASE_URL=postgresql://newsuser:your_password@localhost:5432/newsdb

# BGE Embedding Configuration
EMBEDDING_DEVICE=auto  # auto, cpu, or cuda

# Scraping Configuration  
SCRAPING_INTERVAL_HOURS=6
EMBEDDING_INTERVAL_MINUTES=30
CLEANUP_INTERVAL_DAYS=7

# Optional Email Alerts
EMAIL_ALERTS_ENABLED=false

# Environment
ENVIRONMENT=development
DEBUG=true
"""
    
    env_path = ".env"
    if not os.path.exists(env_path):
        with open(env_path, 'w') as f:
            f.write(env_content)
        logger.info(f"✓ Created {env_path} file")
        logger.info("⚠️  Please update DATABASE_URL with your actual database credentials")
    else:
        logger.info("✓ .env file already exists")

async def test_database_connection():
    """Test database connection and pgvector extension."""
    logger.info("Testing database connection...")
    
    try:
        import asyncpg
        from dotenv import load_dotenv
        
        load_dotenv()
        database_url = os.getenv('DATABASE_URL')
        
        if not database_url or 'your_password' in database_url:
            logger.warning("⚠️  Please update DATABASE_URL in .env file with your actual credentials")
            return False
        
        # Test connection
        conn = await asyncpg.connect(database_url)
        
        # Test pgvector extension
        result = await conn.fetchval("SELECT extname FROM pg_extension WHERE extname = 'vector'")
        if result:
            logger.info("✓ Database connection successful")
            logger.info("✓ pgvector extension is installed")
        else:
            logger.warning("⚠️  pgvector extension not found - please install it")
            logger.info("See POSTGRESQL_SETUP.md for installation instructions")
        
        await conn.close()
        return True
        
    except Exception as e:
        logger.error(f"✗ Database connection failed: {e}")
        logger.info("Please check your DATABASE_URL and ensure PostgreSQL is running")
        return False

def show_next_steps():
    """Show next steps for the user."""
    print("\n" + "="*60)
    print("🎉 BGE SETUP COMPLETED!")
    print("="*60)
    
    print("\n📋 Next Steps:")
    print("\n1. Database Setup:")
    print("   - Create PostgreSQL database: 'newsdb'")
    print("   - Install pgvector extension")
    print("   - Update DATABASE_URL in .env file")
    print("   - See POSTGRESQL_SETUP.md for detailed instructions")
    
    print("\n2. Test the system:")
    print("   python run_scraper.py run-once")
    
    print("\n3. Run continuously:")
    print("   python run_scraper.py run")
    
    print("\n💡 Key Benefits of BGE Model:")
    print("   ✓ No API costs - runs locally")
    print("   ✓ Privacy - data never leaves your server") 
    print("   ✓ No rate limits")
    print("   ✓ 768-dimensional embeddings")
    print("   ✓ Optimized for retrieval tasks")
    
    print("\n📚 Documentation:")
    print("   - README.md - Complete system documentation")
    print("   - POSTGRESQL_SETUP.md - Database setup guide")
    print("   - IMPLEMENTATION_SUMMARY.md - Architecture overview")
    
    print("\n" + "="*60)

async def main():
    """Main setup function."""
    print("🚀 Setting up News Scraper with BGE Embeddings")
    print("="*50)
    
    # Install dependencies
    if not install_dependencies():
        print("❌ Setup failed - could not install dependencies")
        return
    
    # Test BGE model
    if not test_bge_model():
        print("❌ Setup failed - BGE model test failed")
        return
    
    # Create .env file
    create_env_file()
    
    # Test database (optional - may fail if not configured yet)
    await test_database_connection()
    
    # Show next steps
    show_next_steps()

if __name__ == '__main__':
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n❌ Setup interrupted by user")
    except Exception as e:
        print(f"❌ Setup failed: {e}")
        sys.exit(1)
