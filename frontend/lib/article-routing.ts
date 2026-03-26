const MARKET_NEWS_SOURCES = new Set([
  "newsbtc",
  "cryptoslate",
  "ambcrypto",
  "blockonomi",
  "decrypt",
  "cnbc_crypto",
]);

export function isMarketNewsSource(source?: string | null): boolean {
  const normalized = (source || "").trim().toLowerCase();
  return MARKET_NEWS_SOURCES.has(normalized);
}

export function getArticleDetailPathBySource(
  articleId?: string | null,
  source?: string | null,
): string | null {
  if (!articleId) {
    return null;
  }

  if (isMarketNewsSource(source)) {
    return `/market-finance/news/${articleId}`;
  }

  return `/news-feed/${articleId}`;
}
