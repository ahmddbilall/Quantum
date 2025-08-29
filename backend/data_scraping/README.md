# Data Scraping Setup Guide

This guide provides step-by-step instructions for setting up PostgreSQL with `pgvector`, downloading the model, and installing requirements for running the data scraping pipeline.

---

## 1. PostgreSQL Setup

### PostgreSQL Server Configuration
- **Password:** `1234567` (required when creating a new server)  
- **Port:** `5432`

---

### Install `pgvector` Extension

#### Option 1: Build from source
1. Open **x64 Native Tools Command Prompt for VS 2022** as Administrator.
2. Run the following commands:

```sh
set PGROOT=C:\Program Files\PostgreSQL\17
set "PGROOT=C:\Program Files\PostgreSQL\17"
cd %TEMP%
git clone --branch v0.8.0 https://github.com/pgvector/pgvector.git
cd pgvector
nmake /F Makefile.win
nmake /F Makefile.win install
````

#### Option 2: Precompiled binaries (if x64 tools are not available)

* Download from [pgvector\_pgsql\_windows Releases](https://github.com/andreiramani/pgvector_pgsql_windows/releases).
* Move the downloaded files to the corresponding PostgreSQL folders.

---

### Database & User Setup (Development Environment)

After installing PostgreSQL and `pgvector`, follow these steps:

```sql
-- Create a database
CREATE DATABASE newsdb;

-- Create a user
CREATE USER newsuser WITH PASSWORD 'pass123';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE newsdb TO newsuser;

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Grant schema permissions
GRANT ALL ON SCHEMA public TO newsuser;
GRANT CREATE ON SCHEMA public TO newsuser;

-- Ensure default privileges
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO newsuser;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO newsuser;
```

#### Database URL

```
DATABASE_URL=postgresql://newsuser:pass123@localhost:5432/newsdb
```

---

## 2. Downloading the Model

We are using **BAAI/bge-base-en-v1.5** from Hugging Face.
Run the following code in **Google Colab**:

```python
# Step 1: Install dependencies
!pip install -q huggingface_hub

# Step 2: Download model into a local folder
from huggingface_hub import snapshot_download
snapshot_download(
    repo_id="BAAI/bge-base-en-v1.5",
    local_dir="bge-base-en-v1.5",
    local_dir_use_symlinks=False
)

# Step 3: Zip the folder
import shutil
shutil.make_archive("bge-base-en-v1.5", 'zip', "bge-base-en-v1.5")

# Step 4: Save to Google Drive
from google.colab import drive, files
drive.mount('/content/drive')
!cp bge-base-en-v1.5.zip /content/drive/MyDrive/
```

➡️ After downloading, unzip the file inside the `models/` directory in your project.

---

## 3. Installing Requirements

From your project root directory, install dependencies:

```sh
pip install -r requirements.txt
```

---

✅ At this point, PostgreSQL + `pgvector`, the model, and Python dependencies should be ready for running the scraping pipeline.

---
---
---
---
---


# Documentation

## Architecture

```
data scraping/
├── news_scraper/              # Main package
│   ├── __init__.py           # Package initialization
│   ├── config.py             # Configuration management
│   ├── database.py           # PostgreSQL + pgvector integration
│   ├── base_scraper.py       # Base scraper class with error 
│   ├── scrapers.py           # Source-specific scrapers
│   ├── embeddings.py         # Vector embedding processing
│   ├── scheduler.py          # Automated task scheduling
│   ├── logging_utils.py      # Comprehensive logging system
│   └── manager.py            # Main system manager
│    
├── run_scraper.py            # Main entry point
├── .env.example              # Environment configuration template
├── README.md                 # Comprehensive documentation
└── logs/                     # Log files directory
```

---
## 📁 File Structure & Responsibilities

### **Core System Files**

#### 1. `manager.py` - **MAIN ORCHESTRATOR**
**Purpose**: Central command center that coordinates all system operations
**Key Responsibilities**:
- System initialization and cleanup
- Command-line interface handling
- Coordinating scraping, embedding, and search operations
- Performance monitoring and error tracking

**Key Classes**:
```python
class NewsScraperManager:
    async def run_continuous()     # Run system 24/7 with scheduler
    async def run_once()          # One-time scraping + processing
    async def scrape_source()     # Scrape specific news source
    async def process_embeddings() # Generate vector embeddings
    async def search_articles()   # Semantic search functionality
```

#### 2. `config.py` - **CONFIGURATION HUB**
**Purpose**: Centralized configuration management
**Key Configurations**:
```python
DATABASE_CONFIG     # PostgreSQL connection settings
EMBEDDING_CONFIG    # BGE model settings (768-dim, BAAI/bge-base-en-v1.5)
SCRAPING_CONFIG     # Timeouts, retries, concurrent requests
NEWS_SOURCES        # Al Jazeera, BBC, Guardian, Crypto RSS configs
SCHEDULER_CONFIG    # Automation intervals (6hr scraping, 30min embeddings)
```

#### 3. `database.py` - **DATA PERSISTENCE LAYER**
**Purpose**: PostgreSQL integration with vector search capabilities
**Key Features**:
- Connection pooling (5-20 connections)
- Vector similarity search using pgvector
- Article deduplication (URL + title hashing)
- Metadata storage and retrieval

**Key Tables**:
```sql
articles: id, url, title, content, summary, source_name, published_at, created_at
embeddings: article_id, embedding_vector (768-dim), created_at
```

**Key Methods**:
```python
class DatabaseManager:
    async def save_article()           # Store article with deduplication
    async def update_article_embedding() # Store 768-dim vector
    async def search_articles()        # Cosine similarity search
    async def get_unprocessed_articles() # Articles without embeddings
