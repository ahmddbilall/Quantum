"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";
import {
  Search,
  Filter,
  Calendar as CalendarIcon,
  User,
  Eye,
  X,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  TrendingUp,
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

export default function NewsFeedPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState("newest");
  const [showFilters, setShowFilters] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  // Enhanced mock news data with more realistic dates and sources
  const newsArticles = [
    {
      id: 1,
      title: "Breaking: Major AI Breakthrough Announced",
      summary:
        "Researchers have developed a new AI model that shows unprecedented capabilities in understanding and reasoning.",
      category: "Technology",
      source: "TechCrunch",
      publishedAt: "2 hours ago",
      publishedDate: new Date(2025, 7, 30, 10, 0), // Aug 30, 2025, 10:00 AM
      views: 1234,
      image: "/technology-innovation.png",
      tags: ["AI", "Technology", "Research"],
      trending: true,
    },
    {
      id: 2,
      title: "Global Climate Summit Reaches Historic Agreement",
      summary:
        "World leaders have committed to ambitious new targets for carbon emission reduction.",
      category: "Environment",
      source: "BBC News",
      publishedAt: "4 hours ago",
      publishedDate: new Date(2025, 7, 30, 8, 0), // Aug 30, 2025, 8:00 AM
      views: 856,
      image: "/environment-climate.png",
      tags: ["Climate", "Environment", "Politics"],
      trending: false,
    },
    {
      id: 3,
      title: "Space Exploration Makes New Discovery",
      summary:
        "NASA's latest mission has revealed surprising findings about distant galaxies.",
      category: "Science",
      source: "Space.com",
      publishedAt: "6 hours ago",
      publishedDate: new Date(2025, 7, 30, 6, 0), // Aug 30, 2025, 6:00 AM
      views: 642,
      image: "/technology-innovation.png",
      tags: ["Space", "NASA", "Discovery"],
      trending: false,
    },
    {
      id: 4,
      title: "Federal Reserve Announces Interest Rate Decision",
      summary:
        "The Fed has decided to maintain current interest rates amid economic uncertainty.",
      category: "Finance",
      source: "Financial Times",
      publishedAt: "8 hours ago",
      publishedDate: new Date(2025, 7, 30, 4, 0), // Aug 30, 2025, 4:00 AM
      views: 987,
      image: "/business-finance.png",
      tags: ["Fed", "Interest Rates", "Economics"],
      trending: true,
    },
    {
      id: 5,
      title: "Medical Breakthrough in Cancer Treatment",
      summary:
        "Revolutionary treatment shows promising results in clinical trials with 90% success rate.",
      category: "Health",
      source: "Medical Journal",
      publishedAt: "10 hours ago",
      publishedDate: new Date(2025, 7, 30, 2, 0), // Aug 30, 2025, 2:00 AM
      views: 756,
      image: "/health-medical-research.png",
      tags: ["Health", "Medical", "Cancer"],
      trending: false,
    },
    {
      id: 6,
      title: "Tech Giants Report Record Quarterly Earnings",
      summary:
        "Major technology companies exceed expectations with strong performance across all sectors.",
      category: "Technology",
      source: "MarketWatch",
      publishedAt: "12 hours ago",
      publishedDate: new Date(2025, 7, 29, 22, 0), // Aug 29, 2025, 10:00 PM
      views: 543,
      image: "/technology-innovation.png",
      tags: ["Tech", "Earnings", "Stocks"],
      trending: false,
    },
    {
      id: 7,
      title: "Olympic Games Set New Viewership Records",
      summary:
        "The latest Olympic Games have broken all previous television and streaming viewership records.",
      category: "Sports",
      source: "ESPN",
      publishedAt: "1 day ago",
      publishedDate: new Date(2025, 7, 29, 12, 0), // Aug 29, 2025, 12:00 PM
      views: 1456,
      image: "/technology-innovation.png",
      tags: ["Olympics", "Sports", "Records"],
      trending: true,
    },
    {
      id: 8,
      title: "New Political Alliance Forms in European Parliament",
      summary:
        "A groundbreaking coalition has been established to address climate change and economic reform.",
      category: "Politics",
      source: "Reuters",
      publishedAt: "1 day ago",
      publishedDate: new Date(2025, 7, 29, 10, 0), // Aug 29, 2025, 10:00 AM
      views: 789,
      image: "/technology-innovation.png",
      tags: ["Politics", "Europe", "Climate"],
      trending: false,
    },
  ];

  // Get unique sources from articles
  const availableSources = [
    ...new Set(newsArticles.map((article) => article.source)),
  ];
  const categories = [
    "all",
    "Technology",
    "Environment",
    "Science",
    "Politics",
    "Health",
    "Sports",
  ];

  // Filter articles based on all criteria
  const filteredArticles = newsArticles.filter((article) => {
    const matchesSearch =
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.tags.some((tag) =>
        tag.toLowerCase().includes(searchQuery.toLowerCase())
      );

    const matchesCategory =
      selectedCategory === "all" || article.category === selectedCategory;

    const matchesSource =
      selectedSources.length === 0 || selectedSources.includes(article.source);

    const matchesDate =
      (!dateRange?.from || article.publishedDate >= dateRange.from) &&
      (!dateRange?.to || article.publishedDate <= dateRange.to);

    return matchesSearch && matchesCategory && matchesSource && matchesDate;
  });

  // Sort articles
  const sortedArticles = [...filteredArticles].sort((a, b) => {
    switch (sortBy) {
      case "newest":
        return b.publishedDate.getTime() - a.publishedDate.getTime();
      case "oldest":
        return a.publishedDate.getTime() - b.publishedDate.getTime();
      default:
        return 0;
    }
  });

  const handleSourceToggle = (source: string) => {
    setSelectedSources((prev) =>
      prev.includes(source)
        ? prev.filter((s) => s !== source)
        : [...prev, source]
    );
  };

  const clearFilters = () => {
    setSelectedCategory("all");
    setSelectedSources([]);
    setDateRange(undefined);
    setSortBy("newest");
    setSearchQuery("");
  };

  // Check if any filters are applied
  const hasActiveFilters =
    searchQuery !== "" ||
    selectedCategory !== "all" ||
    selectedSources.length > 0 ||
    dateRange !== undefined ||
    sortBy !== "newest";

  const handleArticleClick = (articleId: number) => {
    router.push(`/news-feed/${articleId}`);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar showSearch={true} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">News Feed</h1>
          <p className="text-gray-300 text-xl">
            Stay updated with the latest news from around the world
          </p>
        </div>

        {/* Enhanced Search and Filter Section */}
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
                className="border-white text-white hover:bg-white  cursor-pointer hover:text-black transition-all duration-300 bg-transparent group"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
                {showFilters ? (
                  <ChevronUp className="h-4 w-4 ml-2" />
                ) : (
                  <ChevronUp className="h-4 w-4 ml-2 transform rotate-180" />
                )}
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

          {/* Advanced Filters Panel */}
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-black p-6 rounded-lg border border-gray-500"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Source Filter */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-300 block pb-2">
                    News Sources
                  </label>
                  <div className="space-y-2">
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

                {/* Date Range Filter */}
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

                {/* Sort Options */}
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

              {/* Filter Summary */}
              <div className="mt-4 pt-4 border-t border-gray-700">
                <div className="flex items-center justify-between text-sm text-gray-400">
                  <span>
                    Showing {sortedArticles.length} of {newsArticles.length}{" "}
                    articles
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
                    {dateRange && (dateRange.from || dateRange.to) && (
                      <Badge
                        variant="secondary"
                        className="bg-indigo-600 text-white"
                      >
                        Date filtered
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Category Filters */}
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Badge
                key={category}
                variant={
                  selectedCategory === category ? "default" : "secondary"
                }
                className={`cursor-pointer transition-all duration-300 px-4 py-1 ${selectedCategory === category
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

        {/* News Articles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
          {sortedArticles.length > 0 ? (
            sortedArticles.map((article) => (
              <Card
                key={article.id}
                onClick={() => handleArticleClick(article.id)}
                className="bg-black border py-0 pb-4 border-gray-600 hover:border-white/50 transition-all duration-500 cursor-pointer group backdrop-blur-sm overflow-hidden rounded-2xl hover:bg-gray-700/50"
              >
                <div className="aspect-video bg-gray-700 rounded-t-2xl relative overflow-hidden">
                  <img
                    src={article.image}
                    alt={article.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute top-4 left-4 flex gap-2">
                    <Badge className="bg-black/50 text-white border-0 backdrop-blur-sm">
                      LATEST
                    </Badge>
                    <Badge className="bg-black/50 backdrop-blur-sm text-white border-0">
                      {article.category}
                    </Badge>
                  </div>
                </div>
                <CardHeader>
                  <CardTitle className="text-white text-xl font-bold group-hover:text-indigo-200 transition-colors duration-300 line-clamp-2">
                    {article.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-400 text-sm mb-4 line-clamp-3 leading-relaxed">
                    {article.summary}
                  </p>

                  <div className="flex flex-wrap gap-1 mb-4">
                    {article.tags.map((tag) => (
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
                      <span className="flex items-center gap-1">
                        {article.publishedAt}
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

        {/* Load More Button */}
        {sortedArticles.length > 0 && (
          <div className="text-center mb-8">
            <Button
              variant="outline"
              className="border-white text-white hover:bg-white hover:text-black transition-all duration-300 bg-transparent group"
            >
              Load More Articles
            </Button>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
