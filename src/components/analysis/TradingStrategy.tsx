import React from 'react';
import { Target, ArrowRight } from 'lucide-react';
import type { TradingStrategy as TradingStrategyType } from '../../services/types';

interface TradingStrategyProps {
  data: TradingStrategyType;
}

export const TradingStrategy: React.FC<TradingStrategyProps> = ({ data }) => {
  if (!data || !data.entries || !data.stopLoss || !data.targets) {
    return (
      <div className="bg-slate-800 rounded-lg p-4">
        <h3 className="font-medium flex items-center gap-2 mb-4">
          <Target className="w-5 h-5 text-blue-400" />
          Trading Strategy
        </h3>
        <div>Loading trading strategy...</div>
      </div>
    );
  }

  const formatPrice = (price: number | undefined) => 
    `$${(price || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

  return (
    <div className="bg-slate-800 rounded-lg p-4">
      <h3 className="font-medium flex items-center gap-2 mb-4">
        <Target className="w-5 h-5 text-blue-400" />
        Trading Strategy
      </h3>
      <div className="space-y-4">
        {/* Recommendation */}
        <div className="bg-slate-750 p-3 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-slate-400">Recommendation</span>
            <div className={`px-2 py-1 rounded-full text-sm ${
              data.recommendation.includes('Buy') ? 'bg-green-500/10 text-green-400' :
              data.recommendation.includes('Sell') ? 'bg-red-500/10 text-red-400' :
              'bg-yellow-500/10 text-yellow-400'
            }`}>
              {data.recommendation} ({data.confidence}%)
            </div>
          </div>
          <div className="text-xs text-slate-400">
            Timeframe: {data.timeframe}
          </div>
        </div>

        {/* Entry Points */}
        <div className="space-y-2">
          <h4 className="text-sm text-slate-400">Entry Points</h4>
          <div className="grid grid-cols-3 gap-2">
            {Object.entries(data.entries || {}).map(([type, price]) => (
              <div key={type} className="bg-slate-750 p-2 rounded">
                <div className="text-xs text-slate-400 mb-1">{type}</div>
                <div className="font-medium">{formatPrice(price as number)}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Stop Losses */}
        <div className="space-y-2">
          <h4 className="text-sm text-slate-400">Stop Loss Levels</h4>
          <div className="grid grid-cols-3 gap-2">
            {Object.entries(data.stopLoss).map(([type, price]) => (
              <div key={type} className="bg-slate-750 p-2 rounded">
                <div className="text-xs text-slate-400 mb-1">{type}</div>
                <div className="font-medium text-red-400">{formatPrice(price as number)}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Targets */}
        <div className="space-y-2">
          <h4 className="text-sm text-slate-400">Price Targets</h4>
          <div className="grid grid-cols-3 gap-2">
            {Object.entries(data.targets).map(([type, price]) => (
              <div key={type} className="bg-slate-750 p-2 rounded">
                <div className="text-xs text-slate-400 mb-1">{type}</div>
                <div className="font-medium text-green-400">{formatPrice(price as number)}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Rationale */}
        <div className="space-y-2">
          <h4 className="text-sm text-slate-400">Strategy Rationale</h4>
          <div className="space-y-1">
            {data.rationale.map((reason, index) => (
              <div key={index} className="flex items-center gap-2 text-xs text-slate-400">
                <ArrowRight className="w-3 h-3" />
                <span>{reason}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}; 