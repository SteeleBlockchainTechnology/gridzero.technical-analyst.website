import React, { useEffect, useRef } from 'react';
import { CryptoPrice } from '../services/types';

interface TradingViewProps {
  crypto: string;
  timeframe: string;
  price: CryptoPrice;
}

export const TradingView: React.FC<TradingViewProps> = ({ crypto, timeframe, price }) => {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Map timeframes to TradingView intervals
    const intervalMap: Record<string, string> = {
      '1H': '60',
      '4H': '240',
      '1D': 'D',
      '1W': 'W',
      '1M': 'M'
    };

    // Map crypto IDs to TradingView symbols
    const getSymbol = (cryptoId: string) => {
      const symbolMap: Record<string, string> = {
        'bitcoin': 'BTCUSDT',
        'ethereum': 'ETHUSDT',
        'binancecoin': 'BNBUSDT',
        'cardano': 'ADAUSDT',
        'solana': 'SOLUSDT',
        'polkadot': 'DOTUSDT',
        'injective-protocol': 'INJUSDT',
        'render-token': 'RENDERUSDT',
        // Add more special cases
        'chainlink': 'LINKUSDT',
        'avalanche-2': 'AVAXUSDT',
        'matic-network': 'MATICUSDT',
        'ripple': 'XRPUSDT',
        'dogecoin': 'DOGEUSDT',
        'uniswap': 'UNIUSDT',
      };

      // Use mapped symbol if available, otherwise construct it
      const symbol = symbolMap[cryptoId] || 
        cryptoId.replace(/-/g, '').toUpperCase() + 'USDT';

      return `BINANCE:${symbol}`;
    };

    if (container.current) {
      // Clear previous content
      container.current.innerHTML = '';

      const script = document.createElement('script');
      script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
      script.type = 'text/javascript';
      script.async = true;

      const config = {
        "width": "100%",
        "height": "600",
        "symbol": getSymbol(crypto),
        "interval": intervalMap[timeframe] || "D",
        "timezone": "exchange",
        "theme": "dark",
        "style": "1",
        "locale": "en",
        "enable_publishing": false,
        "backgroundColor": "rgba(0, 0, 0, 0.1)",
        "gridColor": "rgba(255, 255, 255, 0.06)",
        "hide_top_toolbar": false,
        "hide_legend": false,
        "save_image": false,
        "hide_volume": false,
        "support_host": "https://www.tradingview.com",
        "allow_symbol_change": true,
        "studies": [
          "MASimple@tv-basicstudies",
          "RSI@tv-basicstudies",
          "MACD@tv-basicstudies"
        ],
        "show_popup_button": false,
        "popup_width": "1000",
        "popup_height": "650",
        "container_id": `tradingview_${crypto}_${Date.now()}`,
        // Add current price overlay
        "overrides": {
          "paneProperties.background": "rgba(0, 0, 0, 0.1)",
          "paneProperties.vertGridProperties.color": "rgba(255, 255, 255, 0.06)",
          "paneProperties.horzGridProperties.color": "rgba(255, 255, 255, 0.06)",
          "scalesProperties.textColor": "#AAA",
          "mainSeriesProperties.priceLineColor": price.change24h >= 0 ? "#26a69a" : "#ef5350",
          "mainSeriesProperties.priceLineWidth": 2,
          "mainSeriesProperties.showPriceLine": true,
        }
      };

      script.innerHTML = JSON.stringify(config);

      // Create widget container
      const widgetContainer = document.createElement('div');
      widgetContainer.className = 'tradingview-widget-container relative';
      
      // Add current price overlay
      const priceOverlay = document.createElement('div');
      priceOverlay.className = 'absolute top-4 right-4 bg-black/50 backdrop-blur-sm rounded-lg p-2 text-sm';
      priceOverlay.innerHTML = `
        <div class="flex items-center gap-2">
          <span class="text-white font-medium">$${price.price.toLocaleString()}</span>
          <span class="${price.change24h >= 0 ? 'text-green-400' : 'text-red-400'}">
            ${price.change24h >= 0 ? '+' : ''}${price.change24h.toFixed(2)}%
          </span>
        </div>
      `;
      
      widgetContainer.appendChild(priceOverlay);
      container.current.appendChild(widgetContainer);
      widgetContainer.appendChild(script);
    }

    // Cleanup
    return () => {
      if (container.current) {
        container.current.innerHTML = '';
      }
    };
  }, [crypto, timeframe, price]); // Add price to dependency array

  return (
    <div 
      ref={container} 
      className="w-full h-[600px] bg-black/30 rounded-lg overflow-hidden"
    >
      <div className="flex items-center justify-center h-full text-slate-400">
        Loading chart...
      </div>
    </div>
  );
};