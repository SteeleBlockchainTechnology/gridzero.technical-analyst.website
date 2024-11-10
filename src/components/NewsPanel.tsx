import React, { useState, useEffect } from 'react';
import { Newspaper, TrendingUp, TrendingDown, Clock, ExternalLink } from 'lucide-react';
import type { NewsItem } from '../services/types';
import { api } from '../services/api';

interface NewsPanelProps {
  crypto: string;
  news: NewsItem[];
}

export const NewsPanel: React.FC<NewsPanelProps> = ({ crypto, news }) => {
  return (
    <div className="space-y-4">
      {news.map((item, index) => (
        <a
          key={index}
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block p-3 rounded-lg bg-slate-700 hover:bg-slate-600 transition-colors"
        >
          <h4 className="font-medium mb-1 text-gray-200">{item.title}</h4>
          {item.description && (
            <p className="text-sm text-gray-300 line-clamp-2">{item.description}</p>
          )}
          <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
            <span>{item.source}</span>
            <span>•</span>
            <span>{new Date(item.timestamp).toLocaleDateString()}</span>
          </div>
        </a>
      ))}
    </div>
  );
};