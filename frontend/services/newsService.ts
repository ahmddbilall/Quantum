import api from "@/lib/api";
import { toApiClientError } from "@/lib/error-parser";
import {
  BookmarkActionResponse,
  NewsArticleDetail,
  NewsArticleSummary,
  NewsFeedResponse,
} from "@/types";

export interface GetNewsFeedParams {
  page?: number;
  limit?: number;
  category?: string;
  sources?: string[];
  searchQuery?: string;
  startDate?: string;
  endDate?: string;
}

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

  async getArticle(articleId: string): Promise<NewsArticleDetail> {
    try {
      const response = await api.get<NewsArticleDetail>(`/news/${articleId}`);
      return response.data;
    } catch (error) {
      throw toApiClientError(error, "Unable to load article.");
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
};
