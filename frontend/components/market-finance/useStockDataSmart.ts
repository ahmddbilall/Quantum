"use client";

import { useState, useEffect } from "react";
import { useStockData } from "./useStockData";
import { useStockDataFallback } from "./useStockDataFallback";
import { MarketDataHookReturn } from "./types";

export function useStockDataSmart(): MarketDataHookReturn & {
  isFallbackMode: boolean;
  connectionAttempts: number;
} {
  const [useFallback, setUseFallback] = useState(false);
  const [connectionAttempts, setConnectionAttempts] = useState(0);

  const webSocketData = useStockData();
  const fallbackData = useStockDataFallback();

  // Monitor WebSocket connection attempts and errors
  useEffect(() => {
    if (webSocketData.error && !useFallback) {
      setConnectionAttempts((prev) => prev + 1);

      // After 3 failed attempts or specific errors, switch to fallback
      if (
        connectionAttempts >= 2 ||
        webSocketData.error.includes("Failed to connect") ||
        webSocketData.error.includes("Invalid API key") ||
        webSocketData.error.includes("rate limit")
      ) {
        console.log("Switching to fallback mode due to WebSocket issues");
        setUseFallback(true);
      }
    }

    // If WebSocket successfully connects, reset attempts counter
    if (webSocketData.isConnected && connectionAttempts > 0) {
      setConnectionAttempts(0);
    }
  }, [
    webSocketData.error,
    webSocketData.isConnected,
    connectionAttempts,
    useFallback,
  ]);

  // Return fallback data if we're using fallback mode
  if (useFallback) {
    return {
      ...fallbackData,
      isFallbackMode: true,
      connectionAttempts,
    };
  }

  // Return WebSocket data by default
  return {
    ...webSocketData,
    isFallbackMode: false,
    connectionAttempts,
  };
}
