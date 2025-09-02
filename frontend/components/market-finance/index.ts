// Market Finance Components
export { MarketWidget } from "./MarketWidget";
export { StockTab } from "./StockTab";
export { CryptoTab } from "./CryptoTab";
export { NewsTab } from "./NewsTab";
export { default as TradingViewStocks } from "./TradingViewStocks";
export { default as TradingViewCrypto } from "./TradingViewCrypto";

// Hooks
export { useStockData } from "./useStockData";
export { useCryptoData } from "./useCryptoData";
export { useStockSearch } from "./useStockSearch";
export { useCryptoSearch } from "./useCryptoSearch";
export { useStockDataSmart } from "./useStockDataSmart";
export { useCryptoDataSmart } from "./useCryptoDataSmart";
export { useStockDataFallback } from "./useStockDataFallback";
export { useCryptoDataFallback } from "./useCryptoDataFallback";

// Types
export type {
  MarketItem,
  MarketWidgetProps,
  NewsArticle,
  SearchHookReturn,
  MarketDataHookReturn,
} from "./types";

// Utils
export { getStockName, getCryptoName, getCryptoDisplaySymbol } from "./utils";
