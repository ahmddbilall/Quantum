"""
Specific scrapers for different news sources.
"""
import re
from typing import List, Optional
from bs4 import BeautifulSoup
from urllib.parse import urljoin
import feedparser
from newspaper import Article, Config
import logging

from .base_scraper import BaseScraper, ArticleData

logger = logging.getLogger(__name__)

class AlJazeeraScraper(BaseScraper):
    """Scraper for Al Jazeera news."""
    
    async def get_article_links(self, base_url: str) -> List[str]:
        """Get article links from Al Jazeera section page."""
        content = await self.fetch_url(base_url)
        if not content:
            return []
        
        soup = BeautifulSoup(content, 'html.parser')
        links = set()
        
        for a in soup.find_all('a', href=True):
            href = a['href']
            full_url = urljoin('https://www.aljazeera.com', href)
            
            # Match URLs with /YYYY/ pattern and /news/
            if re.search(r'/\d{4}/', full_url) and '/news/' in full_url:
                links.add(full_url)
        
        return sorted(links)
    
    async def parse_article(self, soup: BeautifulSoup, url: str) -> Optional[ArticleData]:
        """Parse Al Jazeera article."""
        # Title
        title_tag = soup.find('h1')
        title = title_tag.get_text(strip=True) if title_tag else ""
        
        if not title:
            return None
        
        # Content
        content_div = soup.find('div', class_='wysiwyg wysiwyg--all-content')
        if not content_div:
            return None
        
        content_parts = []
        for tag in content_div.find_all(['p', 'li']):
            text = tag.get_text(strip=True)
            if text:
                content_parts.append(text)
        
        content = self.clean_text('\n'.join(content_parts))
        if not content:
            return None
        
        # Published date
        published_date = None
        date_div = soup.find('div', class_='date-simple')
        if date_div:
            spans = date_div.find_all('span')
            if len(spans) > 1:
                date_str = spans[1].get_text(strip=True)
                published_date = self.parse_date(date_str)
        
        if not published_date:
            time_tag = soup.find('time')
            if time_tag:
                date_str = time_tag.get('datetime')
                published_date = self.parse_date(date_str)
        
        # Extract other metadata
        main_image_url = self.extract_image_url(soup, url)
        author = self.extract_author(soup)
        category = self.extract_category(soup, url)
        tags = self.extract_tags(soup, content)
        
        return ArticleData(
            title=title,
            url=url,
            content=content,
            published_date=published_date,
            main_image_url=main_image_url,
            author=author,
            category=category,
            tags=tags,
            metadata={'source_type': 'web_scraping'}
        )

class BBCScraper(BaseScraper):
    """Scraper for BBC news."""
    
    async def get_article_links(self, base_url: str) -> List[str]:
        """Get article links from BBC section page."""
        content = await self.fetch_url(base_url)
        if not content:
            return []
        
        soup = BeautifulSoup(content, 'html.parser')
        links = set()
        
        for a in soup.find_all('a', href=True):
            href = a['href']
            
            # Keep only proper article URLs
            if href.startswith('/news/articles/'):
                full_url = urljoin('https://www.bbc.com', href)
                links.add(full_url)
        
        return sorted(links)
    
    async def parse_article(self, soup: BeautifulSoup, url: str) -> Optional[ArticleData]:
        """Parse BBC article."""
        # Title
        title_tag = soup.find('h1')
        title = title_tag.get_text(strip=True) if title_tag else ""
        
        if not title:
            return None
        
        # Content
        article_tag = soup.find('article')
        if not article_tag:
            return None
        
        content_parts = []
        for elem in article_tag.find_all(['p', 'li'], recursive=True):
            text = elem.get_text(strip=True)
            if not text:
                continue
            
            # Stop at related content
            if text.lower().startswith(('related topics', 'more on this story')):
                break
            
            content_parts.append(text)
        
        content = self.clean_text('\n'.join(content_parts))
        if not content:
            return None
        
        # Published date
        published_date = None
        time_tag = soup.find('time')
        if time_tag:
            date_str = time_tag.get('datetime')
            published_date = self.parse_date(date_str)
        
        # Extract other metadata
        main_image_url = self.extract_image_url(soup, url)
        author = self.extract_author(soup)
        category = self.extract_category(soup, url)
        tags = self.extract_tags(soup, content)
        
        return ArticleData(
            title=title,
            url=url,
            content=content,
            published_date=published_date,
            main_image_url=main_image_url,
            author=author,
            category=category,
            tags=tags,
            metadata={'source_type': 'web_scraping'}
        )

