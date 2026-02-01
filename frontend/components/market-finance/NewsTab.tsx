"use client";

import { useState } from "react";
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
} from "lucide-react";
import { NewsArticle } from "./types";

// Mock finance news data
const financeNews: NewsArticle[] = [
  {
    id: "1",
    title: "Federal Reserve Announces Interest Rate Decision",
    summary:
      "The Fed has decided to maintain current interest rates amid economic uncertainty.",
    category: "Economics",
    source: "Financial Times",
    publishedAt: "1 hour ago",
    views: 2134,
    image: "/business-finance.png",
    tags: ["Fed", "Interest Rates", "Economics"],
    sentiment: "neutral", // "positive", "negative", or "neutral"
  },
  {
    id: "2",
    title: "Bitcoin Surges Past $68,000 on Institutional Adoption",
    summary:
      "Major corporations continue to add Bitcoin to their treasury reserves.",
    category: "Cryptocurrency",
    source: "CoinDesk",
    publishedAt: "3 hours ago",
    views: 1856,
    image: "/business-finance.png",
    tags: ["Bitcoin", "Cryptocurrency", "Institutional"],
    sentiment: "positive",
  },
  {
    id: "3",
    title: "Tech Stocks Rally on Strong Earnings Reports",
    summary: "Major technology companies exceed earnings expectations for Q4.",
    category: "Stocks",
    source: "MarketWatch",
    publishedAt: "5 hours ago",
    views: 1342,
    image: "/business-finance.png",
    tags: ["Tech Stocks", "Earnings", "Q4"],
    sentiment: "positive",
  },
];

export function NewsTab() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  // Helper function to get sentiment styling
  const getSentimentStyle = (sentiment: string | undefined) => {
    switch (sentiment) {
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

  const filteredNews = financeNews.filter(
    (article) =>
      searchQuery === "" ||
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.tags.some((tag) =>
        tag.toLowerCase().includes(searchQuery.toLowerCase())
      )
  );

  return (
    <div className="space-y-6">
      {/* Search for Finance News */}
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

      {/* Finance News Articles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredNews.length > 0 ? (
          filteredNews.map((article, index) => (
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
                        {article.category}
                      </Badge>
                      <Badge
                        variant="outline"
                        className="border-zinc-700 text-zinc-400"
                      >
                        <Clock className="h-3 w-3 mr-1" />
                        {article.publishedAt}
                      </Badge>
                    </div>
                    <CardTitle className="text-white text-lg font-bold group-hover:text-white transition-colors duration-300 line-clamp-2 leading-tight">
                      {article.title}
                    </CardTitle>
                  </div>

                  {/* Sentiment Indicator */}
                  <div className="flex-shrink-0">
                    <div
                      className={`px-3 py-1 rounded-full ${getSentimentStyle(article.sentiment).bgColor
                        } border ${getSentimentStyle(article.sentiment).borderColor
                        } ${getSentimentStyle(article.sentiment).textColor
                        } text-xs font-medium flex items-center gap-1`}
                      title={`Sentiment: ${article.sentiment}`}
                    >
                      <span className="text-sm">
                        {getSentimentStyle(article.sentiment).icon}
                      </span>
                      <span className="capitalize">{article.sentiment}</span>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4 flex-grow flex flex-col">
                <p className="text-gray-400 text-sm line-clamp-2 leading-relaxed">
                  {article.summary}
                </p>

                {/* Finance-style tag display */}
                <div className="flex flex-wrap gap-2">
                  {article.tags.map((tag, idx) => (
                    <span
                      key={tag}
                      className="text-xs px-2 py-1 rounded bg-zinc-900 text-zinc-300 border border-zinc-800 hover:border-white/30 transition-colors"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>

                {/* Bottom section with source and action */}
                <div className="flex items-center justify-between pt-3 border-t border-zinc-900 mt-auto">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-zinc-900 flex items-center justify-center border border-zinc-800">
                      <Newspaper className="h-3 w-3 text-zinc-400" />
                    </div>
                    <span className="text-xs text-zinc-400 font-medium">
                      {article.source}
                    </span>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transform group-hover:translate-x-1 group-hover:-translate-y-1 transition-all duration-300" />
                </div>
              </CardContent>

              {/* Decorative financial pattern */}
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

      {/* Load More Button */}
      {filteredNews.length > 0 && (
        <div className="text-center">
          <Button
            variant="outline"
            className="border-white text-white hover:bg-white hover:text-black transition-all duration-300 bg-transparent group"
          >
            Load More Articles
          </Button>
        </div>
      )}
    </div>
  );
}
