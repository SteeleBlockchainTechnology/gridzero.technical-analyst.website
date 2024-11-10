import React, { useEffect, useState } from 'react';
import { Brain, TrendingUp, TrendingDown, Activity, Target, AlertTriangle } from 'lucide-react';
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
  aiAnalysis: string;
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
        setAnalysis({
          summary: 'Market analysis unavailable',
          aiAnalysis: 'AI analysis unavailable',
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

      {/* AI Analysis */}
      <div className="bg-slate-800 rounded-lg p-4">
        <h3 className="font-medium flex items-center gap-2 mb-3">
          <Brain className="w-5 h-5 text-purple-400" />
          AI Analysis
        </h3>
        <div 
          className="prose prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: analysis?.aiAnalysis || 'AI analysis unavailable' }}
        />
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
    </div>
  );
}; 