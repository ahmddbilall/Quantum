"""
Base scraper class and utilities for news scraping.
"""
import asyncio
import aiohttp
import logging
import json
from typing import Dict, List, Optional, Any, Set
from abc import ABC, abstractmethod
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
import re
from datetime import datetime, timezone
import hashlib
import time
from dataclasses import dataclass
from collections import Counter
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

# Initialize with a source name and then start scraping
class BaseScraper(ABC):
    """Base class for all news scrapers."""
    
    def __init__(self, source_name: str, source_config: Dict[str, Any]):
        self.source_name = source_name
        self.source_config = source_config
        self.session = None
        self.source_id = None
        self.scraped_count = 0
        self.inserted_count = 0
        self.updated_count = 0
        self.failed_count = 0
        self.existing_urls = set()
        
        # Rate limiting
        self.last_request_time = 0
        self.min_delay = SCRAPING_CONFIG['delay_between_requests']

    # get existing urls of that source
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
    
    # 3 sec delay between requests
    async def rate_limit(self):
        """Implement rate limiting between requests."""
        current_time = time.time()
        time_since_last = current_time - self.last_request_time
        
        if time_since_last < self.min_delay:
            sleep_time = self.min_delay - time_since_last
            await asyncio.sleep(sleep_time)
        
        self.last_request_time = time.time()
    
    # A fetch request to given URL -- this function will use the rate limit and retries to fetch a url
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
    
    # try different kind of selectors to fetch the main URL image using BS4
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
    
    # try different kind of selectors to fetch the author name using BS4
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
    
    def extract_category(
        self,
        soup: BeautifulSoup,
        url: str,
        title: Optional[str] = None,
    ) -> Optional[str]:
        """Extract category from metadata/breadcrumbs/URL while filtering title-like values."""
        generic_categories = {
            "",
            "news",
            "latest",
            "latest news",
            "article",
            "articles",
            "story",
            "stories",
            "home",
        }

        def normalize_for_compare(value: Optional[str]) -> str:
            if not value:
                return ""
            return re.sub(r"[^a-z0-9]+", "", value.lower())

        title_fingerprint = normalize_for_compare(title)

        def normalize_category(value: Optional[str]) -> Optional[str]:
            if not value:
                return None
            cleaned = re.sub(r"\s+", " ", value.replace("-", " ").replace("_", " ")).strip(" |:-")
            if not cleaned:
                return None
            if len(cleaned) > 60:
                return None
            if cleaned.lower() in generic_categories:
                return None
            if title_fingerprint and normalize_for_compare(cleaned) == title_fingerprint:
                return None
            return cleaned

        def extract_jsonld_categories(payload: Any) -> List[str]:
            categories: List[str] = []
            if isinstance(payload, dict):
                for key in ("articleSection", "section", "genre"):
                    value = payload.get(key)
                    if isinstance(value, str):
                        categories.append(value)

                about = payload.get("about")
                if isinstance(about, dict):
                    name = about.get("name")
                    if isinstance(name, str):
                        categories.append(name)
                elif isinstance(about, list):
                    for item in about:
                        if isinstance(item, dict):
                            name = item.get("name")
                            if isinstance(name, str):
                                categories.append(name)

                graph = payload.get("@graph")
                if isinstance(graph, list):
                    for item in graph:
                        categories.extend(extract_jsonld_categories(item))

            elif isinstance(payload, list):
                for item in payload:
                    categories.extend(extract_jsonld_categories(item))

            return categories

        # 1) Meta tags from the page.
        for selector, attr in [
            ('meta[property="article:section"]', 'content'),
            ('meta[name="article:section"]', 'content'),
            ('meta[name="section"]', 'content'),
            ('meta[name="parsely-section"]', 'content'),
            ('meta[property="og:section"]', 'content'),
            ('meta[property="article:tag"]', 'content'),
            ('[itemprop="articleSection"]', None),
        ]:
            element = soup.select_one(selector)
            if not element:
                continue

            candidate = element.get(attr) if attr else element.get_text(strip=True)
            normalized = normalize_category(candidate)
            if normalized:
                return normalized

        # 2) JSON-LD structured data.
        for script in soup.select('script[type="application/ld+json"]'):
            json_text = script.string or script.get_text(strip=True)
            if not json_text:
                continue

            try:
                payload = json.loads(json_text)
            except (json.JSONDecodeError, TypeError):
                continue

            for candidate in extract_jsonld_categories(payload):
                normalized = normalize_category(candidate)
                if normalized:
                    return normalized

        # 3) Breadcrumb/topic links from page chrome.
        for selector in [
            'nav[aria-label*="breadcrumb" i] a',
            '[data-testid*="breadcrumb" i] a',
            '[class*="breadcrumb"] a',
            '[data-testid*="topic" i] a',
            '[data-component*="topic" i] a',
            'a[data-link-name*="article section" i]',
            'a[href*="/topic/"]',
        ]:
            for element in soup.select(selector):
                normalized = normalize_category(element.get_text(strip=True))
                if normalized:
                    return normalized

        # 4) URL fallback while skipping generic/date/id path segments.
        skip_tokens = {
            "news",
            "article",
            "articles",
            "latest",
            "story",
            "stories",
            "live",
            "amp",
            "tag",
            "tags",
            "category",
        }
        path_parts = [part.strip().lower() for part in urlparse(url).path.split('/') if part.strip()]
        candidate_parts = path_parts[:-1] if len(path_parts) > 1 else path_parts

        for part in candidate_parts:
            if part in skip_tokens:
                continue
            if part.isdigit() or re.fullmatch(r"\d{4}", part):
                continue
            if re.fullmatch(r"[a-z0-9]{12,}", part):
                continue

            slug_without_numeric_suffix = re.sub(r"-\d+$", "", part)
            normalized = normalize_category(slug_without_numeric_suffix)
            if normalized:
                return normalized

        # Only inspect the final path segment when it looks like a compact taxonomy token.
        if len(path_parts) > 1:
            final_part = re.sub(r"-\d+$", "", path_parts[-1])
            final_words = [word for word in final_part.split("-") if word]
            if (
                final_part
                and final_part not in skip_tokens
                and not re.fullmatch(r"[a-z0-9]{12,}", final_part)
                and not any(ch.isdigit() for ch in final_part)
                and len(final_words) <= 2
                and len(final_part) <= 24
            ):
                normalized = normalize_category(final_part)
                if normalized:
                    return normalized

        # Required fallback for web sources when no category is available.
        return "News"
    

    def parse_date(self, date_str: str) -> Optional[datetime]:
        """Parse date string to datetime object - ensures result is always timezone-aware."""
        if not date_str:
            return None
        
        # Clean up the date string
        date_str = date_str.strip()
        
        # Common date formats
        formats = [
            # --- RFC 2822 / RSS ---
            '%a, %d %b %Y %H:%M:%S %z',
            '%a, %d %b %Y %H:%M:%S GMT',
            '%a, %d %b %Y %H:%M:%S UTC',
            # --- ISO 8601 variations ---
            '%Y-%m-%dT%H:%M:%S%z',
            '%Y-%m-%dT%H:%M:%SZ',
            '%Y-%m-%dT%H:%M:%S.%fZ',
            '%Y-%m-%dT%H:%M:%S.%f%z',
            '%Y-%m-%dT%H:%M',
            '%Y-%m-%dT%H:%M:%S',
            '%Y-%m-%dT%H:%M:%S.%f',
            # --- Common formats ---
            '%Y-%m-%d %H:%M:%S',
            '%Y-%m-%d %H:%M',
            '%Y-%m-%d',
            '%d %B %Y',
            '%B %d, %Y',
            '%b %d, %Y',
            '%d %b %Y',
            # --- Slashes & Dashes ---
            '%d/%m/%Y',
            '%m/%d/%Y',
            '%d-%m-%Y',
            '%m-%d-%Y',
            '%d.%m.%Y',
            # --- With time ---
            '%d/%m/%Y %H:%M:%S',
            '%m/%d/%Y %H:%M:%S',
            '%d-%m-%Y %H:%M:%S',
            '%m-%d-%Y %H:%M:%S',
            # --- Logs / syslog / Apache ---
            '%d/%b/%Y:%H:%M:%S %z',   # 10/Oct/2000:13:55:36 -0700
            '%Y-%m-%d %H:%M:%S,%f',   # 2023-05-10 14:30:59,123
            '%Y-%m-%d %H:%M:%S.%f',   # 2023-05-10 14:30:59.123
            # --- Short & Human-like ---
            '%d %b %y',               # 01 Jan 23
            '%b %d %Y',               # Jan 01 2023
            '%a %b %d %H:%M:%S %Y',   # Tue Jan 01 13:45:30 2023
        ]
        
       
        for fmt in formats: 
            try: 
                # Handle GMT timezone specifically 
                if 'GMT' in date_str: 
                    date_str_clean = date_str.replace('GMT', '+0000') 
                    if fmt == '%a, %d %b %Y %H:%M:%S GMT': 
                        fmt = '%a, %d %b %Y %H:%M:%S %z' 
                    dt = datetime.strptime(date_str_clean, fmt) 
                else: 
                    dt = datetime.strptime(date_str, fmt) 
                
                # CRITICAL: Ensure ALL datetime objects are timezone-aware
                if dt.tzinfo is None: 
                    dt = dt.replace(tzinfo=timezone.utc)
                    
                return dt 
            except ValueError: 
                continue
        
        logger.warning(f"Could not parse date: {date_str}")
        return None
    
    # clean the test articles content 
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
    
    
    # keyword-based extractive summary
    @staticmethod
    def generate_summary(content: str, max_length: int = 200) -> str:
        """Generate a simple extractive summary from content."""
        if not content:
            return ""
        
        # Split into sentences
        sentences = re.split(r'(?<=[.!?]) +', content)
        if not sentences:
            return ""

        # Build a word frequency map (ignoring stopwords & short words)
        words = re.findall(r'\w+', content.lower())
        stopwords = {"the", "is", "a", "an", "in", "on", "at", "and", "or", "of", "to"}
        words = [w for w in words if w not in stopwords and len(w) > 2]
        freq = Counter(words)

        # Score each sentence by sum of word frequencies
        scored = [(sum(freq[w.lower()] for w in re.findall(r'\w+', s)), s) for s in sentences]

        # Sort by score (higher = more important), keep top sentences
        top_sentences = [s for _, s in sorted(scored, reverse=True)[:3]]

        # Join and truncate
        summary = " ".join(top_sentences)
        return summary[:max_length].strip()

    
       
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
                'source': self.source_name,  # Always include source name to prevent "unknown"
                'title': article.title,
                'url': article.url,
                'published_date': article.published_date,
                'content': article.content,
                'summary': None,
                'main_image_url': article.main_image_url,
                'author': article.author,
                'category': article.category,
                'tags': article.tags,
                'metadata': article.metadata
            }

            result = await db_manager.insert_article(article_data, return_action=True)
            if result and result.get("id"):
                action = result.get("action")
                if action == "inserted":
                    self.inserted_count += 1
                elif action == "updated":
                    self.updated_count += 1

                self.scraped_count = self.inserted_count + self.updated_count

                if action in {"inserted", "updated"}:
                    logger.info(f"Saved article: {article.title} ({action})")
                    return True

                logger.info(f"Skipped unchanged article: {article.title}")
                return False
            
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
                self.source_id,
                'success',
                f"Completed scraping {self.source_name}",
                articles_scraped=self.inserted_count,
                articles_failed=self.failed_count,
                articles_updated=self.updated_count,
            )
            
            logger.info(f"Scraping completed for {self.source_name}: "
                       f"{self.scraped_count} scraped, {self.failed_count} failed")
            
            return {
                'scraped': self.scraped_count,
                'inserted': self.inserted_count,
                'updated': self.updated_count,
                'failed': self.failed_count,
                'total_links': len(all_links),
                'new_links': len(new_links)
            }
            
        except Exception as e:
            logger.error(f"Error during scraping {self.source_name}: {e}")
            await db_manager.log_scraping_activity(
                self.source_id,
                'error',
                f"Error scraping {self.source_name}: {str(e)}",
                articles_scraped=self.inserted_count,
                articles_failed=self.failed_count,
                error_details={'error': str(e), 'type': type(e).__name__},
                articles_updated=self.updated_count,
            )
            return {
                'scraped': self.scraped_count,
                'inserted': self.inserted_count,
                'updated': self.updated_count,
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
