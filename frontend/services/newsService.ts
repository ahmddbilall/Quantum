import api from "@/lib/api";
import { toApiClientError } from "@/lib/error-parser";
import {
  BookmarkActionResponse,
  NewsArticleDetail,
  NewsArticleSummary,
  NewsFeedResponse,
  SummaryFeedbackPayload,
  SummaryFeedbackResponse,
} from "@/types";

export interface GetNewsFeedParams {
  page?: number;
  limit?: number;
  category?: string;
  sources?: string[];
  searchQuery?: string;
  startDate?: string;
  endDate?: string;
  feedContext?: string;
  excludeArticleIds?: string[];
}

export const newsQueryKeys = {
  feed: (params: GetNewsFeedParams = {}) => {
    return [
      "news-feed",
      "feed",
      params.category || "all",
      params.sources?.join(",") || "",
      params.searchQuery || "",
      params.startDate || "",
      params.endDate || "",
    ] as const;
  },
  search: (query: string) => ["search", "news", query] as const,
  marketNews: (params: GetNewsFeedParams = {}) => {
    return ["market-news", params.searchQuery || ""] as const;
  },
  newsFeedSources: ["news-feed", "sources"] as const,
  newsFeedCategories: ["news-feed", "categories"] as const,
  marketNewsSources: ["market-news", "sources"] as const,
  recommendations: (context: string) => ["recommendations", context] as const,
  bookmarks: ["bookmarks"] as const,
};

