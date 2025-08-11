import express from 'express';
import cors from 'cors';
import axios from 'axios';
import dotenv from 'dotenv';
import { WebSocketServer, WebSocket } from 'ws';
import type { Request, Response, NextFunction } from 'express';
import http from 'http';
import session from 'express-session';
import path from 'path';
import { fileURLToPath } from 'url';

// ESM-compatible __dirname and __filename
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables reliably - try multiple approaches
console.log('=== LOADING ENVIRONMENT VARIABLES ===');
console.log('Current NODE_ENV:', process.env.NODE_ENV);

// Load .env first (fallback)
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Then try production if in production mode
if (process.env.NODE_ENV === 'production') {
  dotenv.config({ path: path.resolve(__dirname, '../../.env.production') });
}

// Also try to load from working directory as fallback
dotenv.config();

console.log('=== ENVIRONMENT VARIABLES DEBUG ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('HOST:', process.env.HOST);
console.log('DISCORD_CLIENT_ID:', process.env.DISCORD_CLIENT_ID ? 'SET' : 'MISSING');
console.log('DISCORD_CLIENT_SECRET:', process.env.DISCORD_CLIENT_SECRET ? 'SET' : 'MISSING');
console.log('DISCORD_GUILD_ID:', process.env.DISCORD_GUILD_ID);
console.log('DISCORD_PREMIUM_ROLE_ID:', process.env.DISCORD_PREMIUM_ROLE_ID);
console.log('DISCORD_CALLBACK_URL:', process.env.DISCORD_CALLBACK_URL);
console.log('SESSION_SECRET:', process.env.SESSION_SECRET ? 'SET' : 'MISSING');

// Validate critical environment variables
const requiredEnvVars = [
  'DISCORD_CLIENT_ID',
  'DISCORD_CLIENT_SECRET', 
  'DISCORD_BOT_TOKEN',
  'DISCORD_GUILD_ID',
  'DISCORD_PREMIUM_ROLE_ID',
  'SESSION_SECRET'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingVars.length > 0) {
  console.error('❌ CRITICAL: Missing required environment variables:', missingVars);
  console.error('Server cannot start without these variables. Check your .env file.');
  process.exit(1);
}

console.log('✅ All required environment variables are set');
console.log('=======================================');

// Import passport after environment variables are loaded
import { initializePassport } from './config/passport.js';

console.log('=== SERVER STARTUP DEBUG ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('HOST:', process.env.HOST);
console.log('SESSION_SECRET exists:', !!process.env.SESSION_SECRET);
console.log('DISCORD_CLIENT_ID:', process.env.DISCORD_CLIENT_ID);
console.log('DISCORD_BOT_TOKEN exists:', !!process.env.DISCORD_BOT_TOKEN);
console.log('DISCORD_GUILD_ID:', process.env.DISCORD_GUILD_ID);
console.log('=== END STARTUP DEBUG ===');

console.log('Initializing passport...');
let passport;
try {
  passport = initializePassport();
  console.log('Passport initialized successfully');
} catch (error) {
  console.error('Failed to initialize passport:', error);
  process.exit(1);
}

const app = express();
const server = http.createServer(app);
// Prefer BACKEND_PORT/PORT for dev; keep VITE_PORT fallback to preserve existing behavior
const PORT = parseInt(process.env.BACKEND_PORT || process.env.PORT || process.env.VITE_PORT || '5000', 10);

// Resolve frontend origin for redirects (OAuth success/failure) and dev convenience
const HOST = process.env.HOST || 'localhost';
const FRONTEND_PORT = process.env.FRONTEND_PORT || process.env.VITE_FRONTEND_PORT || '3000';
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || (
  process.env.NODE_ENV === 'production'
    ? `https://${HOST}`
    : `http://localhost:${FRONTEND_PORT}`
);

// Trust proxy for Nginx/reverse proxy setup
app.set('trust proxy', 1);

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? [`https://${process.env.HOST}`, `https://www.${process.env.HOST}`]
    : [
        'http://localhost:3000', // frontend dev default
        'http://localhost:5000', // backend dev default
        'http://localhost:3001'  // existing backend default
      ],
  methods: ['GET', 'POST', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Authentication Middleware
app.use(session({
  secret: process.env.SESSION_SECRET!,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // HTTPS required in production
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // Use 'none' for cross-site HTTPS
    path: '/',
    domain: process.env.NODE_ENV === 'production' ? 'ta.gridzero.xyz' : undefined
  },
  name: 'connect.sid', // Use default session name for better compatibility
  // Enhanced session persistence
  rolling: true, // Reset expiration on each request
  proxy: process.env.NODE_ENV === 'production' // Trust proxy in production
}));

app.use(passport.initialize());
app.use(passport.session());

// Cookie debugging middleware
app.use((req, res, next) => {
  console.log('=== COOKIE DEBUG ===');
  console.log('URL:', req.url);
  console.log('Cookie header:', req.headers.cookie);
  console.log('Session ID:', req.sessionID);
  console.log('Session data:', req.session);
  console.log('Is authenticated:', req.isAuthenticated ? req.isAuthenticated() : 'No method');
  console.log('User:', req.user);
  console.log('=== END COOKIE DEBUG ===');
  next();
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  // Serve static files from the built frontend
  app.use(express.static(path.join(__dirname, '../../dist')));
  console.log(`📁 Serving static files from: ${path.join(__dirname, '../../dist')}`);
}

const ensureVerified = (req: any, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated() || !(req.user as any).verified) {
    return res.status(401).json({ error: 'Verification required. Please verify your Premium Access role.' });
  }
  next();
};

// Authentication Routes
app.get('/api/auth/discord', passport.authenticate('discord'));

app.get('/api/auth/discord/callback', (req, res, next) => {
  console.log('=== DISCORD CALLBACK HIT ===');
  console.log('Query params:', req.query);
  console.log('Session ID before auth:', req.sessionID);
  console.log('Session data before auth:', req.session);
  next();
}, passport.authenticate('discord', {
  failureRedirect: `${FRONTEND_ORIGIN}/verification-failed`
}), (req, res) => {
  // Custom success handler to ensure session is saved before redirect
  console.log('=== AUTHENTICATION SUCCESS ===');
  console.log('Session ID after auth:', req.sessionID);
  console.log('User after auth:', req.user);
  console.log('Session data after auth:', req.session);
  
  // Force session regeneration for security and persistence
  req.session.regenerate((err) => {
    if (err) {
      console.error('Session regeneration error:', err);
      return res.redirect('/verification-failed');
    }
    
    // Re-login the user after regeneration
    req.logIn(req.user!, (err) => {
      if (err) {
        console.error('Re-login error:', err);
        return res.redirect('/verification-failed');
      }
      
      console.log('User re-logged in after session regeneration');
      console.log('New session ID:', req.sessionID);
      
      // Save session explicitly before redirect
      req.session.save((err) => {
        if (err) {
          console.error('Session save error:', err);
          return res.redirect('/verification-failed');
        }
        
        console.log('Session saved successfully, redirecting...');
  // Always redirect to the frontend origin so the SPA handles routing
  res.redirect(FRONTEND_ORIGIN + '/');
      });
    });
  });
});

app.get('/api/check-verification', (req, res) => {
  console.log('=== VERIFICATION CHECK ===');
  console.log('Auth Check: isAuthenticated', req.isAuthenticated());
  console.log('User:', req.user);
  console.log('Session ID:', req.sessionID);
  console.log('Session data:', req.session);
  console.log('Request headers:', req.headers);
  console.log('Cookies:', req.headers.cookie);
  
  const isVerified = req.isAuthenticated() && req.user && (req.user as any).verified;
  console.log('Final verification status:', isVerified);
  
  res.json({ 
    verified: isVerified,
    debug: {
      sessionExists: !!req.session,
      sessionId: req.sessionID,
      isAuthenticated: req.isAuthenticated(),
      hasUser: !!req.user,
      userVerified: req.user ? (req.user as any).verified : false,
      cookies: req.headers.cookie || 'No cookies'
    }
  });
});

app.get('/api/verification-failed', (req, res) => {
  res.status(403).json({ error: 'Verification failed. Ensure you have the Premium Access role in the Discord server.' });
});

app.get('/api/auth/reset', (_req, res) => {
  _req.logout((err: any) => {
    if (err) return res.status(500).json({ error: 'Reset failed.' });
    // Send user back to the frontend app root
    res.redirect(FRONTEND_ORIGIN + '/');
  });
});

// In development, if someone hits the backend root, send them to the Vite frontend
if (process.env.NODE_ENV !== 'production') {
  app.get('/', (_req, res) => res.redirect(FRONTEND_ORIGIN));
}

// Session test endpoint for debugging
app.get('/api/session-test', (req, res) => {
  console.log('=== SESSION TEST ===');
  console.log('Session ID:', req.sessionID);
  console.log('Session data:', req.session);
  console.log('Cookies received:', req.headers.cookie);
  
  // Test session persistence
  const session = req.session as any;
  if (!session.testValue) {
    session.testValue = 'test-' + Date.now();
    console.log('Created test session value:', session.testValue);
  } else {
    console.log('Found existing test session value:', session.testValue);
  }
  
  req.session.save((err) => {
    if (err) {
      console.error('Session save error in test:', err);
      return res.status(500).json({ error: 'Session save failed', sessionId: req.sessionID });
    }
    
    res.json({
      sessionId: req.sessionID,
      testValue: session.testValue,
      isAuthenticated: req.isAuthenticated(),
      user: req.user,
      message: 'Session test completed'
    });
  });
});

// Rate Limiting Configuration
const RATE_LIMITS = {
  COINGECKO: {
    REQUESTS_PER_MINUTE: 10, // Conservative limit for free tier
    REQUEST_DELAY: 6000,     // 6 seconds between requests
    lastRequest: 0
  },
  NEWSDATA: {
    REQUESTS_PER_MINUTE: 5,  // Very conservative for free tier
    REQUEST_DELAY: 12000,    // 12 seconds between requests  
    lastRequest: 0
  }
};

// Rate limiter utility
class RateLimiter {
  private lastRequest: number = 0;
  private delay: number;

  constructor(delay: number) {
    this.delay = delay;
  }

  async waitForNext(): Promise<void> {
    const timeSinceLastRequest = Date.now() - this.lastRequest;
    if (timeSinceLastRequest < this.delay) {
      const waitTime = this.delay - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    this.lastRequest = Date.now();
  }

  canMakeRequest(): boolean {
    const timeSinceLastRequest = Date.now() - this.lastRequest;
    return timeSinceLastRequest >= this.delay;
  }

  getWaitTime(): number {
    const timeSinceLastRequest = Date.now() - this.lastRequest;
    return Math.max(0, this.delay - timeSinceLastRequest);
  }
}

// Create rate limiters
const coinGeckoLimiter = new RateLimiter(RATE_LIMITS.COINGECKO.REQUEST_DELAY);
const newsDataLimiter = new RateLimiter(RATE_LIMITS.NEWSDATA.REQUEST_DELAY);

// NewsData API configuration with rate limiting
const NEWSDATA_API = 'https://newsdata.io/api/1/news';
const NEWSDATA_API_KEY = process.env.VITE_NEWSDATA_API_KEY;
const NEWS_CACHE_DURATION = 30 * 60 * 1000; // 30 minutes - longer cache
// let lastNewsRequest = 0; // Unused rate limit tracker
// const NEWS_REQUEST_DELAY = 12000; // Unused delay constant

// Add news endpoint with proper error handling and rate limiting
app.get('/api/news/:crypto', ensureVerified, async (req: Request, res: Response) => {
  const { crypto } = req.params;
  const limit = Math.min(parseInt(req.query.limit as string) || 5, 10); // Cap limit at 10
  const cacheKey = `news-${crypto}`;

  try {
    // Check cache first
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < NEWS_CACHE_DURATION) {
      console.log(`Using cached news data for ${crypto}`);
      return res.json(cached.data);
    }

    // Check rate limit
    if (!newsDataLimiter.canMakeRequest()) {
      if (cached) {
        console.log(`Rate limited, using cached news data for ${crypto}`);
        return res.json(cached.data);
      }
      return res.status(429).json({ 
        error: 'News API rate limit exceeded. Please try again later.',
        articles: [],  // Frontend expects 'articles' not 'news'
        retryAfter: 30
      });
    }

    // Wait for rate limit before making request
    await newsDataLimiter.waitForNext();

    console.log(`Fetching fresh news data for ${crypto}...`);
    const response = await axios.get(NEWSDATA_API, {
      params: {
        apikey: NEWSDATA_API_KEY,
        q: `${crypto} cryptocurrency`,
        language: 'en',
        size: limit,
        country: 'us',
        category: 'business,technology'
      },
      timeout: 10000 // 10 second timeout
    });

    if (!response.data || response.data.status !== "success") {
      throw new Error('Invalid response from NewsData API');
    }

    const processedNews = (response.data.results || [])
      .slice(0, limit)
      .map((item: any) => ({
        title: item.title || 'No title available',
        source: item.source_name || 'Unknown source',
        url: item.link || '#',
        timestamp: item.pubDate ? new Date(item.pubDate).getTime() : Date.now(),
        sentiment: analyzeSentiment(item.title + ' ' + (item.description || '')),
        description: item.description || 'No description available',
        imageUrl: item.image_url || null
      }));

    const result = {
      articles: processedNews,  // Frontend expects 'articles' not 'news'
      cached: false,
      timestamp: Date.now()
    };

    // Cache the successful result
    cache.set(cacheKey, {
      data: result,
      timestamp: Date.now()
    });

    console.log(`Successfully fetched ${processedNews.length} news items for ${crypto}`);
    return res.json(result);

  } catch (error: any) {
    console.error('News API error:', error.response?.data || error.message);
    
    // Try to return cached data on error
    const cached = cache.get(cacheKey);
    if (cached) {
      console.log(`Error occurred, using cached news data for ${crypto}`);
      return res.json({
        ...cached.data,
        cached: true,
        error: 'Using cached data due to API error'
      });
    }
    
    // Return empty array with proper structure if no cache available
    return res.status(500).json({ 
      articles: [],  // Frontend expects 'articles' not 'news'
      error: 'Failed to fetch news. Please try again later.',
      cached: false
    });
  }
});

// Improved sentiment analysis function
function analyzeSentiment(text: string): string {
  const words = text.toLowerCase().split(/\W+/);
  let score = 0;
  let relevantWords = 0;

  const positive = ['bullish', 'surge', 'gain', 'up', 'high', 'rise', 'growth', 'boost', 'rally'];
  const negative = ['bearish', 'drop', 'fall', 'down', 'low', 'crash', 'decline', 'plunge', 'risk'];
  const multipliers = {
    'very': 2,
    'significant': 1.5,
    'massive': 2,
    'slight': 0.5,
    'minor': 0.5
  };

  let multiplier = 1;
  words.forEach((word) => {
    // Check for multipliers
    if (multipliers[word as keyof typeof multipliers]) {
      multiplier = multipliers[word as keyof typeof multipliers];
      return;
    }

    // Score calculation
    if (positive.includes(word)) {
      score += 1 * multiplier;
      relevantWords++;
      multiplier = 1;
    } else if (negative.includes(word)) {
      score -= 1 * multiplier;
      relevantWords++;
      multiplier = 1;
    }
  });

  // Normalize score based on relevant words found
  if (relevantWords > 0) {
    score = score / relevantWords;
  }

  // Return sentiment category
  if (score > 0.2) return 'positive';
  if (score < -0.2) return 'negative';
  return 'neutral';
}

// Create WebSocket server attached to HTTP server
const wss = new WebSocketServer({ server });

// CoinGecko API configuration with proper rate limiting
const COINGECKO_API = 'https://api.coingecko.com/api/v3';
const CACHE_DURATION = {
  PRICE: 5 * 60 * 1000,      // 5 minutes - longer cache to reduce API calls
  HISTORY: 60 * 60 * 1000,   // 60 minutes (was 30) to reduce CoinGecko pressure
  MARKET: 10 * 60 * 1000     // 10 minutes
};

// Rate limiting for CoinGecko
// let lastCoinGeckoRequest = 0; // Unused
// const COINGECKO_REQUEST_DELAY = 10000; // Unused

// Cache implementation
interface CacheEntry {
  data: any;
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();

// Search endpoint for coin search through the backend
app.get('/api/crypto/search', ensureVerified, async (req: Request, res: Response) => {
  try {
    const { query } = req.query;
    
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Query parameter is required' });
    }

    // Check rate limit before making request
    if (!coinGeckoLimiter.canMakeRequest()) {
      return res.status(429).json({
        error: 'Rate limit exceeded. Please try again later.',
        retryAfter: coinGeckoLimiter.getWaitTime()
      });
    }

    // Wait for rate limit
    await coinGeckoLimiter.waitForNext();

    console.log(`Searching CoinGecko for: ${query}`);
    
    // Call CoinGecko search API
    const response = await axios.get(`${COINGECKO_API}/search`, {
      params: { query },
      timeout: 15000
    });

    // Return search results (limit to top 10)
    const coins = response.data.coins?.slice(0, 10) || [];
    
    res.json({
      coins: coins.map((coin: any) => ({
        id: coin.id,
        symbol: coin.symbol.toUpperCase(),
        name: coin.name
      }))
    });

  } catch (error) {
    console.error('Error searching coins:', error);
    
    if (axios.isAxiosError(error) && error.response?.status === 429) {
      return res.status(429).json({
        error: 'CoinGecko rate limit exceeded',
        retryAfter: 60
      });
    }
    
    res.status(500).json({ error: 'Failed to search coins' });
  }
});

// Price endpoint with proper rate limiting and error handling
app.get('/api/crypto/price/:id', ensureVerified, async (req: Request, res: Response) => {
  const { id } = req.params;
  const cacheKey = `price-${id}`;

  try {
    // Check cache first
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION.PRICE) {
      console.log(`Using cached price data for ${id}`);
      return res.json(cached.data);
    }

    // Check rate limit
    if (!coinGeckoLimiter.canMakeRequest()) {
      if (cached) {
        console.log(`Rate limited, using cached price data for ${id}`);
        return res.json(cached.data);
      }
      return res.status(429).json({ 
        error: 'CoinGecko API rate limit exceeded. Please try again later.',
        retryAfter: 30
      });
    }

    // Wait for rate limit before making request
    await coinGeckoLimiter.waitForNext();

    console.log(`Fetching fresh price data for ${id}...`);
    // Make request to CoinGecko
    const response = await axios.get(`${COINGECKO_API}/simple/price`, {
      params: {
        ids: id,
        vs_currencies: 'usd',
        include_24hr_change: true,
        include_market_cap: true,
        include_last_updated_at: true
      },
      timeout: 15000, // 15 second timeout
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'CryptoSensei-Dashboard/1.0'
      }
    });

    if (!response.data || !response.data[id]) {
      throw new Error('Invalid response from CoinGecko');
    }

    // Format the response
    const coinData = response.data[id];
    const formattedData = {
      price: coinData.usd || 0,
      change24h: coinData.usd_24h_change || 0,
      marketCap: coinData.usd_market_cap || 0,
      lastUpdated: coinData.last_updated_at || Date.now() / 1000,
      timestamp: Date.now()
    };

    // Cache the result
    cache.set(cacheKey, {
      data: formattedData,
      timestamp: Date.now()
    });

    console.log(`Successfully fetched price data for ${id}: $${formattedData.price}`);
    return res.json(formattedData);

  } catch (error: any) {
    console.error('Price API error:', error.response?.data || error.message);
    
    // Try to return cached data on error
    const cached = cache.get(cacheKey);
    if (cached) {
      console.log(`Error occurred, using cached price data for ${id}`);
      return res.json({
        ...cached.data,
        cached: true,
        error: 'Using cached data due to API error'
      });
    }
    
    // Return fallback data if no cache available
    return res.status(500).json({ 
      price: 0,
      change24h: 0,
      marketCap: 0,
      lastUpdated: Date.now() / 1000,
      timestamp: Date.now(),
      error: 'Failed to fetch price data. Please try again later.'
    });
  }
});

