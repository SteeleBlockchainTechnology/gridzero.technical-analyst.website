import axios from 'axios';
import { CryptoPrice, NewsItem, SentimentData } from './types';

// API Configuration
const API_BASE = 'http://localhost:3001/api';

// Basic cache entry interface
interface CacheEntry {
  data: any;
  timestamp: number;
}

// News-specific cache entry interface
interface NewsCacheEntry extends CacheEntry {
  hasMore: boolean;
  page: number;
}

// Cache implementation with longer duration
const cache = new Map<string, CacheEntry | NewsCacheEntry>();
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

  async getNews(crypto: string, page: number = 1, limit: number = 5): Promise<{ news: NewsItem[], hasMore: boolean }> {
    const cacheKey = `news-${crypto}-${page}`;
    
    if (isValidCache(cacheKey, 'NEWS')) {
      const cachedData = cache.get(cacheKey) as NewsCacheEntry;
      return {
        news: cachedData.data,
        hasMore: cachedData.hasMore
      };
    }

    try {
      await handleRateLimit('newsdata');
      
      // Get crypto ticker symbol
      const ticker = crypto.toUpperCase() === 'BITCOIN' ? 'BTC' : crypto.toUpperCase();
      
      // Make direct request to NewsData API
      const response = await axios.get('https://newsdata.io/api/1/news', {
        params: {
          apikey: 'pub_5827833f271352bd4b9540e47433b0fc33dc5',
          q: `${crypto} OR ${ticker}`,
          language: 'en',
          size: limit
        }
      });

      if (!response.data || response.data.status !== "success") {
        throw new Error('Invalid response from NewsData API');
      }

      // Process the news data
      const news = response.data.results.map((item: any) => ({
        title: item.title,
        source: item.source_name,
        url: item.link,
        timestamp: new Date(item.pubDate).getTime(),
        sentiment: this.analyzeSentiment(item.title + ' ' + (item.description || '')),
        description: item.description,
        imageUrl: item.image_url,
        sentimentStats: {
          positive: 0,
          negative: 0,
          neutral: 0
        }
      }));

      // Check if there are more pages using nextPage from API response
      const hasMore = response.data.nextPage !== null;

      // Cache the result
      const cacheEntry: NewsCacheEntry = {
        data: news,
        timestamp: Date.now(),
        page,
        hasMore
      };
      cache.set(cacheKey, cacheEntry);

      return { news, hasMore };
    } catch (error) {
      console.error('Error fetching news:', error);
      
      // Try to use cached data if available
      const cachedData = cache.get(cacheKey) as NewsCacheEntry | undefined;
      if (cachedData) {
        console.log('Using cached news data');
        return {
          news: cachedData.data,
          hasMore: cachedData.hasMore
        };
      }
      
      // Return empty result if no cache available
      return { 
        news: [], 
        hasMore: false 
      };
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