"use client";

import { useState, useCallback, useEffect } from "react";
import { MarketItem, SearchHookReturn } from "./types";
import { getStockName } from "./utils";

export function useStockSearch(): SearchHookReturn {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<MarketItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const searchStock = useCallback(async (symbol: string) => {
    if (!symbol || symbol.trim().length === 0) {
      setSearchResults([]);
      setSearchError(null);
      return;
    }

    setIsSearching(true);
    setSearchError(null);

    try {
      const apiKey = process.env.NEXT_PUBLIC_FINNHUB_API_KEY || "demo";
      const upperSymbol = symbol.toUpperCase();

      const response = await fetch(
        `https://finnhub.io/api/v1/quote?symbol=${upperSymbol}&token=${apiKey}`
      );

      if (!response.ok) {
        throw new Error(`Stock "${symbol}" not found or API error`);
      }

      const data = await response.json();

      // Check if we got valid data
      if (data.c === 0 && data.d === 0 && data.dp === 0) {
        throw new Error(`Stock "${symbol}" not found`);
      }

      const stockData: MarketItem = {
        symbol: upperSymbol,
        name: getStockName(upperSymbol),
        price: data.c || 0,
        change: data.d || 0,
        changePercent: data.dp || 0,
      };

      setSearchResults([stockData]);
      console.log("Stock search result:", stockData);
    } catch (error) {
      console.error("Error searching stock:", error);
      setSearchError(
        error instanceof Error ? error.message : "Failed to search stock"
      );
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const debouncedSearch = useCallback(
    (() => {
      let timeout: NodeJS.Timeout;
      return (symbol: string) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => searchStock(symbol), 500);
      };
    })(),
    [searchStock]
  );

  useEffect(() => {
    debouncedSearch(searchQuery);
  }, [searchQuery, debouncedSearch]);

  return {
    searchQuery,
    setSearchQuery,
    searchResults,
    isSearching,
    searchError,
  };
}
