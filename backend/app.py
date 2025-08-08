from flask import Flask, jsonify, request
import asyncio
import aiohttp
from dateutil import parser
import os
from db import (
    create_pool, create_news_article, get_news_article,
    get_all_news_articles, update_news_article, delete_news_article
)

app = Flask(__name__)

# Global pool variable
pool = None

# Simulated AI functions
async def compute_summary(content: str) -> str:
    """Simulate summarization (placeholder for actual model)."""
    return content[:100] + "..."

async def compute_sentiment(content: str) -> str:
    """Simulate sentiment analysis (placeholder for actual model)."""
    return "neutral"

async def fetch_news(api_key: str, topic: str = "finance") -> None:
    """Fetch news from NewsAPI and store in the database."""
    url = f"https://newsapi.org/v2/everything?q={topic}&apiKey={api_key}"
    async with aiohttp.ClientSession() as session:
        async with session.get(url) as response:
            if response.status == 200:
                data = await response.json()
                articles = data.get('articles', [])
                for article in articles:
                    source = article['source']['name']
                    date_str = article['publishedAt']
                    title = article['title']
                    content = article['content'] or article['description']
                    date = parser.parse(date_str)
                    await create_news_article(pool, source, date, title, content)
            else:
                print(f"Failed to fetch news: {response.status}")

# CRUD Routes for NewsArticles
@app.route('/articles', methods=['POST'])
async def create_article():
    """Create a new news article."""
    data = request.json
    await create_news_article(
        pool,
        source=data['source'],
        date=parser.parse(data['date']),
        title=data['title'],
        content=data['content'],
        summary=data.get('summary'),
        sentiment=data.get('sentiment'),
        category=data.get('category'),
        cluster_id=data.get('cluster_id'),
        vector_embedding=data.get('vector_embedding')
    )
    return jsonify({'status': 'success'}), 201

@app.route('/articles', methods=['GET'])
async def read_all_articles():
    """Retrieve all news articles."""
    articles = await get_all_news_articles(pool)
    return jsonify(articles)

@app.route('/articles/<int:article_id>', methods=['GET'])
async def read_article(article_id):
    """Retrieve a specific news article."""
    article = await get_news_article(pool, article_id)
    if article:
        return jsonify(article)
    return jsonify({'error': 'Article not found'}), 404

@app.route('/articles/<int:article_id>', methods=['PUT'])
async def update_article(article_id):
    """Update a news article."""
    data = request.json
    await update_news_article(
        pool,
        article_id,
        source=data.get('source'),
        date=parser.parse(data['date']) if data.get('date') else None,
        title=data.get('title'),
        content=data.get('content'),
        summary=data.get('summary'),
        sentiment=data.get('sentiment'),
        category=data.get('category'),
        cluster_id=data.get('cluster_id'),
        vector_embedding=data.get('vector_embedding')
    )
    return jsonify({'status': 'success'})

@app.route('/articles/<int:article_id>', methods=['DELETE'])
async def delete_article(article_id):
    """Delete a news article."""
    await delete_news_article(pool, article_id)
    return jsonify({'status': 'success'})

# AI Simulation Route
@app.route('/articles/<int:article_id>/analyze', methods=['POST'])
async def analyze_article(article_id):
    """Simulate AI analysis (summary and sentiment)."""
    article = await get_news_article(pool, article_id)
    if not article:
        return jsonify({'error': 'Article not found'}), 404
    content = article['content']
    summary = await compute_summary(content)
    sentiment = await compute_sentiment(content)
    await update_news_article(pool, article_id, summary=summary, sentiment=sentiment)
    return jsonify({'summary': summary, 'sentiment': sentiment})

# Startup function to initialize pool and fetch news
async def startup():
    global pool
    pool = await create_pool()
    api_key = os.getenv('NEWSAPI_KEY')
    if api_key:
        await fetch_news(api_key)
    else:
        print("NEWSAPI_KEY not set, skipping news fetch.")

if __name__ == '__main__':
    import uvicorn
    asyncio.run(startup())
    uvicorn.run(app, host='0.0.0.0', port=8000)