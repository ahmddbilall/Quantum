import React, { useEffect, useRef, memo } from "react";

interface TradingViewStocksProps {
  wishlist: Array<{ symbol: string; name: string }>;
  onResetToDefaults?: () => void;
}

function TradingViewStocks({
  wishlist,
  onResetToDefaults,
}: TradingViewStocksProps) {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (container.current) {
      // Clear any existing content
      container.current.innerHTML = "";

      // Convert wishlist to TradingView format
      const symbols = wishlist.map((item) => [item.name, `${item.symbol}|1D`]);

      const script = document.createElement("script");
      script.src =
        "https://s3.tradingview.com/external-embedding/embed-widget-symbol-overview.js";
      script.type = "text/javascript";
      script.async = true;
      script.innerHTML = JSON.stringify({
        lineWidth: 2,
        lineType: 0,
        chartType: "area",
        fontColor: "rgb(106, 109, 120)",
        gridLineColor: "rgba(242, 242, 242, 0.06)",
        volumeUpColor: "rgba(34, 171, 148, 0.5)",
        volumeDownColor: "rgba(247, 82, 95, 0.5)",
        backgroundColor: "#0F0F0F",
        widgetFontColor: "#DBDBDB",
        upColor: "#22ab94",
        downColor: "#f7525f",
        borderUpColor: "#22ab94",
        borderDownColor: "#f7525f",
        wickUpColor: "#22ab94",
        wickDownColor: "#f7525f",
        colorTheme: "dark",
        isTransparent: false,
        locale: "en",
        chartOnly: false,
        scalePosition: "right",
        scaleMode: "Normal",
        fontFamily:
          "-apple-system, BlinkMacSystemFont, Trebuchet MS, Roboto, Ubuntu, sans-serif",
        valuesTracking: "1",
        changeMode: "price-and-percent",
        symbols: symbols,
        dateRanges: ["1d|1", "1m|30", "3m|60", "12m|1D", "60m|1W", "all|1M"],
        fontSize: "10",
        headerFontSize: "medium",
        autosize: true,
        width: "100%",
        height: "500",
        noTimeScale: false,
        hideDateRanges: false,
        hideMarketStatus: false,
        hideSymbolLogo: false,
      });
      container.current.appendChild(script);
    }
  }, [wishlist]);

  return (
    <div className="bg-zinc-900 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-white">
          Your Stock Watchlist ({wishlist.length})
        </h3>
      </div>
      <div
        className="tradingview-widget-container"
        ref={container}
        style={{ height: "500px" }}
      >
        <div className="tradingview-widget-container__widget"></div>
        <div className="tradingview-widget-copyright">
          <a
            href="https://www.tradingview.com/"
            rel="noopener nofollow"
            target="_blank"
            className="text-blue-400 text-xs"
          >
            <span>Stock quotes by TradingView</span>
          </a>
        </div>
      </div>
    </div>
  );
}

export default memo(TradingViewStocks);
