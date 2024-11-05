import React from 'react';
import { Newspaper, TrendingUp, TrendingDown, Clock, ExternalLink } from 'lucide-react';
import type { NewsItem } from '../services/types';

interface NewsPanelProps {
  crypto: string;
  news: NewsItem[];
}

export const NewsPanel: React.FC<NewsPanelProps> = ({ crypto, news }) => {
  const getCryptoSymbol = (cryptoId: string) => {
    const symbols: Record<string, string> = {
      'bitcoin': 'BTC',
      'ethereum': 'ETH',
      'binancecoin': 'BNB',
      'cardano': 'ADA',
      'solana': 'SOL',
    };
    return symbols[cryptoId] || cryptoId.toUpperCase();
  };

  const analyzeSentimentContext = (text: string, cryptoSymbol: string) => {
    const words = text.toLowerCase().split(/\W+/);
    let score = 0;
    let contextRelevance = 0;

    const priceUp = ['surge', 'soar', 'jump', 'rally', 'gain', 'rise', 'climb', 'breakout'];
    const priceDown = ['plunge', 'crash', 'drop', 'fall', 'decline', 'dip', 'tumble', 'slump'];
    const bullish = ['bullish', 'optimistic', 'positive', 'confident', 'strong', 'support'];
    const bearish = ['bearish', 'pessimistic', 'negative', 'weak', 'resistance', 'concern'];

    let lastCryptoMention = -1;
    words.forEach((word, index) => {
      if (word.includes(cryptoSymbol.toLowerCase()) || 
          word === 'btc' || word === 'crypto' || word === 'bitcoin') {
        lastCryptoMention = index;
        contextRelevance += 1;
      }

      let wordScore = 0;
      let multiplier = 1.0;

      if (lastCryptoMention !== -1) {
        const distance = Math.abs(index - lastCryptoMention);
        if (distance <= 5) {
          multiplier *= (1 - distance/10);
        }
      }

      if (priceUp.includes(word)) wordScore = 1;
      else if (priceDown.includes(word)) wordScore = -1;
      else if (bullish.includes(word)) wordScore = 0.8;
      else if (bearish.includes(word)) wordScore = -0.8;

      score += wordScore * multiplier;
    });

    const normalizedScore = (score / 10) * 100;
    const confidence = Math.min(100, Math.max(0, contextRelevance * 20));

    return {
      sentiment: normalizedScore > 30 ? 'positive' : 
                 normalizedScore < -30 ? 'negative' : 'neutral',
      stats: {
        positive: Math.max(0, normalizedScore),
        negative: Math.max(0, -normalizedScore),
        neutral: 100 - Math.abs(normalizedScore)
      },
      confidence
    };
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment.toLowerCase()) {
      case 'positive': return 'bg-green-500/10 text-green-400';
      case 'negative': return 'bg-red-500/10 text-red-400';
      default: return 'bg-yellow-500/10 text-yellow-400';
    }
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment.toLowerCase()) {
      case 'positive': return <TrendingUp className="w-4 h-4" />;
      case 'negative': return <TrendingDown className="w-4 h-4" />;
      default: return null;
    }
  };

  const formatTimeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    const intervals = {
      year: 31536000,
      month: 2592000,
      week: 604800,
      day: 86400,
      hour: 3600,
      minute: 60
    };

    for (const [unit, secondsInUnit] of Object.entries(intervals)) {
      const interval = Math.floor(seconds / secondsInUnit);
      if (interval >= 1) {
        return `${interval} ${unit}${interval === 1 ? '' : 's'} ago`;
      }
    }
    return 'Just now';
  };

  const cleanTitle = (title: string) => {
    return title
      .replace(/ONLY AVAILABLE IN .+$/i, '')
      .replace(/\[.+?\]/g, '')
      .replace(/\bONLY AVAILABLE IN PROFESSIONAL AND CORPORATE PLANS\b/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  };

  return (
    <div className="h-full flex flex-col">
      <h2 className="text-lg font-semibold flex items-center gap-2 mb-3">
        <Newspaper className="w-5 h-5" />
        Latest {getCryptoSymbol(crypto)} News
      </h2>
      <div className="flex-1 space-y-3 overflow-y-auto max-h-[calc(100vh-24rem)]">
        {news && news.length > 0 ? (
          news.map((item, index) => {
            const sentimentAnalysis = analyzeSentimentContext(
              item.title + ' ' + (item.description || ''),
              getCryptoSymbol(crypto)
            );
            return (
              <div key={index} className="bg-slate-750 rounded-lg overflow-hidden">
                {item.imageUrl && (
                  <div className="relative h-32 w-full">
                    <img 
                      src={item.imageUrl} 
                      alt={cleanTitle(item.title)}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-750 to-transparent" />
                  </div>
                )}
                <div className="p-3">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-medium text-sm leading-snug flex-1">
                        {cleanTitle(item.title)}
                      </h3>
                      <div className={`flex-shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-full text-xs whitespace-nowrap ${
                        getSentimentColor(sentimentAnalysis.sentiment)
                      }`}>
                        {getSentimentIcon(sentimentAnalysis.sentiment)}
                        <span>{sentimentAnalysis.confidence}%</span>
                      </div>
                    </div>
                    
                    {item.description && (
                      <p className="text-xs text-slate-400 line-clamp-2">
                        {cleanTitle(item.description)}
                      </p>
                    )}

                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 text-slate-400">
                        <Clock className="w-3 h-3" />
                        <span>{formatTimeAgo(item.timestamp)}</span>
                        <span>•</span>
                        <span>{item.source}</span>
                      </div>
                      {item.url && (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-blue-400 hover:text-blue-300"
                        >
                          Read more
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center text-slate-400 py-4">
            <Newspaper className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No recent news available for {getCryptoSymbol(crypto)}</p>
          </div>
        )}
      </div>
    </div>
  );
};