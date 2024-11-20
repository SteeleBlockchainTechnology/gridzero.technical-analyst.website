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
      };

      // Use mapped symbol if available, otherwise construct it
      const symbol = symbolMap[cryptoId] || 
        cryptoId.replace(/-/g, '').toUpperCase() + 'USDT';

      return `BINANCE:${symbol}`;
    };

    if (container.current) {
      // Clear previous content
      container.current.innerHTML = '';

      const widgetContainer = document.createElement('div');
      widgetContainer.className = 'tradingview-widget-container relative';
      
      // Add price overlay
      const priceOverlay = document.createElement('div');
      priceOverlay.className = 'absolute top-4 right-4 bg-black/50 backdrop-blur-sm rounded-lg p-2 text-sm z-10';
      priceOverlay.innerHTML = `
        <div class="flex items-center gap-2">
          <span class="text-white font-medium">$${price.price.toLocaleString()}</span>
          <span class="${price.change24h >= 0 ? 'text-green-400' : 'text-red-400'}">
            ${price.change24h >= 0 ? '+' : ''}${price.change24h.toFixed(2)}%
          </span>
        </div>
      `;
      widgetContainer.appendChild(priceOverlay);
      
      const widget = document.createElement('div');
      const widgetId = `tradingview_${crypto}_${Date.now()}`;
      widget.id = widgetId;
      
      widgetContainer.appendChild(widget);
      container.current.appendChild(widgetContainer);

      const script = document.createElement('script');
      script.src = 'https://s3.tradingview.com/tv.js';
      script.async = true;
      script.onload = () => {
        if (typeof TradingView !== 'undefined') {
          new (window as any).TradingView.widget({
            autosize: true,
            symbol: getSymbol(crypto),
            interval: intervalMap[timeframe] || 'D',
            container_id: widgetId,
            theme: 'dark',
            style: '1',
            locale: 'en',
            toolbar_bg: '#f1f3f6',
            enable_publishing: false,
            allow_symbol_change: true,
            save_image: false,
            studies: [
              'MASimple@tv-basicstudies',
              'RSI@tv-basicstudies',
              'MACD@tv-basicstudies'
            ],
            width: '100%',
            height: '600',
            hide_side_toolbar: false,
            withdateranges: true,
            hide_volume: false,
            details: true,
            hotlist: true,
            calendar: true,
            show_popup_button: false,
            popup_width: '1000',
            popup_height: '650',
            disabled_features: [
              'header_symbol_search',
              'header_settings',
              'header_compare',
              'header_undo_redo',
              'header_screenshot',
              'header_saveload'
            ],
            enabled_features: [
              'hide_left_toolbar_by_default',
              'use_localstorage_for_settings'
            ],
            overrides: {
              'mainSeriesProperties.candleStyle.upColor': '#26a69a',
              'mainSeriesProperties.candleStyle.downColor': '#ef5350',
              'mainSeriesProperties.candleStyle.borderUpColor': '#26a69a',
              'mainSeriesProperties.candleStyle.borderDownColor': '#ef5350',
              'mainSeriesProperties.candleStyle.wickUpColor': '#26a69a',
              'mainSeriesProperties.candleStyle.wickDownColor': '#ef5350'
            }
          });
        }
      };

      document.head.appendChild(script);
    }

    return () => {
      if (container.current) {
        container.current.innerHTML = '';
      }
    };
  }, [crypto, timeframe, price]);

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