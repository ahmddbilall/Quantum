"use client";

import { useState, useEffect } from "react";

export interface WishlistItem {
  symbol: string;
  name: string;
  type: "stock" | "crypto";
}

const STORAGE_KEY_STOCKS = "market-finance-watchlist-stocks";
const STORAGE_KEY_CRYPTO = "market-finance-watchlist-crypto";

// Default lists - these are constant and never change
const DEFAULT_CRYPTO_LIST: WishlistItem[] = [
  { symbol: "BTCUSDT", name: "Bitcoin", type: "crypto" },
  { symbol: "ETHUSDT", name: "Ethereum", type: "crypto" },
  { symbol: "BNBUSDT", name: "Binance Coin", type: "crypto" },
  { symbol: "ADAUSDT", name: "Cardano", type: "crypto" },
  { symbol: "SOLUSDT", name: "Solana", type: "crypto" },
  { symbol: "MATICUSDT", name: "Polygon", type: "crypto" },
];

const DEFAULT_STOCK_LIST: WishlistItem[] = [
  { symbol: "AAPL", name: "Apple Inc.", type: "stock" },
  { symbol: "MSFT", name: "Microsoft", type: "stock" },
  { symbol: "GOOGL", name: "Alphabet Inc.", type: "stock" },
  { symbol: "AMZN", name: "Amazon", type: "stock" },
  { symbol: "TSLA", name: "Tesla", type: "stock" },
  { symbol: "NVDA", name: "NVIDIA", type: "stock" },
];

export function useWishlist(type: "stock" | "crypto") {
  const storageKey = type === "stock" ? STORAGE_KEY_STOCKS : STORAGE_KEY_CRYPTO;

  // Get the default list for this type
  const getDefaultList = (): WishlistItem[] => {
    return type === "crypto"
      ? [...DEFAULT_CRYPTO_LIST]
      : [...DEFAULT_STOCK_LIST];
  };

  // Start with empty watchlist to avoid hydration mismatch
  const [watchlist, setWatchlist] = useState<WishlistItem[]>([]);
  const [mounted, setMounted] = useState(false);

  // Load from localStorage only after component mounts (client-side only)
  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);

        // Migrate old format to new format for crypto
        if (type === "crypto") {
          const migrated = parsed.map((item: WishlistItem) => {
            // Convert old USD format to USDT format
            if (item.symbol.endsWith("USD") && !item.symbol.endsWith("USDT")) {
              return { ...item, symbol: item.symbol.replace("USD", "USDT") };
            }
            return item;
          });
          setWatchlist(migrated);
          localStorage.setItem(storageKey, JSON.stringify(migrated));
        } else {
          setWatchlist(parsed);
        }
      } catch {
        // Initialize with default list on error
        const defaultList = getDefaultList();
        setWatchlist(defaultList);
        localStorage.setItem(storageKey, JSON.stringify(defaultList));
      }
    } else {
      // First time - initialize with default list
      const defaultList = getDefaultList();
      setWatchlist(defaultList);
      localStorage.setItem(storageKey, JSON.stringify(defaultList));
    }
  }, [storageKey]);

  // Save to localStorage whenever watchlist changes (but only after mount)
  useEffect(() => {
    if (mounted && watchlist.length > 0) {
      localStorage.setItem(storageKey, JSON.stringify(watchlist));
    }
  }, [watchlist, storageKey, mounted]);

  const addToWatchlist = (symbol: string, name: string) => {
    setWatchlist((prev) => {
      // Check if already exists
      if (prev.some((item) => item.symbol === symbol)) {
        return prev;
      }
      return [...prev, { symbol, name, type }];
    });
  };

  const removeFromWatchlist = (symbol: string) => {
    setWatchlist((prev) => prev.filter((item) => item.symbol !== symbol));
  };

  const isInWatchlist = (symbol: string) => {
    return watchlist.some((item) => item.symbol === symbol);
  };

  const resetToDefaults = () => {
    const defaultList = getDefaultList();
    setWatchlist(defaultList);
    localStorage.setItem(storageKey, JSON.stringify(defaultList));
  };

  return {
    watchlist, // This is the user's watchlist (can be modified)
    defaultList: getDefaultList(), // This is the constant default list
    addToWatchlist,
    removeFromWatchlist,
    isInWatchlist,
    resetToDefaults,
  };
}
