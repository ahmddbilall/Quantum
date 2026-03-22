import asyncio
import re
from typing import Optional
from bs4 import BeautifulSoup
from newspaper import Article as NewspaperArticle

class CleaningService:
    """Intelligence layer to parse, clean, and validate scraped article text."""

    COPYRIGHT_REGEX = re.compile(r"Copyright\s+©?\s*\d{4}.*reserved", re.IGNORECASE)

    @classmethod
    async def clean_article_html(cls, html: str, url: str) -> Optional[str]:
        """
        Extract primary text from HTML, convert it into standard paragraphs,
        and run quality checks. Returns None if the article is invalid/stubs.
        """
        if not html:
            return None

        # 1. Newspaper3k extraction via thread pool
        article = NewspaperArticle(url)
        def parse_html():
            article.set_html(html)
            article.parse()
        await asyncio.to_thread(parse_html)

        text = article.text

        # 2. Extract and sanitize
        return cls.process_extracted_text(text)

    @classmethod
    def process_extracted_text(cls, text: str) -> Optional[str]:
        """Process the extracted text: chunking, HTML-stripping, validating."""
        if not text or len(text.strip()) < 200:
            return None  # Too short to be a meaningful article

        # If the entire text looks like a generic copyright stub
        if cls.COPYRIGHT_REGEX.search(text) and len(text.strip()) < 500:
            return None

        # Extreme fallback: scrub any stray HTML tags left by newspaper3k
        if "<" in text and ">" in text:
            soup = BeautifulSoup(text, "html.parser")
            text = soup.get_text(separator="\n\n")

        # 3. Create discrete, delimited paragraphs
        # newspaper3k commonly provides \n\n, but we normalize any whitespace structures
        paragraphs = [p.strip() for p in text.split('\n') if p.strip()]

        # Re-join with double newlines so frontend `toHtml` or similar can render correctly
        clean_text = "\n\n".join(paragraphs)

        # 4. Final validation
        if len(clean_text) < 300: # We want substantial articles, not stubs
            return None

        return clean_text

cleaning_service = CleaningService()