export const newsService = {
  async getFeed(params: GetNewsFeedParams = {}): Promise<NewsFeedResponse> {
    try {
      const queryParams: Record<string, string | number> = {
        page: params.page ?? 1,
        limit: params.limit ?? 20,
      };

      if (params.category && params.category.toLowerCase() !== "all") {
        queryParams.category = params.category;
      }

      if (params.sources && params.sources.length > 0) {
        queryParams.source = params.sources.join(",");
      }

      if (params.searchQuery?.trim()) {
        queryParams.q = params.searchQuery.trim();
      }

      if (params.startDate) {
        queryParams.start_date = params.startDate;
      }

      if (params.endDate) {
        queryParams.end_date = params.endDate;
      }

      const response = await api.get<NewsFeedResponse>("/news/feed", {
        params: queryParams,
      });

      return response.data;
    } catch (error) {
      throw toApiClientError(error, "Unable to load news feed.");
    }
  },

  async getNewsFeed(params: GetNewsFeedParams = {}): Promise<NewsFeedResponse> {
    try {
      const queryParams: Record<string, string | number> = {
        page: params.page ?? 1,
        limit: params.limit ?? 20,
      };

      if (params.category && params.category.toLowerCase() !== "all") {
        queryParams.category = params.category;
      }

      if (params.sources && params.sources.length > 0) {
        queryParams.source = params.sources.join(",");
      }

      if (params.searchQuery?.trim()) {
        queryParams.q = params.searchQuery.trim();
      }

      if (params.startDate) {
        queryParams.start_date = params.startDate;
      }

      if (params.endDate) {
        queryParams.end_date = params.endDate;
      }

      if (params.excludeArticleIds && params.excludeArticleIds.length > 0) {
        queryParams.exclude_article_ids = params.excludeArticleIds.join(",");
      }

      const response = await api.get<NewsFeedResponse>("/news/news-feed", {
        params: queryParams,
      });

      return response.data;
    } catch (error) {
      throw toApiClientError(error, "Unable to load news feed.");
    }
  },

  async getMarketNews(
    params: GetNewsFeedParams = {},
  ): Promise<NewsFeedResponse> {
    try {
      const queryParams: Record<string, string | number> = {
        page: params.page ?? 1,
        limit: params.limit ?? 20,
      };

      if (params.category && params.category.toLowerCase() !== "all") {
        queryParams.category = params.category;
      }

      if (params.sources && params.sources.length > 0) {
        queryParams.source = params.sources.join(",");
      }

      if (params.searchQuery?.trim()) {
        queryParams.q = params.searchQuery.trim();
      }

      if (params.startDate) {
        queryParams.start_date = params.startDate;
      }

      if (params.endDate) {
        queryParams.end_date = params.endDate;
      }

      if (params.excludeArticleIds && params.excludeArticleIds.length > 0) {
        queryParams.exclude_article_ids = params.excludeArticleIds.join(",");
      }

      const response = await api.get<NewsFeedResponse>("/news/market-news", {
        params: queryParams,
      });
      return response.data;
    } catch (error) {
      throw toApiClientError(error, "Unable to load market news.");
    }
  },

  async getArticle(articleId: string): Promise<NewsArticleDetail> {
    try {
      const response = await api.get<NewsArticleDetail>(
        `/news/article/${articleId}`,
      );
      return response.data;
    } catch (error) {
      throw toApiClientError(error, "Unable to load article.");
    }
  },

  async getCategories(): Promise<string[]> {
    try {
      const response = await api.get<string[]>("/news/categories");
      return response.data;
    } catch (error) {
      throw toApiClientError(error, "Unable to load categories.");
    }
  },

  async getSources(): Promise<string[]> {
    try {
      const response = await api.get<string[]>("/news/sources");
      return response.data;
    } catch (error) {
      throw toApiClientError(error, "Unable to load sources.");
    }
  },

  async getNewsFeedSources(): Promise<string[]> {
    try {
      const response = await api.get<string[]>("/news/news-feed/sources");
      return response.data;
    } catch (error) {
      throw toApiClientError(error, "Unable to load news feed sources.");
    }
  },

  async getNewsFeedCategories(): Promise<string[]> {
    try {
      const response = await api.get<string[]>("/news/news-feed/categories");
      return response.data;
    } catch (error) {
      throw toApiClientError(error, "Unable to load news feed categories.");
    }
  },

  async getMarketNewsSources(): Promise<string[]> {
    try {
      const response = await api.get<string[]>("/news/market-news/sources");
      return response.data;
    } catch (error) {
      throw toApiClientError(error, "Unable to load market news sources.");
    }
  },

  async getBookmarks(): Promise<NewsArticleSummary[]> {
    try {
      const response = await api.get<NewsArticleSummary[]>("/news/bookmarks");
      return response.data;
    } catch (error) {
      throw toApiClientError(error, "Unable to load bookmarks.");
    }
  },

  async addBookmark(articleId: string): Promise<BookmarkActionResponse> {
    try {
      const response = await api.post<BookmarkActionResponse>(
        `/news/bookmark/${articleId}`,
      );
      return response.data;
    } catch (error) {
      throw toApiClientError(error, "Unable to add bookmark.");
    }
  },

  async removeBookmark(articleId: string): Promise<BookmarkActionResponse> {
    try {
      const response = await api.delete<BookmarkActionResponse>(
        `/news/bookmark/${articleId}`,
      );
      return response.data;
    } catch (error) {
      throw toApiClientError(error, "Unable to remove bookmark.");
    }
  },

  async submitSummaryFeedback(
    articleId: string,
    payload: SummaryFeedbackPayload,
  ): Promise<SummaryFeedbackResponse> {
    try {
      const response = await api.post<SummaryFeedbackResponse>(
        `/news/article/${articleId}/summary-feedback`,
        payload,
      );
      return response.data;
    } catch (error) {
      throw toApiClientError(error, "Unable to submit summary feedback.");
    }
  },

  async getRecommendations(
    params: GetNewsFeedParams & { excludeArticleId?: string } = {},
  ): Promise<NewsFeedResponse> {
    try {
      const queryParams: Record<string, string | number> = {
        page: params.page ?? 1,
        limit: params.limit ?? 20,
      };

      if (params.category && params.category.toLowerCase() !== "all") {
        queryParams.category = params.category;
      }

      if (params.sources && params.sources.length > 0) {
        queryParams.source = params.sources.join(",");
      }

      if (params.excludeArticleId) {
        queryParams.exclude_article_id = params.excludeArticleId;
      }

      if (params.excludeArticleIds && params.excludeArticleIds.length > 0) {
        queryParams.exclude_article_ids = params.excludeArticleIds.join(",");
      }

      if (params.feedContext) {
        queryParams.feed_context = params.feedContext;
      }

      const response = await api.get<NewsFeedResponse>(
        "/news/recommendations",
        { params: queryParams },
      );
      return response.data;
    } catch (error) {
      throw toApiClientError(error, "Unable to load recommendations.");
    }
  },

  async getRelatedArticles(
    articleId: string,
    limit: number = 6,
  ): Promise<NewsArticleSummary[]> {
    try {
      const response = await api.get<NewsArticleSummary[]>(
        `/news/article/${articleId}/related`,
        { params: { limit } },
      );
      return response.data;
    } catch (error) {
      throw toApiClientError(error, "Unable to load related articles.");
    }
  },

  async getFeaturedNews(limit: number = 10): Promise<NewsArticleSummary[]> {
    try {
      const response = await api.get<NewsArticleSummary[]>("/news/featured", {
        params: { limit },
      });
      return response.data;
    } catch (error) {
      throw toApiClientError(error, "Unable to load featured news.");
    }
  },
};
