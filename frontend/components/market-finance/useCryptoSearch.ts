"use client";

import { useState, useCallback, useEffect } from "react";
import { MarketItem, SearchHookReturn } from "./types";
import { getCryptoName, getCryptoDisplaySymbol } from "./utils";

// Popular cryptocurrencies with their symbols
const CRYPTO_LIST = [
  { symbol: "BTCUSDT", display: "BTC", name: "Bitcoin" },
  { symbol: "ETHUSDT", display: "ETH", name: "Ethereum" },
  { symbol: "BNBUSDT", display: "BNB", name: "Binance Coin" },
  { symbol: "ADAUSDT", display: "ADA", name: "Cardano" },
  { symbol: "SOLUSDT", display: "SOL", name: "Solana" },
  { symbol: "XRPUSDT", display: "XRP", name: "XRP" },
  { symbol: "DOTUSDT", display: "DOT", name: "Polkadot" },
  { symbol: "AVAXUSDT", display: "AVAX", name: "Avalanche" },
  { symbol: "LINKUSDT", display: "LINK", name: "Chainlink" },
  { symbol: "MATICUSDT", display: "MATIC", name: "Polygon" },
  { symbol: "ATOMUSDT", display: "ATOM", name: "Cosmos" },
  { symbol: "LTCUSDT", display: "LTC", name: "Litecoin" },
  { symbol: "UNIUSDT", display: "UNI", name: "Uniswap" },
  { symbol: "ALGOUSDT", display: "ALGO", name: "Algorand" },
  { symbol: "VETUSDT", display: "VET", name: "VeChain" },
  { symbol: "FTMUSDT", display: "FTM", name: "Fantom" },
  { symbol: "DOGEUSDT", display: "DOGE", name: "Dogecoin" },
  { symbol: "SHIBUSDT", display: "SHIB", name: "Shiba Inu" },
  { symbol: "PEPEUSDT", display: "PEPE", name: "Pepe" },
];

export function useCryptoSearch(): SearchHookReturn {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<MarketItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const searchCrypto = useCallback(async (query: string) => {
    if (!query || query.trim().length === 0) {
      setSearchResults([]);
      setSearchError(null);
      return;
    }

    setIsSearching(true);
    setSearchError(null);

    try {
      const searchTerm = query.toUpperCase().trim();

      // Find matching cryptocurrencies from our list
      const matches = CRYPTO_LIST.filter(
        (crypto) =>
          crypto.display.startsWith(searchTerm) ||
          crypto.name.toUpperCase().includes(searchTerm) ||
          crypto.symbol.startsWith(searchTerm)
      );

      if (matches.length === 0) {
        setSearchError(`No cryptocurrency found matching "${query}"`);
        setSearchResults([]);
        setIsSearching(false);
        return;
      }

      // Fetch data for all matches
      const results = await Promise.allSettled(
        matches.map(async (crypto) => {
          try {
            const response = await fetch(
              `https://api.binance.com/api/v3/ticker/24hr?symbol=${crypto.symbol}`
            );

            if (!response.ok) {
              throw new Error(`Failed to fetch ${crypto.display}`);
            }

            const data = await response.json();

            return {
              symbol: crypto.symbol, // Use full Binance symbol (BTCUSDT)
              name: crypto.name,
              price: parseFloat(data.lastPrice),
              change: parseFloat(data.priceChange),
              changePercent: parseFloat(data.priceChangePercent),
            };
          } catch (error) {
            console.error(`Error fetching ${crypto.display}:`, error);
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
          `Could not fetch data for "${query}". Please try again.`
        );
        setSearchResults([]);
      } else {
        setSearchResults(validResults);
        setSearchError(null);
      }
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
