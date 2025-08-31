"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wifi, WifiOff, TrendingUp, TrendingDown } from "lucide-react";
import { MarketWidgetProps } from "./types";

export function MarketWidget({
  data,
  title,
  icon: Icon,
  isPriceInDollars = true,
  isConnected = false,
  error = null,
  isLoading = false,
  lastUpdated,
}: MarketWidgetProps & { lastUpdated?: Date | null }) {
  return (
    <Card className="bg-zinc-900 border-gray-700 hover:border-white/50 transition-all duration-500 rounded-2xl">
      <CardHeader className="pb-3">
        <CardTitle className="text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className="h-5 w-5" />
            {title}
          </div>
          <div className="flex items-center gap-2">
            {error ? (
              <div className="flex items-center gap-1 text-red-400">
                <WifiOff className="h-4 w-4" />
                <span className="text-xs">Error</span>
              </div>
            ) : isConnected ? (
              <div className="flex items-center gap-1 text-green-400">
                <Wifi className="h-4 w-4" />
                <span className="text-xs">Live</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-yellow-400">
                <WifiOff className="h-4 w-4" />
                <span className="text-xs">Connecting</span>
              </div>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {error ? (
          <div className="text-center py-8">
            <div className="text-red-400 mb-2">⚠️ Connection Error</div>
            <div className="text-sm text-gray-400 mb-4">{error}</div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.reload()}
              className="border-red-400 text-red-400 hover:bg-red-400 hover:text-white"
            >
              Retry
            </Button>
          </div>
        ) : isLoading || data.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <div className="animate-pulse mb-2">📊</div>
            <div className="text-sm">
              {isLoading ? "Loading market data..." : "No data available"}
            </div>
          </div>
        ) : (
          data.map((item) => (
            <div
              key={item.symbol}
              className="flex items-center justify-between p-3 bg-zinc-800 rounded-lg hover:bg-zinc-700 transition-colors duration-300"
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
                  {typeof item.price === "number"
                    ? item.price.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: item.price < 1 ? 6 : 2,
                      })
                    : "0.00"}
                </div>
                <div
                  className={`text-xs flex items-center gap-1 ${
                    item.changePercent >= 0 ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {item.changePercent >= 0 ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  {item.changePercent >= 0 ? "+" : ""}
                  {typeof item.changePercent === "number"
                    ? item.changePercent.toFixed(2)
                    : "0.00"}
                  %
                </div>
              </div>
            </div>
          ))
        )}
        {!error && !isLoading && data.length > 0 && lastUpdated && (
          <div className="text-xs text-gray-500 text-center pt-2 border-t border-gray-700">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
