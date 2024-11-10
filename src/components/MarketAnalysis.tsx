import React, { useEffect, useState } from 'react';
import { Brain, TrendingUp, TrendingDown, Activity, Target, AlertTriangle, Clock } from 'lucide-react';
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

const formatAIAnalysis = (htmlContent: string) => {
  // Extract sections using more precise regex patterns
  const sections = {
    marketAnalysis: htmlContent.match(/<p class="highlight">(.*?)<\/p>/s)?.[1] || '',
    signals: htmlContent
      .split('Critical Trading Signals')[1]
      ?.split('Strategic Recommendations')[0]
      ?.split('\n')
      .filter(line => 
        line.trim() && 
        !line.includes('h3') && 
        !line.includes('ul') && 
        !line.includes('div') && 
        line.length > 10 // Filter out very short lines
      )
      .map(signal => signal.replace(/<[^>]*>/g, '').trim())
      .filter(Boolean) || [], // Filter out empty strings
    strategy: {
      overview: htmlContent
        .split('Strategic Recommendations')[1]
        ?.split('Entry Zones')[0]
        ?.replace(/<[^>]*>/g, '')
        .trim() || '',
      entry: htmlContent.match(/Entry Zones[:\s]*([^<\n]*)/)?.[1]?.trim() || '',
      stop: htmlContent.match(/Stop Loss[:\s]*([^<\n]*)/)?.[1]?.trim() || '',
      targets: htmlContent.match(/Targets[:\s]*([^<\n]*)/)?.[1]?.trim() || '',
      timeframe: htmlContent.match(/Timeframe[:\s]*([^<\n]*)/)?.[1]?.trim() || ''
    }
  };

  return (
    <div className="space-y-6">
      {/* Market Analysis Section */}
      {sections.marketAnalysis && (
        <div className="border-l-4 border-blue-500 pl-4">
          <h4 className="text-lg font-semibold text-blue-400 mb-2">Strategic Market Analysis</h4>
          <p className="text-gray-300 leading-relaxed">{sections.marketAnalysis}</p>
        </div>
      )}

      {/* Trading Signals Section - Only show if there are signals */}
      {sections.signals.length > 0 && (
        <div className="border-l-4 border-green-500 pl-4">
          <h4 className="text-lg font-semibold text-green-400 mb-2">Critical Trading Signals</h4>
          <ul className="space-y-3">
            {sections.signals.map((signal, index) => (
              <li key={index} className="flex items-start gap-2 bg-slate-700/30 p-3 rounded-lg">
                <div className="mt-1">
                  {signal.toLowerCase().includes('bullish') || signal.toLowerCase().includes('positive') ? (
                    <TrendingUp className="w-4 h-4 text-green-400" />
                  ) : signal.toLowerCase().includes('bearish') || signal.toLowerCase().includes('negative') ? (
                    <TrendingDown className="w-4 h-4 text-red-400" />
                  ) : (
                    <Activity className="w-4 h-4 text-yellow-400" />
                  )}
                </div>
                <span className="text-gray-300">{signal}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Strategy Section - Only show if there's content */}
      {(sections.strategy.overview || sections.strategy.entry || sections.strategy.targets) && (
        <div className="border-l-4 border-purple-500 pl-4">
          <h4 className="text-lg font-semibold text-purple-400 mb-2">Strategic Recommendations</h4>
          
          {/* Strategy Overview */}
          {sections.strategy.overview && (
            <div className="mb-4 bg-slate-700/30 p-3 rounded-lg">
              <p className="text-gray-300 leading-relaxed">{sections.strategy.overview}</p>
            </div>
          )}

          {/* Key Levels Grid - Only show if there are values */}
          {(sections.strategy.entry || sections.strategy.stop || sections.strategy.targets) && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              {sections.strategy.entry && (
                <div className="bg-slate-700/30 p-4 rounded-lg">
                  <h5 className="text-sm font-semibold text-blue-400 mb-2 flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    Entry Zones
                  </h5>
                  <p className="text-gray-300">{sections.strategy.entry}</p>
                </div>
              )}

              {sections.strategy.stop && (
                <div className="bg-slate-700/30 p-4 rounded-lg">
                  <h5 className="text-sm font-semibold text-red-400 mb-2 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Stop Loss
                  </h5>
                  <p className="text-gray-300">{sections.strategy.stop}</p>
                </div>
              )}

              {sections.strategy.targets && (
                <div className="bg-slate-700/30 p-4 rounded-lg">
                  <h5 className="text-sm font-semibold text-green-400 mb-2 flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    Targets
                  </h5>
                  <p className="text-gray-300">{sections.strategy.targets}</p>
                </div>
              )}
            </div>
          )}

          {/* Timeframe - Only show if there's a value */}
          {sections.strategy.timeframe && (
            <div className="bg-slate-700/30 p-4 rounded-lg">
              <h5 className="text-sm font-semibold text-yellow-400 mb-2 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Timeframe
              </h5>
              <p className="text-gray-300">{sections.strategy.timeframe}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

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

      {/* Market Summary - only show if there's content */}
      {analysis?.summary && (
        <div className="bg-slate-800 rounded-lg p-4">
          <h3 className="font-medium flex items-center gap-2 mb-3 text-white">
            <Brain className="w-5 h-5 text-blue-400" />
            Market Summary
          </h3>
          <div className="prose prose-invert max-w-none">
            <p className="text-gray-200">{analysis.summary}</p>
          </div>
        </div>
      )}

      {/* AI Analysis - only show if there's content */}
      {analysis?.aiAnalysis && (
        <div className="bg-slate-800 rounded-lg p-4">
          <h3 className="font-medium flex items-center gap-2 mb-4 text-white">
            <Brain className="w-5 h-5 text-purple-400" />
            AI Analysis
          </h3>
          {analysis.aiAnalysis ? 
            formatAIAnalysis(analysis.aiAnalysis)
            : null
          }
        </div>
      )}

      {/* Key Signals - only show if there are signals */}
      {analysis?.signals && analysis.signals.length > 0 && (
        <div className="bg-slate-800 rounded-lg p-4">
          <h3 className="font-medium flex items-center gap-2 mb-3 text-white">
            <Activity className="w-5 h-5 text-green-400" />
            Key Signals
          </h3>
          <div className="space-y-2">
            {analysis.signals.map((signal: Signal, index: number) => (
              <div key={index} className="flex items-center gap-2 p-2 rounded-lg bg-slate-700 text-gray-200">
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
      )}

      {/* Only show empty state if no data at all */}
      {!analysis?.summary && !analysis?.aiAnalysis && (!analysis?.signals || analysis.signals.length === 0) && (
        <div className="bg-slate-800 rounded-lg p-4 text-center">
          <p className="text-gray-400">No analysis data available</p>
        </div>
      )}
    </div>
  );
}; 