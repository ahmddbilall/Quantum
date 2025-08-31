"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { MarketItem, MarketDataHookReturn } from "./types";
import { getStockName } from "./utils";

export function useStockDataFallback(): MarketDataHookReturn {
  const [data, setData] = useState<MarketItem[]>([]);
  const [isConnected] = useState(false); // Always false for fallback
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const stockSymbols = useMemo(
    () => ["AAPL", "MSFT", "GOOGL", "AMZN", "TSLA"],
    []
  );

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const apiKey = process.env.NEXT_PUBLIC_FINNHUB_API_KEY || "demo";

      const stockPromises = stockSymbols.map(async (symbol) => {
        const response = await fetch(
          `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey}`
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch ${symbol}: ${response.statusText}`);
        }

        const data = await response.json();

        return {
          symbol,
          name: getStockName(symbol),
          price: data.c || 0,
          change: data.d || 0,
          changePercent: data.dp || 0,
        };
      });

      const stocksData = await Promise.all(stockPromises);
      setData(stocksData);
      setLastUpdated(new Date());
      console.log("Stock data loaded (fallback mode):", stocksData);
    } catch (error) {
      console.error("Error fetching stock data:", error);
      setError(
        error instanceof Error ? error.message : "Failed to load stock data"
      );
    }
  }, [stockSymbols]);

  useEffect(() => {
    const initializeData = async () => {
      setIsLoading(true);
      await fetchData();
      setIsLoading(false);
    };

    initializeData();

    // Refresh data every 30 seconds in fallback mode
    const interval = setInterval(fetchData, 30000);

    return () => {
      clearInterval(interval);
    };
  }, [fetchData]);

  return {
    data,
    isConnected,
    error,
    isLoading,
    lastUpdated,
  };
}
