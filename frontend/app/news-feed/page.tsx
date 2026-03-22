"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { format, formatDistanceToNow } from "date-fns";
import { DateRange } from "react-day-picker";
import {
  Search,
  Filter,
  Calendar as CalendarIcon,
  User,
  X,
  ChevronUp as ChevronUpIcon,
  AlertCircle,
  Loader2,
  Sparkles,
} from "lucide-react";

import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { newsService } from "@/services/newsService";
import { parseApiError } from "@/lib/error-parser";
import { NewsArticleSummary } from "@/types";
import { useToast } from "@/hooks/use-toast";

const DEFAULT_LIMIT = 18;
const SEARCH_DEBOUNCE_MS = 400;
const MIN_SEARCH_QUERY_LENGTH = 3;

function toTimestamp(value?: string | null): number {
  if (!value) {
    return 0;
  }
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}

function interleaveBySource(items: NewsArticleSummary[]): NewsArticleSummary[] {
  const buckets = new Map<string, NewsArticleSummary[]>();

  for (const item of items) {
    const sourceKey = (item.source || "unknown").trim().toLowerCase();
    if (!buckets.has(sourceKey)) {
      buckets.set(sourceKey, []);
    }
    buckets.get(sourceKey)?.push(item);
  }

  const sourceKeys = [...buckets.keys()].sort((a, b) => {
    const aTop = toTimestamp(buckets.get(a)?.[0]?.published_at);
    const bTop = toTimestamp(buckets.get(b)?.[0]?.published_at);
    if (bTop !== aTop) {
      return bTop - aTop;
    }
    return a.localeCompare(b);
  });

  // Keep each source internally ordered by newest first.
  for (const key of sourceKeys) {
    buckets
      .get(key)
      ?.sort(
        (a, b) => toTimestamp(b.published_at) - toTimestamp(a.published_at),
      );
  }

  const indices = new Map<string, number>(sourceKeys.map((key) => [key, 0]));
  const result: NewsArticleSummary[] = [];
  let remaining = items.length;

  // Round-robin one item per source per cycle.
  while (remaining > 0) {
    for (const key of sourceKeys) {
      const currentIndex = indices.get(key) ?? 0;
      const sourceItems = buckets.get(key) ?? [];
      if (currentIndex < sourceItems.length) {
        result.push(sourceItems[currentIndex]);
        indices.set(key, currentIndex + 1);
        remaining -= 1;
      }
    }
  }

  return result;
}

function formatPublishedTime(publishedAt?: string | null): string {
  if (!publishedAt) {
    return "Unknown";
  }

  const date = new Date(publishedAt);
  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return formatDistanceToNow(date, { addSuffix: true });
}

function isLatestArticle(publishedAt?: string | null): boolean {
  if (!publishedAt) {
    return false;
  }

  const published = new Date(publishedAt).getTime();
  if (Number.isNaN(published)) {
    return false;
  }

  return Date.now() - published <= 60 * 60 * 1000;
}

