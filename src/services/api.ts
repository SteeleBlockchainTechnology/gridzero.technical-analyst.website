import axios from 'axios';
import { CryptoPrice, NewsItem, SentimentData } from './types';

// API Configuration
const API_BASE = 'http://localhost:3001/api';

// Cache implementation with longer duration
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = {
  PRICE: 1 * 60 * 1000,      // 1 minute
  NEWS: 15 * 60 * 1000,      // 15 minutes
  HISTORICAL: 60 * 60 * 1000, // 1 hour
};

// Rate limiting
const rateLimiter = {
  newsdata: {
    lastCall: 0,
    minInterval: 60000, // 1 minute between calls
  },
};

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const isValidCache = (key: string, type: 'PRICE' | 'NEWS' | 'HISTORICAL') => {
  const cached = cache.get(key);
  return cached && Date.now() - cached.timestamp < CACHE_DURATION[type];
};

// Rate limit handler for NewsData API
const handleRateLimit = async (api: 'newsdata') => {
  const now = Date.now();
  const timeSinceLastCall = now - rateLimiter[api].lastCall;
  
  if (timeSinceLastCall < rateLimiter[api].minInterval) {
    await wait(rateLimiter[api].minInterval - timeSinceLastCall);
  }
  
  rateLimiter[api].lastCall = Date.now();
};

export const api = {
  async getPrice(crypto: string): Promise<CryptoPrice> {
    const cacheKey = `price-${crypto}`;
    
    if (isValidCache(cacheKey, 'PRICE')) {
      return cache.get(cacheKey)!.data;
    }

    try {
      const response = await axios.get(
        `${API_BASE}/crypto/price/${crypto}`
      );

      const data = {
        price: response.data[crypto.toLowerCase()].usd,
        change24h: response.data[crypto.toLowerCase()].usd_24h_change,
        timestamp: Date.now(),
      };

      cache.set(cacheKey, { data, timestamp: Date.now() });
      return data;
    } catch (error) {
      console.error('API error:', error);
      const cachedData = cache.get(cacheKey);
      if (cachedData) {
        console.log('Using stale cache for price data');
        return cachedData.data;
      }
      return {
        price: 0,
        change24h: 0,
        timestamp: Date.now(),
      };
    }
  },

  async getHistoricalData(crypto: string, days: number = 30) {
    const cacheKey = `historical-${crypto}-${days}`;
    
    if (isValidCache(cacheKey, 'HISTORICAL')) {
      return cache.get(cacheKey)!.data;
    }

    try {
      const response = await axios.get(
        `${API_BASE}/crypto/history/${crypto}`, {
          params: { days }
        }
      );

      const data = response.data.prices.map((item: [number, number]) => ({
        timestamp: item[0],
        price: item[1],
      }));

      cache.set(cacheKey, { data, timestamp: Date.now() });
      return data;
    } catch (error) {
      console.error('Error fetching historical data:', error);
      const cachedData = cache.get(cacheKey);
      if (cachedData) {
        console.log('Using stale cache for historical data');
        return cachedData.data;
      }
      throw error;
    }
  },

  async getSentiment(crypto: string): Promise<SentimentData[]> {
    const cacheKey = `sentiment-${crypto}`;
    
    if (isValidCache(cacheKey, 'NEWS')) {
      return cache.get(cacheKey)!.data;
    }

    try {
      // Use market data for sentiment analysis
      const [priceData, volumeData] = await Promise.all([
        this.getPrice(crypto),
        this.getHistoricalData(crypto, 1),
      ]);

      // Calculate sentiment based on price and volume trends
      const priceChange = priceData.change24h;
      const volumeChange = volumeData ? 
        ((volumeData[volumeData.length - 1].price - volumeData[0].price) / volumeData[0].price) * 100 : 
        0;

      const sentiment: SentimentData = {
        source: 'Market Analysis',
        sentiment: priceChange > 2 ? 'Bullish' : 
                  priceChange < -2 ? 'Bearish' : 'Neutral',
        volume: Math.min(100, Math.max(0, Math.abs(volumeChange))),
        timestamp: Date.now(),
      };

      const data = [sentiment];
      cache.set(cacheKey, { data, timestamp: Date.now() });
      return data;
    } catch (error) {
      console.error('Error generating sentiment:', error);
      return [
        { source: 'Market', sentiment: 'Neutral', volume: 50, timestamp: Date.now() }
      ];
    }
  },

  async getNews(crypto: string): Promise<NewsItem[]> {
    const cacheKey = `news-${crypto}`;
    
    if (isValidCache(cacheKey, 'NEWS')) {
      return cache.get(cacheKey)!.data;
    }

    try {
      await handleRateLimit('newsdata');
      const response = await axios.get(`${API_BASE}/news/${crypto}`, {
        timeout: 10000,
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.data) {
        throw new Error('No news data received');
      }

      const data = response.data;
      cache.set(cacheKey, { data, timestamp: Date.now() });
      return data;
    } catch (error) {
      console.error('Error fetching news:', error);
      const cachedData = cache.get(cacheKey);
      if (cachedData) {
        console.log('Using cached news data');
        return cachedData.data;
      }
      return [];
    }
  },

  analyzeSentiment(text: string): string {
    // Simple sentiment analysis based on keyword matching
    const words = text.toLowerCase().split(/\W+/);
    let score = 0;

    const positive = ['bullish', 'surge', 'gain', 'up', 'high', 'rise'];
    const negative = ['bearish', 'drop', 'fall', 'down', 'low', 'crash'];

    words.forEach(word => {
      if (positive.includes(word)) score++;
      if (negative.includes(word)) score--;
    });

    return score > 0 ? 'positive' : score < 0 ? 'negative' : 'neutral';
  }
}; 