// Batch price endpoint for multiple cryptocurrencies
app.get('/api/crypto/prices', ensureVerified, async (req: Request, res: Response) => {
  const ids = req.query.ids as string || '';
  const coinIds = ids.split(',').filter(id => id.trim().length > 0);
  
  if (coinIds.length === 0) {
    return res.status(400).json({ error: 'No coin IDs provided' });
  }

  try {
    const results: any = {};
    const cacheKey = `batch-prices-${coinIds.sort().join(',')}`;

    // Check cache first
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION.PRICE) {
      console.log(`Using cached batch price data for ${coinIds.length} coins`);
      return res.json(cached.data);
    }

    // Check rate limit
    if (!coinGeckoLimiter.canMakeRequest()) {
      if (cached) {
        console.log(`Rate limited, using cached batch price data for ${coinIds.length} coins`);
        return res.json(cached.data);
      }
      return res.status(429).json({ 
        error: 'CoinGecko API rate limit exceeded. Please try again later.',
        retryAfter: 30
      });
    }

    // Wait for rate limit before making request
    await coinGeckoLimiter.waitForNext();

    console.log(`Fetching fresh batch price data for ${coinIds.length} coins...`);
    
    // Make request to CoinGecko for multiple coins
    const response = await axios.get(`${COINGECKO_API}/simple/price`, {
      params: {
        ids: coinIds.join(','),
        vs_currencies: 'usd',
        include_24hr_change: true,
        include_market_cap: true,
        include_last_updated_at: true
      },
      timeout: 15000,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'CryptoSensei-Dashboard/1.0'
      }
    });

    if (!response.data) {
      throw new Error('Invalid response from CoinGecko');
    }

    // Format the response for each coin
    for (const coinId of coinIds) {
      if (response.data[coinId]) {
        const coinData = response.data[coinId];
        results[coinId] = {
          price: coinData.usd || 0,
          change24h: coinData.usd_24h_change || 0,
          marketCap: coinData.usd_market_cap || 0,
          lastUpdated: coinData.last_updated_at || Date.now() / 1000
        };
      } else {
        // Fallback for missing coins
        results[coinId] = {
          price: 0,
          change24h: 0,
          marketCap: 0,
          lastUpdated: Date.now() / 1000,
          error: 'Coin not found'
        };
      }
    }

    const finalResult = {
      ...results,
      timestamp: Date.now()
    };

    // Cache the result
    cache.set(cacheKey, {
      data: finalResult,
      timestamp: Date.now()
    });

    console.log(`Successfully fetched batch price data for ${coinIds.length} coins`);
    return res.json(finalResult);

  } catch (error: any) {
    console.error('Batch price API error:', error.response?.data || error.message);
    
    // Try to return cached data on error
    const cacheKey = `batch-prices-${coinIds.sort().join(',')}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      console.log(`Error occurred, using cached batch price data for ${coinIds.length} coins`);
      return res.json({
        ...cached.data,
        cached: true,
        error: 'Using cached data due to API error'
      });
    }
    
    // Return fallback data if no cache available
    const fallbackResults: any = {};
    for (const coinId of coinIds) {
      fallbackResults[coinId] = {
        price: 0,
        change24h: 0,
        marketCap: 0,
        lastUpdated: Date.now() / 1000,
        error: 'Failed to fetch price data'
      };
    }
    
    return res.status(500).json({ 
      ...fallbackResults,
      timestamp: Date.now(),
      error: 'Failed to fetch batch price data. Please try again later.'
    });
  }
});

// Update the history endpoint to return proper data structure
app.get('/api/crypto/history/:id', ensureVerified, async (req: Request, res: Response) => {
  const { id } = req.params;
  const daysParam = req.query.days as string || '1';
  const days = parseInt(daysParam) || 1;
  const cacheKey = `history-${id}-${days}`;

  try {
    // Check cache first
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION.HISTORY) {
      console.log(`Using cached historical data for ${id}`);
      return res.json(cached.data);
    }

    // Check rate limit
    if (!coinGeckoLimiter.canMakeRequest()) {
      if (cached) {
        console.log(`Rate limited, using cached historical data for ${id}`);
        return res.json(cached.data);
      }
      // Provide a concrete retryAfter hint for clients to back off
      const retryAfterSec = Math.ceil(coinGeckoLimiter.getWaitTime() / 1000) || 6;
      return res.status(429).json({ 
        error: 'CoinGecko API rate limit exceeded. Please try again later.',
        retryAfter: retryAfterSec
      });
    }

    // Wait for rate limit before making request
    await coinGeckoLimiter.waitForNext();

    console.log(`Fetching historical data for ${id}...`);
    // Fetch new data
    const response = await axios.get(`${COINGECKO_API}/coins/${id}/market_chart`, {
      params: {
        vs_currency: 'usd',
        days: days.toString(),
        interval: days > 30 ? 'daily' : 'hourly'
      },
      timeout: 20000, // 20 second timeout for historical data
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'CryptoSensei-Dashboard/1.0'
      }
    });

    if (!response.data || !response.data.prices) {
      throw new Error('Invalid response from CoinGecko');
    }

    // Process and validate the data
    const prices = response.data.prices || [];
    const marketCaps = response.data.market_caps || [];
    const volumes = response.data.total_volumes || [];

    console.log(`Raw data lengths - Prices: ${prices.length}, Volumes: ${volumes.length}, Market Caps: ${marketCaps.length}`);

    const clamp = 180; // reduce payload to ease rate/size
    const processedData = {
      prices: prices.map((item: [number, number]) => item[1]).slice(-clamp),
      volumes: volumes.length > 0 ? volumes.map((item: [number, number]) => item[1]).slice(-clamp) : [],
      timestamps: prices.map((item: [number, number]) => item[0]).slice(-clamp),
      // Remove current_price - it should come from price store
      market_cap: marketCaps.length > 0 ? marketCaps[marketCaps.length - 1][1] : 0,
      price_change_24h: calculatePriceChange(prices),
      total_volume: volumes.length > 0 ? volumes[volumes.length - 1][1] : 0
    };

    console.log(`Processed data - Prices: ${processedData.prices.length}, Volumes: ${processedData.volumes.length}`);

    // Cache the result
    cache.set(cacheKey, {
      data: processedData,
      timestamp: Date.now()
    });

    console.log(`Successfully fetched and processed historical data for ${id}`);
    console.log(`24h change: ${processedData.price_change_24h}`);
    
    return res.json(processedData);

  } catch (error: any) {
    console.error('History API error:', error.response?.data || error.message);
    
    // Try to return cached data on error
    const cached = cache.get(cacheKey);
    if (cached) {
      console.log(`Error occurred, using cached historical data for ${id}`);
      return res.json({
        ...cached.data,
        cached: true,
        error: 'Using cached data due to API error'
      });
    }
    
    // Return fallback data if no cache available
    return res.status(500).json({ 
      prices: [],
      volumes: [],
      timestamps: [],
      // Remove current_price from fallback data
      market_cap: 0,
      price_change_24h: 0,
      total_volume: 0,
      error: 'Failed to fetch historical data. Please try again later.'
    });
  }
});

// Helper function to calculate 24h price change
function calculatePriceChange(prices: [number, number][]): number {
  if (prices.length < 2) return 0;
  const currentPrice = prices[prices.length - 1][1];
  const yesterdayPrice = prices[prices.length - 2][1];
  return parseFloat(((currentPrice - yesterdayPrice) / yesterdayPrice * 100).toFixed(2));
}

// WebSocket connection handling
wss.on('connection', (ws: WebSocket) => {
  console.log('Client connected');
  let currentCrypto: string = 'bitcoin';

  const sendPriceUpdate = async () => {
    try {
      const cacheKey = `price-${currentCrypto}`;
      const cached = cache.get(cacheKey);
      
      // Use cached data if fresh
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION.PRICE) {
        ws.send(JSON.stringify(cached.data));
        return;
      }

      // Fetch new price data
      const response = await axios.get(`${COINGECKO_API}/simple/price`, {
        params: {
          ids: currentCrypto,
          vs_currencies: 'usd',
          include_24hr_change: true
        },
        timeout: 5000,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Crypto Trading Dashboard'
        }
      });

      if (response.data && response.data[currentCrypto]) {
        const data = {
          [currentCrypto]: {
            usd: response.data[currentCrypto].usd,
            usd_24h_change: response.data[currentCrypto].usd_24h_change
          }
        };

        // Cache the data
        cache.set(cacheKey, {
          data,
          timestamp: Date.now()
        });

        // Send to client
        ws.send(JSON.stringify(data));
      }
    } catch (error) {
      console.error('Error fetching price update:', error);
    }
  };

  let updateInterval = setInterval(sendPriceUpdate, 5000);

  ws.on('message', async (message: string) => {
    try {
      const data = JSON.parse(message);
      if (data.type === 'subscribe' && data.crypto) {
        currentCrypto = data.crypto;
        clearInterval(updateInterval);
        await sendPriceUpdate(); // Send immediate update
        updateInterval = setInterval(sendPriceUpdate, 5000);
      }
    } catch (error) {
      console.error('WebSocket message error:', error);
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
    clearInterval(updateInterval);
  });
});

// Handle React Router (serve index.html for all non-API routes) - Production only
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api') && !req.path.startsWith('/ws')) {
      res.sendFile(path.join(__dirname, '../../dist/index.html'));
    }
  });
}

// Start server using the HTTP server (enables WebSocket upgrade handling)
server.listen(PORT, '0.0.0.0', () => {
  const environment = process.env.NODE_ENV || 'development';
  const host = process.env.HOST || 'localhost';
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';

  if (environment === 'development') {
  console.log(`🚀 Development Server running at http://localhost:${PORT}`);
  const frontPort = process.env.FRONTEND_PORT || process.env.VITE_FRONTEND_PORT || '3000';
  console.log(`📊 Frontend running at http://localhost:${frontPort}`);
  } else {
    console.log(`🚀 Production Server running at ${protocol}://${host}:${PORT}`);
    console.log(`📊 Frontend available at ${protocol}://${host}`);
  }
});

// Error handling
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  server.close(() => {
    process.exit(0);
  });
});