export default function NewsFeedPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();

  const [articles, setArticles] = useState<NewsArticleSummary[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState("shuffled");
  const [showFilters, setShowFilters] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [allSources, setAllSources] = useState<string[]>([]);
  const [allCategories, setAllCategories] = useState<string[]>(["all"]);
  const [recommendedArticles, setRecommendedArticles] = useState<
    NewsArticleSummary[]
  >([]);
  const [isLoadingRecommended, setIsLoadingRecommended] = useState(false);

  const selectedSourcesKey = selectedSources.join("|");

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
          limit: 16,
          feedContext: "general",
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

  useEffect(() => {
    const loadSources = async () => {
      try {
        const response = await newsService.getNewsFeedSources();
        setAllSources(response);
      } catch {
        setAllSources([]);
      }
    };

    void loadSources();
  }, []);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await newsService.getNewsFeedCategories();
        setAllCategories(response.length > 0 ? response : ["all"]);
      } catch {
        setAllCategories(["all"]);
      }
    };

    void loadCategories();
  }, []);

  const fetchFeed = async (targetPage: number, append: boolean) => {
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

      const response = await newsService.getNewsFeed({
        page: targetPage,
        limit: DEFAULT_LIMIT,
        category: selectedCategory,
        sources: selectedSources.length > 0 ? selectedSources : undefined,
        searchQuery: effectiveSearchQuery,
        startDate: dateRange?.from ? dateRange.from.toISOString() : undefined,
        endDate: dateRange?.to ? dateRange.to.toISOString() : undefined,
        excludeArticleIds: append ? articles.map((a) => a.id) : undefined,
      });

      setArticles((prev) => {
        if (!append) {
          return response.items;
        }

        const merged = [...prev, ...response.items];
        const uniqueById = new Map(merged.map((item) => [item.id, item]));
        return Array.from(uniqueById.values());
      });
      setPage(targetPage);
      setTotal(response.total);
      setHasMore(response.has_more);
    } catch (error) {
      const parsed = parseApiError(error, "Failed to load news feed.");
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
    void fetchFeed(1, false);
  }, [
    selectedCategory,
    selectedSourcesKey,
    debouncedSearchQuery,
    dateRange?.from,
    dateRange?.to,
  ]);

  const sortedArticles = useMemo(() => {
    const copy = [...articles];

    if (sortBy === "shuffled") {
      return interleaveBySource(copy);
    }

    copy.sort((a, b) => {
      const aDate = a.published_at ? new Date(a.published_at).getTime() : 0;
      const bDate = b.published_at ? new Date(b.published_at).getTime() : 0;
      return sortBy === "oldest" ? aDate - bDate : bDate - aDate;
    });
    return copy;
  }, [articles, sortBy]);

  const availableSources = useMemo(() => allSources, [allSources]);

  const categories = useMemo(() => {
    const seen = new Set<string>();
    const unique: string[] = [];

    for (const category of allCategories) {
      const key = category.toLowerCase();
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      unique.push(category);
    }

    return unique;
  }, [allCategories]);

  const clearFilters = () => {
    setSelectedCategory("all");
    setSelectedSources([]);
    setDateRange(undefined);
    setSortBy("shuffled");
    setSearchQuery("");
  };

  const handleSourceToggle = (source: string) => {
    setSelectedSources((prev) =>
      prev.includes(source)
        ? prev.filter((s) => s !== source)
        : [...prev, source],
    );
  };

  const hasActiveFilters =
    searchQuery !== "" ||
    selectedCategory !== "all" ||
    selectedSources.length > 0 ||
    dateRange !== undefined ||
    sortBy !== "shuffled";

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar showSearch={true} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">News Feed</h1>
          <p className="text-gray-300 text-xl">
            Stay updated with the latest news from around the world
          </p>
        </div>

        <div className="mb-8 space-y-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search news articles, tags, or content..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-transparent border-gray-700 text-white placeholder-gray-400 hover:border-white/50 transition-all duration-300"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="border-white text-white hover:bg-white cursor-pointer hover:text-black transition-all duration-300 bg-transparent"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
                <ChevronUpIcon
                  className={`h-4 w-4 ml-2 transition-transform ${
                    showFilters ? "rotate-0" : "rotate-180"
                  }`}
                />
              </Button>
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  onClick={clearFilters}
                  className="text-gray-400 hover:text-white cursor-pointer hover:bg-zinc-800"
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear
                </Button>
              )}
            </div>
          </div>

          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-black p-6 rounded-lg border border-gray-500"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-300 block pb-2">
                    News Sources
                    {total > 0 && (
                      <span className="text-xs text-gray-500 ml-2">
                        ({articles.length} of {total})
                      </span>
                    )}
                  </label>
                  <div className="space-y-2 max-h-44 overflow-auto pr-2 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-600 [&::-webkit-scrollbar-thumb]:rounded-full">
                    {availableSources.length === 0 && (
                      <p className="text-sm text-gray-500">
                        Sources will appear after loading data.
                      </p>
                    )}
                    {availableSources.map((source) => (
                      <div
                        key={source}
                        className="flex items-center space-x-2 scrollbar-dark scrollbar-thin"
                      >
                        <Checkbox
                          id={source}
                          checked={selectedSources.includes(source)}
                          onCheckedChange={() => handleSourceToggle(source)}
                          className="border-gray-600 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600 cursor-pointer"
                        />
                        <label
                          htmlFor={source}
                          className="text-sm text-gray-300 cursor-pointer"
                        >
                          {source}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-300 block pb-2">
                    Date Range
                  </label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal bg-transparent border-gray-600 text-gray-300 hover:bg-zinc-800 hover:text-white cursor-pointer"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateRange?.from ? (
                          dateRange.to ? (
                            <>
                              {format(dateRange.from, "LLL dd, y")} -{" "}
                              {format(dateRange.to, "LLL dd, y")}
                            </>
                          ) : (
                            format(dateRange.from, "LLL dd, y")
                          )
                        ) : (
                          "Pick a date range"
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-auto p-0 bg-zinc-900 border-gray-700"
                      align="start"
                    >
                      <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={dateRange?.from}
                        selected={dateRange}
                        onSelect={setDateRange}
                        numberOfMonths={2}
                        className="bg-zinc-900 text-white"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-300 block pb-2">
                    Sort By
                  </label>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="bg-transparent hover:bg-zinc-800 hover:text-white border-gray-600 text-gray-300 cursor-pointer">
                      <SelectValue placeholder="Sort articles" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-gray-700 text-white">
                      <SelectItem value="shuffled">Shuffled</SelectItem>
                      <SelectItem value="newest">Newest First</SelectItem>
                      <SelectItem value="oldest">Oldest First</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-700 flex items-center justify-between text-sm text-gray-400">
                <span>
                  Showing {sortedArticles.length} of {total} articles
                </span>
                <div className="flex gap-2">
                  {selectedSources.length > 0 && (
                    <Badge
                      variant="secondary"
                      className="bg-indigo-600 text-white"
                    >
                      {selectedSources.length} source
                      {selectedSources.length > 1 ? "s" : ""}
                    </Badge>
                  )}
                  {dateRange && (
                    <Badge
                      variant="secondary"
                      className="bg-indigo-600 text-white"
                    >
                      Date filtered
                    </Badge>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Badge
                key={category}
                variant={
                  selectedCategory === category ? "default" : "secondary"
                }
                className={`cursor-pointer transition-all duration-300 px-4 py-1 ${
                  selectedCategory === category
                    ? "bg-white text-black hover:bg-white/50"
                    : "bg-zinc-800 text-gray-300 hover:bg-zinc-700 hover:text-white"
                }`}
                onClick={() => setSelectedCategory(category)}
              >
                {category === "all" ? "All Categories" : category}
              </Badge>
            ))}
          </div>
        </div>

        {/* Recommended For You Section */}
        {recommendedArticles.length > 0 && !hasActiveFilters && (
          <div className="mb-12">
            <div className="flex items-center gap-2 mb-6 text-indigo-400">
              <Sparkles className="h-6 w-6" />
              <h2 className="text-2xl font-bold text-white">
                Recommended for You
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {recommendedArticles.map((article) => (
                <Card
                  key={`rec-${article.id}`}
                  onClick={() => router.push(`/news-feed/${article.id}`)}
                  className="bg-indigo-950/20 border py-0 pb-4 border-indigo-500/30 hover:border-indigo-400/60 transition-all duration-500 cursor-pointer group flex flex-col h-full rounded-2xl overflow-hidden"
                >
                  <div className="aspect-[16/10] bg-gray-800 relative overflow-hidden shrink-0">
                    <img
                      src={article.image_url || "/technology-innovation.png"}
                      alt={article.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute top-3 left-3 flex gap-2">
                      <Badge className="bg-indigo-500 text-white border-0 hover:bg-indigo-600">
                        FOR YOU
                      </Badge>
                      {article.category && (
                        <Badge className="bg-black/60 text-white border-0">
                          {article.category}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <CardHeader className="flex-1 p-4 pb-0">
                    <CardTitle className="text-white text-lg font-bold group-hover:text-indigo-300 transition-colors duration-300 line-clamp-3">
                      {article.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-4 mt-auto border-t border-indigo-500/10">
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <span className="flex items-center gap-1 font-medium truncate max-w-[120px]">
                        <User className="h-3 w-3 shrink-0" />
                        <span className="truncate">{article.source}</span>
                      </span>
                      <span className="shrink-0">
                        {formatPublishedTime(article.published_at)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Main Feed Header */}
        {(hasActiveFilters || recommendedArticles.length > 0) && (
          <h2 className="text-2xl font-bold mb-6 text-white border-b border-gray-800 pb-2">
            {hasActiveFilters ? "Search Results" : "Latest News"}
          </h2>
        )}

        {isLoading ? (
          <div className="py-20 text-center text-gray-300">
            <Loader2 className="mx-auto h-10 w-10 animate-spin mb-4" />
            Loading news feed...
          </div>
        ) : error ? (
          <div className="py-20 text-center text-red-400">
            <AlertCircle className="mx-auto h-10 w-10 mb-4" />
            {error}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
              {sortedArticles.length > 0 ? (
                sortedArticles.map((article) => (
                  <Card
                    key={article.id}
                    onClick={() => router.push(`/news-feed/${article.id}`)}
                    className="bg-black border py-0 pb-4 border-gray-600 hover:border-white/50 transition-all duration-500 cursor-pointer group backdrop-blur-sm overflow-hidden rounded-2xl hover:bg-gray-700/50"
                  >
                    <div className="aspect-video bg-gray-700 rounded-t-2xl relative overflow-hidden">
                      <img
                        src={article.image_url || "/technology-innovation.png"}
                        alt={article.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                      <div className="absolute top-4 left-4 flex gap-2">
                        {isLatestArticle(article.published_at) && (
                          <Badge className="bg-black/50 text-white border-0 backdrop-blur-sm">
                            LATEST
                          </Badge>
                        )}
                        {article.category && (
                          <Badge className="bg-black/50 backdrop-blur-sm text-white border-0">
                            {article.category}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <CardHeader>
                      <CardTitle className="text-white text-xl font-bold group-hover:text-indigo-200 transition-colors duration-300 line-clamp-2">
                        {article.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-400 text-sm mb-4 line-clamp-3 leading-relaxed">
                        {article.summary || "No summary available."}
                      </p>

                      <div className="flex flex-wrap gap-1 mb-4">
                        {(article.tags || []).slice(0, 4).map((tag) => (
                          <Badge
                            key={tag}
                            variant="outline"
                            className="text-xs bg-black/80 text-gray-300 border-gray-600 hover:bg-gray-600 transition-colors duration-200"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>

                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center gap-4">
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {article.source}
                          </span>
                          <span>
                            {formatPublishedTime(article.published_at)}
                          </span>
                        </div>
                      </div>
                    </CardContent>
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
                      Try adjusting your search criteria or filters to find more
                      articles.
                    </p>
                    <Button
                      onClick={clearFilters}
                      variant="outline"
                      className="border-gray-600 text-black hover:bg-zinc-800 hover:text-white"
                    >
                      Clear all filters
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {hasMore && (
              <div className="text-center mb-8">
                <Button
                  variant="outline"
                  onClick={() => void fetchFeed(page + 1, true)}
                  disabled={isLoadingMore}
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
          </>
        )}
      </div>

      <Footer />
    </div>
  );
}
