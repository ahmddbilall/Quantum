"""
Base scraper class and utilities for news scraping.
"""
import asyncio
import aiohttp
import logging
from typing import Dict, List, Optional, Any, Set
from abc import ABC, abstractmethod
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
import re
from datetime import datetime, timezone
import hashlib
import time
from dataclasses import dataclass

from .config import SCRAPING_CONFIG
from .database import db_manager

logger = logging.getLogger(__name__)

@dataclass
class ArticleData:
    """Data class for article information."""
    title: str
    url: str
    content: str
    published_date: Optional[datetime] = None
    summary: Optional[str] = None
    main_image_url: Optional[str] = None
    author: Optional[str] = None
    category: Optional[str] = None
    tags: List[str] = None
    metadata: Dict[str, Any] = None

    def __post_init__(self):
        if self.tags is None:
            self.tags = []
        if self.metadata is None:
            self.metadata = {}

class BaseScraper(ABC):
    """Base class for all news scrapers."""
    
    def __init__(self, source_name: str, source_config: Dict[str, Any]):
        self.source_name = source_name
        self.source_config = source_config
        self.session = None
        self.source_id = None
        self.scraped_count = 0
        self.failed_count = 0
        self.existing_urls = set()
        
        # Rate limiting
        self.last_request_time = 0
        self.min_delay = SCRAPING_CONFIG['delay_between_requests']
        
    async def initialize(self):
        """Initialize the scraper."""
        # Create HTTP session
        timeout = aiohttp.ClientTimeout(total=SCRAPING_CONFIG['timeout'])
        connector = aiohttp.TCPConnector(limit=SCRAPING_CONFIG['concurrent_requests'])
        
        headers = {
            'User-Agent': SCRAPING_CONFIG['user_agent'],
            **self.source_config.get('headers', {})
        }
        
        self.session = aiohttp.ClientSession(
            timeout=timeout,
            connector=connector,
            headers=headers
        )
        
        # Get source ID from database
        self.source_id = await db_manager.get_source_id(self.source_name)
        if not self.source_id:
            logger.error(f"Source ID not found for {self.source_name}")
            raise ValueError(f"Source ID not found for {self.source_name}")
        
        # Load existing URLs to avoid duplicates
        self.existing_urls = await db_manager.get_existing_urls(self.source_id)
        logger.info(f"Initialized {self.source_name} scraper with {len(self.existing_urls)} existing URLs")
    
    async def cleanup(self):
        """Cleanup resources."""
        if self.session:
            await self.session.close()
    
    async def __aenter__(self):
        await self.initialize()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.cleanup()
    
    async def rate_limit(self):
        """Implement rate limiting between requests."""
        current_time = time.time()
        time_since_last = current_time - self.last_request_time
        
        if time_since_last < self.min_delay:
            sleep_time = self.min_delay - time_since_last
            await asyncio.sleep(sleep_time)
        
        self.last_request_time = time.time()
    
    async def fetch_url(self, url: str, retries: int = None) -> Optional[str]:
        """Fetch URL content with retries and error handling."""
        if retries is None:
            retries = SCRAPING_CONFIG['max_retries']
        
        for attempt in range(retries + 1):
            try:
                await self.rate_limit()
                
                async with self.session.get(url) as response:
                    if response.status == 200:
                        content = await response.text()
                        logger.debug(f"Successfully fetched {url}")
                        return content
                    else:
                        logger.warning(f"HTTP {response.status} for {url}")
                        
            except asyncio.TimeoutError:
                logger.warning(f"Timeout fetching {url} (attempt {attempt + 1})")
            except Exception as e:
                logger.warning(f"Error fetching {url} (attempt {attempt + 1}): {e}")
            
            if attempt < retries:
                # Exponential backoff
                wait_time = (2 ** attempt) * self.min_delay
                await asyncio.sleep(min(wait_time, 30))  # Max 30 seconds
        
        logger.error(f"Failed to fetch {url} after {retries + 1} attempts")
        return None
    
    def extract_image_url(self, soup: BeautifulSoup, base_url: str) -> Optional[str]:
        """Extract main image URL from article."""
        # Try different selectors for main image
        selectors = [
            'meta[property="og:image"]',
            'meta[name="twitter:image"]',
            'img.main-image',
            'img.hero-image',
            'img.featured-image',
            'article img',
            'img'
        ]
        
        for selector in selectors:
            img = soup.select_one(selector)
            if img:
                src = img.get('content') or img.get('src')
                if src:
                    return urljoin(base_url, src)
        
        return None
    
    def extract_author(self, soup: BeautifulSoup) -> Optional[str]:
        """Extract author from article."""
        selectors = [
            'meta[name="author"]',
            'meta[property="article:author"]',
            '.author',
            '.byline',
            '[rel="author"]'
        ]
        
        for selector in selectors:
            element = soup.select_one(selector)
            if element:
                return element.get('content') or element.get_text(strip=True)
        
        return None
    
    def extract_category(self, soup: BeautifulSoup, url: str) -> Optional[str]:
        """Extract category from article."""
        # Try meta tags first
        category_meta = soup.select_one('meta[property="article:section"]')
        if category_meta:
            return category_meta.get('content')
        
        # Try to extract from URL path
        path_parts = urlparse(url).path.split('/')
        if len(path_parts) > 1:
            for part in path_parts[1:]:
                if part and not part.isdigit() and len(part) > 2:
                    return part.replace('-', ' ').title()
        
        return None
    
    def parse_date(self, date_str: str) -> Optional[datetime]:
        """Parse date string to datetime object."""
        if not date_str:
            return None
        
        # Common date formats
        formats = [
            '%Y-%m-%dT%H:%M:%S%z',
            '%Y-%m-%dT%H:%M:%SZ',
            '%Y-%m-%d %H:%M:%S',
            '%Y-%m-%d',
            '%d %B %Y',
            '%B %d, %Y',
            '%d/%m/%Y',
            '%m/%d/%Y'
        ]
        
        for fmt in formats:
            try:
                dt = datetime.strptime(date_str.strip(), fmt)
                if dt.tzinfo is None:
                    dt = dt.replace(tzinfo=timezone.utc)
                return dt
            except ValueError:
                continue
        
        logger.warning(f"Could not parse date: {date_str}")
        return None
    
    def clean_text(self, text: str) -> str:
        """Clean and normalize text content."""
        if not text:
            return ""
        
        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text)
        
        # Remove common footer/header content
        patterns_to_remove = [
            r'Related Topics.*',
            r'More on this story.*',
            r'Subscribe to.*',
            r'Follow us on.*',
            r'Copyright.*',
            r'All rights reserved.*'
        ]
        
        for pattern in patterns_to_remove:
            text = re.sub(pattern, '', text, flags=re.IGNORECASE)
        
        return text.strip()
    
    def generate_summary(self, content: str, max_length: int = 200) -> str:
        """Generate a summary from content."""
        if not content:
            return ""
        
        # Split into sentences
        sentences = re.split(r'[.!?]+', content)
        
        summary = ""
        for sentence in sentences:
            sentence = sentence.strip()
            if not sentence:
                continue
            
            if len(summary) + len(sentence) > max_length:
                break
            
            summary += sentence + ". "
        
        return summary.strip()
    
    def extract_tags(self, soup: BeautifulSoup, content: str) -> List[str]:
        """Extract tags/keywords from article."""
        tags = set()
        
        # Try meta keywords
        keywords_meta = soup.select_one('meta[name="keywords"]')
        if keywords_meta:
            keywords = keywords_meta.get('content', '')
            tags.update([tag.strip() for tag in keywords.split(',') if tag.strip()])
        
        # Try article tags
        tag_elements = soup.select('.tags a, .keywords a, [rel="tag"]')
        for element in tag_elements:
            tag = element.get_text(strip=True)
            if tag:
                tags.add(tag)
        
        return list(tags)[:10]  # Limit to 10 tags
    
    async def scrape_article(self, url: str) -> Optional[ArticleData]:
        """Scrape a single article. Must be implemented by subclasses."""
        try:
            content = await self.fetch_url(url)
            if not content:
                return None
            
            soup = BeautifulSoup(content, 'html.parser')
            article_data = await self.parse_article(soup, url)
            
            if article_data and self.validate_article(article_data):
                return article_data
            
        except Exception as e:
            logger.error(f"Error scraping article {url}: {e}")
            self.failed_count += 1
        
        return None
    
    @abstractmethod
    async def parse_article(self, soup: BeautifulSoup, url: str) -> Optional[ArticleData]:
        """Parse article content from soup. Must be implemented by subclasses."""
        pass
    
    @abstractmethod
    async def get_article_links(self, base_url: str) -> List[str]:
        """Get article links from a page. Must be implemented by subclasses."""
        pass
    
    def validate_article(self, article: ArticleData) -> bool:
        """Validate article data."""
        if not article.title or not article.content or not article.url:
            return False
        
        if len(article.content) < 100:  # Minimum content length
            return False
        
        return True
    
    async def save_article(self, article: ArticleData) -> bool:
        """Save article to database."""
        try:
            article_data = {
                'source_id': self.source_id,
                'title': article.title,
                'url': article.url,
                'published_date': article.published_date,
                'content': article.content,
                'summary': article.summary or self.generate_summary(article.content),
                'main_image_url': article.main_image_url,
                'author': article.author,
                'category': article.category,
                'tags': article.tags,
                'metadata': article.metadata
            }
            
            article_id = await db_manager.insert_article(article_data)
            if article_id:
                self.scraped_count += 1
                logger.info(f"Saved article: {article.title}")
                return True
            
        except Exception as e:
            logger.error(f"Error saving article {article.url}: {e}")
            self.failed_count += 1
        
        return False
    
    async def scrape_all(self) -> Dict[str, int]:
        """Main scraping method."""
        logger.info(f"Starting scraping for {self.source_name}")
        
        try:
            await db_manager.log_scraping_activity(
                self.source_id, 'started', f"Started scraping {self.source_name}"
            )
            
            # Get article links
            all_links = await self.get_all_article_links()
            logger.info(f"Found {len(all_links)} article links for {self.source_name}")
            
            # Filter out existing URLs
            new_links = [link for link in all_links if link not in self.existing_urls]
            logger.info(f"Found {len(new_links)} new articles to scrape")
            
            # Limit articles per session
            max_articles = SCRAPING_CONFIG['max_articles_per_source']
            if len(new_links) > max_articles:
                new_links = new_links[:max_articles]
                logger.info(f"Limited to {max_articles} articles for this session")
            
            # Scrape articles
            tasks = []
            for link in new_links:
                task = self.scrape_and_save_article(link)
                tasks.append(task)
            
            await asyncio.gather(*tasks, return_exceptions=True)
            
            # Log completion
            await db_manager.log_scraping_activity(
                self.source_id, 'success', 
                f"Completed scraping {self.source_name}",
                self.scraped_count, self.failed_count
            )
            
            logger.info(f"Scraping completed for {self.source_name}: "
                       f"{self.scraped_count} scraped, {self.failed_count} failed")
            
            return {
                'scraped': self.scraped_count,
                'failed': self.failed_count,
                'total_links': len(all_links),
                'new_links': len(new_links)
            }
            
        except Exception as e:
            logger.error(f"Error during scraping {self.source_name}: {e}")
            await db_manager.log_scraping_activity(
                self.source_id, 'error', 
                f"Error scraping {self.source_name}: {str(e)}",
                self.scraped_count, self.failed_count,
                {'error': str(e), 'type': type(e).__name__}
            )
            return {
                'scraped': self.scraped_count,
                'failed': self.failed_count,
                'error': str(e)
            }
    
    async def scrape_and_save_article(self, url: str):
        """Scrape and save a single article."""
        try:
            article = await self.scrape_article(url)
            if article:
                await self.save_article(article)
        except Exception as e:
            logger.error(f"Error scraping and saving {url}: {e}")
            self.failed_count += 1
    
    async def get_all_article_links(self) -> List[str]:
        """Get all article links from all base URLs."""
        all_links = set()
        
        base_urls = self.source_config.get('base_urls', [])
        for base_url in base_urls:
            try:
                links = await self.get_article_links(base_url)
                all_links.update(links)
                logger.debug(f"Found {len(links)} links from {base_url}")
            except Exception as e:
                logger.error(f"Error getting links from {base_url}: {e}")
        
        return list(all_links)
