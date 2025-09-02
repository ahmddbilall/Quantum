"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { MarketItem, MarketDataHookReturn } from "./types";
import { getCryptoName, getCryptoDisplaySymbol } from "./utils";

export function useCryptoDataFallback(): MarketDataHookReturn {
  const [data, setData] = useState<MarketItem[]>([]);
  const [isConnected] = useState(false); // Always false for fallback
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const cryptoSymbols = useMemo(
    () => ["BTCUSDT", "ETHUSDT", "BNBUSDT", "ADAUSDT", "SOLUSDT"],
    []
  );

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch(
        `https://api.binance.com/api/v3/ticker/24hr?symbols=["${cryptoSymbols.join(
          '","'
        )}"]`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch crypto data: ${response.statusText}`);
      }

      const data = await response.json();

      const cryptoData = data.map((item: any) => ({
        symbol: getCryptoDisplaySymbol(item.symbol),
        name: getCryptoName(item.symbol),
        price: parseFloat(item.lastPrice),
        change: parseFloat(item.priceChange),
        changePercent: parseFloat(item.priceChangePercent),
      }));

      setData(cryptoData);
      setLastUpdated(new Date());
      console.log("Crypto data loaded (fallback mode):", cryptoData);
    } catch (error) {
      console.error("Error fetching crypto data:", error);
      setError(
        error instanceof Error ? error.message : "Failed to load crypto data"
      );
    }
  }, [cryptoSymbols]);

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
