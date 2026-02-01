# Phase 3: News Pipeline & Embeddings

## Objective
Create a self-updating pipeline that fetches news, deduplicates it, generates vector embeddings using a local model, and makes it searchable via API.

## 1. News Acquisition
- **Source**: NewsAPI (via `newsapi-python` or direct HTTP requests).
- **Scheduling**: `APScheduler` or `Celery` (APScheduler is simpler for this scale).
- **Job Frequency**: e.g., Every 30 minutes.

### 1.1 Ingestion Service (`services/news_ingestion.py`)
1.  **Fetch**: Query NewsAPI for top headlines and specific categories.
2.  **Normalize**: Map API response to our `Article` schema.
3.    - Check if `url` already exists in DB. Skip if yes.
    - **Tagging**: Extract top 3-5 keywords/tags from title/summary (using NLP or LLM) to populate `tags` array.
    - **Sentiment Analysis**: Calculate sentiment score and label ('positive', 'negative', 'neutral') using `nltk` or LLM.

## 2. Embedding Generation
We will use `sentence-transformers` locally with the `bge-base-en-v1.5` model.

### 2.1 Embedding Service (`services/embedding.py`)
- **Model Loading**: Load model once on app startup (singleton pattern) to save memory.
- **Method**: `generate_embedding(text: str) -> List[float]`
- **Input**: Combined `title` + `summary` (and potentially first 500 chars of content) for best semantic representation.
- **Output**: 768-dimensional float list.

### 2.2 Processing Flow
- When a new article is saved:
    - Trigger embedding generation immediately (sync) or enqueue background task (async).
    - Save vector to `article_embeddings` table.

## 3. Search & Retrieval

### 3.1 Vector Search
- **Query**: "Recent advancements in AI".
- **Logic**:
    1.  Generate embedding for query.
    2.  Perform Cosine Similarity search using `pgvector`.
        ```sql
        SELECT article_id FROM article_embeddings ORDER BY embedding <=> :query_vector LIMIT 20;
        ```
    3.  Fetch Article details for these IDs.

### 3.2 Filters
- The frontend needs filters by `source`, `category`, and `date`.
- **Hybrid Search**: We must combine Vector Search with SQL `WHERE` clauses (Metadata filtering).
    - *Note*: pgvector supports this natively (filtering scan).

## 4. API Endpoints (`api/endpoints/news.py`)
- `GET /news/feed`:
    - Params: `page`, `limit`, `category`, `source`, `search_query`.
    - Logic:
        - If `search_query` is present: Use Vector Search + Filters.
        - If no query: Use Standard SQL `ORDER BY published_at DESC` + Filters.
- `GET /news/{id}`: Detail view.
- `POST /news/bookmark/{id}`: Add to bookmarks.
- `GET /news/bookmarks`: List user bookmarks.

## 5. Implementation Checklist
- [ ] Install `sentence-transformers`, `scikit-learn` (for utils), `newsapi-python`, `apscheduler`.
- [ ] Create `services/news_fetcher.py` to talk to NewsAPI.
- [ ] Create `services/embedding.py` to wrap `bge-base`.
- [ ] Implement Background Job to run Fetcher -> DB -> Embedder loop.
- [ ] Implement `pgvector` search logic in CRUD layer.
- [ ] Create News Router with filtering and search.
