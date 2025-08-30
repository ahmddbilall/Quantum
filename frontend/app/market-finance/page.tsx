"use client";

import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search,
  TrendingUp,
  TrendingDown,
  Calendar,
  User,
  Eye,
  DollarSign,
  Bitcoin,
  Activity,
} from "lucide-react";
import { useState } from "react";

export default function MarketFinancePage() {
  const [searchQuery, setSearchQuery] = useState("");

  // Mock market data - replace with actual trading API data
  const topStocks = [
    {
      symbol: "AAPL",
      name: "Apple Inc.",
      price: 195.32,
      change: 2.45,
      changePercent: 1.27,
    },
    {
      symbol: "MSFT",
      name: "Microsoft Corp.",
      price: 378.85,
      change: -1.23,
      changePercent: -0.32,
    },
    {
      symbol: "GOOGL",
      name: "Alphabet Inc.",
      price: 142.56,
      change: 3.78,
      changePercent: 2.72,
    },
    {
      symbol: "AMZN",
      name: "Amazon.com Inc.",
      price: 151.94,
      change: -0.85,
      changePercent: -0.56,
    },
    {
      symbol: "TSLA",
      name: "Tesla Inc.",
      price: 238.45,
      change: 8.92,
      changePercent: 3.89,
    },
  ];

  const topCrypto = [
    {
      symbol: "BTC",
      name: "Bitcoin",
      price: 67845.32,
      change: 1234.56,
      changePercent: 1.85,
    },
    {
      symbol: "ETH",
      name: "Ethereum",
      price: 3456.78,
      change: -89.45,
      changePercent: -2.52,
    },
    {
      symbol: "BNB",
      name: "Binance Coin",
      price: 298.45,
      change: 12.34,
      changePercent: 4.31,
    },
    {
      symbol: "ADA",
      name: "Cardano",
      price: 0.6789,
      change: 0.0234,
      changePercent: 3.58,
    },
    {
      symbol: "SOL",
      name: "Solana",
      price: 189.23,
      change: -5.67,
      changePercent: -2.91,
    },
  ];

  // Mock finance news data
  const financeNews = [
    {
      id: 1,
      title: "Federal Reserve Announces Interest Rate Decision",
      summary:
        "The Fed has decided to maintain current interest rates amid economic uncertainty.",
      category: "Economics",
      source: "Financial Times",
      publishedAt: "1 hour ago",
      views: 2134,
      image: "/placeholder.jpg",
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
      image: "/placeholder.jpg",
      tags: ["Bitcoin", "Cryptocurrency", "Institutional"],
    },
    {
      id: 3,
      title: "Tech Stocks Rally on Strong Earnings Reports",
      summary:
        "Major technology companies exceed earnings expectations for Q4.",
      category: "Stocks",
      source: "MarketWatch",
      publishedAt: "5 hours ago",
      views: 1342,
      image: "/placeholder.jpg",
      tags: ["Tech Stocks", "Earnings", "Q4"],
    },
  ];

  interface MarketItem {
    symbol: string;
    name: string;
    price: number;
    change: number;
    changePercent: number;
  }

  interface MarketWidgetProps {
    data: MarketItem[];
    title: string;
    icon: React.ComponentType<any>;
    isPriceInDollars?: boolean;
  }

  const MarketWidget = ({
    data,
    title,
    icon: Icon,
    isPriceInDollars = true,
  }: MarketWidgetProps) => (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader className="pb-3">
        <CardTitle className="text-white flex items-center gap-2">
          <Icon className="h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {data.map((item) => (
          <div
            key={item.symbol}
            className="flex items-center justify-between p-3 bg-gray-700 rounded-lg"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                <span className="text-xs font-bold text-white">
                  {item.symbol.slice(0, 2)}
                </span>
              </div>
              <div>
                <div className="font-semibold text-white">{item.symbol}</div>
                <div className="text-xs text-gray-400">{item.name}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-semibold text-white">
                {isPriceInDollars ? "$" : ""}
                {item.price.toLocaleString()}
              </div>
              <div
                className={`text-xs flex items-center gap-1 ${
                  item.change >= 0 ? "text-green-400" : "text-red-400"
                }`}
              >
                {item.change >= 0 ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                {item.changePercent >= 0 ? "+" : ""}
                {item.changePercent.toFixed(2)}%
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-[#121212] text-white">
      <Navbar showSearch={true} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">Market & Finance</h1>
          <p className="text-gray-400 text-lg">
            Track markets, cryptocurrencies, and financial news in real-time
          </p>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-gray-800 border-gray-700">
            <TabsTrigger
              value="overview"
              className="data-[state=active]:bg-white data-[state=active]:text-black"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="stocks"
              className="data-[state=active]:bg-white data-[state=active]:text-black"
            >
              Stocks
            </TabsTrigger>
            <TabsTrigger
              value="crypto"
              className="data-[state=active]:bg-white data-[state=active]:text-black"
            >
              Cryptocurrency
            </TabsTrigger>
            <TabsTrigger
              value="news"
              className="data-[state=active]:bg-white data-[state=active]:text-black"
            >
              Finance News
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Market Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <MarketWidget
                data={topStocks}
                title="Top Stocks"
                icon={TrendingUp}
                isPriceInDollars={true}
              />
              <MarketWidget
                data={topCrypto}
                title="Top Cryptocurrencies"
                icon={Bitcoin}
                isPriceInDollars={true}
              />
            </div>

            {/* Market Indices */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Market Indices
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    { name: "S&P 500", value: "4,789.45", change: "+0.87%" },
                    { name: "NASDAQ", value: "14,567.23", change: "+1.23%" },
                    { name: "DOW JONES", value: "37,234.56", change: "-0.34%" },
                  ].map((index) => (
                    <div
                      key={index.name}
                      className="bg-gray-700 p-4 rounded-lg text-center"
                    >
                      <div className="text-sm text-gray-400 mb-1">
                        {index.name}
                      </div>
                      <div className="text-xl font-bold text-white">
                        {index.value}
                      </div>
                      <div
                        className={`text-sm ${
                          index.change.startsWith("+")
                            ? "text-green-400"
                            : "text-red-400"
                        }`}
                      >
                        {index.change}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stocks" className="space-y-6">
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search stocks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                />
              </div>
            </div>
            <MarketWidget
              data={topStocks}
              title="Stock Market"
              icon={DollarSign}
              isPriceInDollars={true}
            />
          </TabsContent>

          <TabsContent value="crypto" className="space-y-6">
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search cryptocurrencies..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                />
              </div>
            </div>
            <MarketWidget
              data={topCrypto}
              title="Cryptocurrency Market"
              icon={Bitcoin}
              isPriceInDollars={true}
            />
          </TabsContent>

          <TabsContent value="news" className="space-y-6">
            {/* Search for Finance News */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search finance news..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                />
              </div>
            </div>

            {/* Finance News Articles */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {financeNews.map((article) => (
                <Card
                  key={article.id}
                  className="bg-gray-800 border-gray-700 hover:border-gray-600 transition-colors cursor-pointer"
                >
                  <div className="aspect-video bg-gray-700 rounded-t-lg relative overflow-hidden">
                    <img
                      src={article.image}
                      alt={article.title}
                      className="w-full h-full object-cover"
                    />
                    <Badge className="absolute top-2 left-2 bg-black/70 text-white">
                      {article.category}
                    </Badge>
                  </div>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-white text-lg line-clamp-2">
                      {article.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-400 text-sm mb-4 line-clamp-3">
                      {article.summary}
                    </p>

                    <div className="flex flex-wrap gap-1 mb-4">
                      {article.tags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="text-xs bg-gray-700 text-gray-300"
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
                          <Calendar className="h-3 w-3" />
                          {article.publishedAt}
                        </span>
                      </div>
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {article.views}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="text-center">
              <Button
                variant="outline"
                className="border-white text-white hover:bg-white hover:text-black"
              >
                Load More Articles
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Footer />
    </div>
  );
}
