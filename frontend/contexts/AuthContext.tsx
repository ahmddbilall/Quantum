"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { authService } from "@/services/authService";
import { parseApiError } from "@/lib/error-parser";
import { BackendUserProfile, RegisterData, User } from "@/types";
import {
  clearAllClientCache,
  clearStoredAuth,
  getAccessToken,
  getCachedMarketWatchlist,
  getStoredUser,
  setCachedMarketWatchlist,
  setAuthSession,
  setStoredUser,
} from "@/lib/auth-storage";

type WatchlistType = "stock" | "crypto";

interface WatchlistItem {
  symbol: string;
  name: string;
  type: WatchlistType;
}

const normalizeSymbol = (symbol: string, type: WatchlistType): string => {
  const normalized = symbol.trim().toUpperCase();

  if (type !== "crypto") {
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

const normalizeWatchlistItem = (value: unknown): WatchlistItem | null => {
  if (!value || typeof value !== "object") {
    return null;
  }

  const raw = value as Record<string, unknown>;
  const rawSymbol = String(raw.symbol || "").trim();
  if (!rawSymbol) {
    return null;
  }

  const inferredType: WatchlistType =
    raw.type === "crypto" || raw.type === "stock"
      ? raw.type
      : rawSymbol.toUpperCase().endsWith("USDT")
        ? "crypto"
        : "stock";

  const symbol = normalizeSymbol(rawSymbol, inferredType);

  return {
    symbol,
    name: String(raw.name || symbol).trim() || symbol,
    type: inferredType,
  };
};

const normalizeWatchlist = (value: unknown): WatchlistItem[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => normalizeWatchlistItem(item))
    .filter((item): item is WatchlistItem => item !== null);
};

const dedupeWatchlist = (items: WatchlistItem[]): WatchlistItem[] => {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = `${item.type}:${item.symbol.toUpperCase()}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
};

const cacheWatchlistByType = (watchlist: WatchlistItem[]) => {
  setCachedMarketWatchlist(
    "stock",
    watchlist.filter((item) => item.type === "stock"),
  );
  setCachedMarketWatchlist(
    "crypto",
    watchlist.filter((item) => item.type === "crypto"),
  );
};

const areWatchlistsEqual = (
  a: WatchlistItem[],
  b: WatchlistItem[],
): boolean => {
  if (a.length !== b.length) {
    return false;
  }

  return a.every((item, index) => {
    const other = b[index];
    return (
      item.symbol === other.symbol &&
      item.name === other.name &&
      item.type === other.type
    );
  });
};

const getGuestCachedWatchlist = (): {
  hasGuestCache: boolean;
  guestWatchlist: WatchlistItem[];
} => {
  const cachedStock = getCachedMarketWatchlist("stock");
  const cachedCrypto = getCachedMarketWatchlist("crypto");

  const hasGuestCache = cachedStock !== null || cachedCrypto !== null;

  const guestWatchlist = dedupeWatchlist([
    ...(cachedStock || []),
    ...(cachedCrypto || []),
  ]);

  return { hasGuestCache, guestWatchlist };
};

const mapBackendProfileToUser = (profile: BackendUserProfile): User => ({
  id: profile.id,
  email: profile.email,
  created_at: profile.created_at,
  name: profile.full_name || "User",
  full_name: profile.full_name,
  is_active: profile.is_active,
  is_superuser: profile.is_superuser,
  profile: profile.profile,
  preferences: profile.preferences,
});

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (
    email: string,
    password: string,
    options?: { rememberMe?: boolean },
  ) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: (
    idToken: string,
    options?: { rememberMe?: boolean },
  ) => Promise<{ success: boolean; error?: string }>;
  register: (
    data: RegisterData,
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isLoading: boolean;
  refreshProfile: () => Promise<void>;
  syncUserProfile: (profile: BackendUserProfile) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const syncUserProfile = (profile: BackendUserProfile) => {
    const mapped = mapBackendProfileToUser(profile);
    setUser(mapped);
    setIsAuthenticated(true);
    setStoredUser(mapped);

    const preferences = (profile.preferences || {}) as Record<string, unknown>;
    const watchlist = normalizeWatchlist(preferences.watchlist);
    cacheWatchlistByType(watchlist);
  };

  const mergeGuestWatchlistIntoBackend = async (
    profile: BackendUserProfile,
  ): Promise<BackendUserProfile> => {
    const preferences = (profile.preferences || {}) as Record<string, unknown>;
    const backendWatchlist = dedupeWatchlist(
      normalizeWatchlist(preferences.watchlist),
    );

    const { hasGuestCache, guestWatchlist } = getGuestCachedWatchlist();

    if (!hasGuestCache || guestWatchlist.length === 0) {
      cacheWatchlistByType(backendWatchlist);
      return profile;
    }

    const merged = dedupeWatchlist([...backendWatchlist, ...guestWatchlist]);

    if (areWatchlistsEqual(backendWatchlist, merged)) {
      cacheWatchlistByType(backendWatchlist);
      return profile;
    }

    const updated = await authService.updateProfile({
      preferences: {
        ...preferences,
        watchlist: merged,
      },
    });

    cacheWatchlistByType(merged);
    return updated;
  };

  const refreshProfileInternal = async (initializeWatchlist: boolean) => {
    const profile = await authService.getProfile();
    const finalProfile = initializeWatchlist
      ? await mergeGuestWatchlistIntoBackend(profile)
      : profile;
    syncUserProfile(finalProfile);
  };

  // Parse user from local storage initially
  useEffect(() => {
    const initAuth = async () => {
      const token = getAccessToken();
      const storedUser = getStoredUser<User>();

      if (storedUser) {
        setUser(storedUser);
      }

      if (!token) {
        setUser(null);
        setIsAuthenticated(false);
        clearStoredAuth();
        setIsLoading(false);
        return;
      }

      setIsAuthenticated(true);

      try {
        await refreshProfileInternal(true);
      } catch (error) {
        const parsed = parseApiError(error);
        if (parsed.status === 401 || parsed.status === 403) {
          setUser(null);
          setIsAuthenticated(false);
          clearStoredAuth();
        }
      }

      setIsLoading(false);
    };
    initAuth();
  }, []);

  useEffect(() => {
    const onStorageChange = (event: StorageEvent) => {
      if (event.key === "access_token" && !event.newValue) {
        setUser(null);
        setIsAuthenticated(false);
      }
    };

    window.addEventListener("storage", onStorageChange);
    return () => window.removeEventListener("storage", onStorageChange);
  }, []);

  const refreshProfile = async () => {
    await refreshProfileInternal(false);
  };

  const login = async (
    email: string,
    password: string,
    options?: { rememberMe?: boolean },
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const data = await authService.login({ email, password });
      setAuthSession(data.access_token, options?.rememberMe ?? false);
      setIsAuthenticated(true);

      await refreshProfileInternal(true);
      return { success: true };
    } catch (error) {
      const parsed = parseApiError(error, "Unable to login. Please try again.");
      console.error("Login failed:", parsed.message, error);
      return { success: false, error: parsed.message };
    }
  };

  const loginWithGoogle = async (
    idToken: string,
    options?: { rememberMe?: boolean },
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const data = await authService.googleLogin(idToken);
      setAuthSession(data.access_token, options?.rememberMe ?? false);
      setIsAuthenticated(true);
      await refreshProfileInternal(true);
      return { success: true };
    } catch (error) {
      const parsed = parseApiError(
        error,
        "Unable to complete Google sign-in. Please try again.",
      );
      console.error("Google sign-in failed:", parsed.message, error);
      return { success: false, error: parsed.message };
    }
  };

  const register = async (
    data: RegisterData,
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      await authService.register(data);
      return await login(data.email, data.password, { rememberMe: true });
    } catch (error) {
      const parsed = parseApiError(
        error,
        "Unable to register. Please try again.",
      );
      console.error("Registration failed:", parsed.message, error);
      return { success: false, error: parsed.message };
    }
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    clearAllClientCache();

    setTimeout(() => {
      if (typeof window !== "undefined") {
        window.location.href = "/";
      }
    }, 0);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        login,
        loginWithGoogle,
        logout,
        isLoading,
        register,
        refreshProfile,
        syncUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
