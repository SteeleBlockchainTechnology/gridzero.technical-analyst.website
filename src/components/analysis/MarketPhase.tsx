import React from 'react';
import { Activity, TrendingUp, TrendingDown } from 'lucide-react';

interface MarketPhaseProps {
  data: {
    phase: string;
    strength: number;
    confidence: number;
    keyLevels: {
      strongSupport: number;
      support: number;
      pivot: number;
      resistance: number;
      strongResistance: number;
    };
  };
}

export const MarketPhase: React.FC<MarketPhaseProps> = ({ data }) => {
  if (!data || !data.keyLevels) {
    return (
      <div className="bg-slate-800 rounded-lg p-4">
        <h3 className="font-medium flex items-center gap-2 mb-4">
          <Activity className="w-5 h-5 text-blue-400" />
          Market Phase
        </h3>
        <div>Loading market phase data...</div>
      </div>
    );
  }
  
  const getPhaseColor = (phase: string) => {
    switch (phase.toLowerCase()) {
      case 'accumulation': return 'text-yellow-400';
      case 'markup': return 'text-green-400';
      case 'distribution': return 'text-red-400';
      case 'markdown': return 'text-red-500';
      default: return 'text-blue-400';
    }
  };

  return (
    <div className="bg-slate-800 rounded-lg p-4">
      <h3 className="font-medium flex items-center gap-2 mb-4">
        <Activity className="w-5 h-5 text-blue-400" />
        Market Phase
      </h3>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-slate-400">Current Phase</span>
          <span className={`font-medium ${getPhaseColor(data.phase)}`}>
            {data.phase}
          </span>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Strength</span>
            <span>{(data.strength * 100).toFixed(1)}%</span>
          </div>
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500 transition-all"
              style={{ width: `${data.strength * 100}%` }}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(data.keyLevels || {}).map(([level, price]: [string, number]) => (
            <div key={level} className="bg-slate-750 p-2 rounded">
              <div className="text-xs text-slate-400 mb-1">
                {level.replace(/([A-Z])/g, ' $1').trim()}
              </div>
              <div className="font-medium">
                ${(price || 0).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}; 