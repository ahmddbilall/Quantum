"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { MarketItem, MarketDataHookReturn } from "./types";
import { getStockName } from "./utils";

export function useStockData(): MarketDataHookReturn {
  const [data, setData] = useState<MarketItem[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const priceCache = useRef<{ [key: string]: number }>({});

  const stockSymbols = useMemo(
    () => ["AAPL", "MSFT", "GOOGL", "AMZN", "TSLA"],
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
      const apiKey = process.env.NEXT_PUBLIC_FINNHUB_API_KEY || "demo";

      const stockPromises = stockSymbols.map(async (symbol) => {
        const response = await fetch(
          `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey}`
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch ${symbol}: ${response.statusText}`);
        }

        const data = await response.json();

        return {
          symbol,
          name: getStockName(symbol),
          price: data.c || 0,
          change: data.d || 0,
          changePercent: data.dp || 0,
        };
      });

      const stocksData = await Promise.all(stockPromises);
      setData(stocksData);

      stocksData.forEach((stock) => {
        priceCache.current[stock.symbol] = stock.price;
      });

      console.log("Initial stock data loaded:", stocksData);
    } catch (error) {
      console.error("Error fetching initial stock data:", error);
      setError(
        error instanceof Error ? error.message : "Failed to load stock data"
      );
    }
  }, [stockSymbols]);

  const initWebSocket = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      const apiKey = process.env.NEXT_PUBLIC_FINNHUB_API_KEY || "demo";
      console.log(
        "Connecting to Finnhub WebSocket with API key:",
        apiKey === "demo" ? "demo (limited)" : "provided"
      );

      // Check if we have a valid API key
      if (!apiKey || apiKey === "demo") {
        console.warn("Using demo API key - this has limited functionality");
      }

      const wsUrl = `wss://ws.finnhub.io?token=${apiKey}`;
      console.log("WebSocket URL:", wsUrl);

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("Finnhub WebSocket connected successfully");
        setIsConnected(true);
        setError(null);

        // Subscribe to stock symbols with error handling
        stockSymbols.forEach((symbol) => {
          try {
            const subscribeMessage = JSON.stringify({
              type: "subscribe",
              symbol,
            });
            console.log("Subscribing to stock:", symbol);
            ws.send(subscribeMessage);
          } catch (subscribeError) {
            console.error(`Failed to subscribe to ${symbol}:`, subscribeError);
          }
        });
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === "trade" && data.data && data.data.length > 0) {
            debouncedUpdate(() => {
              setData((prevData) => {
                const newData = [...prevData];

                data.data.forEach((trade: any) => {
                  const symbol = trade.s;
                  const price = trade.p;
                  const previousPrice = priceCache.current[symbol] || price;
                  const change = price - previousPrice;
                  const changePercent = previousPrice
                    ? (change / previousPrice) * 100
                    : 0;

                  const existingIndex = newData.findIndex(
                    (item) => item.symbol === symbol
                  );
                  const stockName = getStockName(symbol);

                  const updatedItem: MarketItem = {
                    symbol,
                    name: stockName,
                    price,
                    change,
                    changePercent,
                  };

                  if (existingIndex >= 0) {
                    newData[existingIndex] = updatedItem;
                  } else {
                    newData.push(updatedItem);
                  }

                  priceCache.current[symbol] = price;
                });

                setLastUpdated(new Date());
                return newData;
              });
            });
          }
        } catch (error) {
          console.error("Error parsing stock data:", error);
        }
      };

      ws.onclose = (event) => {
        console.log(
          "Finnhub WebSocket disconnected. Code:",
          event.code,
          "Reason:",
          event.reason
        );
        setIsConnected(false);

        // Handle different close codes
        if (event.code === 1006) {
          setError("Connection lost. Attempting to reconnect...");
        } else if (event.code === 1008) {
          // Silent handling - just log for debugging
          console.log("API key validation issue detected");
        } else if (event.code === 1003) {
          // Silent handling
          console.log("Data type issue detected");
        } else if (event.code === 1011) {
          // Silent handling
          console.log("Server error detected");
        } else if (event.code !== 1000) {
          // Silent handling - no user-facing errors
          console.log(`Connection closed with code: ${event.code}`);
        }

        // Don't auto-reconnect if it's an authentication error
        if (event.code !== 1000 && event.code !== 1008) {
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log("Attempting to reconnect to Finnhub...");
            initWebSocket();
          }, 5000);
        }
      };

      ws.onerror = (error) => {
        // Silent error logging - don't expose to users
        console.log("WebSocket connection issue detected", {
          readyState: ws.readyState,
        });
        setIsConnected(false);

        // Don't set user-facing error messages
        // The UI will gracefully handle the disconnected state
      };
    } catch (error) {
      // Silent error logging
      console.log("WebSocket initialization issue:", {
        stack: error instanceof Error ? error.stack : undefined,
      });
      setError(
        `Failed to establish connection: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }, [stockSymbols, debouncedUpdate]);

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
