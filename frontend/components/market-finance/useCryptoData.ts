"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { MarketItem, MarketDataHookReturn } from "./types";
import { getCryptoName, getCryptoDisplaySymbol } from "./utils";

export function useCryptoData(): MarketDataHookReturn {
  const [data, setData] = useState<MarketItem[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const cryptoSymbols = useMemo(
    () => ["BTCUSDT", "ETHUSDT", "BNBUSDT", "ADAUSDT", "SOLUSDT"],
    []
  );

  const debouncedUpdate = useCallback(
    (() => {
      let timeout: NodeJS.Timeout;
      return (updateFn: () => void) => {
        clearTimeout(timeout);
        timeout = setTimeout(updateFn, 100);
      };
    })(),
    []
  );

  const fetchInitialData = useCallback(async () => {
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
      console.log("Initial crypto data loaded:", cryptoData);
    } catch (error) {
      console.error("Error fetching initial crypto data:", error);
      setError(
        error instanceof Error ? error.message : "Failed to load crypto data"
      );
    }
  }, [cryptoSymbols]);

  const initWebSocket = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      const streams = cryptoSymbols
        .map((symbol) => `${symbol.toLowerCase()}@ticker`)
        .join("/");
      const wsUrl = `wss://stream.binance.com:9443/stream?streams=${streams}`;
      console.log("Connecting to Binance WebSocket...");
      console.log("Binance WebSocket URL:", wsUrl);

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("Binance WebSocket connected successfully");
        setIsConnected(true);
        setError(null);
      };

      ws.onmessage = (event) => {
        try {
          const response = JSON.parse(event.data);

          if (response.stream && response.data) {
            const tickerData = response.data;
            debouncedUpdate(() => {
              setData((prevData) => {
                const newData = [...prevData];
                const symbol = tickerData.s;
                const price = parseFloat(tickerData.c);
                const changePercent = parseFloat(tickerData.P);

                const existingIndex = newData.findIndex(
                  (item) => item.symbol === getCryptoDisplaySymbol(symbol)
                );
                const cryptoName = getCryptoName(symbol);
                const displaySymbol = getCryptoDisplaySymbol(symbol);

                const updatedItem: MarketItem = {
                  symbol: displaySymbol,
                  name: cryptoName,
                  price,
                  change: parseFloat(tickerData.p),
                  changePercent: changePercent,
                };

                if (existingIndex >= 0) {
                  newData[existingIndex] = updatedItem;
                } else {
                  newData.push(updatedItem);
                }

                setLastUpdated(new Date());
                return newData;
              });
            });
          }
        } catch (error) {
          console.error("Error parsing crypto data:", error);
        }
      };

      ws.onclose = (event) => {
        console.log(
          "Binance WebSocket disconnected. Code:",
          event.code,
          "Reason:",
          event.reason
        );
        setIsConnected(false);

        // Handle different close codes
        if (event.code === 1006) {
          setError("Connection lost. Attempting to reconnect...");
        } else if (event.code === 1002) {
          setError("Protocol error occurred");
        } else if (event.code !== 1000) {
          setError(`Connection closed unexpectedly (Code: ${event.code})`);
        }

        if (event.code !== 1000) {
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log("Attempting to reconnect to Binance...");
            initWebSocket();
          }, 5000);
        }
      };

      ws.onerror = (error) => {
        console.error("Binance WebSocket error details:", {
          error,
          readyState: ws.readyState,
          url: ws.url,
          protocol: ws.protocol,
        });
        setIsConnected(false);

        // More specific error messages
        if (ws.readyState === WebSocket.CONNECTING) {
          setError(
            "Failed to connect to Binance. Check your internet connection."
          );
        } else {
          setError("WebSocket connection failed. Please try again.");
        }
      };
    } catch (error) {
      console.error("Failed to create Binance WebSocket:", {
        error,
        message: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      });
      setError(
        `Failed to establish connection: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }, [cryptoSymbols, debouncedUpdate]);

  useEffect(() => {
    const initializeData = async () => {
      setIsLoading(true);
      await fetchInitialData();
      setTimeout(() => {
        initWebSocket();
      }, 2000);
      setIsLoading(false);
    };

    initializeData();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [fetchInitialData, initWebSocket]);

  return {
    data,
    isConnected,
    error,
    isLoading,
    lastUpdated,
  };
}
