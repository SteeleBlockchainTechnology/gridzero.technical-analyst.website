import React from 'react';
import { Brain, Clock, TrendingUp, TrendingDown } from 'lucide-react';
import { PredictionData } from '../services/types';

interface PredictionPanelProps {
  crypto: string;
  timeframe: string;
  predictions: PredictionData[];
}

export function PredictionPanel({ crypto, timeframe, predictions }: PredictionPanelProps) {
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'bg-green-500/10 text-green-400';
    if (confidence >= 60) return 'bg-yellow-500/10 text-yellow-400';
    return 'bg-red-500/10 text-red-400';
  };

  const getPriceChange = (pred: PredictionData) => {
    const currentPrice = predictions[0]?.price || 0;
    const change = ((pred.price - currentPrice) / currentPrice) * 100;
    return {
      value: change,
      isPositive: change >= 0
    };
  };

  return (
    <div>
      <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
        <Brain className="w-5 h-5" />
        AI Predictions
      </h2>
      <div className="space-y-4">
        {predictions.map((pred) => {
          const priceChange = getPriceChange(pred);
          return (
            <div key={pred.period} className="bg-slate-750 p-3 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span className="text-sm text-slate-400">{pred.period}</span>
                </div>
                <span className={`text-sm px-2 py-0.5 rounded ${getConfidenceColor(pred.confidence)}`}>
                  {pred.confidence}% confidence
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-xl font-semibold">
                  ${pred.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </div>
                <div className="flex items-center gap-1 text-sm">
                  {priceChange.isPositive ? (
                    <TrendingUp className="w-4 h-4 text-green-500" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-500" />
                  )}
                  <span className={priceChange.isPositive ? 'text-green-500' : 'text-red-500'}>
                    {Math.abs(priceChange.value).toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}