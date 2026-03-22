"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  TrendingUp,
  Clock,
  ArrowUpRight,
  Newspaper,
  Loader2,
  Sparkles,
  User,
} from "lucide-react";
import { newsService } from "@/services/newsService";
import { NewsArticleSummary } from "@/types";
import { parseApiError } from "@/lib/error-parser";
import { useToast } from "@/hooks/use-toast";

const PAGE_LIMIT = 18;
const SEARCH_DEBOUNCE_MS = 400;
const MIN_SEARCH_QUERY_LENGTH = 3;

export function NewsTab() {
  const router = useRouter();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [articles, setArticles] = useState<NewsArticleSummary[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recommendedArticles, setRecommendedArticles] = useState<
    NewsArticleSummary[]
  >([]);
  const [isLoadingRecommended, setIsLoadingRecommended] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery.trim());
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timeout);
  }, [searchQuery]);

  useEffect(() => {
    const loadRecommendations = async () => {
      const token = localStorage.getItem("access_token");
      if (!token) return;

      setIsLoadingRecommended(true);
      try {
        const response = await newsService.getRecommendations({
          limit: 14,
          feedContext: "market",
        });
        setRecommendedArticles(response.items || []);
      } catch (err) {
        console.error("Failed to load recommendations", err);
      } finally {
        setIsLoadingRecommended(false);
      }
    };
    void loadRecommendations();
  }, []);

  const fetchArticles = async (targetPage: number, append: boolean) => {
    try {
      setError(null);
      if (append) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
      }

      const normalizedSearchQuery = debouncedSearchQuery.trim();
      const effectiveSearchQuery =
        normalizedSearchQuery.length >= MIN_SEARCH_QUERY_LENGTH
          ? normalizedSearchQuery
          : undefined;

      const response = await newsService.getMarketNews({
        page: targetPage,
        limit: PAGE_LIMIT,
        searchQuery: effectiveSearchQuery,
        excludeArticleIds: append ? articles.map((a) => a.id) : undefined,
      });

      setArticles((prev) =>
        append ? [...prev, ...response.items] : response.items,
      );
      setPage(targetPage);
      setHasMore(response.has_more);
    } catch (err) {
      const parsed = parseApiError(err, "Failed to load market news.");
      setError(parsed.message);
      toast({
        title: "Could not load news",
        description: parsed.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    void fetchArticles(1, false);
  }, [debouncedSearchQuery, toast]);

  const getSentimentStyle = (sentiment: string | undefined | null) => {
    const sentimentStr = (sentiment || "").toLowerCase();
    switch (sentimentStr) {
      case "positive":
        return {
          bgColor: "bg-white/5",
          borderColor: "border-white/20",
          textColor: "text-white",
          icon: "↑",
        };
      case "negative":
        return {
          bgColor: "bg-white/5",
          borderColor: "border-white/20",
          textColor: "text-white",
          icon: "↓",
        };
      case "neutral":
      default:
        return {
          bgColor: "bg-white/5",
          borderColor: "border-white/20",
          textColor: "text-white",
          icon: "→",
        };
    }
  };

  if (isLoading && articles.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {recommendedArticles.length > 0 && !searchQuery && (
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-6 text-purple-400">
            <Sparkles className="h-5 w-5" />
            <h2 className="text-xl font-bold text-white">
              Recommended for You
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {recommendedArticles.map((article) => (
              <Card
                key={`rec-${article.id}`}
                onClick={() =>
                  router.push(`/market-finance/news/${article.id}`)
                }
                className="group relative bg-purple-950/20 border border-purple-900/40 hover:border-purple-500/50 transition-all duration-300 cursor-pointer overflow-hidden flex flex-col sm:flex-row h-full rounded-xl"
              >
                {article.image_url && (
                  <div className="w-full sm:w-1/3 aspect-video sm:aspect-auto sm:h-full bg-gray-800 relative overflow-hidden shrink-0">
                    <img
                      src={article.image_url}
                      alt={article.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute top-3 left-3 flex gap-2 sm:hidden">
                      <Badge className="bg-purple-600/80 text-white border-0 hover:bg-purple-700 backdrop-blur-sm shadow-sm font-semibold tracking-wide">
                        FOR YOU
                      </Badge>
                    </div>
                  </div>
                )}
                <div className="flex-1 p-5 flex flex-col justify-between">
                  <div>
                    <div className="hidden sm:flex items-center gap-2 mb-3">
                      <Badge className="bg-purple-600/80 text-white border-0 hover:bg-purple-700 backdrop-blur-sm shadow-sm font-semibold tracking-wide">
                        FOR YOU
                      </Badge>
                      {article.category && (
                        <Badge className="bg-white/10 text-white border-0 hover:bg-white/20">
                          {article.category}
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-white text-lg font-bold group-hover:text-purple-300 transition-colors duration-300 line-clamp-2 leading-tight mb-2">
                      {article.title}
                    </CardTitle>
                    <p className="text-gray-400 text-sm line-clamp-2 leading-relaxed mb-4">
                      {article.summary}
                    </p>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-purple-900/30">
                    <span className="flex items-center gap-1 font-medium truncate max-w-[120px]">
                      <User className="h-3 w-3 shrink-0" />
                      <span className="truncate">{article.source}</span>
                    </span>
                    <span className="shrink-0 flex items-center gap-1 text-gray-400">
                      <Clock className="w-3 h-3" />
                      {article.published_at
                        ? new Date(article.published_at).toLocaleDateString(
                            undefined,
                            { month: "short", day: "numeric" },
                          )
                        : ""}
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Main Latest News */}
      {(recommendedArticles.length > 0 || searchQuery) && (
        <h2 className="text-xl font-bold mb-6 text-white border-b border-gray-800 pb-2">
          {searchQuery ? "Search Results" : "Latest Market News"}
        </h2>
      )}

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search finance news..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-transparent border-gray-700 text-white placeholder-gray-100 hover:border-white/50 transition-all duration-300"
          />
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {articles.length > 0 ? (
          articles.map((article) => (
            <Card
              key={article.id}
              onClick={() => router.push(`/market-finance/news/${article.id}`)}
              className="group relative bg-black border border-zinc-800 hover:border-purple-900 transition-all duration-300 cursor-pointer overflow-hidden h-full flex flex-col before:absolute before:inset-0 before:rounded-lg before:p-[2px] before:bg-gradient-to-r before:from-purple-500 before:via-gray-400 before:to-white before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300 before:-z-10 before:animate-gradient"
            >
              <CardHeader className="pb-3 flex-shrink-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className="bg-white/10 text-white border border-white/20 hover:bg-white/20">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        {article.category || "Market"}
                      </Badge>
                      <Badge
                        variant="outline"
                        className="border-zinc-700 text-zinc-400"
                      >
                        <Clock className="h-3 w-3 mr-1" />
                        {article.published_at
                          ? new Date(article.published_at).toLocaleDateString()
                          : "Unknown"}
                      </Badge>
                    </div>
                    <CardTitle className="text-white text-lg font-bold group-hover:text-white transition-colors duration-300 line-clamp-2 leading-tight">
                      {article.title}
                    </CardTitle>
                  </div>

                  <div className="flex-shrink-0">
                    <div
                      className={`px-3 py-1 rounded-full ${
                        getSentimentStyle(article.sentiment_label).bgColor
                      } border ${
                        getSentimentStyle(article.sentiment_label).borderColor
                      } ${
                        getSentimentStyle(article.sentiment_label).textColor
                      } text-xs font-medium flex items-center gap-1`}
                      title={`Sentiment: ${article.sentiment_label || "Unknown"}`}
                    >
                      <span className="text-sm">
                        {getSentimentStyle(article.sentiment_label).icon}
                      </span>
                      <span className="capitalize">
                        {article.sentiment_label || "neutral"}
                      </span>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4 flex-grow flex flex-col">
                <p className="text-gray-400 text-sm line-clamp-2 leading-relaxed">
                  {article.summary || "No summary available"}
                </p>

                <div className="flex flex-wrap gap-2">
                  {(article.tags || []).slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="text-xs px-2 py-1 rounded bg-zinc-900 text-zinc-300 border border-zinc-800 hover:border-white/30 transition-colors"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-zinc-900 mt-auto">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-zinc-900 flex items-center justify-center border border-zinc-800">
                      <Newspaper className="h-3 w-3 text-zinc-400" />
                    </div>
                    <span className="text-xs text-zinc-400 font-medium">
                      {article.source || "Unknown"}
                    </span>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transform group-hover:translate-x-1 group-hover:-translate-y-1 transition-all duration-300" />
                </div>
              </CardContent>

              <div className="absolute bottom-0 right-0 w-32 h-32 opacity-5 pointer-events-none">
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  <path
                    d="M20,80 L30,70 L40,75 L50,60 L60,65 L70,50 L80,55"
                    stroke="currentColor"
                    strokeWidth="2"
                    fill="none"
                    className="text-white"
                  />
                </svg>
              </div>
            </Card>
          ))
        ) : (
          <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
            <div className="bg-zinc-900 p-8 rounded-lg border border-gray-700">
              <Search className="h-12 w-12 text-gray-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                No articles found
              </h3>
              <p className="text-gray-400 mb-4">
                Try adjusting your search query to find finance news articles.
              </p>
              <Button
                onClick={() => setSearchQuery("")}
                variant="outline"
                className="border-white text-white hover:bg-white hover:text-black transition-all duration-300 bg-transparent"
              >
                Clear search
              </Button>
            </div>
          </div>
        )}
      </div>

      {hasMore && articles.length > 0 && (
        <div className="text-center">
          <Button
            variant="outline"
            disabled={isLoadingMore}
            onClick={() => void fetchArticles(page + 1, true)}
            className="border-white text-white hover:bg-white hover:text-black transition-all duration-300 bg-transparent group"
          >
            {isLoadingMore ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              "Load More Articles"
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
