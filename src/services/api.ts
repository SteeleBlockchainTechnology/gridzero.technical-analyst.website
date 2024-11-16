import axios from 'axios';
import { CryptoPrice, NewsItem, PredictionData, BatchPriceData } from './types';

// API Configuration
const COINGECKO_API = 'https://api.coingecko.com/api/v3';

// Add CoinGecko API headers
const headers = {
  'Accept': 'application/json',
  'Content-Type': 'application/json',
};

// Cache configuration
const CACHE_DURATION = {
  PRICE: 1 * 60 * 1000,        // 1 minute
  NEWS: 15 * 60 * 1000,        // 15 minutes
  HISTORICAL: 5 * 60 * 1000,   // 5 minutes
  SENTIMENT: 30 * 60 * 1000,   // 30 minutes
};

const cache = new Map<string, { data: any; timestamp: number }>();

const isValidCache = (key: string, type: keyof typeof CACHE_DURATION) => {
  const cached = cache.get(key);
  return cached && (Date.now() - cached.timestamp < CACHE_DURATION[type]);
};

interface HistoricalDataItem {
  timestamp: number;
  price: number;
  value?: number;
}

interface HistoricalData {
  prices: HistoricalDataItem[];
  total_volumes: HistoricalDataItem[];
  market_caps: HistoricalDataItem[];
}

