import React, { useEffect, useRef } from 'react';
import { LineChart, TrendingUp, TrendingDown } from 'lucide-react';
import type { CryptoPrice } from '../services/types';

declare global {
  interface Window {
    TradingView: any;
  }
}

export interface TradingViewProps {
  crypto: string;
  timeframe: string;
  price: CryptoPrice | null;
}

export const TradingView: React.FC<TradingViewProps> = ({ crypto, timeframe, price }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const formatPrice = (value: number) => {
    return value.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const formatChange = (value: number) => {
    return value.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      signDisplay: 'always',
    });
  };

  const getCryptoSymbol = (cryptoId: string) => {
    const symbols: Record<string, string> = {
      'bitcoin': 'BTC',
      'ethereum': 'ETH',
      'binancecoin': 'BNB',
      'cardano': 'ADA',
      'solana': 'SOL',
    };
    return symbols[cryptoId] || cryptoId.toUpperCase();
  };

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/tv.js';
    script.async = true;
    script.onload = () => {
      if (containerRef.current && window.TradingView) {
        const symbol = `BINANCE:${getCryptoSymbol(crypto)}USDT`;
        
        new window.TradingView.widget({
          container_id: containerRef.current.id,
          symbol: symbol,
          interval: timeframe === '1H' ? '60' : 
                   timeframe === '4H' ? '240' :
                   timeframe === '1D' ? 'D' :
                   timeframe === '1W' ? 'W' : 'M',
          theme: 'dark',
          style: '1',
          locale: 'en',
          toolbar_bg: '#1e293b',
          enable_publishing: false,
          hide_side_toolbar: false,
          allow_symbol_change: false,
          save_image: false,
          height: 400,
          width: '100%',
          studies: [
            'RSI@tv-basicstudies',
            'MASimple@tv-basicstudies',
            'MACD@tv-basicstudies'
          ],
          show_popup_button: true,
          popup_width: '1000',
          popup_height: '650',
          backgroundColor: '#1e293b',
          gridColor: '#334155',
          hide_volume: false,
        });
      }
    };
    document.head.appendChild(script);

    return () => {
      script.remove();
    };
  }, [crypto, timeframe]);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <LineChart className="w-5 h-5" />
          {getCryptoSymbol(crypto)}/USD Chart • {timeframe}
        </h2>
        {price && (
          <div className="flex items-center gap-4">
            <div className="text-xl font-semibold">
              ${formatPrice(price.price)}
            </div>
            <div className="flex items-center gap-2 text-slate-400">
              {price.change24h >= 0 ? (
                <TrendingUp className="w-4 h-4 text-green-500" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-500" />
              )}
              <span className={price.change24h >= 0 ? 'text-green-500' : 'text-red-500'}>
                {formatChange(price.change24h)}%
              </span>
              <span>24h Change</span>
            </div>
          </div>
        )}
      </div>
      <div 
        id="tradingview_widget"
        ref={containerRef} 
        className="rounded-lg overflow-hidden bg-slate-850"
      />
    </div>
  );
};