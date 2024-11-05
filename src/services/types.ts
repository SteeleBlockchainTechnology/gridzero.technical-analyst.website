export interface CryptoPrice {
  price: number;
  timestamp: number;
  change24h: number;
}

export interface NewsItem {
  title: string;
  source: string;
  url: string;
  timestamp: number;
  sentiment: string;
  description?: string;
  imageUrl?: string;
  sentimentStats?: {
    positive: number;
    neutral: number;
    negative: number;
  };
  aiTags?: string[];
}

export interface SentimentData {
  source: string;
  sentiment: 'Bullish' | 'Bearish' | 'Neutral';
  volume: number;
  timestamp: number;
}

export interface PredictionData {
  period: 'Short-term' | 'Mid-term' | 'Long-term';
  price: number;
  confidence: number;
  timestamp: number;
}

export interface Alert {
  id: string;
  type: string;
  message: string;
  severity: 'high' | 'medium' | 'low';
  timestamp: number;
} 