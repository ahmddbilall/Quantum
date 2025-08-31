// Helper functions for market data
export const getStockName = (symbol: string): string => {
  const stockNames: { [key: string]: string } = {
    AAPL: "Apple Inc.",
    MSFT: "Microsoft Corp.",
    GOOGL: "Alphabet Inc.",
    AMZN: "Amazon.com Inc.",
    TSLA: "Tesla Inc.",
    NVDA: "NVIDIA Corp.",
    META: "Meta Platforms Inc.",
    NFLX: "Netflix Inc.",
    BABA: "Alibaba Group",
    JPM: "JPMorgan Chase & Co.",
    JNJ: "Johnson & Johnson",
    V: "Visa Inc.",
    PG: "Procter & Gamble Co.",
    UNH: "UnitedHealth Group Inc.",
    HD: "Home Depot Inc.",
    MA: "Mastercard Inc.",
    DIS: "Walt Disney Co.",
    ADBE: "Adobe Inc.",
    CRM: "Salesforce Inc.",
    PYPL: "PayPal Holdings Inc.",
  };
  return stockNames[symbol] || `${symbol} Inc.`;
};

export const getCryptoName = (symbol: string): string => {
  const cryptoNames: { [key: string]: string } = {
    BTCUSDT: "Bitcoin",
    ETHUSDT: "Ethereum",
    BNBUSDT: "Binance Coin",
    ADAUSDT: "Cardano",
    SOLUSDT: "Solana",
    XRPUSDT: "XRP",
    DOTUSDT: "Polkadot",
    AVAXUSDT: "Avalanche",
    LINKUSDT: "Chainlink",
    MATICUSDT: "Polygon",
    ATOMUSDT: "Cosmos",
    LTCUSDT: "Litecoin",
    UNIUSDT: "Uniswap",
    ALGOUSDT: "Algorand",
    VETUSDT: "VeChain",
    FTMUSDT: "Fantom",
    DOGEUSDT: "Dogecoin",
    SHIBUSDT: "Shiba Inu",
    PEPEUSDT: "Pepe",
  };
  return cryptoNames[symbol] || symbol.replace("USDT", "");
};

export const getCryptoDisplaySymbol = (symbol: string): string => {
  return symbol.replace("USDT", "");
};
