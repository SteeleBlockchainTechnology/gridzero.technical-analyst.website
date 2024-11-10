import React from 'react';
import { Activity, TrendingUp, TrendingDown } from 'lucide-react';
import type { SentimentData } from '../services/types';

interface SentimentAnalysisProps {
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

  const calculateOverallSentiment = () => {
    if (!sentimentData.length) return { sentiment: 'Neutral', strength: 0 };
    
    const bullishCount = sentimentData.filter(d => d.sentiment === 'Bullish').length;
    const bearishCount = sentimentData.filter(d => d.sentiment === 'Bearish').length;
    const total = sentimentData.length;
    
    const bullishPercentage = (bullishCount / total) * 100;
    const bearishPercentage = (bearishCount / total) * 100;
    
    if (bullishPercentage > bearishPercentage + 20) {
      return { sentiment: 'Bullish', strength: bullishPercentage };
    } else if (bearishPercentage > bullishPercentage + 20) {
      return { sentiment: 'Bearish', strength: bearishPercentage };
    }
    return { sentiment: 'Neutral', strength: 50 };
  };

  const { sentiment, strength } = calculateOverallSentiment();

  return (
    <div>
      <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
        <Activity className="w-5 h-5" />
        {getCryptoSymbol(crypto)} Market Sentiment
      </h2>
      <div className="space-y-4">
        {/* Overall Sentiment */}
        <div className="bg-slate-750 p-3 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-400">Overall</span>
            <div className={`flex items-center gap-2 px-2 py-1 rounded-full text-sm ${
              sentiment === 'Bullish' ? 'bg-green-500/10 text-green-400' :
              sentiment === 'Bearish' ? 'bg-red-500/10 text-red-400' :
              'bg-yellow-500/10 text-yellow-400'
            }`}>
              {sentiment === 'Bullish' ? <TrendingUp className="w-4 h-4" /> :
               sentiment === 'Bearish' ? <TrendingDown className="w-4 h-4" /> : null}
              {sentiment}
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-slate-400">
              <span>Sentiment Strength</span>
              <span>{strength.toFixed(1)}%</span>
            </div>
            <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all ${
                  sentiment === 'Bullish' ? 'bg-green-500' :
                  sentiment === 'Bearish' ? 'bg-red-500' :
                  'bg-yellow-500'
                }`}
                style={{ width: `${strength}%` }}
              />
            </div>
          </div>
        </div>

        {/* Latest Sentiment Data */}
        <div className="space-y-2">
          {sentimentData.slice(0, 3).map((data, index) => (
            <div key={index} className="bg-slate-750 p-2 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">{data.source}</span>
                <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${
                  data.sentiment === 'Bullish' ? 'bg-green-500/10 text-green-400' :
                  data.sentiment === 'Bearish' ? 'bg-red-500/10 text-red-400' :
                  'bg-yellow-500/10 text-yellow-400'
                }`}>
                  {data.sentiment === 'Bullish' ? <TrendingUp className="w-3 h-3" /> :
                   data.sentiment === 'Bearish' ? <TrendingDown className="w-3 h-3" /> : null}
                  {data.sentiment}
                </div>
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-slate-400">Volume</span>
                <span className="text-xs">{data.volume.toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Updated Time */}
        <div className="text-xs text-slate-400 text-right">
          •
          Updated {new Date().toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
};