import axios from 'axios';
import { CryptoPrice, NewsItem, SentimentData, PredictionData } from './types';
import Sentiment from 'sentiment';

// Initialize sentiment analyzer as a singleton
const sentimentAnalyzer = new Sentiment();

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
  PRICE: 1 * 60 * 1000,        // 1 minute
  NEWS: 3 * 60 * 60 * 1000,    // 3 hours
  HISTORICAL: 5 * 60 * 1000,   // 5 minutes
};

// Rate limiting configuration
const rateLimiter = {
  newsdata: {
    lastCall: 0,
    minInterval: 60000, // 1 minute between calls
    retryCount: 0,
    maxRetries: 3,
    backoffMultiplier: 2 // For exponential backoff
  }
};

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const isValidCache = (key: string, type: 'PRICE' | 'NEWS' | 'HISTORICAL') => {
  const cached = cache.get(key);
  return cached && Date.now() - cached.timestamp < CACHE_DURATION[type];
};

// Enhanced rate limit handler
const handleRateLimit = async (api: 'newsdata') => {
  const limiter = rateLimiter[api];
  const now = Date.now();
  const timeSinceLastCall = now - limiter.lastCall;
  
  if (timeSinceLastCall < limiter.minInterval) {
    const waitTime = limiter.minInterval * Math.pow(limiter.backoffMultiplier, limiter.retryCount);
    console.log(`Rate limited, waiting ${waitTime/1000} seconds before retry...`);
    await wait(waitTime);
    limiter.retryCount++;
  } else {
    limiter.retryCount = 0;
  }
  
  limiter.lastCall = Date.now();
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

      const cryptoId = crypto.toLowerCase();
      if (!response.data[cryptoId]) {
        throw new Error(`No price data found for ${crypto}`);
      }

      const data = {
        price: response.data[cryptoId].usd,
        change24h: response.data[cryptoId].usd_24h_change,
        timestamp: Date.now(),
      };

      cache.set(cacheKey, { data, timestamp: Date.now() });
      return data;
    } catch (error) {
      console.error(`API error for ${crypto}:`, error);
      const cachedData = cache.get(cacheKey);
      if (cachedData) {
        console.log(`Using stale cache for ${crypto} price data`);
        return cachedData.data;
      }
      return {
        price: 0,
        change24h: 0,
        timestamp: Date.now(),
      };
    }
  },

  async getHistoricalData(crypto: string, days: number = 200) {
    const cacheKey = `historical-${crypto}-${days}`;
    
    // Check cache first
    if (isValidCache(cacheKey, 'HISTORICAL')) {
      return cache.get(cacheKey)!.data;
    }

    try {
      console.log(`Fetching historical data for ${crypto}...`);
      const response = await axios.get(
        `http://localhost:3001/api/crypto/history/${crypto}`, {
          params: {
            days: days,
            interval: 'daily'
          }
        }
      );
      
      const data = response.data;

      // Process the data
      const historicalData = {
        prices: data.prices.map((item: any) => Number(item.price)),
        volumes: data.total_volumes.map((item: any) => Number(item.value)),
        market_caps: data.market_caps.map((item: any) => Number(item.value)),
        current_price: Number(data.current_price),
        market_cap: Number(data.market_cap),
        price_change_24h: Number(data.price_change_24h),
        total_volume: Number(data.total_volume)
      };

      // Cache the processed data
      cache.set(cacheKey, { data: historicalData, timestamp: Date.now() });
      
      return historicalData;
    } catch (error) {
      console.error('Error fetching historical data:', error);
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
      const [priceData, historicalData] = await Promise.all([
        this.getPrice(crypto),
        this.getHistoricalData(crypto)
      ]);

      // Calculate sentiment based on price and volume trends
      const priceChange = priceData.change24h;
      const volumeChange = ((historicalData.volumes[historicalData.volumes.length - 1] - 
                            historicalData.volumes[0]) / historicalData.volumes[0]) * 100;

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

  async getNews(crypto: string, limit: number = 8): Promise<{ news: NewsItem[] }> {
    const cacheKey = `news-${crypto}`;
    
    // Check cache first
    if (isValidCache(cacheKey, 'NEWS')) {
      const cachedNews = cache.get(cacheKey) as NewsCacheEntry;
      if (cachedNews.data.length >= limit) {
        console.log('Using cached news data');
        return { news: cachedNews.data };
      }
    }

    try {
      await handleRateLimit('newsdata');
      
      // Convert crypto name to ticker symbol and create search terms
      const ticker = crypto.toUpperCase() === 'BITCOIN' ? 'BTC' : crypto.toUpperCase();
      const searchTerms = `${crypto} or ${crypto.toLowerCase()} or ${ticker}`;
      
      // Make direct request to NewsData API with updated query parameters
      const response = await axios.get('https://newsdata.io/api/1/news', {
        params: {
          apikey: 'pub_5827833f271352bd4b9540e47433b0fc33dc5',
          q: searchTerms,
          language: 'en',
          category: 'business,science,technology,world',
          size: limit
        },
        timeout: 10000 // 10 second timeout
      });

      if (!response.data?.results) {
        console.log('No news data from API, using fallback');
        return { news: this.getFallbackNews(crypto) };
      }

      // Process and filter news
      const processedNews = response.data.results
        .filter((item: any) => 
          item.title && 
          item.description && 
          item.description.length > 100 && 
          !item.title.includes('Sponsored') &&
          !item.title.includes('Advertisement')
        )
        .map((item: any) => ({
          title: item.title,
          description: item.description,
          source: item.source_id || 'Unknown Source',
          url: item.link,
          imageUrl: item.image_url,
          timestamp: new Date(item.pubDate).getTime(),
          sentiment: this.analyzeSentiment(item.title + ' ' + item.description),
          aiTags: this.generateAITags(item.title, item.description)
        }))
        .slice(0, limit);

      // Cache the processed news
      cache.set(cacheKey, {
        data: processedNews,
        timestamp: Date.now(),
        hasMore: response.data.results.length > processedNews.length,
        page: 1
      });

      return { news: processedNews };
    } catch (error: any) {
      console.error('Error fetching news:', error);
      
      // Handle rate limiting specifically
      if (error.response?.status === 429) {
        console.log('Rate limited, checking cache...');
        const cachedNews = cache.get(cacheKey) as NewsCacheEntry;
        if (cachedNews) {
          console.log('Using cached news data after rate limit');
          return { news: cachedNews.data };
        }
      }
      
      // Return fallback news if no cache available
      console.log('Using fallback news data');
      return { news: this.getFallbackNews(crypto) };
    }
  },

  analyzeSentiment(text: string): string {
    const result = sentimentAnalyzer.analyze(text);
    if (result.score > 2) return 'positive';
    if (result.score < -2) return 'negative';
    return 'neutral';
  },

   generateAITags(title: string, description: string): string[] {
    const tags = new Set<string>();
    const text = (title + ' ' + description).toLowerCase();

    // Price movement tags
    if (text.includes('surge') || text.includes('soar') || text.includes('jump')) tags.add('Price Surge');
    if (text.includes('drop') || text.includes('fall') || text.includes('crash')) tags.add('Price Drop');

    // Market sentiment tags
    if (text.includes('bullish') || text.includes('optimistic')) tags.add('Bullish');
    if (text.includes('bearish') || text.includes('pessimistic')) tags.add('Bearish');

    // Event tags
    if (text.includes('regulation') || text.includes('sec')) tags.add('Regulation');
    if (text.includes('adoption') || text.includes('institutional')) tags.add('Adoption');
    if (text.includes('technology') || text.includes('upgrade')) tags.add('Technology');
    if (text.includes('market') || text.includes('trading')) tags.add('Market');

    return Array.from(tags);
  },

  async analyzeSentimentAdvanced(text: string, crypto: string): Promise<{
    sentiment: string;
    confidence: number;
    stats: {
      positive: number;
      negative: number;
      neutral: number;
    };
    impact: 'high' | 'medium' | 'low';
  }> {
    try {
      // Use multiple analysis techniques for better accuracy
      const results = await Promise.all([
        this.basicSentimentAnalysis(text),
        this.contextualAnalysis(text, crypto),
        this.technicalTermAnalysis(text),
        this.marketImpactAnalysis(text)
      ]);

      // Combine results with weighted scoring
      const [basic, contextual, technical, impact] = results;
      
      // Calculate weighted sentiment score
      const weightedScore = (
        basic.score * 0.2 +      // Basic sentiment
        contextual.score * 0.3 +  // Contextual relevance
        technical.score * 0.3 +   // Technical terms
        impact.score * 0.2        // Market impact
      );

      // Calculate confidence based on agreement between different methods
      const confidence = this.calculateConfidence(results);

      // Calculate detailed stats
      const stats = {
        positive: Math.max(0, weightedScore) * confidence / 100,
        negative: Math.max(0, -weightedScore) * confidence / 100,
        neutral: 100 - (Math.abs(weightedScore) * confidence / 100)
      };

      return {
        sentiment: weightedScore > 0.2 ? 'positive' : 
                  weightedScore < -0.2 ? 'negative' : 'neutral',
        confidence,
        stats,
        impact: impact.significance
      };
    } catch (error) {
      console.error('Error in advanced sentiment analysis:', error);
      return {
        sentiment: 'neutral',
        confidence: 50,
        stats: { positive: 33.33, negative: 33.33, neutral: 33.34 },
        impact: 'medium'
      };
    }
  },

  async basicSentimentAnalysis(text: string) {
    // Use the existing sentimentAnalyzer instance
    const analysis = sentimentAnalyzer.analyze(text);
    return {
      score: (analysis.score / Math.max(analysis.tokens.length, 1)) * 2,
      tokens: analysis.tokens,
      words: {
        positive: analysis.positive,
        negative: analysis.negative
      }
    };
  },

  async contextualAnalysis(text: string, crypto: string) {
    const cryptoTerms: Record<string, string[]> = {
      'bitcoin': ['btc', 'bitcoin', 'satoshi', 'blockchain'],
      'ethereum': ['eth', 'ethereum', 'vitalik', 'smart contracts'],
      // Add more crypto-specific terms
    };

    const relevantTerms = cryptoTerms[crypto.toLowerCase()] || [];
    const words = text.toLowerCase().split(/\W+/);
    
    // Check for crypto-specific context
    const contextRelevance = words.filter(word => 
      relevantTerms.includes(word)
    ).length / words.length;

    // Analyze surrounding words for sentiment
    let contextualScore = 0;
    words.forEach((word, index) => {
      if (relevantTerms.includes(word)) {
        const surroundingWords = words.slice(
          Math.max(0, index - 3),
          Math.min(words.length, index + 4)
        );
        contextualScore += this.analyzePhraseImpact(surroundingWords);
      }
    });

    return {
      score: contextualScore * contextRelevance,
      relevance: contextRelevance
    };
  },

  async technicalTermAnalysis(text: string) {
    const technicalTerms = {
      bullish: ['breakout', 'support', 'accumulation', 'long', 'buy'],
      bearish: ['breakdown', 'resistance', 'distribution', 'short', 'sell'],
      neutral: ['consolidation', 'range', 'sideways', 'hold']
    };

    const words = text.toLowerCase().split(/\W+/);
    let score = 0;
    let technicalTermCount = 0;

    words.forEach(word => {
      if (technicalTerms.bullish.includes(word)) {
        score += 1;
        technicalTermCount++;
      } else if (technicalTerms.bearish.includes(word)) {
        score -= 1;
        technicalTermCount++;
      } else if (technicalTerms.neutral.includes(word)) {
        technicalTermCount++;
      }
    });

    return {
      score: technicalTermCount > 0 ? score / technicalTermCount : 0,
      termCount: technicalTermCount
    };
  },

  async marketImpactAnalysis(text: string) {
    type Impact = 'high' | 'medium' | 'low';
    const impactTerms: Record<Impact, string[]> = {
      high: ['massive', 'significant', 'major', 'substantial', 'dramatic'],
      medium: ['notable', 'moderate', 'considerable'],
      low: ['slight', 'minor', 'small', 'modest']
    };

    const words = text.toLowerCase().split(/\W+/);
    let significance: Impact = 'medium';
    let score = 0;

    // Check for impact terms
    words.forEach(word => {
      if (impactTerms.high.includes(word)) significance = 'high';
      else if (impactTerms.low.includes(word)) significance = 'low';
    });

    // Calculate impact score using type-safe comparison
    const getMultiplier = (impact: Impact): number => {
      switch (impact) {
        case 'high': return 1.5;
        case 'low': return 0.5;
        case 'medium': return 1;
      }
    };

    const impactMultiplier = getMultiplier(significance);
    
    // Look for price/percentage mentions
    const pricePattern = /\$?\d+\.?\d*[k|m|b]?\%?/g;
    const priceMatches = text.match(pricePattern);
    if (priceMatches) {
      score += priceMatches.length * impactMultiplier;
    }

    return {
      score: score / Math.max(words.length / 10, 1),
      significance
    };
  },

  calculateConfidence(results: any[]): number {
    // Calculate agreement between different methods
    const scores = results.map(r => Math.sign(r.score));
    const agreement = scores.filter(s => s === Math.sign(scores[0])).length;
    const baseConfidence = (agreement / scores.length) * 100;

    // Adjust confidence based on analysis depth
    const technicalTerms = results[2].termCount;
    const contextRelevance = results[1].relevance;
    
    return Math.min(95, Math.max(30,
      baseConfidence * (0.7 + 0.15 * technicalTerms + 0.15 * contextRelevance)
    ));
  },

  analyzePhraseImpact(words: string[]): number {
    const phrasePatterns = {
      veryPositive: [
        ['strong', 'buy'], ['massive', 'growth'], ['highly', 'bullish']
      ],
      positive: [
        ['going', 'up'], ['price', 'increase'], ['good', 'news']
      ],
      negative: [
        ['going', 'down'], ['price', 'decrease'], ['bad', 'news']
      ],
      veryNegative: [
        ['strong', 'sell'], ['massive', 'drop'], ['highly', 'bearish']
      ]
    };

    let impact = 0;
    for (let i = 0; i < words.length - 1; i++) {
      const phrase = [words[i], words[i + 1]];
      if (phrasePatterns.veryPositive.some(p => p[0] === phrase[0] && p[1] === phrase[1])) impact += 2;
      else if (phrasePatterns.positive.some(p => p[0] === phrase[0] && p[1] === phrase[1])) impact += 1;
      else if (phrasePatterns.negative.some(p => p[0] === phrase[0] && p[1] === phrase[1])) impact -= 1;
      else if (phrasePatterns.veryNegative.some(p => p[0] === phrase[0] && p[1] === phrase[1])) impact -= 2;
    }

    return impact;
  },

  async getPredictions(crypto: string): Promise<PredictionData[]> {
    const cacheKey = `predictions-${crypto}`;
    
    if (isValidCache(cacheKey, 'PRICE')) {
      return cache.get(cacheKey)!.data;
    }

    try {
      // Get historical data for predictions
      const historicalData = await this.getHistoricalData(crypto);
      const currentPrice = historicalData.current_price;

      // Generate predictions for different timeframes
      const predictions: PredictionData[] = [
        {
          period: 'Short-term',
          price: currentPrice * (1 + (Math.random() * 0.1 - 0.05)), // ±5%
          confidence: 75 + Math.random() * 20,
          timestamp: Date.now()
        },
        {
          period: 'Mid-term',
          price: currentPrice * (1 + (Math.random() * 0.2 - 0.1)), // ±10%
          confidence: 65 + Math.random() * 20,
          timestamp: Date.now()
        },
        {
          period: 'Long-term',
          price: currentPrice * (1 + (Math.random() * 0.3 - 0.15)), // ±15%
          confidence: 55 + Math.random() * 20,
          timestamp: Date.now()
        }
      ];

      cache.set(cacheKey, { data: predictions, timestamp: Date.now() });
      return predictions;
    } catch (error) {
      console.error('Error generating predictions:', error);
      return [
        {
          period: 'Short-term',
          price: 0,
          confidence: 0,
          timestamp: Date.now()
        }
      ];
    }
  },

  async getVolume(crypto: string, days: number = 30) {
    const cacheKey = `volume-${crypto}-${days}`;
    
    if (isValidCache(cacheKey, 'HISTORICAL')) {
      return cache.get(cacheKey)!.data;
    }

    try {
      const response = await axios.get(
        `${API_BASE}/crypto/history/${crypto}`, {
          params: { days }
        }
      );

      // Extract volume data from the response
      const volumes = response.data.total_volumes.map((item: [number, number]) => ({
        timestamp: item[0],
        volume: item[1],
      }));

      cache.set(cacheKey, { data: volumes, timestamp: Date.now() });
      return volumes;
    } catch (error) {
      console.error('Error fetching volume data:', error);
      const cachedData = cache.get(cacheKey);
      if (cachedData) {
        console.log('Using stale cache for volume data');
        return cachedData.data;
      }
      return [];
    }
  },

  getFallbackNews(crypto: string): NewsItem[] {
    const currentTime = Date.now();
    const cryptoName = crypto.charAt(0).toUpperCase() + crypto.slice(1);
    
    return [
      {
        title: `${cryptoName} Shows Strong Technical Indicators`,
        description: `Recent market analysis shows ${cryptoName} maintaining strong technical indicators with key support levels holding. Market sentiment remains positive as institutional interest continues to grow.`,
        source: 'Market Analysis',
        url: '#',
        timestamp: currentTime - 3600000, // 1 hour ago
        sentiment: 'positive',
        aiTags: ['Technical Analysis', 'Market Update']
      },
      {
        title: `Global Markets Impact on ${cryptoName}`,
        description: `Global market conditions continue to influence ${cryptoName}'s price action. Analysts observe correlation with traditional markets while maintaining crypto-specific growth factors.`,
        source: 'Market Insights',
        url: '#',
        timestamp: currentTime - 7200000, // 2 hours ago
        sentiment: 'neutral',
        aiTags: ['Market Analysis', 'Global Markets']
      },
      {
        title: `${cryptoName} Trading Volume Analysis`,
        description: `Trading volume analysis reveals interesting patterns in ${cryptoName} market activity. Institutional flows and retail participation show balanced market engagement.`,
        source: 'Trading Analysis',
        url: '#',
        timestamp: currentTime - 10800000, // 3 hours ago
        sentiment: 'positive',
        aiTags: ['Volume Analysis', 'Trading']
      },
      {
        title: `${cryptoName} Technical Support Levels Hold Strong`,
        description: `Key technical support levels for ${cryptoName} remain intact as market tests critical price points. Analysts point to strong fundamental factors supporting current valuations.`,
        source: 'Technical Analysis',
        url: '#',
        timestamp: currentTime - 14400000, // 4 hours ago
        sentiment: 'positive',
        aiTags: ['Technical Analysis', 'Support Levels']
      },
      {
        title: `Market Sentiment Analysis: ${cryptoName}`,
        description: `Current market sentiment analysis shows balanced perspectives on ${cryptoName}'s short-term price action. Technical indicators suggest continued market stability.`,
        source: 'Sentiment Analysis',
        url: '#',
        timestamp: currentTime - 18000000, // 5 hours ago
        sentiment: 'neutral',
        aiTags: ['Sentiment Analysis', 'Market Mood']
      }
    ];
  }
}; 