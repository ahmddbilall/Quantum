"use client";

import { useState, useEffect } from "react";
import { useCryptoData } from "./useCryptoData";
import { useCryptoDataFallback } from "./useCryptoDataFallback";
import { MarketDataHookReturn } from "./types";

export function useCryptoDataSmart(): MarketDataHookReturn & {
  isFallbackMode: boolean;
  connectionAttempts: number;
} {
  const [useFallback, setUseFallback] = useState(false);
  const [connectionAttempts, setConnectionAttempts] = useState(0);

  const webSocketData = useCryptoData();
  const fallbackData = useCryptoDataFallback();

  // Monitor WebSocket connection attempts and errors
  useEffect(() => {
    if (webSocketData.error && !useFallback) {
      setConnectionAttempts((prev) => prev + 1);

      // After 3 failed attempts or specific errors, switch to fallback
      if (
        connectionAttempts >= 2 ||
        webSocketData.error.includes("Failed to connect") ||
        webSocketData.error.includes("Protocol error")
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
