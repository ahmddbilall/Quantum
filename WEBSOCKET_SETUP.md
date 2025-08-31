# Real-Time Market Data WebSocket Setup

This guide explains how to set up real-time market data using WebSocket connections for the Market & Finance page.

## API Requirements

### 1. Finnhub API (Stock Data)

- **Website**: https://finnhub.io/
- **Free Tier**: 60 API calls/minute
- **WebSocket**: Real-time stock prices
- **Setup Steps**:
  1. Create a free account at finnhub.io
  2. Get your API key from the dashboard
  3. Replace `YOUR_FINNHUB_API_KEY` in the code with your actual key

### 2. Binance WebSocket (Crypto Data)

- **Website**: https://binance-docs.github.io/apidocs/spot/en/
- **Free**: No API key required for public WebSocket streams
- **WebSocket**: Real-time cryptocurrency prices
- **Already configured**: No additional setup needed

## Code Implementation Features

### Performance Optimizations:

1. **Debounced Updates**: 100ms debounce to prevent excessive re-renders
2. **Connection Management**: Automatic reconnection on disconnect
3. **Memory Efficiency**: Uses refs for WebSocket connections
4. **Smart Price Caching**: Tracks previous prices for change calculations
5. **Memoized Arrays**: Prevents unnecessary dependency array changes

### Connection Status:

- ✅ Live indicator when connected
- ❌ Offline indicator when disconnected
- Auto-reconnection after 3 seconds on disconnect
- Loading states while fetching data

### Data Flow:

1. **Stocks (Finnhub)**:

   - Connects to `wss://ws.finnhub.io`
   - Subscribes to: AAPL, MSFT, GOOGL, AMZN, TSLA
   - Receives trade data with real-time prices

2. **Crypto (Binance)**:
   - Connects to `wss://stream.binance.com:9443/ws/`
   - Subscribes to: BTC, ETH, BNB, ADA, SOL (USDT pairs)
   - Receives 24hr ticker statistics

## Environment Setup

1. **Add to your `.env.local` file**:

```env
NEXT_PUBLIC_FINNHUB_API_KEY=your_finnhub_api_key_here
```

2. **Update the WebSocket connection**:

```typescript
const ws = new WebSocket(
  `wss://ws.finnhub.io?token=${process.env.NEXT_PUBLIC_FINNHUB_API_KEY}`
);
```

## Current Implementation Status

- ✅ Binance crypto WebSocket (working)
- ⚠️ Finnhub stock WebSocket (requires API key)
- ✅ Real-time price updates
- ✅ Connection status indicators
- ✅ Auto-reconnection logic
- ✅ Performance optimizations

## Testing

1. **Crypto Data**: Should work immediately (no API key needed)
2. **Stock Data**: Requires Finnhub API key setup
3. **Connection Status**: Check the Live/Offline indicators
4. **Performance**: No lag with debounced updates

## Troubleshooting

- **No crypto data**: Check browser console for WebSocket errors
- **No stock data**: Verify Finnhub API key is correct
- **Lag issues**: Debounce timing can be adjusted (currently 100ms)
- **Connection issues**: Check network and API key validity

## Alternative APIs (if needed)

### Stock Data Alternatives:

1. **Alpha Vantage**: 5 calls/minute free
2. **IEX Cloud**: 500,000 calls/month free
3. **Polygon.io**: Limited free tier

### Crypto Data Alternatives:

1. **CoinGecko**: Free WebSocket
2. **Kraken**: Free WebSocket
3. **Coinbase Pro**: Free WebSocket
