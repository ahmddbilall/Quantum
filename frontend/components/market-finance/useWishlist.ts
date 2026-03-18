"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { authService } from "@/services/authService";
import {
  getCachedMarketWatchlist,
  setCachedMarketWatchlist,
} from "@/lib/auth-storage";

export interface WishlistItem {
  symbol: string;
  name: string;
  type: "stock" | "crypto";
}

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
  const { user, isAuthenticated, syncUserProfile } = useAuth();

  // Get the default list for this type
  const getDefaultList = (): WishlistItem[] => {
    return type === "crypto"
      ? [...DEFAULT_CRYPTO_LIST]
      : [...DEFAULT_STOCK_LIST];
  };

  // Start with empty watchlist to avoid hydration mismatch
  const [watchlist, setWatchlist] = useState<WishlistItem[]>([]);
  const [isUserWatchlist, setIsUserWatchlist] = useState(false);

  const normalizeSymbol = (symbol: string, itemType: "stock" | "crypto") => {
    const normalized = symbol.trim().toUpperCase();

    if (itemType !== "crypto") {
      return normalized;
    }

    if (normalized.endsWith("USDT")) {
      return normalized;
    }

    if (normalized.endsWith("USD")) {
      return `${normalized.slice(0, -3)}USDT`;
    }

    return `${normalized}USDT`;
  };

  const normalizeWatchlistItem = (value: unknown): WishlistItem | null => {
    if (!value || typeof value !== "object") {
      return null;
    }

    const raw = value as Record<string, unknown>;
    const rawSymbol = String(raw.symbol || "").trim();
    const inferredType =
      raw.type === "crypto" || raw.type === "stock"
        ? raw.type
        : rawSymbol.toUpperCase().endsWith("USDT")
          ? "crypto"
          : "stock";
    const symbol = normalizeSymbol(rawSymbol, inferredType);

    if (!symbol) {
      return null;
    }

    return {
      symbol,
      name: String(raw.name || symbol).trim() || symbol,
      type: inferredType,
    };
  };

  const normalizeWatchlistFromPreferences = (
    preferences: Record<string, unknown> | null | undefined,
  ): WishlistItem[] => {
    const rawWatchlist = preferences?.watchlist;

    if (!Array.isArray(rawWatchlist)) {
      return [];
    }

    return rawWatchlist
      .map((item) => normalizeWatchlistItem(item))
      .filter((item): item is WishlistItem => item !== null);
  };

  const getUserWatchlist = (): WishlistItem[] => {
    return normalizeWatchlistFromPreferences(
      (user?.preferences || {}) as Record<string, unknown>,
    );
  };

  const getWatchlistByType = (items: WishlistItem[]) =>
    items.filter((item) => item.type === type);

  const getMergedWatchlist = (nextTypeItems: WishlistItem[]) => {
    const existing = getUserWatchlist().filter((item) => item.type !== type);
    return [...existing, ...nextTypeItems];
  };

  // Load watchlist based on authentication status
  useEffect(() => {
    if (isAuthenticated && user) {
      const fullWatchlist = getUserWatchlist();
      const typeItems = getWatchlistByType(fullWatchlist);
      const effective = typeItems.length > 0 ? typeItems : getDefaultList();

      setWatchlist(effective);
      setIsUserWatchlist(typeItems.length > 0);
      setCachedMarketWatchlist(type, effective);
    } else {
      // User is not logged in - use cached guest watchlist or defaults
      const cached = getCachedMarketWatchlist(type);
      const normalizedCached = (cached || [])
        .map((item) => normalizeWatchlistItem(item))
        .filter((item): item is WishlistItem => item !== null)
        .filter((item) => item.type === type);

      if (cached === null) {
        // No saved guest watchlist yet: show defaults without persisting.
        setWatchlist(getDefaultList());
      } else {
        // Guest explicitly saved watchlist (can be empty after removals).
        setWatchlist(normalizedCached);
      }

      setIsUserWatchlist(false);
    }
  }, [isAuthenticated, user, type]);

  const addToWatchlist = async (symbol: string, name: string) => {
    const normalizedSymbol = normalizeSymbol(symbol, type);
    const nextTypeItems = watchlist.some(
      (item) => item.symbol === normalizedSymbol,
    )
      ? watchlist
      : [...watchlist, { symbol: normalizedSymbol, name, type }];

    if (!isAuthenticated || !user) {
      setWatchlist(nextTypeItems);
      setCachedMarketWatchlist(type, nextTypeItems);
      setIsUserWatchlist(false);
      return;
    }

    try {
      const nextMerged = getMergedWatchlist(nextTypeItems);
      const nextPreferences = {
        ...((user.preferences || {}) as Record<string, unknown>),
        watchlist: nextMerged,
      };

      const updatedProfile = await authService.updateProfile({
        preferences: nextPreferences,
      });

      syncUserProfile(updatedProfile);

      const updatedTypeItems = getWatchlistByType(
        normalizeWatchlistFromPreferences(
          (updatedProfile.preferences || {}) as Record<string, unknown>,
        ),
      );

      const effective =
        updatedTypeItems.length > 0 ? updatedTypeItems : getDefaultList();
      setWatchlist(effective);
      setCachedMarketWatchlist(type, effective);
      setIsUserWatchlist(updatedTypeItems.length > 0);
    } catch (error) {
      console.error("Failed to sync watchlist to backend:", error);
    }
  };

  const removeFromWatchlist = async (symbol: string) => {
    const normalizedSymbol = normalizeSymbol(symbol, type);
    const nextTypeItems = watchlist.filter(
      (item) => item.symbol !== normalizedSymbol,
    );

    if (!isAuthenticated || !user) {
      setWatchlist(nextTypeItems);
      setCachedMarketWatchlist(type, nextTypeItems);
      setIsUserWatchlist(false);
      return;
    }

    try {
      const nextMerged = getMergedWatchlist(nextTypeItems);
      const nextPreferences = {
        ...((user.preferences || {}) as Record<string, unknown>),
        watchlist: nextMerged,
      };

      const updatedProfile = await authService.updateProfile({
        preferences: nextPreferences,
      });

      syncUserProfile(updatedProfile);

      const updatedTypeItems = getWatchlistByType(
        normalizeWatchlistFromPreferences(
          (updatedProfile.preferences || {}) as Record<string, unknown>,
        ),
      );

      const effective =
        updatedTypeItems.length > 0 ? updatedTypeItems : getDefaultList();
      setWatchlist(effective);
      setCachedMarketWatchlist(type, effective);
      setIsUserWatchlist(updatedTypeItems.length > 0);
    } catch (error) {
      console.error("Failed to sync watchlist to backend:", error);
    }
  };

  const isInWatchlist = (symbol: string) => {
    const normalizedSymbol = normalizeSymbol(symbol, type);
    return watchlist.some((item) => item.symbol === normalizedSymbol);
  };

  const resetToDefaults = () => {
    const defaultList = getDefaultList();

    void (async () => {
      if (!isAuthenticated || !user) {
        setWatchlist(defaultList);
        setCachedMarketWatchlist(type, defaultList);
        setIsUserWatchlist(false);
        return;
      }

      try {
        const nextMerged = getMergedWatchlist(defaultList);
        const nextPreferences = {
          ...((user.preferences || {}) as Record<string, unknown>),
          watchlist: nextMerged,
        };

        const updatedProfile = await authService.updateProfile({
          preferences: nextPreferences,
        });

        syncUserProfile(updatedProfile);

        const updatedTypeItems = getWatchlistByType(
          normalizeWatchlistFromPreferences(
            (updatedProfile.preferences || {}) as Record<string, unknown>,
          ),
        );

        const effective =
          updatedTypeItems.length > 0 ? updatedTypeItems : getDefaultList();
        setWatchlist(effective);
        setCachedMarketWatchlist(type, effective);
        setIsUserWatchlist(updatedTypeItems.length > 0);
      } catch (error) {
        console.error("Failed to reset watchlist defaults:", error);
      }
    })();
  };

  return {
    watchlist, // This is the user's or default watchlist
    defaultList: getDefaultList(), // This is the constant default list
    isUserWatchlist, // Whether this is the user's watchlist or the default list
    addToWatchlist,
    removeFromWatchlist,
    isInWatchlist,
    resetToDefaults,
  };
}
