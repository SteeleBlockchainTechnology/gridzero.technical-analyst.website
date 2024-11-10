import React from 'react';
import { Brain, TrendingUp, TrendingDown } from 'lucide-react';

interface PricePredictionsProps {
  data: {
    shortTerm: {
      price: { low: number; high: number; };
      confidence: number;
      signals: string[];
    };
    midTerm: {
      price: { low: number; high: number; };
      confidence: number;
      signals: string[];
    };
    longTerm: {
      price: { low: number; high: number; };
      confidence: number;
      signals: string[];
    };
  };
}

export const PricePredictions: React.FC<PricePredictionsProps> = ({ data }) => {
  if (!data) {
    return (
      <div className="bg-slate-800 rounded-xl p-6 shadow-xl shadow-black/10">
        <h3 className="font-medium flex items-center gap-2 mb-4 text-white">
          <Brain className="w-5 h-5 text-blue-400" />
          Price Predictions
        </h3>
        <div>Loading predictions...</div>
      </div>
    );
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 70) return 'text-green-400 bg-green-500/10';
    if (confidence >= 50) return 'text-yellow-400 bg-yellow-500/10';
    return 'text-red-400 bg-red-500/10';
  };

  const formatPrice = (price: number) => 
    `$${price.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

  const timeframes = [
    { key: 'shortTerm', label: 'Short Term' },
    { key: 'midTerm', label: 'Mid Term' },
    { key: 'longTerm', label: 'Long Term' }
  ] as const;

  return (
    <div className="bg-slate-800 rounded-xl p-6 shadow-xl shadow-black/10">
      <h3 className="font-medium flex items-center gap-2 mb-4 text-white">
        <Brain className="w-5 h-5 text-blue-400" />
        Price Predictions
      </h3>
      <div className="space-y-4">
        {timeframes.map(({ key, label }) => (
          <div key={key} className="bg-slate-750 p-3 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-slate-400">{label}</span>
              <div className={`px-2 py-1 rounded-full text-sm ${
                getConfidenceColor(data[key].confidence)
              }`}>
                {data[key].confidence.toFixed(1)}% confidence
              </div>
            </div>
            <div className="flex justify-between items-center mb-2">
              <div className="text-sm">
                <span className="text-slate-400">Range: </span>
                <span className="font-medium">
                  {formatPrice(data[key].price.low)} - {formatPrice(data[key].price.high)}
                </span>
              </div>
              <div className="flex items-center gap-1">
                {data[key].price.high > data[key].price.low ? (
                  <TrendingUp className="w-4 h-4 text-green-400" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-400" />
                )}
              </div>
            </div>
            {data[key].signals.length > 0 && (
              <div className="text-xs text-slate-400">
                {data[key].signals[0]}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}; 