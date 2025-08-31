"use client";

import { useState, useCallback, useEffect } from "react";
import { MarketItem, SearchHookReturn } from "./types";
import { getCryptoName, getCryptoDisplaySymbol } from "./utils";

export function useCryptoSearch(): SearchHookReturn {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<MarketItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const searchCrypto = useCallback(async (symbol: string) => {
    if (!symbol || symbol.trim().length === 0) {
      setSearchResults([]);
      setSearchError(null);
      return;
    }

    setIsSearching(true);
    setSearchError(null);

    try {
      // Try different symbol formats
      let searchSymbol = symbol.toUpperCase();
      if (!searchSymbol.includes("USDT")) {
        searchSymbol = searchSymbol + "USDT";
      }

      const response = await fetch(
        `https://api.binance.com/api/v3/ticker/24hr?symbol=${searchSymbol}`
      );

      if (!response.ok) {
        throw new Error(`Cryptocurrency "${symbol}" not found`);
      }

      const data = await response.json();

      const cryptoData: MarketItem = {
        symbol: getCryptoDisplaySymbol(data.symbol),
        name: getCryptoName(data.symbol),
        price: parseFloat(data.lastPrice),
        change: parseFloat(data.priceChange),
        changePercent: parseFloat(data.priceChangePercent),
      };

      setSearchResults([cryptoData]);
      console.log("Crypto search result:", cryptoData);
    } catch (error) {
      console.error("Error searching crypto:", error);
      setSearchError(
        error instanceof Error
          ? error.message
          : "Failed to search cryptocurrency"
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
        timeout = setTimeout(() => searchCrypto(symbol), 500);
      };
    })(),
    [searchCrypto]
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
