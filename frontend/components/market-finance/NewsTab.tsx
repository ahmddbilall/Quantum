"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, User } from "lucide-react";
import { NewsArticle } from "./types";

// Mock finance news data
const financeNews: NewsArticle[] = [
  {
    id: 1,
    title: "Federal Reserve Announces Interest Rate Decision",
    summary:
      "The Fed has decided to maintain current interest rates amid economic uncertainty.",
    category: "Economics",
    source: "Financial Times",
    publishedAt: "1 hour ago",
    views: 2134,
    image: "/business-finance.png",
    tags: ["Fed", "Interest Rates", "Economics"],
  },
  {
    id: 2,
    title: "Bitcoin Surges Past $68,000 on Institutional Adoption",
    summary:
      "Major corporations continue to add Bitcoin to their treasury reserves.",
    category: "Cryptocurrency",
    source: "CoinDesk",
    publishedAt: "3 hours ago",
    views: 1856,
    image: "/business-finance.png",
    tags: ["Bitcoin", "Cryptocurrency", "Institutional"],
  },
  {
    id: 3,
    title: "Tech Stocks Rally on Strong Earnings Reports",
    summary: "Major technology companies exceed earnings expectations for Q4.",
    category: "Stocks",
    source: "MarketWatch",
    publishedAt: "5 hours ago",
    views: 1342,
    image: "/business-finance.png",
    tags: ["Tech Stocks", "Earnings", "Q4"],
  },
];

export function NewsTab() {
  const [searchQuery, setSearchQuery] = useState("");

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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredNews.length > 0 ? (
          filteredNews.map((article) => (
            <Card
              key={article.id}
              className="bg-zinc-900 border py-0 pb-4 border-gray-700 hover:border-white/50 transition-all duration-500 cursor-pointer group backdrop-blur-sm overflow-hidden rounded-2xl hover:bg-gray-700/50"
            >
              <div className="aspect-video bg-gray-700 rounded-t-2xl relative overflow-hidden">
                <img
                  src={article.image}
                  alt={article.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute top-4 left-4 flex gap-2">
                  <Badge className="bg-black/50 text-white border-0 backdrop-blur-sm">
                    FINANCE
                  </Badge>
                  <Badge className="bg-black/50 backdrop-blur-sm text-white border-0">
                    {article.category}
                  </Badge>
                </div>
              </div>
              <CardHeader className="pb-2">
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
                      className="text-xs bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600 transition-colors duration-200"
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
