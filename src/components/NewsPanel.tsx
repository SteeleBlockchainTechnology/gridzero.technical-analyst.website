import React from 'react';
import { Clock } from 'lucide-react';
import type { NewsItem } from '../services/types';

interface NewsPanelProps {
  crypto: string;
  news: NewsItem[];
}

export const NewsPanel: React.FC<NewsPanelProps> = ({ crypto, news }) => {
  // Remove duplicate news based on title
  const uniqueNews = news.filter((item, index, self) =>
    index === self.findIndex((t) => t.title === item.title)
  );

  return (
    <div className="space-y-4 max-h-[800px]"> {/* Increased max height */}
      {uniqueNews.map((item, index) => (
        <a
          key={index}
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block p-4 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 transition-colors"
        >
          {/* Image Section */}
          {item.imageUrl && (
            <div className="mb-3 relative rounded-lg overflow-hidden">
              <img
                src={item.imageUrl}
                alt={item.title}
                className="w-full h-48 object-cover"
                onError={(e) => {
                  // Hide image on error
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          )}

          {/* Content Section */}
          <div className="space-y-2">
            <h4 className="font-medium text-gray-200 line-clamp-2 hover:line-clamp-none">
              {item.title}
            </h4>
            
            {item.description && (
              <p className="text-sm text-gray-300 line-clamp-3 hover:line-clamp-none">
                {item.description}
              </p>
            )}

            {/* Metadata Section */}
            <div className="flex items-center justify-between text-xs text-gray-400 mt-2">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>{new Date(item.timestamp).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <span>{item.source}</span>
                {item.sentiment && (
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    item.sentiment === 'positive' ? 'bg-green-500/20 text-green-400' :
                    item.sentiment === 'negative' ? 'bg-red-500/20 text-red-400' :
                    'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {item.sentiment}
                  </span>
                )}
              </div>
            </div>

            {/* AI Tags if available */}
            {item.aiTags && item.aiTags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {item.aiTags.map((tag, tagIndex) => (
                  <span
                    key={tagIndex}
                    className="px-2 py-1 rounded-full bg-blue-500/20 text-blue-400 text-xs"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </a>
      ))}
    </div>
  );
};