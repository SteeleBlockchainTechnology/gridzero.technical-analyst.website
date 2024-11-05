import React, { useEffect, useState } from 'react';
import { Brain, BarChart2, TrendingUp, TrendingDown, Activity, LineChart, Volume2, Target, AlertTriangle } from 'lucide-react';
import { analysisService } from '../services/analysis';

interface MarketAnalysisProps {
  crypto: string;
}

interface Signal {
  text: string;
  importance: string;
}

interface AnalysisData {
  summary: string;
  priceTargets: {
    '24H': { range: string; confidence: string };
    '7D': { range: string; confidence: string };
    '30D': { range: string; confidence: string };
  };
  signals: Signal[];
  strategy: {
    position: string;
    entry: string;
    stop: string;
    target: string;
  };
  marketStructure: {
    trend: string;
  };
}

export const MarketAnalysis: React.FC<MarketAnalysisProps> = ({ crypto }) => {
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await analysisService.getDetailedAnalysis(crypto);
        if (!result) {
          throw new Error('No analysis data available');
        }
        setAnalysis(result);
      } catch (err) {
        console.error('Error in MarketAnalysis:', err);
        setError('Failed to fetch market analysis');
        // Set default analysis state
        setAnalysis({
          summary: 'Market analysis unavailable',
          priceTargets: {
            '24H': { range: 'N/A', confidence: '0' },
            '7D': { range: 'N/A', confidence: '0' },
            '30D': { range: 'N/A', confidence: '0' }
          },
          signals: [],
          strategy: {
            position: 'Neutral',
            entry: 'N/A',
            stop: 'N/A',
            target: 'N/A'
          },
          marketStructure: {
            trend: 'Neutral'
          }
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAnalysis();
    const interval = setInterval(fetchAnalysis, 60000);
    return () => clearInterval(interval);
  }, [crypto]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-500/10 text-red-400 p-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {/* Market Summary */}
      <div className="bg-slate-800 rounded-lg p-4">
        <h3 className="font-medium flex items-center gap-2 mb-3">
          <Brain className="w-5 h-5 text-blue-400" />
          Market Summary
        </h3>
        <div className="prose prose-invert max-w-none">
          <p>{analysis?.summary || 'Market analysis unavailable'}</p>
        </div>
      </div>

      {/* Price Targets */}
      <div className="bg-slate-800 rounded-lg p-4">
        <h3 className="font-medium flex items-center gap-2 mb-3">
          <Target className="w-5 h-5 text-purple-400" />
          Price Targets
        </h3>
        <div className="grid grid-cols-3 gap-4">
          {[
            { timeframe: '24H', data: analysis?.priceTargets?.['24H'] },
            { timeframe: '7D', data: analysis?.priceTargets?.['7D'] },
            { timeframe: '30D', data: analysis?.priceTargets?.['30D'] }
          ].map(({ timeframe, data }) => (
            <div key={timeframe} className="bg-slate-750 p-3 rounded-lg">
              <div className="text-sm text-slate-400 mb-2">{timeframe}</div>
              <div className="flex flex-col gap-2">
                <div className="text-lg font-medium">
                  {data?.range || 'N/A'}
                </div>
                <div className={`text-sm px-2 py-1 rounded-full ${
                  parseFloat(data?.confidence || '0') > 70
                    ? 'bg-green-500/10 text-green-400'
                    : 'bg-yellow-500/10 text-yellow-400'
                }`}>
                  {data?.confidence || '0'}% Confidence
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Key Signals */}
      <div className="bg-slate-800 rounded-lg p-4">
        <h3 className="font-medium flex items-center gap-2 mb-3">
          <Activity className="w-5 h-5 text-green-400" />
          Key Signals
        </h3>
        <div className="space-y-2">
          {analysis?.signals?.map((signal: Signal, index: number) => (
            <div key={index} className="flex items-center gap-2 p-2 rounded-lg bg-slate-750">
              {signal.text.toLowerCase().includes('bullish') ? (
                <TrendingUp className="w-4 h-4 text-green-400" />
              ) : signal.text.toLowerCase().includes('bearish') ? (
                <TrendingDown className="w-4 h-4 text-red-400" />
              ) : (
                <Activity className="w-4 h-4 text-yellow-400" />
              )}
              <span>{signal.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Trading Strategy */}
      <div className="bg-slate-800 rounded-lg p-4">
        <h3 className="font-medium flex items-center gap-2 mb-3">
          <AlertTriangle className="w-5 h-5 text-yellow-400" />
          Trading Strategy
        </h3>
        <div className="space-y-3">
          <div className={`flex items-center justify-between p-3 rounded-lg ${
            analysis?.marketStructure?.trend === 'Bull Market' ? 'bg-green-500/10' :
            analysis?.marketStructure?.trend === 'Bear Market' ? 'bg-red-500/10' :
            'bg-yellow-500/10'
          }`}>
            <span className="text-slate-300">Position</span>
            <span className={
              analysis?.marketStructure?.trend === 'Bull Market' ? 'text-green-400' :
              analysis?.marketStructure?.trend === 'Bear Market' ? 'text-red-400' :
              'text-yellow-400'
            }>
              {analysis?.strategy?.position || 'Neutral'}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-750 p-2 rounded-lg">
              <div className="text-sm text-slate-400 mb-1">Entry</div>
              <div className="font-medium">{analysis?.strategy?.entry || 'N/A'}</div>
            </div>
            <div className="bg-slate-750 p-2 rounded-lg">
              <div className="text-sm text-slate-400 mb-1">Stop</div>
              <div className="font-medium">{analysis?.strategy?.stop || 'N/A'}</div>
            </div>
            <div className="bg-slate-750 p-2 rounded-lg">
              <div className="text-sm text-slate-400 mb-1">Target</div>
              <div className="font-medium">{analysis?.strategy?.target || 'N/A'}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 