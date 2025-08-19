# News Scraper System

A robust, scalable news scraping system with PostgreSQL integration and vector embeddings for RAG-based applications.

## Features

- **Multi-source scraping**: Al Jazeera, BBC, The Guardian, Crypto News (RSS)
- **PostgreSQL storage**: Structured data storage with metadata
- **Vector embeddings**: OpenAI-powered embeddings for semantic search
- **Automated scheduling**: Configurable intervals for scraping and processing
- **Error handling**: Comprehensive error tracking and recovery
- **Performance monitoring**: Detailed logging and metrics
- **Scalable architecture**: Async/await, connection pooling, rate limiting

## Architecture

```
news_scraper/
├── __init__.py          # Package initialization
├── config.py            # Configuration management
├── database.py          # PostgreSQL database management
├── base_scraper.py      # Base scraper class
├── scrapers.py          # Source-specific scrapers
├── embeddings.py        # Vector embedding processing
├── scheduler.py         # Automated task scheduling
├── logging_utils.py     # Logging and monitoring
├── manager.py           # Main system manager
└── requirements.txt     # Dependencies
```

## Database Schema

### news_sources

- id, name, base_url, scraper_type, is_active, timestamps

### news_articles

- id, source_id, title, url, published_date, content, summary
- main_image_url, author, category, tags, metadata
- scraped_at, updated_at, is_processed, embedding (vector)

### scraping_logs

- id, source_id, status, message, articles_scraped/failed
- started_at, completed_at, error_details

## Installation

1. **Install dependencies**:

   ```bash
   pip install -r news_scraper/requirements.txt
   ```

2. **Setup PostgreSQL**:

   ```sql
   CREATE DATABASE newsdb;
   CREATE USER newsuser WITH PASSWORD 'password';
   GRANT ALL PRIVILEGES ON DATABASE newsdb TO newsuser;
   ```

3. **Install pgvector extension**:

   ```sql
   CREATE EXTENSION vector;
   ```

4. **Configure environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your database and API credentials
   ```

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

## Configuration

### Environment Variables

- `DATABASE_URL`: PostgreSQL connection string
- `OPENAI_API_KEY`: OpenAI API key for embeddings
- `SCRAPING_INTERVAL_HOURS`: Hours between scraping cycles (default: 6)
- `EMBEDDING_INTERVAL_MINUTES`: Minutes between embedding processing (default: 30)

### Source Configuration

Edit `config.py` to modify scraping sources, intervals, and behavior:

```python
NEWS_SOURCES = {
    'aljazeera': {
        'name': 'Al Jazeera',
        'base_urls': [...],
        'headers': {...}
    },
    # Add more sources...
}
```

## Data Flow

1. **Scraping**: Fetch article links → Extract content → Save to database
2. **Embedding**: Process unprocessed articles → Generate embeddings → Update database
3. **Search**: Generate query embedding → Vector similarity search → Return results

## Error Handling

- **Retry logic**: Exponential backoff for failed requests
- **Circuit breaking**: Temporarily disable failing sources
- **Comprehensive logging**: All errors tracked with context
- **Graceful degradation**: System continues working despite individual failures

## Monitoring

- **Performance metrics**: Timing for all operations
- **Error tracking**: Categorized error statistics
- **Session metrics**: Articles scraped, success rates
- **Health checks**: System status and statistics

## Scaling Considerations

- **Database connection pooling**: Configurable pool sizes
- **Rate limiting**: Respectful scraping with delays
- **Concurrent processing**: Async operations throughout
- **Batch processing**: Efficient embedding generation
- **Memory management**: Streaming and cleanup

## API Integration

The system can be easily integrated into web applications:

```python
# In your FastAPI/Flask app
from news_scraper import news_manager

@app.get("/api/articles/recent")
async def get_recent_articles(limit: int = 20):
    return await news_manager.get_recent_articles(limit)

@app.get("/api/articles/search")
async def search_articles(q: str, limit: int = 10):
    return await news_manager.search_articles(q, limit)
```

## Troubleshooting

### Common Issues

1. **Database connection errors**: Check DATABASE_URL and PostgreSQL status
2. **OpenAI API errors**: Verify OPENAI_API_KEY and quota
3. **Scraping failures**: Check internet connection and source availability
4. **Memory issues**: Reduce batch sizes in config

### Logs

- Application logs: `logs/news_scraper.log`
- Performance metrics: Check performance logger output
- Error details: Comprehensive error context in logs

## Contributing

1. Follow the established architecture patterns
2. Add proper error handling and logging
3. Update configuration as needed
4. Add tests for new scrapers
5. Document any new features

## License

This project is part of a news website application with AI chat capabilities.
