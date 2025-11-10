"use client";

import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WifiOff } from "lucide-react";
import { useState } from "react";
import { StockTab, CryptoTab, NewsTab } from "@/components/market-finance";

export default function MarketFinancePage() {
  const [error] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("news");

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar showSearch={true} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Market & Finance
          </h1>
          <p className="text-gray-300 text-xl">
            Track markets, cryptocurrencies, and financial news in real-time
          </p>

          {/* Global Status Indicator */}
          {error && (
            <div className="mt-4 p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
              <div className="flex items-center gap-2 text-red-400">
                <WifiOff className="h-5 w-5" />
                <span className="font-medium">Connection Error</span>
              </div>
              <p className="text-sm text-red-300 mt-1">{error}</p>
            </div>
          )}
        </div>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="bg-zinc-900 border-gray-700">
            <TabsTrigger
              value="news"
              className="data-[state=active]:bg-white data-[state=active]:text-black text-white hover:bg-zinc-800"
            >
              News
            </TabsTrigger>
            <TabsTrigger
              value="stocks"
              className="data-[state=active]:bg-white data-[state=active]:text-black text-white hover:bg-zinc-800"
            >
              Stocks
            </TabsTrigger>
            <TabsTrigger
              value="crypto"
              className="data-[state=active]:bg-white data-[state=active]:text-black text-white hover:bg-zinc-800"
            >
              Cryptocurrency
            </TabsTrigger>
          </TabsList>

          {/* Render all tabs but only show the active one */}
          <div className="space-y-6">
            <div className={activeTab === "stocks" ? "block" : "hidden"}>
              <StockTab />
            </div>

            <div className={activeTab === "crypto" ? "block" : "hidden"}>
              <CryptoTab />
            </div>

            <div className={activeTab === "news" ? "block" : "hidden"}>
              <NewsTab />
            </div>
          </div>
        </Tabs>
      </div>

      <Footer />
    </div>
  );
}
