const ACCESS_TOKEN_KEY = "access_token";
const USER_KEY = "quantum_user";
const REMEMBER_ME_KEY = "quantum_remember_me";
const MARKET_WATCHLIST_STOCKS_KEY = "market-finance-watchlist-stocks";
const MARKET_WATCHLIST_CRYPTO_KEY = "market-finance-watchlist-crypto";

type WatchlistType = "stock" | "crypto";

interface CachedWatchlistItem {
  symbol: string;
  name: string;
  type: WatchlistType;
}

export function getAuthKeys() {
  return {
    ACCESS_TOKEN_KEY,
    USER_KEY,
    REMEMBER_ME_KEY,
  };
}

function hasWindow(): boolean {
  return typeof window !== "undefined";
}

function getStorageByRememberMe(rememberMe: boolean): Storage | null {
  if (!hasWindow()) {
    return null;
  }
  return rememberMe ? window.localStorage : window.sessionStorage;
}

function getStorageWithToken(): Storage | null {
  if (!hasWindow()) {
    return null;
  }

  if (window.localStorage.getItem(ACCESS_TOKEN_KEY)) {
    return window.localStorage;
  }

  if (window.sessionStorage.getItem(ACCESS_TOKEN_KEY)) {
    return window.sessionStorage;
  }

  return null;
}

function parseJson<T>(raw: string | null): T | null {
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function getWatchlistStorageKey(type: WatchlistType): string {
  return type === "stock"
    ? MARKET_WATCHLIST_STOCKS_KEY
    : MARKET_WATCHLIST_CRYPTO_KEY;
}

export function getAccessToken(): string | null {
  const storage = getStorageWithToken();
  if (!storage) {
    return null;
  }
  return storage.getItem(ACCESS_TOKEN_KEY);
}

export function getStoredUser<T>(): T | null {
  if (!hasWindow()) {
    return null;
  }

  const raw =
    window.localStorage.getItem(USER_KEY) ||
    window.sessionStorage.getItem(USER_KEY);

  if (!raw) {
    return null;
  }

  const parsed = parseJson<T>(raw);
  if (!parsed) {
    clearStoredAuth();
    return null;
  }

  return parsed;
}

export function setAuthSession(token: string, rememberMe: boolean): void {
  if (!hasWindow()) {
    return;
  }

  clearStoredAuth();

  const storage = getStorageByRememberMe(rememberMe);
  storage?.setItem(ACCESS_TOKEN_KEY, token);
  window.localStorage.setItem(REMEMBER_ME_KEY, rememberMe ? "1" : "0");
}

export function setStoredUser(user: unknown): void {
  if (!hasWindow()) {
    return;
  }

  const storage = getStorageWithToken() || getStorageByRememberMe(true);
  storage?.setItem(USER_KEY, JSON.stringify(user));
}

export function clearStoredAuth(): void {
  if (!hasWindow()) {
    return;
  }

  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
  window.sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  window.sessionStorage.removeItem(USER_KEY);
}

export function getCachedMarketWatchlist(
  type: WatchlistType,
): CachedWatchlistItem[] | null {
  if (!hasWindow()) {
    return null;
  }

  const key = getWatchlistStorageKey(type);
  const parsed = parseJson<unknown[]>(window.localStorage.getItem(key));
  if (!Array.isArray(parsed)) {
    return null;
  }

  return parsed
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const raw = item as Record<string, unknown>;
      const symbol = String(raw.symbol || "")
        .trim()
        .toUpperCase();
      const name = String(raw.name || symbol).trim() || symbol;
      const itemType = raw.type === "crypto" ? "crypto" : "stock";

      if (!symbol) {
        return null;
      }

      return {
        symbol,
        name,
        type: itemType,
      } satisfies CachedWatchlistItem;
    })
    .filter((item): item is CachedWatchlistItem => item !== null);
}

export function setCachedMarketWatchlist(
  type: WatchlistType,
  watchlist: CachedWatchlistItem[],
): void {
  if (!hasWindow()) {
    return;
  }

  const key = getWatchlistStorageKey(type);
  window.localStorage.setItem(key, JSON.stringify(watchlist));
}

export function clearMarketWatchlistCache(): void {
  if (!hasWindow()) {
    return;
  }

  window.localStorage.removeItem(MARKET_WATCHLIST_STOCKS_KEY);
  window.localStorage.removeItem(MARKET_WATCHLIST_CRYPTO_KEY);
}

export function clearAllClientCache(): void {
  if (!hasWindow()) {
    return;
  }

  clearStoredAuth();
  clearMarketWatchlistCache();
  window.localStorage.removeItem(REMEMBER_ME_KEY);
}

export function isRememberMeEnabled(): boolean {
  if (!hasWindow()) {
    return false;
  }

  return window.localStorage.getItem(REMEMBER_ME_KEY) === "1";
}
