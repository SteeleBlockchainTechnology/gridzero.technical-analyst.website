# CryptoSensei Architecture Documentation

## Table of Contents

1. [Project Overview](#project-overview)
2. [Frontend Architecture](#frontend-architecture)
3. [Backend Architecture](#backend-architecture)
4. [Frontend-Backend Integration](#frontend-backend-integration)
5. [Data Flow Patterns](#data-flow-patterns)
6. [File Structure](#file-structure)
7. [API Endpoints](#api-endpoints)
8. [WebSocket Implementation](#websocket-implementation)
9. [Caching Strategy](#caching-strategy)
10. [Development Workflow](#development-workflow)

## Project Overview

CryptoSensei is a real-time cryptocurrency dashboard built with React/TypeScript frontend and Express.js backend. It provides:

- Real-time price tracking
- News aggregation with sentiment analysis
- AI-powered market analysis
- Interactive charts via TradingView
- User-customizable featured coins

### Technology Stack

- **Frontend**: React 18, TypeScript, Vite, TailwindCSS, Shadcn/UI
- **Backend**: Express.js, TypeScript, WebSocket, Axios
- **APIs**: CoinGecko (prices), NewsData.io (news), TradingView (charts)
- **Development**: Vite dev server with proxy, tsx for backend

## Frontend Architecture

### Entry Point & Core Application

#### `src/main.tsx` - Application Bootstrap

```typescript
// Main entry point that renders the entire application
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

**Purpose**: Initializes React app and mounts to DOM

#### `src/App.tsx` - Main Application Logic

**State Management**:

- `crypto`: Currently selected cryptocurrency (string)
- `news`: Array of news articles with sentiment
- `price`: Real-time price data object
- `predictions`: AI-generated predictions
- `timeframe`: Chart timeframe selection
- `featuredCoins`: User's customized coin list

**Key useEffect Hooks**:

1. **Price Updates**: Fetches price every 60 seconds
2. **News & Predictions**: Updates when crypto selection changes
3. **Featured Coins**: Initializes user preferences from localStorage

**Layout Structure**:

```
App
├── Layout (gradient background wrapper)
├── Header (crypto selector + timeframe controls)
├── Main Grid (responsive 12-column)
│   ├── Left Column (8/12)
│   │   ├── TradingView Chart
│   │   ├── MarketAnalysis
│   │   └── AdvancedAnalysis
│   └── Right Column (4/12)
│       ├── FeaturedCoinsManager
│       └── NewsPanel
```

### Component Architecture

#### UI Foundation (`src/components/ui/`)

**Shadcn/UI Components** - Consistent design system:

- `button.tsx`: Styled button variants (primary, secondary, destructive, etc.)
- `card.tsx`: Container components (Card, CardHeader, CardContent, CardFooter)
- `select.tsx`: Dropdown selectors with search and keyboard navigation
- `input.tsx`: Form input with validation states
- `switch.tsx`: Toggle switches for settings
- `loading.tsx`: Loading spinners, skeletons, and progress indicators

#### Core Feature Components

##### `src/components/TradingView.tsx`

**Purpose**: Embeds TradingView charts
**Key Features**:

- Maps crypto IDs to TradingView symbols
- Handles timeframe changes (1H, 4H, 1D, 1W, 1M)
- Creates responsive embedded chart widget
- Error handling for unsupported symbols

**Crypto-to-Symbol Mapping**:

```typescript
const symbolMap: Record<string, string> = {
  bitcoin: "BTCUSD",
  ethereum: "ETHUSD",
  cardano: "ADAUSD",
  // ... more mappings
};
```

##### `src/components/NewsPanel.tsx`

**Purpose**: Displays filtered cryptocurrency news
**Key Features**:

- Duplicate article removal by title similarity
- Crypto-specific content filtering
- Image handling with fallback placeholders
- Sentiment badge display (positive/negative/neutral)
- AI-generated tags
- Truncated descriptions with "Read more" links

**News Processing Pipeline**:

1. Fetch from backend API
2. Remove duplicates
3. Filter by crypto relevance
4. Add sentiment analysis
5. Format for display

##### `src/components/MarketAnalysis.tsx`

**Purpose**: AI-powered market analysis display
**Features**:

- Multi-step loading animation
- Market summary with key metrics
- AI analysis with HTML formatting
- Price targets and confidence levels
- Trading signals (BUY/SELL/HOLD)
- Strategy recommendations

**Loading States**:

- "Analyzing market trends..."
- "Processing price data..."
- "Generating insights..."
- "Finalizing analysis..."

##### `src/components/AdvancedAnalysis.tsx`

**Purpose**: Container for advanced analysis modules
**Uses**: Custom hook `useAdvancedAnalysis` for data fetching
**Renders**: Multiple specialized analysis cards

#### Analysis Modules (`src/components/analysis/`)

Each module provides specialized market insights:

- **`TechnicalSignals.tsx`**: RSI, MACD, moving averages
- **`SentimentOverview.tsx`**: Market sentiment aggregation
- **`PricePredictions.tsx`**: AI price forecasts
- **`RiskAnalysis.tsx`**: Volatility and risk metrics
- **`TradingStrategy.tsx`**: Trading recommendations
- **`MarketPhase.tsx`**: Bull/bear market cycle analysis

##### `src/components/FeaturedCoinsManager.tsx`

**Purpose**: User's personalized coin tracking
**Features**:

- Drag-and-drop reordering using drag events
- Search and add new cryptocurrencies
- Toggle active/inactive status
- Real-time price metadata fetching
- Responsive design (mobile/desktop)
- Local storage persistence

**Data Flow**:

1. Load from localStorage
2. Fetch live prices for each coin
3. Update metadata (24h change, market cap)
4. Save changes back to localStorage

#### Error Handling

##### `src/components/ErrorBoundary.tsx`

**Purpose**: Catches and handles React component errors
**Features**:

- Class component with error state
- Retry functionality
- Error logging
- Graceful fallback UI

**Utility Components**:

- `LoadingSpinner`: Consistent loading states
- `ErrorDisplay`: Non-breaking error messages

### Services Layer

#### `src/services/api.ts` - Main API Interface

**Purpose**: Centralized API communication with caching and error handling

**Core Methods**:

```typescript
// Price data fetching
async getPrice(crypto: string): Promise<CryptoPrice>

// News with sentiment analysis
async getNews(crypto: string, page?: number): Promise<NewsItem[]>

// Historical price charts
async getHistoricalData(crypto: string, days?: number): Promise<any>

// AI-powered predictions
async getPredictions(crypto: string): Promise<PredictionData>

// Batch price updates
async getBatchPrices(cryptos: string[]): Promise<Record<string, CryptoPrice>>
```

**Caching Strategy**:

- Price data: 2 minutes
- News data: 15 minutes
- Historical data: 30 minutes
- Predictions: 5 minutes

**Error Handling**:

- Automatic fallback to cached data
- Retry logic with exponential backoff
- User-friendly error messages

#### `src/services/types.ts` - Type Definitions

**Purpose**: TypeScript interfaces for type safety across the application

**Key Interfaces**:

```typescript
interface CryptoPrice {
  usd: number;
  usd_24h_change: number;
  last_updated_at: number;
  market_cap?: number;
}

interface NewsItem {
  title: string;
  source: string;
  url: string;
  timestamp: number;
  sentiment: "positive" | "negative" | "neutral";
  description?: string;
  imageUrl?: string;
  aiTags?: string[];
}

interface PredictionData {
  shortTerm: number;
  mediumTerm: number;
  longTerm: number;
  confidence: number;
  factors: string[];
}
```

#### `src/services/featuredCoins.ts` - Local Storage Management

**Purpose**: Manages user's featured cryptocurrency preferences

**Functions**:

- `getFeaturedCoins()`: Load from localStorage with defaults
- `saveFeaturedCoins()`: Persist changes to localStorage
- `addFeaturedCoin()`: Add new coin to list
- `removeFeaturedCoin()`: Remove coin from list
- `reorderFeaturedCoins()`: Update order after drag-and-drop

## Backend Architecture

### `src/server/index.ts` - Express Server

#### Core Setup

```typescript
const app = express();
const server = http.createServer(app);
const PORT = process.env.VITE_PORT || 3001;
```

#### Middleware Configuration

- **CORS**: Allows frontend (5173) and backend (3001) origins
- **JSON Parser**: Handles JSON request bodies
- **Error Handler**: Global error catching and logging

#### External API Integrations

##### NewsData.io Integration

**Endpoint**: `/api/news/:crypto`
**Rate Limiting**: 60 seconds between requests
**Caching**: 15 minutes

**Query Construction**:

```typescript
q: `${crypto} AND (price OR trading OR market OR investment) NOT (scam OR hack)`;
```

**Processing Pipeline**:

1. Fetch from NewsData API
2. Filter and validate results
3. Apply sentiment analysis
4. Structure response data
5. Cache results

##### CoinGecko Integration

**Endpoints**:

- `/api/crypto/price/:id` - Current prices
- `/api/crypto/history/:id` - Historical data

**Rate Limiting**: 6 seconds between requests
**Caching**: 2 minutes (prices), 30 minutes (history)

**Price Data Structure**:

```typescript
{
  [cryptoId]: {
    usd: number,
    usd_24h_change: number,
    last_updated_at: number,
    market_cap: number
  }
}
```

#### Sentiment Analysis Engine

**Purpose**: Analyzes news content for market sentiment

**Algorithm**:

```typescript
function analyzeSentiment(text: string): string {
  // Word tokenization
  const words = text.toLowerCase().split(/\W+/);

  // Sentiment scoring
  const positive = ["bullish", "surge", "gain", "up", "high", "rise"];
  const negative = ["bearish", "drop", "fall", "down", "low", "crash"];

  // Context multipliers
  const multipliers = { very: 2, significant: 1.5, massive: 2 };

  // Score calculation with normalization
  // Returns: 'positive', 'negative', or 'neutral'
}
```

#### WebSocket Server

**Purpose**: Real-time price updates

**Connection Lifecycle**:

1. Client connects via WebSocket
2. Sends subscription message with crypto symbol
3. Server starts 5-second update interval
4. Fetches fresh price data or uses cache
5. Broadcasts updates to client
6. Cleanup on disconnect

**Message Protocol**:

```typescript
// Client subscription
{ type: 'subscribe', crypto: 'bitcoin' }

// Server price update
{ bitcoin: { usd: 45000, usd_24h_change: 2.5 } }
```

#### Caching System

**Implementation**: In-memory Map with timestamp validation

```typescript
interface CacheEntry {
  data: any;
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();
```

**Cache Keys**:

- `price-${cryptoId}`: Price data
- `news-${crypto}-${page}`: News articles
- `history-${cryptoId}-${days}`: Historical data

**TTL (Time To Live)**:

- Prices: 2 minutes
- News: 15 minutes
- History: 30 minutes

## Frontend-Backend Integration

### Vite Development Proxy (`vite.config.ts`)

```typescript
server: {
  port: 5173,
  proxy: {
    '/api': {
      target: 'http://localhost:3001',
      changeOrigin: true,
    },
    '/ws': {
      target: 'ws://localhost:3001',
      ws: true,
    }
  },
}
```

**How It Works**:

1. Frontend makes request to `/api/crypto/price/bitcoin`
2. Vite proxy intercepts and forwards to `http://localhost:3001/api/crypto/price/bitcoin`
3. Backend processes request and returns data
4. Proxy forwards response back to frontend

### CORS Configuration

**Backend allows**:

- `http://localhost:5173` (Frontend dev server)
- `http://localhost:3001` (Backend self-requests)
- Production origins based on environment

### Environment Variables

- `VITE_NEWSDATA_API_KEY`: NewsData.io API key
- `VITE_PORT`: Server port (default: 3001)
- `NODE_ENV`: Environment (development/production)
- `HOST`: Production server host

## Data Flow Patterns

### Price Data Flow

```
App.tsx (useEffect) →
api.getPrice('bitcoin') →
Vite Proxy (/api/*) →
Express Handler (/api/crypto/price/bitcoin) →
Rate Limit Check →
Cache Check →
CoinGecko API Request →
Data Processing →
Cache Storage →
JSON Response →
Frontend State Update →
UI Re-render
```

### News Data Flow

```
App.tsx (crypto change) →
api.getNews('bitcoin') →
Vite Proxy →
Express Handler (/api/news/bitcoin) →
Rate Limit Check →
Cache Check →
NewsData.io API →
Sentiment Analysis →
Data Processing →
Cache Storage →
Response →
NewsPanel Component →
Article Rendering
```

### Real-time Updates Flow

```
App.tsx (WebSocket connection) →
WebSocket Server Connection →
Client sends { type: 'subscribe', crypto: 'bitcoin' } →
Server starts 5-second interval →
Price fetch (cached or fresh) →
Broadcast to client →
Frontend receives update →
State update →
UI re-render with new price
```

### Featured Coins Flow

```
FeaturedCoinsManager loads →
featuredCoins.getFeaturedCoins() →
localStorage retrieval →
api.getBatchPrices(coins) →
Backend batch price fetch →
Metadata update →
Component re-render →
User interaction (drag/drop) →
featuredCoins.saveFeaturedCoins() →
localStorage update
```

## API Endpoints

### Backend REST API

#### Price Endpoints

- **GET** `/api/crypto/price/:id`
  - **Params**: `id` (crypto identifier)
  - **Response**: Price data with 24h change and market cap
  - **Cache**: 2 minutes
  - **Rate Limit**: 6 seconds between requests

#### News Endpoints

- **GET** `/api/news/:crypto`
  - **Params**: `crypto` (cryptocurrency name)
  - **Query**: `page` (pagination), `limit` (results per page)
  - **Response**: Array of news articles with sentiment
  - **Cache**: 15 minutes
  - **Rate Limit**: 60 seconds between requests

#### Historical Data Endpoints

- **GET** `/api/crypto/history/:id`
  - **Params**: `id` (crypto identifier)
  - **Query**: `days` (time range)
  - **Response**: Price history, market cap, volume data
  - **Cache**: 30 minutes
  - **Rate Limit**: 6 seconds between requests

### External API Dependencies

#### CoinGecko API

- **Base URL**: `https://api.coingecko.com/api/v3`
- **Endpoints**:
  - `/simple/price` - Current prices
  - `/coins/{id}/market_chart` - Historical data
- **Rate Limits**: 10-50 requests/minute (free tier)

#### NewsData.io API

- **Base URL**: `https://newsdata.io/api/1/news`
- **Features**: News search with language and category filtering
- **Rate Limits**: 200 requests/day (free tier)

#### TradingView Widgets

- **Implementation**: Embedded iframe widgets
- **No API key required**
- **Real-time charts with technical indicators**

## WebSocket Implementation

### Server-Side WebSocket Handler

```typescript
wss.on("connection", (ws: WebSocket) => {
  let currentCrypto = "bitcoin";
  let updateInterval: NodeJS.Timeout;

  const sendPriceUpdate = async () => {
    // Fetch price data (cached or fresh)
    // Send JSON update to client
  };

  // Handle client messages
  ws.on("message", (message) => {
    const data = JSON.parse(message);
    if (data.type === "subscribe") {
      currentCrypto = data.crypto;
      // Reset interval for new crypto
    }
  });

  // Cleanup on disconnect
  ws.on("close", () => {
    clearInterval(updateInterval);
  });
});
```

### Client-Side WebSocket Usage

```typescript
// In React component
useEffect(() => {
  const ws = new WebSocket("ws://localhost:3001");

  ws.onopen = () => {
    ws.send(JSON.stringify({ type: "subscribe", crypto }));
  };

  ws.onmessage = (event) => {
    const priceData = JSON.parse(event.data);
    setPrice(priceData);
  };

  return () => ws.close();
}, [crypto]);
```

## Caching Strategy

### Frontend Caching (Service Layer)

- **Implementation**: JavaScript Map with timestamp validation
- **Strategy**: Cache-first with TTL expiration
- **Benefits**: Reduces API calls, improves performance

### Backend Caching (Express Server)

- **Implementation**: In-memory Map with structured cache entries
- **Fallback**: Serves stale cache on API failures
- **Cache Keys**: Structured with resource type and parameters

### Cache Invalidation

- **Time-based**: Automatic expiration based on TTL
- **Manual**: Cache clear on critical errors
- **Strategy**: Graceful degradation to cached data

## Development Workflow

### Local Development Setup

1. **Start Backend**: `npm run server:dev` (port 3001)
2. **Start Frontend**: `npm run dev` (port 5173)
3. **Environment**: Copy `.env.example` to `.env` with API keys

### Package Scripts

```json
{
  "dev": "vite",
  "server:dev": "tsx watch src/server/index.ts",
  "build": "tsc && vite build",
  "start": "concurrently \"npm run server:dev\" \"npm run dev\""
}
```

### Development Tools

- **Vite**: Fast HMR and development server
- **tsx**: TypeScript execution with watch mode
- **Concurrently**: Run frontend and backend simultaneously
- **TypeScript**: Full type checking across the stack

### Production Deployment

- **Build**: `npm run build` creates optimized frontend bundle
- **Server**: Express server handles both API and static file serving
- **Environment**: Production environment variables for API keys and hosts

## File Dependencies Map

### Core Application Flow

```
main.tsx → App.tsx → Layout.tsx → [Components]
```

### Component Hierarchy

```
App.tsx
├── TradingView.tsx
├── MarketAnalysis.tsx
├── AdvancedAnalysis.tsx
│   └── analysis/*.tsx
├── FeaturedCoinsManager.tsx
└── NewsPanel.tsx
```

### Service Dependencies

```
Components → api.ts → Backend APIs
Components → featuredCoins.ts → localStorage
Components → types.ts → Type Safety
```

### Backend Module Structure

```
index.ts
├── Express Setup
├── CORS Configuration
├── API Routes
├── WebSocket Server
├── Caching System
└── Error Handling
```

This architecture provides a robust, scalable cryptocurrency dashboard with real-time updates, intelligent caching, and comprehensive error handling. The separation between frontend and backend allows for independent scaling and deployment while maintaining type safety and consistent data flow patterns.
