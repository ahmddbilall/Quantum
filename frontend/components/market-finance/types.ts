// Market Finance Types
export interface MarketItem {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

export interface MarketWidgetProps {
  data: MarketItem[];
  title: string;
  icon: React.ComponentType<any>;
  isPriceInDollars?: boolean;
  isConnected?: boolean;
  error?: string | null;
  isLoading?: boolean;
}

export interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  category: string;
  source: string;
  publishedAt: string;
  views: number;
  image: string;
  tags: string[];
  sentiment?: "positive" | "negative" | "neutral";
}

export interface SearchHookReturn {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchResults: MarketItem[];
  isSearching: boolean;
  searchError: string | null;
}

export interface MarketDataHookReturn {
  data: MarketItem[];
  isConnected: boolean;
  error: string | null;
  isLoading: boolean;
  lastUpdated: Date | null;
}
