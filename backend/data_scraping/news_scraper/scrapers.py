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
from datetime import timezone

from .base_scraper import BaseScraper, ArticleData
from .database import db_manager

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
        category = self.extract_category(soup, url, title=title)
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
        category = self.extract_category(soup, url, title=title)
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
        category = self.extract_category(soup, url, title=title)
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
        # RSS feeds will be loaded from database during initialization
        self.RSS_FEEDS = []
        self.rss_news_items = {}  # Store RSS metadata for articles
    
    async def initialize(self):
        """Initialize the scraper and load RSS feeds from database."""
        await super().initialize()
        
        # Load RSS feed URLs from database for crypto sources
        self.RSS_FEEDS = await self.get_crypto_rss_feeds()
        logger.info(f"Loaded {len(self.RSS_FEEDS)} RSS feeds for crypto scraping")
    
    async def get_crypto_rss_feeds(self) -> List[str]:
        """Get crypto RSS feed URLs from database."""
        try:
            async with db_manager.get_connection() as conn:
                rows = await conn.fetch("""
                    SELECT base_url FROM news_sources 
                    WHERE name IN ('newsbtc', 'cryptoslate', 'ambcrypto', 'blockonomi', 'decrypt', 'cnbc_crypto')
                    AND is_active = TRUE
                """)
                return [row['base_url'] for row in rows]
        except Exception as e:
            logger.error(f"Failed to load RSS feeds from database: {e}")
            # Fallback to hardcoded feeds
            return [
                "https://www.newsbtc.com/feed/",
                "https://cryptoslate.com/feed/",
                "https://ambcrypto.com/feed/",
                "https://blockonomi.com/feed/",
                "https://decrypt.co/feed",
                "https://www.cnbc.com/id/100003114/device/rss/rss.html",
            ]
    
    async def get_rss_source_mapping(self) -> dict:
        """Get mapping of RSS feed URLs to their source IDs."""
        try:
            async with db_manager.get_connection() as conn:
                rows = await conn.fetch("""
                    SELECT id, base_url FROM news_sources 
                    WHERE name IN ('newsbtc', 'cryptoslate', 'ambcrypto', 'blockonomi', 'decrypt', 'cnbc_crypto')
                    AND is_active = TRUE
                """)
                return {row['base_url']: row['id'] for row in rows}
        except Exception as e:
            logger.error(f"Failed to load RSS source mapping from database: {e}")
            return {}
    
    def fetch_full_article(self, url: str) -> str:
        """Fetch full article content using newspaper3k."""
        try:
            article = Article(url, config=self.newspaper_config)
            article.download()
            article.parse()
            return article.text.strip() if article.text else "No article text found."
        except Exception as e:
            logger.error(f"Error fetching article {url}: {e}")
            return f"Error fetching article: {e}"
    
    async def fetch_rss_news_with_metadata(self, existing_links: set) -> List[dict]:
        """Fetch RSS news items with metadata from all configured feeds."""
        news_items = []
        
        # Get source mapping for RSS feeds
        source_mapping = await self.get_rss_source_mapping()
        
        for feed_url in self.RSS_FEEDS:
            try:
                logger.info(f"Fetching articles from RSS feed: {feed_url}")
                feed = feedparser.parse(feed_url)
                
                if not feed.entries:
                    logger.warning(f"No entries found in RSS feed: {feed_url}")
                    continue
                
                source_title = feed.feed.get("title", "Unknown Source")
                logger.info(f"Processing feed: {source_title} ({len(feed.entries)} entries)")
                
                # Get the source ID for this RSS feed
                source_id = source_mapping.get(feed_url)
                if not source_id:
                    logger.warning(f"No source ID found for RSS feed: {feed_url}")
                    continue
                
                processed_count = 0
                for entry in feed.entries:
                    # Skip if already exists
                    if entry.link in existing_links:
                        logger.debug(f"Skipping (already saved): {entry.link}")
                        continue
                    
                    # Extract metadata from RSS entry
                    news_item = {
                        "source_id": source_id,  # Add source_id for database consistency
                        "rss_url": feed_url,
                        "source": source_title,
                        "title": entry.title,
                        "summary": entry.get("summary", ""),
                        "link": entry.link,
                        "published_date": self.parse_date(entry.get("published", "")),
                        "author": entry.get("author", ""),
                        "category": entry.get("category", ""),
                        "tags": [tag.term for tag in entry.get("tags", [])],
                        "metadata": {
                            "rss_entry_id": entry.get("id", ""),
                            "feed_title": source_title,
                            "feed_url": feed_url
                        }
                    }
                    
                    news_items.append(news_item)
                    processed_count += 1
                    
                    # Limit articles per feed to avoid overwhelming
                    if processed_count >= 10:
                        break
                
                logger.info(f"Added {processed_count} new articles from {source_title}")
                
            except Exception as e:
                logger.error(f"Error processing RSS feed {feed_url}: {e}")
                continue
        
        logger.info(f"Total RSS articles collected: {len(news_items)}")
        return news_items
    
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
        """Get all article links from RSS feeds with metadata processing."""
        # Get existing URLs to avoid duplicates
        existing_links = await db_manager.get_existing_urls(self.source_id)
        
        # Fetch RSS news items with metadata
        news_items = await self.fetch_rss_news_with_metadata(existing_links)
        
        # Extract just the links for compatibility with base class
        all_links = [item["link"] for item in news_items]
        
        # Store the news items for later use in scraping
        self.rss_news_items = {item["link"]: item for item in news_items}
        
        return all_links
    
    async def parse_article(self, soup: BeautifulSoup, url: str) -> Optional[ArticleData]:
        """Parse crypto article using RSS metadata and newspaper3k for content."""
        try:
            # Get RSS metadata if available
            rss_item = getattr(self, 'rss_news_items', {}).get(url, {})
            
            # Use newspaper3k for better content extraction
            article = Article(url, config=self.newspaper_config)
            article.download()
            article.parse()
            
            if not article.text or not article.title:
                logger.warning(f"No content extracted for {url}")
                return None
            
            content = self.clean_text(article.text)
            if len(content) < 100:
                logger.warning(f"Content too short for {url}: {len(content)} characters")
                return None
            
            # Use RSS title if newspaper title is empty or use the better one
            title = article.title or rss_item.get("title", "")
            if not title:
                logger.warning(f"No title found for {url}")
                return None
            
            # Published date - prefer RSS date, fallback to newspaper
            published_date = rss_item.get("published_date")
            if not published_date and article.publish_date:
                published_date = article.publish_date
                # Ensure newspaper3k date is timezone-aware
                if published_date and published_date.tzinfo is None:
                    published_date = published_date.replace(tzinfo=timezone.utc)
            
            # Extract metadata
            main_image_url = article.top_image if article.top_image else None
            
            # Author - prefer RSS, fallback to newspaper
            author = rss_item.get("author") or (article.authors[0] if article.authors else None)
            
            # Category normalization for crypto feeds.
            # Some feeds (notably ambcrypto/blockonomi) often publish generic "news".
            category = self.normalize_crypto_category(rss_item.get("category"), url)
            
            # Tags - combine RSS tags and newspaper keywords
            tags = rss_item.get("tags", [])
            if article.keywords:
                tags.extend(list(article.keywords))
            tags.extend(self.extract_tags_from_content(content))
            tags = list(set(tags))[:10]  # Remove duplicates and limit
            
            # Summary - prefer newspaper summary, fallback to RSS
            summary = article.summary if article.summary else rss_item.get("summary", "")
            
            # Enhanced metadata
            metadata = {
                'source_type': 'rss',
                'rss_source': rss_item.get("source", ""),
                'rss_url': rss_item.get("rss_url", ""),
                'newspaper_meta': {
                    'meta_description': article.meta_description,
                    'meta_keywords': article.meta_keywords,
                    'canonical_link': article.canonical_link
                }
            }
            metadata.update(rss_item.get("metadata", {}))
            
            return ArticleData(
                title=title,
                url=url,
                content=content,
                published_date=published_date,
                summary=summary,
                main_image_url=main_image_url,
                author=author,
                category=category,
                tags=tags,
                metadata=metadata
            )
            
        except Exception as e:
            logger.error(f"Error parsing crypto article {url}: {e}")
            return None

    def normalize_crypto_category(self, raw_category: Optional[str], url: str) -> str:
        """Normalize RSS category to avoid generic categories for crypto sources."""
        source_slug = (self.source_name or "").strip().lower()
        category = (raw_category or "").strip()
        lowered = category.lower()

        generic_categories = {
            "",
            "news",
            "latest",
            "latest news",
            "crypto news",
            "cryptocurrency news",
        }

        # AMBCrypto/Blockonomi frequently provide generic "news" in RSS categories.
        # Prefer URL-derived categories for these sources.
        if source_slug in {"ambcrypto", "blockonomi"} and lowered in generic_categories:
            return self.extract_category_from_url(url) or "Cryptocurrency"

        # Normalize patterns like "Bitcoin News" -> "Bitcoin"
        if lowered.endswith(" news") and len(lowered) > 5:
            category = category[:-5].strip()

        if category:
            return category

        return self.extract_category_from_url(url) or "Cryptocurrency"
        
    def extract_category_from_url(self, url: str) -> Optional[str]:
        """Extract category from URL path since we don't have soup."""
        try:
            from urllib.parse import urlparse
            path_parts = [part.strip().lower() for part in urlparse(url).path.split('/') if part.strip()]

            category_map = {
                'analysis': 'Analysis',
                'market': 'Market',
                'markets': 'Market',
                'trading': 'Trading',
                'defi': 'DeFi',
                'nft': 'NFT',
                'bitcoin': 'Bitcoin',
                'ethereum': 'Ethereum',
                'altcoin': 'Altcoin',
                'altcoins': 'Altcoin',
                'blockchain': 'Blockchain',
                'regulation': 'Regulation',
                'policy': 'Regulation',
            }

            # Skip generic URL segments and prefer domain-specific category tokens.
            ignore_tokens = {'news', 'category', 'tag'}

            if path_parts:
                for idx, part in enumerate(path_parts):
                    if part in ignore_tokens:
                        # If URL has /category/<name>/ pattern, inspect next token.
                        if part == 'category' and idx + 1 < len(path_parts):
                            next_part = path_parts[idx + 1]
                            if next_part in category_map:
                                return category_map[next_part]
                        continue

                    if part in category_map:
                        return category_map[part]

            return 'Cryptocurrency'
        except Exception:
            return 'Cryptocurrency'
    
    def extract_tags_from_content(self, content: str) -> List[str]:
        """Extract cryptocurrency-related tags from content."""
        crypto_terms = [
            'bitcoin', 'btc', 'ethereum', 'eth', 'cryptocurrency', 'crypto',
            'blockchain', 'defi', 'nft', 'trading', 'market', 'price',
            'analysis', 'bullish', 'bearish', 'altcoin', 'mining'
        ]
        
        tags = []
        content_lower = content.lower()
        
        for term in crypto_terms:
            if term in content_lower:
                tags.append(term.title())
        
        return tags[:5] 
    
    async def scrape_article(self, url: str) -> Optional[ArticleData]:
        """Override scrape_article for crypto news (RSS-based)."""
        try:
            # For RSS-based scraping, we don't need to fetch the page first
            # newspaper3k will handle the download, but we can pass None for soup
            # since we're using the RSS metadata
            article_data = await self.parse_article(None, url)
            
            if article_data and self.validate_article(article_data):
                return article_data
            else:
                self.failed_count += 1
                
        except Exception as e:
            logger.error(f"Error scraping crypto article {url}: {e}")
            self.failed_count += 1
        
        return None
    
    async def save_article(self, article: ArticleData) -> bool:
        """Save article to database with RSS-specific source ID."""
        try:
            # Get RSS metadata to find the correct source_id
            rss_item = getattr(self, 'rss_news_items', {}).get(article.url, {})
            source_id = rss_item.get('source_id', self.source_id)  # Fallback to default source_id
            
            article_data = {
                'source_id': source_id,
                'source': self.source_name,  # Always include source name to prevent "unknown"
                'title': article.title,
                'url': article.url,
                'published_date': article.published_date,
                'content': article.content,
                'summary': article.summary or BaseScraper.generate_summary(article.content),
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

                logger.info(
                    f"Saved article: {article.title} (source_id: {source_id}, action: {action})"
                )
                return action in {"inserted", "updated"}
            
        except Exception as e:
            logger.error(f"Error saving article {article.url}: {e}")
            self.failed_count += 1
        
        return False

# Scraper factory
SCRAPER_CLASSES = {
    'aljazeera': AlJazeeraScraper,
    'bbc': BBCScraper,
    'guardian': GuardianScraper,
    'crypto': CryptoScraper,
    # Individual RSS sources all use CryptoScraper
    'newsbtc': CryptoScraper,
    'cryptoslate': CryptoScraper,
    'ambcrypto': CryptoScraper,
    'blockonomi': CryptoScraper,
    'decrypt': CryptoScraper,
    'cnbc_crypto': CryptoScraper
}

def create_scraper(source_name: str, source_config: dict) -> BaseScraper:
    """Create a scraper instance for the given source."""
    scraper_class = SCRAPER_CLASSES.get(source_name)
    if not scraper_class:
        raise ValueError(f"No scraper found for source: {source_name}")
    
    return scraper_class(source_name, source_config)
