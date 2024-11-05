import React from 'react';
import { BarChart3, TrendingUp, TrendingDown } from 'lucide-react';
import type { SentimentData } from '../services/types';

export interface SentimentAnalysisProps {
  crypto: string;
  sentimentData: SentimentData[];
}

export const SentimentAnalysis: React.FC<SentimentAnalysisProps> = ({ crypto, sentimentData }) => {
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

  const getOverallSentiment = () => {
    if (!sentimentData.length) return null;
    
    const bullishCount = sentimentData.filter(d => d.sentiment === 'Bullish').length;
    const bearishCount = sentimentData.filter(d => d.sentiment === 'Bearish').length;
    
    if (bullishCount > bearishCount) return 'Bullish';
    if (bearishCount > bullishCount) return 'Bearish';
    return 'Neutral';
  };

  const overallSentiment = getOverallSentiment();

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          {getCryptoSymbol(crypto)} Market Sentiment
        </h2>
        {overallSentiment && (
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
            overallSentiment === 'Bullish' 
              ? 'bg-green-500/10 text-green-400'
              : overallSentiment === 'Bearish'
              ? 'bg-red-500/10 text-red-400'
              : 'bg-yellow-500/10 text-yellow-400'
          }`}>
            {overallSentiment === 'Bullish' ? (
              <TrendingUp className="w-4 h-4" />
            ) : overallSentiment === 'Bearish' ? (
              <TrendingDown className="w-4 h-4" />
            ) : null}
            <span>Overall {overallSentiment}</span>
          </div>
        )}
      </div>
      <div className="space-y-4">
        {sentimentData.map((item, index) => (
          <div key={index} className="bg-slate-750 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-slate-400">{item.source}</span>
                <span className="text-slate-500">•</span>
                <span className="text-sm text-slate-400">
                  Updated {new Date(item.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <span 
                className={`flex items-center gap-1 text-sm px-2 py-0.5 rounded ${
                  item.sentiment === 'Bullish' 
                    ? 'bg-green-500/10 text-green-400'
                    : item.sentiment === 'Bearish'
                    ? 'bg-red-500/10 text-red-400'
                    : 'bg-yellow-500/10 text-yellow-400'
                }`}
              >
                {item.sentiment === 'Bullish' ? (
                  <TrendingUp className="w-3 h-3" />
                ) : item.sentiment === 'Bearish' ? (
                  <TrendingDown className="w-3 h-3" />
                ) : null}
                {item.sentiment}
              </span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Sentiment Strength</span>
                <span className={
                  item.sentiment === 'Bullish' 
                    ? 'text-green-400'
                    : item.sentiment === 'Bearish'
                    ? 'text-red-400'
                    : 'text-yellow-400'
                }>
                  {item.volume.toFixed(1)}%
                </span>
              </div>
              <div className="h-2 bg-slate-850 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    item.sentiment === 'Bullish'
                      ? 'bg-green-500'
                      : item.sentiment === 'Bearish'
                      ? 'bg-red-500'
                      : 'bg-yellow-500'
                  }`}
                  style={{ width: `${item.volume}%` }}
                />
              </div>
            </div>
          </div>
        ))}
        {sentimentData.length === 0 && (
          <div className="text-center text-slate-400 py-8">
            <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No sentiment data available for {getCryptoSymbol(crypto)}</p>
          </div>
        )}
      </div>
    </div>
  );
};