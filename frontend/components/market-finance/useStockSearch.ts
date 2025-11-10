"use client";

import { useState, useCallback, useEffect } from "react";
import { MarketItem, SearchHookReturn } from "./types";
import { getStockName } from "./utils";

// Popular stocks with their symbols and names
const STOCK_LIST = [
  { symbol: "AAPL", name: "Apple Inc." },
  { symbol: "MSFT", name: "Microsoft Corp." },
  { symbol: "GOOGL", name: "Alphabet Inc." },
  { symbol: "AMZN", name: "Amazon.com Inc." },
  { symbol: "TSLA", name: "Tesla Inc." },
  { symbol: "NVDA", name: "NVIDIA Corp." },
  { symbol: "META", name: "Meta Platforms Inc." },
  { symbol: "NFLX", name: "Netflix Inc." },
  { symbol: "BABA", name: "Alibaba Group" },
  { symbol: "JPM", name: "JPMorgan Chase & Co." },
  { symbol: "JNJ", name: "Johnson & Johnson" },
  { symbol: "V", name: "Visa Inc." },
  { symbol: "PG", name: "Procter & Gamble Co." },
  { symbol: "UNH", name: "UnitedHealth Group Inc." },
  { symbol: "HD", name: "Home Depot Inc." },
  { symbol: "MA", name: "Mastercard Inc." },
  { symbol: "DIS", name: "Walt Disney Co." },
  { symbol: "ADBE", name: "Adobe Inc." },
  { symbol: "CRM", name: "Salesforce Inc." },
  { symbol: "PYPL", name: "PayPal Holdings Inc." },
];

export function useStockSearch(): SearchHookReturn {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<MarketItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const searchStock = useCallback(async (query: string) => {
    if (!query || query.trim().length === 0) {
      setSearchResults([]);
      setSearchError(null);
      return;
    }

    setIsSearching(true);
    setSearchError(null);

    try {
      const apiKey = process.env.NEXT_PUBLIC_FINNHUB_API_KEY || "demo";
      const searchTerm = query.toUpperCase().trim();

      // Find matching stocks from our list
      const matches = STOCK_LIST.filter(
        (stock) =>
          stock.symbol.startsWith(searchTerm) ||
          stock.name.toUpperCase().includes(searchTerm)
      );

      if (matches.length === 0) {
        setSearchError(
          `No stock found matching "${query}". Try: AAPL, MSFT, GOOGL, etc.`
        );
        setSearchResults([]);
        setIsSearching(false);
        return;
      }

      // Fetch data for all matches
      const results = await Promise.allSettled(
        matches.map(async (stock) => {
          try {
            const response = await fetch(
              `https://finnhub.io/api/v1/quote?symbol=${stock.symbol}&token=${apiKey}`
            );

            if (!response.ok) {
              throw new Error(`Failed to fetch ${stock.symbol}`);
            }

            const data = await response.json();

            // Validate that we got real data
            if (
              data.c === 0 &&
              data.d === 0 &&
              data.dp === 0 &&
              data.h === 0 &&
              data.l === 0
            ) {
              throw new Error(`No data available for ${stock.symbol}`);
            }

            return {
              symbol: stock.symbol,
              name: stock.name,
              price: data.c || 0,
              change: data.d || 0,
              changePercent: data.dp || 0,
            };
          } catch (error) {
            console.error(`Error fetching ${stock.symbol}:`, error);
            return null;
          }
        })
      );

      // Filter out failed requests and null results
      const validResults = results
        .filter(
          (result): result is PromiseFulfilledResult<MarketItem> =>
            result.status === "fulfilled" && result.value !== null
        )
        .map((result) => result.value);

      if (validResults.length === 0) {
        setSearchError(
          `Could not fetch data for "${query}". API limit may be reached or stock data unavailable.`
        );
        setSearchResults([]);
      } else {
        setSearchResults(validResults);
        setSearchError(null);
      }
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
