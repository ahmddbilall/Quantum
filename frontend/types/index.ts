export interface User {
  email: string;
  name: string;
  id?: string;
  created_at?: string;
  full_name?: string;
  is_active?: boolean;
  is_superuser?: boolean;
  profile?: Record<string, unknown>;
  preferences?: Record<string, unknown>;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  full_name?: string;
}

export interface BackendUserProfile {
  id: string;
  email: string;
  created_at?: string;
  full_name?: string;
  is_active?: boolean;
  is_superuser?: boolean;
  profile?: Record<string, unknown>;
  preferences?: Record<string, unknown>;
}

export interface NewsArticleSummary {
  id: string;
  title: string;
  summary?: string | null;
  url: string;
  source: string;
  category?: string | null;
  published_at?: string | null;
  image_url?: string | null;
  author?: string | null;
  language: string;
  views: number;
  sentiment_score?: number | null;
  sentiment_label?: string | null;
  tags: string[];
}

export interface NewsArticleDetail extends NewsArticleSummary {
  content?: string | null;
}

export interface NewsFeedResponse {
  items: NewsArticleSummary[];
  page: number;
  limit: number;
  total: number;
  has_more: boolean;
}

export interface BookmarkActionResponse {
  success: boolean;
  message: string;
  article_id: string;
}
