"use client";

import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, DollarSign, Wifi, WifiOff } from "lucide-react";
import { MarketWidget } from "./MarketWidget";
import { useStockSearch } from "./useStockSearch";
import { useStockDataSmart } from "./useStockDataSmart";
import TradingViewStocks from "./TradingViewStocks";
import { useWishlist } from "./useWishlist";

export function StockTab() {
  const stockSearch = useStockSearch();
  const stockData = useStockDataSmart();
  const {
    watchlist,
    addToWatchlist,
    removeFromWatchlist,
    isInWatchlist,
    resetToDefaults,
    isUserWatchlist,
  } = useWishlist("stock");

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
        <div className="mb-6 bg-zinc-900 rounded-lg border border-zinc-800">
          {/* Header Section */}
          <div className="p-4 border-b border-zinc-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Search className="h-5 w-5 text-white" />
                <h3 className="text-lg font-semibold text-white">
                  Search Results
                </h3>
              </div>
              <span className="text-sm text-gray-400">
                {stockSearch.searchResults.length}{" "}
                {stockSearch.searchResults.length === 1 ? "result" : "results"}
              </span>
            </div>
          </div>

          {/* Scrollable Content Section */}
          <ScrollArea className="h-[400px]">
            <div className="p-4">
              <div className="space-y-3">
                {stockSearch.searchResults.map((item) => (
                  <div
                    key={item.symbol}
                    className="flex items-center justify-between p-3 bg-zinc-800 rounded-lg hover:bg-zinc-700 transition-colors duration-300 group"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                        <span className="text-xs font-bold text-white">
                          {item.symbol.slice(0, 2)}
                        </span>
                      </div>
                      <div>
                        <div className="font-semibold text-white">
                          {item.symbol}
                        </div>
                        <div className="text-xs text-gray-400">{item.name}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="font-semibold text-white">
                          $
                          {typeof item.price === "number"
                            ? item.price.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: item.price < 1 ? 6 : 2,
                              })
                            : "0.00"}
                        </div>
                        <div
                          className={`text-xs flex items-center gap-1 justify-end ${
                            item.changePercent >= 0
                              ? "text-green-400"
                              : "text-red-400"
                          }`}
                        >
                          {item.changePercent >= 0 ? "+" : ""}
                          {typeof item.changePercent === "number"
                            ? item.changePercent.toFixed(2)
                            : "0.00"}
                          %
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          if (isInWatchlist(item.symbol)) {
                            removeFromWatchlist(item.symbol);
                          } else {
                            addToWatchlist(item.symbol, item.name);
                          }
                        }}
                        className={`h-8 w-8 rounded-lg flex items-center justify-center transition-all duration-200 ${
                          isInWatchlist(item.symbol)
                            ? "text-red-400 hover:text-red-300 hover:bg-red-400/10"
                            : "text-green-400 hover:text-green-300 hover:bg-green-400/10"
                        }`}
                        title={
                          isInWatchlist(item.symbol)
                            ? "Remove from watchlist"
                            : "Add to watchlist"
                        }
                      >
                        {isInWatchlist(item.symbol) ? (
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        ) : (
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 4v16m8-8H4"
                            />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </ScrollArea>
        </div>
      )}

      {/* Error for search */}
      {stockSearch.searchQuery && stockSearch.searchError && (
        <div className="mb-6 p-4 bg-zinc-900 border border-zinc-700 rounded-lg">
          <div className="flex items-center gap-2 text-white">
            <Search className="h-5 w-5" />
            <span className="font-medium">Search Error</span>
          </div>
          <p className="text-sm text-gray-400 mt-1">
            {stockSearch.searchError}
          </p>
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

        <TradingViewStocks
          wishlist={watchlist}
          onResetToDefaults={resetToDefaults}
          isUserWatchlist={isUserWatchlist}
        />
      </div>
    </div>
  );
}