class GuardianScraper(BaseScraper):
    """Scraper for The Guardian news."""
    
    async def get_article_links(self, base_url: str) -> List[str]:
        """Get article links from Guardian section page."""
        content = await self.fetch_url(base_url)
        if not content:
            return []
        
        soup = BeautifulSoup(content, 'html.parser')
        links = set()
        year_pattern = re.compile(r'/\d{4}/')
        
        for a in soup.find_all('a', href=True):
            href = a['href']
            
            if year_pattern.search(href):
                full_url = urljoin('https://www.theguardian.com', href)
                if '/news/' in full_url:
                    links.add(full_url)
        
        return sorted(links)
    
    async def parse_article(self, soup: BeautifulSoup, url: str) -> Optional[ArticleData]:
        """Parse Guardian article."""
        # Title
        title_tag = soup.find('h1')
        title = title_tag.get_text(strip=True) if title_tag else ""
        
        if not title:
            return None
        
        # Content
        main_div = soup.find('div', id='maincontent')
        if not main_div:
            return None
        
        content_parts = []
        for elem in main_div.find_all(['p', 'li'], recursive=True):
            text = elem.get_text(strip=True)
            if text:
                content_parts.append(text)
        
        content = self.clean_text('\n'.join(content_parts))
        if not content:
            return None
        
        # Published date
        published_date = None
        time_tag = soup.find('time')
        if time_tag:
            date_str = time_tag.get('datetime')
            published_date = self.parse_date(date_str)
        
        # Extract other metadata
        main_image_url = self.extract_image_url(soup, url)
        author = self.extract_author(soup)
        category = self.extract_category(soup, url)
        tags = self.extract_tags(soup, content)
        
        return ArticleData(
            title=title,
            url=url,
            content=content,
            published_date=published_date,
            main_image_url=main_image_url,
            author=author,
            category=category,
            tags=tags,
            metadata={'source_type': 'web_scraping'}
        )

class CryptoScraper(BaseScraper):
    """Scraper for crypto news using RSS feeds."""
    
    def __init__(self, source_name: str, source_config: dict):
        super().__init__(source_name, source_config)
        # Configure newspaper for crypto news
        self.newspaper_config = Config()
        self.newspaper_config.browser_user_agent = (
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) '
            'AppleWebKit/537.36 (KHTML, like Gecko) '
            'Chrome/117.0.0.0 Safari/537.36'
        )
        self.newspaper_config.request_timeout = 10
    
    async def get_article_links(self, rss_url: str) -> List[str]:
        """Get article links from RSS feed."""
        try:
            # Note: feedparser is synchronous, consider using aiohttp for RSS in production
            feed = feedparser.parse(rss_url)
            
            if not feed.entries:
                logger.warning(f"No entries found in RSS feed: {rss_url}")
                return []
            
            links = []
            for entry in feed.entries:
                if hasattr(entry, 'link') and entry.link:
                    links.append(entry.link)
            
            return links
            
        except Exception as e:
            logger.error(f"Error parsing RSS feed {rss_url}: {e}")
            return []
    
    async def get_all_article_links(self) -> List[str]:
        """Get all article links from RSS feeds."""
        all_links = set()
        
        rss_feeds = self.source_config.get('rss_feeds', [])
        for rss_url in rss_feeds:
            try:
                links = await self.get_article_links(rss_url)
                all_links.update(links)
                logger.debug(f"Found {len(links)} links from RSS {rss_url}")
            except Exception as e:
                logger.error(f"Error getting links from RSS {rss_url}: {e}")
        
        return list(all_links)
    
    async def parse_article(self, soup: BeautifulSoup, url: str) -> Optional[ArticleData]:
        """Parse crypto article using newspaper3k."""
        try:
            # Use newspaper3k for better content extraction
            article = Article(url, config=self.newspaper_config)
            article.download()
            article.parse()
            
            if not article.text or not article.title:
                return None
            
            content = self.clean_text(article.text)
            if len(content) < 100:
                return None
            
            # Published date
            published_date = None
            if article.publish_date:
                published_date = article.publish_date
            
            # Extract metadata
            main_image_url = article.top_image if article.top_image else None
            authors = article.authors
            author = authors[0] if authors else None
            
            # Category from URL or meta
            category = self.extract_category(soup, url)
            if not category and 'crypto' in url.lower():
                category = 'Cryptocurrency'
            
            # Tags
            tags = list(article.keywords) if article.keywords else []
            tags.extend(self.extract_tags(soup, content))
            tags = list(set(tags))[:10]  # Remove duplicates and limit
            
            return ArticleData(
                title=article.title,
                url=url,
                content=content,
                published_date=published_date,
                summary=article.summary if article.summary else None,
                main_image_url=main_image_url,
                author=author,
                category=category,
                tags=tags,
                metadata={
                    'source_type': 'rss',
                    'newspaper_meta': {
                        'meta_description': article.meta_description,
                        'meta_keywords': article.meta_keywords,
                        'canonical_link': article.canonical_link
                    }
                }
            )
            
        except Exception as e:
            logger.error(f"Error parsing crypto article {url}: {e}")
            return None
    
    async def scrape_article(self, url: str) -> Optional[ArticleData]:
        """Override scrape_article for crypto news (RSS-based)."""
        try:
            # For RSS-based scraping, we don't need to fetch the page first
            # newspaper3k will handle the download
            article_data = await self.parse_article(None, url)
            
            if article_data and self.validate_article(article_data):
                return article_data
                
        except Exception as e:
            logger.error(f"Error scraping crypto article {url}: {e}")
            self.failed_count += 1
        
        return None

# Scraper factory
SCRAPER_CLASSES = {
    'aljazeera': AlJazeeraScraper,
    'bbc': BBCScraper,
    'guardian': GuardianScraper,
    'crypto': CryptoScraper
}

def create_scraper(source_name: str, source_config: dict) -> BaseScraper:
    """Create a scraper instance for the given source."""
    scraper_class = SCRAPER_CLASSES.get(source_name)
    if not scraper_class:
        raise ValueError(f"No scraper found for source: {source_name}")
    
    return scraper_class(source_name, source_config)
