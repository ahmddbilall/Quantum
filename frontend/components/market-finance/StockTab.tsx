"use client";

import { Input } from "@/components/ui/input";
import { Search, DollarSign, Wifi, WifiOff } from "lucide-react";
import { MarketWidget } from "./MarketWidget";
import { useStockSearch } from "./useStockSearch";
import { useStockDataSmart } from "./useStockDataSmart";
import TradingViewStocks from "./TradingViewStocks";

export function StockTab() {
  const stockSearch = useStockSearch();
  const stockData = useStockDataSmart();

  return (
    <div className="space-y-6">
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search stocks (e.g., AAPL, MSFT, GOOGL)..."
            value={stockSearch.searchQuery}
            onChange={(e) => stockSearch.setSearchQuery(e.target.value)}
            className="pl-10 bg-transparent border-gray-700 text-white placeholder-gray-400 hover:border-white/50 transition-all duration-300"
          />
        </div>
        {stockSearch.isSearching && (
          <div className="mt-2 text-sm text-gray-400 flex items-center gap-2">
            <div className="animate-spin h-4 w-4 border-2 border-gray-400 border-t-transparent rounded-full"></div>
            Searching for stock...
          </div>
        )}
      </div>

      {/* Search Results */}
      {stockSearch.searchQuery && stockSearch.searchResults.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Search Results
          </h3>
          <MarketWidget
            data={stockSearch.searchResults}
            title="Search Results"
            icon={Search}
            isPriceInDollars={true}
            isConnected={true}
            error={stockSearch.searchError}
            isLoading={stockSearch.isSearching}
          />
        </div>
      )}

      {/* Error for search */}
      {stockSearch.searchQuery && stockSearch.searchError && (
        <div className="mb-6 p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
          <div className="flex items-center gap-2 text-red-400">
            <Search className="h-5 w-5" />
            <span className="font-medium">Search Error</span>
          </div>
          <p className="text-sm text-red-300 mt-1">{stockSearch.searchError}</p>
        </div>
      )}

      {/* Default Market Data - TradingView Widget */}
      <div className="space-y-2">
        {/* {stockData.isFallbackMode && (
          <div className="p-3 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
            <div className="flex items-center gap-2 text-yellow-400">
              <WifiOff className="h-4 w-4" />
              <span className="text-sm">
                WebSocket connection issues detected - using TradingView for
                reliable data
              </span>
            </div>
          </div>
        )} */}

        <TradingViewStocks />
      </div>
    </div>
  );
}
