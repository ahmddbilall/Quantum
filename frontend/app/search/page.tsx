"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Sparkles,
  Clock,
  ArrowRight,
  FileText,
  Newspaper,
  Search as SearchIcon,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { newsService } from "@/services/newsService";
import { parseApiError } from "@/lib/error-parser";
import { NewsArticleSummary } from "@/types";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";

export default function SearchResultsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get("q") || "";
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [articles, setArticles] = useState<NewsArticleSummary[]>([]);
  const [searchInput, setSearchInput] = useState(query);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const performSearch = async () => {
      if (!query.trim()) {
        setArticles([]);
        setError(null);
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const response = await newsService.getFeed({
          page: 1,
          limit: 24,
          searchQuery: query,
        });
        setArticles(response.items);
      } catch (error) {
        const parsed = parseApiError(error, "Failed to fetch search results.");
        setError(parsed.message);
        toast({
          title: "Search failed",
          description: parsed.message,
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    void performSearch();
  }, [query]);

  const aiResponse = useMemo(() => {
    if (!query.trim()) {
      return "Enter a query to search the knowledge base.";
    }

    if (articles.length === 0) {
      return `No strong matches were found for \"${query}\" in the current indexed news set.`;
    }

    const topSummaries = articles
      .slice(0, 3)
      .map((article) => article.summary)
      .filter(Boolean)
      .join(" ");

    return (
      topSummaries ||
      `Found ${articles.length} relevant article(s) for \"${query}\". Open an article below for details.`
    );
  }, [articles, query]);

  const sources = useMemo(() => {
    return [...new Set(articles.map((article) => article.source))];
  }, [articles]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchInput.trim())}`);
    }
  };

  const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchInput.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchInput.trim())}`);
    }
  };

  if (!query) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Navbar showSearch={true} />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <SearchIcon className="h-16 w-16 text-gray-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-400">
            No search query provided
          </h1>
          <p className="text-gray-500 mt-2">
            Please enter a search term to find relevant articles and insights.
          </p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar showSearch={false} />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <form onSubmit={handleSearchSubmit} className="max-w-3xl mx-auto">
            <div className="flex items-center bg-zinc-900 border border-gray-700 rounded-full p-2 focus-within:border-white transition-colors duration-200">
              <SearchIcon className="h-5 w-5 text-gray-400 ml-3" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={handleSearchKeyPress}
                placeholder="Search for news, markets, or ask AI anything..."
                className="flex-1 bg-transparent text-white placeholder-gray-400 px-4 py-2 focus:outline-none"
              />
              <button
                type="submit"
                className="bg-white text-black hover:bg-gray-200 rounded-full px-6 py-2 font-medium transition-colors duration-200 cursor-pointer"
              >
                Search
              </button>
            </div>
          </form>
        </motion.div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="h-12 w-12 text-indigo-500 animate-spin mb-4" />
            <p className="text-gray-400">Searching indexed news...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16">
            <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
            <p className="text-red-400">{error}</p>
          </div>
        ) : (
          <>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="mb-8"
            >
              <Card className="bg-transparent border-2 border-transparent bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 bg-clip-border p-[2px] hover:from-purple-400 hover:via-pink-400 hover:to-purple-400 transition-all duration-300 ">
                <div className="bg-black rounded-lg p-5">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2 px-0">
                      <Sparkles className="h-5 w-5 text-purple-500" />
                      AI-Powered Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 px-0">
                    <div className="rounded-lg p-6 px-0">
                      <p className="text-gray-300 leading-relaxed">
                        {aiResponse}
                      </p>
                    </div>

                    <Separator className="bg-gray-700" />

                    <div>
                      <p className="text-sm text-gray-400 mb-2 flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Sources analyzed:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {sources.map((source) => (
                          <Badge
                            key={source}
                            variant="outline"
                            className="border-gray-600 text-gray-300"
                          >
                            {source}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </div>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <h2 className="text-2xl font-bold text-white mb-4">
                Related Articles
              </h2>
              <div className="space-y-6">
                {articles.map((article, index) => (
                  <motion.div
                    key={article.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
                  >
                    <Card
                      className="bg-black border-white/20 hover:border-white transition-all duration-300 cursor-pointer group"
                      onClick={() => router.push(`/news-feed/${article.id}`)}
                    >
                      <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row gap-6">
                          <div className="md:w-48 h-32 bg-zinc-900 rounded-lg overflow-hidden flex-shrink-0">
                            <img
                              src={
                                article.image_url ||
                                "/technology-innovation.png"
                              }
                              alt={article.title}
                              className="w-full h-full object-cover"
                            />
                          </div>

                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <Badge className="bg-white text-black">
                                {article.category || "General"}
                              </Badge>
                              <div className="flex items-center gap-2 text-sm text-gray-400">
                                <Clock className="h-4 w-4" />
                                {article.published_at
                                  ? formatDistanceToNow(
                                      new Date(article.published_at),
                                      {
                                        addSuffix: true,
                                      },
                                    )
                                  : "Unknown"}
                              </div>
                            </div>

                            <h3 className="text-xl font-bold text-white mb-2 transition-colors">
                              {article.title}
                            </h3>

                            <p className="text-gray-400 mb-3 line-clamp-2">
                              {article.summary || "No summary available."}
                            </p>

                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4 text-sm text-gray-400">
                                <span>{article.source}</span>
                                <span>•</span>
                                <span>{article.author || "Unknown"}</span>
                              </div>

                              <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-white group-hover:translate-x-1 transition-all" />
                            </div>

                            <div className="flex flex-wrap gap-2 mt-3">
                              {(article.tags || []).slice(0, 5).map((tag) => (
                                <Badge
                                  key={tag}
                                  variant="outline"
                                  className="border-gray-600 text-gray-400 text-xs"
                                >
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {articles.length === 0 && !isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="text-center py-16"
              >
                <SearchIcon className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-400 mb-2">
                  No results found
                </h2>
                <p className="text-gray-500">
                  Try refining your search query or explore other topics.
                </p>
              </motion.div>
            )}
          </>
        )}
      </div>

      <Footer />
    </div>
  );
}
