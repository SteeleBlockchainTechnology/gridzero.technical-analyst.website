import React from 'react';
import { AlertTriangle, Shield, TrendingUp, TrendingDown } from 'lucide-react';

interface RiskAnalysisProps {
  data: {
    overall: number;
    factors: Record<string, number>;
    warnings: string[];
  };
}

export const RiskAnalysis: React.FC<RiskAnalysisProps> = ({ data }) => {
  const getRiskColor = (risk: number) => {
    if (risk > 70) return 'text-red-400 bg-red-500/10';
    if (risk > 50) return 'text-yellow-400 bg-yellow-500/10';
    return 'text-green-400 bg-green-500/10';
  };

  return (
    <div className="bg-slate-800 rounded-lg p-4">
      <h3 className="font-medium flex items-center gap-2 mb-4">
        <Shield className="w-5 h-5 text-red-400" />
        Risk Analysis
      </h3>
      <div className="space-y-4">
        {/* Overall Risk */}
        <div className="flex items-center justify-between">
          <span className="text-slate-400">Overall Risk</span>
          <div className={`px-2 py-1 rounded-full text-sm ${getRiskColor(data.overall)}`}>
            {data.overall.toFixed(1)}%
          </div>
        </div>

        {/* Risk Factors */}
        <div className="space-y-3">
          {(Object.entries(data.factors) as [string, number][]).map(([factor, value]) => (
            <div key={factor} className="bg-slate-750 p-3 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-slate-400">
                  {factor.charAt(0).toUpperCase() + factor.slice(1)} Risk
                </span>
                <span className={`text-sm ${getRiskColor(value)}`}>
                  {value.toFixed(1)}%
                </span>
              </div>
              <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all ${
                    value > 70 ? 'bg-red-500' :
                    value > 50 ? 'bg-yellow-500' :
                    'bg-green-500'
                  }`}
                  style={{ width: `${value}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Risk Warnings */}
        {data.warnings.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm text-slate-400">Risk Warnings</h4>
            <div className="space-y-1">
              {data.warnings.map((warning, index) => (
                <div key={index} className="flex items-center gap-2 text-xs text-red-400">
                  <AlertTriangle className="w-3 h-3" />
                  <span>{warning}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 