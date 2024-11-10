import React from 'react';
import { BarChart2, TrendingUp, TrendingDown, Activity } from 'lucide-react';

export const SentimentOverview = ({ data }: { data: any }) => {
  return (
    <div className="bg-slate-800 rounded-lg p-4">
      <h3 className="font-medium flex items-center gap-2 mb-4">
        <Activity className="w-5 h-5 text-green-400" />
        Market Sentiment
      </h3>
      <div className="space-y-4">
        {/* Overall Sentiment */}
        <div className="flex items-center justify-between">
          <span className="text-slate-400">Overall Sentiment</span>
          <div className={`px-2 py-1 rounded-full text-sm ${
            data.overall.signal === 'bullish' ? 'bg-green-500/10 text-green-400' :
            data.overall.signal === 'bearish' ? 'bg-red-500/10 text-red-400' :
            'bg-yellow-500/10 text-yellow-400'
          }`}>
            {data.overall.signal} ({data.overall.confidence}%)
          </div>
        </div>

        {/* Components */}
        <div className="space-y-3">
          {/* News Sentiment */}
          <div className="bg-slate-750 p-3 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-slate-400">News Sentiment</span>
              <span className="text-sm">{data.components.news.score.toFixed(1)}%</span>
            </div>
            <div className="space-y-1">
              {data.components.news.recent.map((news: string, index: number) => (
                <div key={index} className="text-xs text-slate-400 truncate">
                  {news}
                </div>
              ))}
            </div>
          </div>

          {/* Social Sentiment */}
          <div className="bg-slate-750 p-3 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-400">Social Sentiment</span>
              <div className="flex items-center gap-2">
                <span className="text-sm">{data.components.social.score.toFixed(1)}%</span>
                <span className="text-xs text-slate-400">
                  Vol: {data.components.social.volume.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Market Sentiment */}
          <div className="bg-slate-750 p-3 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-400">Market Flow</span>
              <div className="flex items-center gap-2">
                <span className="text-sm">{data.components.market.score.toFixed(1)}%</span>
                <span className="text-xs text-slate-400">
                  Dom: {data.components.market.dominance.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 