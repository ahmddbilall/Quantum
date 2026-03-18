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
  ChevronUp,
  AlertCircle,
  Loader2,
} from "lucide-react";

import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

export default function NewsFeedPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [articles, setArticles] = useState<NewsArticleSummary[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState("newest");
  const [showFilters, setShowFilters] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedSourcesKey = selectedSources.join("|");

  const fetchFeed = async (targetPage: number, append: boolean) => {
    try {
      setError(null);
      if (append) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
      }

      const response = await newsService.getFeed({
        page: targetPage,
        limit: DEFAULT_LIMIT,
        category: selectedCategory,
        sources: selectedSources,
        searchQuery,
        startDate: dateRange?.from ? dateRange.from.toISOString() : undefined,
        endDate: dateRange?.to ? dateRange.to.toISOString() : undefined,
      });

      setArticles((prev) =>
        append ? [...prev, ...response.items] : response.items,
      );
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
    searchQuery,
    dateRange?.from,
    dateRange?.to,
  ]);

  const sortedArticles = useMemo(() => {
    const copy = [...articles];
    copy.sort((a, b) => {
      const aDate = a.published_at ? new Date(a.published_at).getTime() : 0;
      const bDate = b.published_at ? new Date(b.published_at).getTime() : 0;
      return sortBy === "oldest" ? aDate - bDate : bDate - aDate;
    });
    return copy;
  }, [articles, sortBy]);

  const availableSources = useMemo(() => {
    return [
      ...new Set(articles.map((article) => article.source).filter(Boolean)),
    ];
  }, [articles]);

  const categories = useMemo(() => {
    const dynamicCategories = [
      ...new Set(articles.map((article) => article.category).filter(Boolean)),
    ] as string[];
    return ["all", ...dynamicCategories];
  }, [articles]);

  const clearFilters = () => {
    setSelectedCategory("all");
    setSelectedSources([]);
    setDateRange(undefined);
    setSortBy("newest");
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
    sortBy !== "newest";

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
                <ChevronUp
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
                  </label>
                  <div className="space-y-2 max-h-44 overflow-auto pr-2">
                    {availableSources.length === 0 && (
                      <p className="text-sm text-gray-500">
                        Sources will appear after loading data.
                      </p>
                    )}
                    {availableSources.map((source) => (
                      <div key={source} className="flex items-center space-x-2">
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
                        <Badge className="bg-black/50 text-white border-0 backdrop-blur-sm">
                          LATEST
                        </Badge>
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