export const api = {
  async getPrice(crypto: string): Promise<CryptoPrice> {
    const cacheKey = `price-${crypto}`;
    
    if (isValidCache(cacheKey, 'PRICE')) {
      return cache.get(cacheKey)!.data;
    }

    try {
      const response = await axios.get(`${COINGECKO_API}/simple/price`, {
        headers,
        params: {
          ids: crypto,
          vs_currencies: 'usd',
          include_24h_change: true,
          include_market_cap: true
        }
      });

      if (!response.data[crypto]) {
        throw new Error(`No price data found for ${crypto}`);
      }

      const data = {
        price: response.data[crypto].usd,
        change24h: response.data[crypto].usd_24h_change || 0,
        timestamp: Date.now(),
      };

      cache.set(cacheKey, { data, timestamp: Date.now() });
      return data;
    } catch (error) {
      console.error(`API error for ${crypto}:`, error);
      const cachedData = cache.get(cacheKey);
      if (cachedData) {
        return cachedData.data;
      }
      return {
        price: 0,
        change24h: 0,
        timestamp: Date.now(),
      };
    }
  },

  async getHistoricalData(crypto: string, days: number = 200): Promise<HistoricalData> {
    const cacheKey = `historical-${crypto}-${days}`;
    
    if (isValidCache(cacheKey, 'HISTORICAL')) {
      return cache.get(cacheKey)!.data;
    }

    try {
      const response = await axios.get(`${COINGECKO_API}/coins/${crypto}/market_chart`, {
        headers,
        params: {
          vs_currency: 'usd',
          days: days.toString(),
          interval: 'daily'
        }
      });

      const transformedData: HistoricalData = {
        prices: response.data.prices.map((item: [number, number]) => ({
          timestamp: item[0],
          price: item[1]
        })),
        total_volumes: response.data.total_volumes.map((item: [number, number]) => ({
          timestamp: item[0],
          value: item[1]
        })),
        market_caps: response.data.market_caps.map((item: [number, number]) => ({
          timestamp: item[0],
          value: item[1]
        }))
      };

      cache.set(cacheKey, { data: transformedData, timestamp: Date.now() });
      return transformedData;
    } catch (error) {
      console.error('Error fetching historical data:', error);
      const cachedData = cache.get(cacheKey);
      if (cachedData) {
        return cachedData.data;
      }
      throw error;
    }
  },

  async getNews(crypto: string): Promise<{ news: NewsItem[] }> {
    const cacheKey = `news-${crypto}`;
    
    if (isValidCache(cacheKey, 'NEWS')) {
      return cache.get(cacheKey)!.data;
    }

    try {
      const response = await axios.get(`${COINGECKO_API}/coins/${crypto}`, {
        headers,
        params: {
          localization: false,
          tickers: false,
          market_data: false,
          community_data: false,
          developer_data: false,
          sparkline: false
        }
      });

      const news: NewsItem[] = [{
        title: `Latest update for ${response.data.name}`,
        source: 'CoinGecko',
        url: response.data.links?.homepage?.[0] || '#',
        timestamp: Date.now(),
        sentiment: 'neutral',
        description: response.data.description?.en || 'No description available',
        aiTags: response.data.categories || []
      }];

      const data = { news };
      cache.set(cacheKey, { data, timestamp: Date.now() });
      return data;
    } catch (error) {
      console.error('Error fetching news:', error);
      return { news: [] };
    }
  },

  async getBatchPrices(coins: string[]): Promise<BatchPriceData> {
    const cacheKey = `batch-prices-${coins.join('-')}`;
    
    if (isValidCache(cacheKey, 'PRICE')) {
      return cache.get(cacheKey)!.data;
    }

    try {
      const response = await axios.get(`${COINGECKO_API}/simple/price`, {
        headers,
        params: {
          ids: coins.join(','),
          vs_currencies: 'usd',
          include_24h_change: true,
          include_market_cap: true
        }
      });

      const batchData: BatchPriceData = {};
      
      Object.entries(response.data).forEach(([id, data]: [string, any]) => {
        batchData[id] = {
          price: data.usd,
          change24h: data.usd_24h_change || 0,
          timestamp: Date.now(),
          marketCap: data.usd_market_cap || 0
        };
      });

      cache.set(cacheKey, { data: batchData, timestamp: Date.now() });
      return batchData;
    } catch (error) {
      console.error('Error fetching batch prices:', error);
      const cachedData = cache.get(cacheKey);
      if (cachedData) {
        return cachedData.data;
      }
      return {};
    }
  },

  async getPredictions(crypto: string): Promise<PredictionData[]> {
    const cacheKey = `predictions-${crypto}`;
    
    if (isValidCache(cacheKey, 'SENTIMENT')) {
      return cache.get(cacheKey)!.data;
    }

    try {
      const response = await this.getHistoricalData(crypto, 30);
      const prices = response.prices.map((item: HistoricalDataItem) => item.price);
      const currentPrice = prices[prices.length - 1];

      const volatility = this.calculateVolatility(prices);
      const trend = this.calculateTrend(prices);

      const predictions: PredictionData[] = [
        {
          period: 'Short-term',
          price: currentPrice * (1 + trend * 0.01),
          confidence: Math.max(30, 100 - volatility),
          timestamp: Date.now()
        },
        {
          period: 'Mid-term',
          price: currentPrice * (1 + trend * 0.03),
          confidence: Math.max(30, 90 - volatility),
          timestamp: Date.now()
        },
        {
          period: 'Long-term',
          price: currentPrice * (1 + trend * 0.05),
          confidence: Math.max(30, 80 - volatility),
          timestamp: Date.now()
        }
      ];

      cache.set(cacheKey, { data: predictions, timestamp: Date.now() });
      return predictions;
    } catch (error) {
      console.error('Error generating predictions:', error);
      return [];
    }
  },

  calculateVolatility(prices: number[]): number {
    const returns = prices.slice(1).map((price, i) => 
      Math.log(price / prices[i])
    );
    
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / returns.length;
    
    return Math.sqrt(variance) * Math.sqrt(365) * 100;
  },

  calculateTrend(prices: number[]): number {
    const periods = prices.length;
    const x = Array.from({ length: periods }, (_, i) => i);
    const y = prices;
    
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((a, b, i) => a + b * y[i], 0);
    const sumXX = x.reduce((a, b) => a + b * b, 0);
    
    const slope = (periods * sumXY - sumX * sumY) / (periods * sumXX - sumX * sumX);
    const avgPrice = sumY / periods;
    
    return (slope / avgPrice) * 100;
  }
};  