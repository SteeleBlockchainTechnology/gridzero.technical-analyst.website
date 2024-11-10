import React from 'react';
import { Activity } from 'lucide-react';
import type { TechnicalSignals as TechnicalSignalsType } from '../../services/types';

interface TechnicalSignalsProps {
  data: TechnicalSignalsType;
}

export const TechnicalSignals: React.FC<TechnicalSignalsProps> = ({ data }) => {
  const getTrendColor = (trend: string) => {
    switch (trend.toLowerCase()) {
      case 'bullish': return 'text-green-400';
      case 'bearish': return 'text-red-400';
      default: return 'text-yellow-400';
    }
  };

  const getSignalColor = (signal: string) => {
    if (signal.includes('bullish') || signal.includes('overbought')) return 'text-green-400';
    if (signal.includes('bearish') || signal.includes('oversold')) return 'text-red-400';
    return 'text-yellow-400';
  };

  return (
    <div className="bg-slate-800 rounded-xl p-6 shadow-xl shadow-black/10">
      <h3 className="font-medium flex items-center gap-2 mb-4 text-white">
        <Activity className="w-5 h-5 text-blue-400" />
        Technical Signals
      </h3>
      
      <div className="space-y-6">
        {/* Trend Analysis */}
        <div className="space-y-3">
          <h4 className="text-sm text-slate-400">Trend Analysis</h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-750 p-3 rounded-lg">
              <div className="text-xs text-slate-400 mb-1">Primary</div>
              <div className={`font-medium ${getTrendColor(data.trend.primary)}`}>
                {data.trend.primary}
              </div>
            </div>
            <div className="bg-slate-750 p-3 rounded-lg">
              <div className="text-xs text-slate-400 mb-1">Secondary</div>
              <div className={`font-medium ${getTrendColor(data.trend.secondary)}`}>
                {data.trend.secondary}
              </div>
            </div>
          </div>
        </div>

        {/* Momentum */}
        <div className="space-y-3">
          <h4 className="text-sm text-slate-400">Momentum</h4>
          <div className="space-y-2">
            {Object.entries(data.momentum).map(([indicator, data]) => (
              <div key={indicator} className="bg-slate-750 p-3 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-400">{indicator.toUpperCase()}</span>
                  <span className={`text-sm ${getSignalColor(data.signal)}`}>
                    {data.value.toFixed(2)}
                  </span>
                </div>
                <div className="text-xs mt-1 text-slate-400">
                  {data.signal}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Volatility */}
        <div className="space-y-3">
          <h4 className="text-sm text-slate-400">Volatility</h4>
          <div className="bg-slate-750 p-3 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-slate-400">Current</span>
              <span className={`text-sm ${
                data.volatility.risk === 'high' ? 'text-red-400' :
                data.volatility.risk === 'medium' ? 'text-yellow-400' :
                'text-green-400'
              }`}>
                {data.volatility.current.toFixed(2)}%
              </span>
            </div>
            <div className="text-xs text-slate-400">
              {data.volatility.trend} trend, {data.volatility.risk} risk
            </div>
          </div>
        </div>

        {/* Volume Analysis */}
        <div className="space-y-3">
          <h4 className="text-sm text-slate-400">Volume Analysis</h4>
          <div className="bg-slate-750 p-3 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-slate-400">Change</span>
              <span className={`text-sm ${
                data.volume.change > 1.5 ? 'text-green-400' :
                data.volume.change < 0.5 ? 'text-red-400' :
                'text-yellow-400'
              }`}>
                {data.volume.change.toFixed(2)}x
              </span>
            </div>
            <div className="text-xs text-slate-400">
              {data.volume.trend} trend, {data.volume.significance} significance
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 