```

#### 4. `embeddings.py` - **VECTOR PROCESSING ENGINE**
**Purpose**: Generate semantic embeddings using local BGE model
**Key Features**:
- BAAI/bge-base-en-v1.5 integration (768 dimensions)
- Batch processing for efficiency
- Local processing (no API costs)
- Optimized text preparation for retrieval

**Key Classes**:
```python
class BGEEmbeddingProcessor:
    async def generate_embedding()      # Single text → 768-dim vector
    async def generate_batch_embeddings() # Batch processing
    async def search_similar_articles() # Query-based similarity search
    async def process_unprocessed_articles() # Background embedding generation
```

#### 5. `scheduler.py` - **AUTOMATION ENGINE**
**Purpose**: Automated task scheduling and background processing
**Key Features**:
- Multi-source scraping every 6 hours
- Embedding processing every 30 minutes
- Database cleanup every 7 days
- Error handling and retry logic

**Key Classes**:
```python
class SchedulerService:
    async def start()           # Start continuous automation
    async def run_once()        # Single scraping + embedding cycle
    async def scrape_all_sources() # Parallel source scraping
```

#### 6. `scrapers.py` - **WEB SCRAPING ENGINES**
**Purpose**: Source-specific content extraction
**Scraper Classes**:
```python
class AlJazeeraScraper:    # Al Jazeera RSS + article content
class BBCScraper:          # BBC RSS + full article extraction
class GuardianScraper:     # The Guardian RSS + content parsing
class CryptoScraper:       # Cryptocurrency news aggregation
```

**Each scraper handles**:
- RSS feed parsing
- Full article content extraction
- Metadata extraction (title, summary, published date)
- Content cleaning and validation

#### 7. `base_scraper.py` - **SCRAPING FRAMEWORK**
**Purpose**: Common scraping functionality and patterns
**Key Features**:
- Rate limiting and request throttling
- Error handling and retries
- Content validation
- Base classes for consistent scraper implementation

#### 8. `logging_utils.py` - **MONITORING & DIAGNOSTICS**
**Purpose**: Comprehensive logging, performance tracking, and error monitoring
**Key Features**:
```python
perf_logger:     # Performance timing and metrics
error_tracker:   # Error aggregation and analysis
metrics_tracker: # System metrics and statistics
```


#### 9. `run_scraper.py` - **MAIN ENTRY POINT**
**Purpose**: Command-line interface for system operations
**Usage Examples**:
```bash
python run_scraper.py run              # Continuous operation
python run_scraper.py run-once         # Single execution
python run_scraper.py scrape --source aljazeera
python run_scraper.py search --query "cryptocurrency"
```

---


## 🔄 Data Flow Architecture

### **1. News Scraping Flow**
```
RSS Feeds → Source Scrapers → Content Extraction → Database Storage
    ↓           ↓                    ↓                    ↓
Al Jazeera  BBCScraper         Full Article      PostgreSQL
BBC         GuardianScraper    + Metadata        (articles table)
Guardian    CryptoScraper      Validation        Deduplication
Crypto      (parallel)         Cleaning          URL hashing
```

### **2. Embedding Processing Flow**
```
Unprocessed Articles → Text Preparation → BGE Model → Vector Storage
        ↓                     ↓              ↓            ↓
   Database Query      Title + Content   768-dim      embeddings
   (no embedding)      Text Formatting   Vector       table
   Batch Loading       Instruction       Generation   (pgvector)
```

### **3. Search & Retrieval Flow**
```
User Query → BGE Embedding → Vector Search → Ranked Results
     ↓            ↓              ↓              ↓
  "crypto"    768-dim vector  Cosine        Top-N articles
  Query text  Generation      Similarity    with scores
              (query prefix)  (pgvector)    + metadata
```

---

## Database Schema For news articles 

### news_sources

- id, name, base_url,  is_active, timestamps

### news_articles

- id, source_id, title, url, published_date, content, summary
- main_image_url, author, category, tags, metadata
- scraped_at, updated_at, is_processed, embedding (vector)

### scraping_logs

- id, source_id, status, message, articles_scraped/failed
- started_at, completed_at, error_details

---


## Usage

### Command Line Interface

```bash
# Run continuously with scheduler
python run_scraper.py run

# Run once (scraping + embeddings)
python run_scraper.py run-once

# Scrape specific source
python run_scraper.py scrape --source aljazeera

# Process embeddings only
python run_scraper.py embeddings

# Search articles
python run_scraper.py search --query "cryptocurrency" --limit 10

# Get recent articles
python run_scraper.py recent --limit 20
```

### Programmatic Usage

```python
from news_scraper import NewsScraperManager

# Initialize manager
manager = NewsScraperManager()

# Run once
result = await manager.run_once()

# Scrape specific source
result = await manager.scrape_source('aljazeera')

# Search articles
result = await manager.search_articles('AI technology', limit=10)

# Get recent articles
result = await manager.get_recent_articles(limit=50)
```

---