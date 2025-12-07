"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Sparkles,
  TrendingUp,
  Clock,
  ArrowRight,
  FileText,
  DollarSign,
  Newspaper,
  Search as SearchIcon,
  Loader2,
} from "lucide-react";

// Mock search results - in a real app, this would come from an API
const mockSearchResults = {
  ai: {
    response: "",
    sources: [] as string[],
    confidence: 0,
  },
  articles: [] as any[],
  marketData: [] as any[],
};

export default function SearchResultsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get("q") || "";

  const [isLoading, setIsLoading] = useState(true);
  const [aiResponse, setAiResponse] = useState("");
  const [articles, setArticles] = useState<any[]>([]);
  const [marketData, setMarketData] = useState<any[]>([]);
  const [sources, setSources] = useState<string[]>([]);
  const [confidence, setConfidence] = useState(0);
  const [searchInput, setSearchInput] = useState(query);

  useEffect(() => {
    if (query) {
      performSearch(query);
    }
  }, [query]);

  const performSearch = async (searchQuery: string) => {
    setIsLoading(true);

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Mock AI response based on query
    const mockAIResponse = `Based on your search for "${searchQuery}", I've analyzed the latest information from multiple sources. ${
      searchQuery.toLowerCase().includes("ai") ||
      searchQuery.toLowerCase().includes("technology")
        ? "Recent developments in artificial intelligence and technology show significant breakthroughs in machine learning capabilities, with new models demonstrating improved reasoning and problem-solving abilities. Industry leaders are investing heavily in AI research, focusing on ethical considerations and practical applications across various sectors including healthcare, finance, and education."
        : searchQuery.toLowerCase().includes("climate") ||
          searchQuery.toLowerCase().includes("environment")
        ? "Climate and environmental initiatives are gaining momentum globally, with world leaders committing to ambitious carbon reduction targets. Renewable energy adoption is accelerating, and sustainable practices are becoming mainstream across industries. Scientists emphasize the urgency of immediate action to address environmental challenges."
        : searchQuery.toLowerCase().includes("market") ||
          searchQuery.toLowerCase().includes("stock") ||
          searchQuery.toLowerCase().includes("finance")
        ? "Market analysis indicates continued volatility in global financial markets, driven by economic indicators and geopolitical factors. Investors are closely monitoring central bank policies and inflation trends. Technology stocks remain a focus area, while traditional sectors show mixed performance. Financial experts recommend diversification and long-term investment strategies."
        : `The latest information regarding "${searchQuery}" reveals important developments across multiple sectors. Key trends show increasing attention from major industry players, with significant investments and strategic initiatives being announced. Experts suggest this area will continue to evolve rapidly, presenting both opportunities and challenges for stakeholders.`
    }`;

    // Mock related articles
    const mockArticles = [
      {
        id: 1,
        title: `Breaking: Major Development in ${searchQuery}`,
        summary: `Recent analysis reveals significant progress in ${searchQuery} sector with industry experts predicting transformative changes ahead.`,
        category: "Technology",
        source: "TechCrunch",
        author: "Alex Johnson",
        publishedAt: "2 hours ago",
        image: "/technology-innovation.png",
        tags: [
          searchQuery.split(" ")[0] || "Tech",
          "Innovation",
          "Breaking News",
        ],
        readTime: "5 min read",
        type: "news",
      },
      {
        id: 2,
        title: `Expert Analysis: Understanding ${searchQuery}`,
        summary: `Industry leaders provide comprehensive insights into ${searchQuery}, highlighting key trends and future implications.`,
        category: "Analysis",
        source: "Reuters",
        author: "Sarah Mitchell",
        publishedAt: "4 hours ago",
        image: "/environment-climate.png",
        tags: ["Analysis", "Expert Opinion", "Trends"],
        readTime: "8 min read",
        type: "news",
      },
      {
        id: 3,
        title: `${searchQuery}: What You Need to Know`,
        summary: `A comprehensive guide covering the latest developments, implications, and expert perspectives on ${searchQuery}.`,
        category: "Guide",
        source: "BBC News",
        author: "David Chen",
        publishedAt: "6 hours ago",
        image: "/technology-innovation.png",
        tags: ["Guide", "Education", "Insights"],
        readTime: "6 min read",
        type: "news",
      },
    ];

    // Mock market data if query is finance-related
    const mockMarketResults =
      searchQuery.toLowerCase().includes("market") ||
      searchQuery.toLowerCase().includes("stock") ||
      searchQuery.toLowerCase().includes("finance")
        ? [
            {
              id: 1,
              symbol: "TECH",
              name: "Tech Index",
              price: "$1,234.56",
              change: "+12.34",
              changePercent: "+1.01%",
              type: "market",
            },
            {
              id: 2,
              symbol: "AAPL",
              name: "Apple Inc.",
              price: "$175.43",
              change: "+2.15",
              changePercent: "+1.24%",
              type: "market",
            },
          ]
        : [];

    setAiResponse(mockAIResponse);
    setArticles(mockArticles);
    setMarketData(mockMarketResults);
    setSources(["Reuters", "TechCrunch", "BBC News", "Bloomberg"]);
    setConfidence(92);
    setIsLoading(false);
  };

  const handleArticleClick = (article: any) => {
    if (article.type === "market") {
      router.push(`/market-finance/news/${article.id}`);
    } else {
      router.push(`/news-feed/${article.id}`);
    }
  };

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
        {/* Search Bar */}
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
                onKeyPress={handleSearchKeyPress}
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
            <p className="text-gray-400">Analyzing your query with AI...</p>
          </div>
        ) : (
          <>
            {/* AI Response Section */}
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
                        {sources.map((source, index) => (
                          <Badge
                            key={index}
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

            {/* Market Data Section */}
            {marketData.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="mb-8"
              >
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                  Related Market Data
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {marketData.map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                    >
                      <Card
                        className="bg-zinc-900 border-gray-700 hover:border-white/50 transition-all duration-300 cursor-pointer"
                        onClick={() => handleArticleClick(item)}
                      >
                        <CardContent className="p-6">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h3 className="text-xl font-bold text-white">
                                {item.symbol}
                              </h3>
                              <p className="text-sm text-gray-400">
                                {item.name}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-bold text-white">
                                {item.price}
                              </p>
                              <p
                                className={`text-sm ${
                                  item.change.startsWith("+")
                                    ? "text-green-500"
                                    : "text-red-500"
                                }`}
                              >
                                {item.change} ({item.changePercent})
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Related Articles Section */}
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
                      onClick={() => handleArticleClick(article)}
                    >
                      <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row gap-6">
                          {/* Article Image */}
                          <div className="md:w-48 h-32 bg-zinc-900 rounded-lg overflow-hidden flex-shrink-0">
                            <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                              <Newspaper className="h-12 w-12 text-gray-600" />
                            </div>
                          </div>

                          {/* Article Content */}
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <Badge className="bg-white text-black">
                                {article.category}
                              </Badge>
                              <div className="flex items-center gap-2 text-sm text-gray-400">
                                <Clock className="h-4 w-4" />
                                {article.publishedAt}
                              </div>
                            </div>

                            <h3 className="text-xl font-bold text-white mb-2 transition-colors">
                              {article.title}
                            </h3>

                            <p className="text-gray-400 mb-3 line-clamp-2">
                              {article.summary}
                            </p>

                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4 text-sm text-gray-400">
                                <span>{article.source}</span>
                                <span>•</span>
                                <span>{article.author}</span>
                                <span>•</span>
                                <span>{article.readTime}</span>
                              </div>

                              <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-white group-hover:translate-x-1 transition-all" />
                            </div>

                            {/* Tags */}
                            <div className="flex flex-wrap gap-2 mt-3">
                              {article.tags.map(
                                (tag: string, tagIndex: number) => (
                                  <Badge
                                    key={tagIndex}
                                    variant="outline"
                                    className="border-gray-600 text-gray-400 text-xs"
                                  >
                                    {tag}
                                  </Badge>
                                )
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* No Results Message */}
            {articles.length === 0 && marketData.length === 0 && !isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="text-center py-16"
              >
                <SearchIcon className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-400 mb-2">
                  No additional results found
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
