Table of Contents

Section 1: Market Analysis
Section 2: Advanced Analysis
Section 3: Integration and Collaboration
High-Level Diagram
Recommendations
Section 1: Market Analysis Purpose

Presents a concise, AI-augmented market view for the selected crypto, merging real-time price, Groq LLM commentary, extracted signals, and key levels/strategy snippets. Aligned to Grid Zero’s educational mission by turning raw data into actionable, readable guidance.
Key Files and Elements

UI
Component: MarketAnalysis
Subscribes to centralized price updates via priceStore and tracks currentPrice.
Fetches detailed AI-enhanced analysis via analysisService.getDetailedAnalysis.
Merges external predictions (passed in props) into the component’s priceTargets structure.
Renders three main blocks:
Strategic Market Analysis (extracted from AI HTML “highlight”).
Critical Trading Signals (list derived from the AI HTML section).
Strategic Recommendations (overview, entry, stop, targets, timeframe parsed out of AI HTML).
Data + AI
Service: analysisService
Inputs: price history and current price via api and priceStore.
Computes indicators: RSI, MACD, SMA/EMA, support/resistance, volatility.
News + sentiment: gets news and sentiment via api.getNews and api.getSentiment.
LLM: Calls Groq (model meta-llama/llama-4-maverick-17b-128e-instruct) to synthesize an HTML-like analysis string.
Throttling: A 15-minute cache for Groq responses per crypto is present:
See: AnalysisService.aiCache and AI_MIN_INTERVAL_MS.
HTML parsing: Extracts marketAnalysis paragraph, “Critical Trading Signals” list, and “Strategic Recommendations” (entry, stop, targets, timeframe).
Data Sources and Fetching
Current price: priceStore.getPrice (centralized store; subscriptions fan out updates).
History/news/sentiment: api which calls backend REST endpoints.
Realtime: priceStore likely uses WebSocket-backed updates (see below) or HTTP fallback.
Backend Support
WebSocket: wss pushes periodic price updates; clients subscribe with a coin id.
REST:
/api/crypto/price/:id, /api/crypto/prices (batch), /api/crypto/history/:id, /api/news/:crypto.
All are gated by Discord verification in production via ensureVerified middleware (development bypass available if configured).
Authentication
Discord OAuth via passport-discord with premium role gating (backend). MarketAnalysis fetches data only after frontend verifies session.
Subsections in MarketAnalysis

Strategic Market Analysis
Purpose: One-paragraph AI summary of market context.
Key code: extraction in formatAIAnalysis using highlight paragraph regex.
UX: Styled callout with supporting color and iconography.
Critical Trading Signals
Purpose: Bullet list of AI-derived signals; icons colored by bullish/bearish/neutral keywords.
Key code: split between “Critical Trading Signals” and “Strategic Recommendations”; sanitized HTML.
Strategic Recommendations
Purpose: Actionable elements such as entry zones, stops, targets, and timeframe.
Key code: regex extractions for Entry Zones, Stop Loss, Targets, Timeframe.
Notes on Triggers

The component effect currently depends on [crypto, predictions, currentPrice], so it calls analysisService.getDetailedAnalysis on each price update. The service-level 15-minute AI cache prevents Groq spam, but still recomputes TA and parsing frequently. Consider client-side time-based gating if needed (see Recommendations).
Section 2: Advanced Analysis Purpose

Produces a comprehensive analytical package: market condition (phase, strength, levels), technical signals (trend/momentum/volatility/volume), sentiment breakdown, ML-bounded price predictions, risk analysis, and a generated trading strategy. Designed to teach and guide with quantitative detail.
Key Files and Elements

UI
Component: AdvancedAnalysis
Hook: useAdvancedAnalysis to fetch and manage lifecycle.
Subcomponents (visualization/UX):
MarketPhase (referenced)
TechnicalSignals (referenced)
SentimentOverview (referenced)
PricePredictions
RiskAnalysis
TradingStrategy (referenced)
Data + AI/ML
Service: advancedAnalysis
Inputs:
Current price via priceStore.getPrice for canonical price.
Historical data via api.getHistoricalData.
Sentiment and news via api.getSentiment and api.getNews.
Technical computation:
Market phase and confidence via SMA(20/50/200) relations, support/resistance with bounds, and trend-strength composite.
Indicators: ADX, Trend Intensity, ROC, volatility (custom), volume trend, secondary trend, etc.
ML models:
TensorFlow.js models from mlModels for trend/price/levels (factory functions; client-side inference).
Example: trend model invoked in analyzeTrendStrength combining ADX, intensity, ROC, volumeTrend.
Predictions:
predictPriceTargets builds short/mid/long-term ranges with volatility/sentiment caps and trend adjustments; also returns qualitative prediction signals.
Risk analysis:
Combines technical risk (volatility and trend), sentiment risk (inverted sentiment score), fundamental/market-like proxies.
Strategy:
strategyGenerator.generateStrategy uses marketCondition, technicalSignals, sentiment score, riskAnalysis, and predictions to output entries, stops, targets, timeframe, and rationale.
Sentiment breakdown:
calculateSentimentAnalysis splits overall sentiment into news/social/market components with scores and trends.
Defaults and safety:
Validates inputs; on errors or weak data, returns a safe default structure via getDefaultAnalysis.
Data Sources and Fetching

Current price: priceStore subscription/cache as the single source of truth.
REST backend via api:
History: /api/crypto/history/:id
News: /api/news/:crypto
Sentiment: derived or proxied; ensure response schema matches what advancedAnalysis expects.
Realtime: priceStore handles real-time updates (WebSocket or HTTP fallback). AdvancedAnalysis fetches computed output on demand (no WS channel dedicated to advanced results at present).
Backend Support

Endpoints implemented in index.ts, protected by Discord verification in production:
Prices, batch prices, history, news; all rate-limited and cached.
WebSocket server:
Sends periodic price updates; client selects crypto by sending a message to subscribe.
Auth:
Discord OAuth (passport-discord), premium role verification in configured guild; dev bypass optionally available.
Subsections in Advanced Analysis

Market Condition
Phase (bullish/bearish/sideways/recovery/correction), strength, confidence, and key levels (support/resistance/pivot).
Code: calculateMarketPhase, SMA calc, bounds, confidence aggregator.
Technical Signals
Trend (primary/secondary), momentum (RSI/MACD/StochRSI if computed in this layer), volatility and volume significance.
Code: calculateADX, calculateTrendIntensity, calculatePriceROC, determineSecondaryTrend, determineVolatilityTrend.
Sentiment Analysis
Overall score/signal/confidence; components for news/social/market; recent headlines list.
Code: calculateSentimentAnalysis, calculateNewsScore, calculateSocialSentiment, calculateMarketSentiment, calculateOverallSentiment.
Predictions
Short/mid/long-term price ranges with confidence and qualitative signals.
Code: predictPriceTargets, generatePredictionSignals; uses TFJS model output indirectly via trend strength and other factors.
Risk Analysis
Aggregated risk score with factor breakdown and warnings (e.g., volatility high, trend weakening).
Code: analyzeRisk, calculateFundamentalRisk, calculateMarketRisk, generateRiskWarnings.
Trading Strategy
Recommendation, confidence, entries (conservative/moderate/aggressive), SL (tight/normal/wide), targets, timeframe, rationale array.
Code: strategyGenerator.generateStrategy.
Section 3: Integration and Collaboration Interconnections

Shared price source: Both MarketAnalysis and AdvancedAnalysis consume current price via priceStore, ensuring consistency across views.
Shared backend: Both use api to retrieve historical data, news, and sentiment from the same REST endpoints, ensuring common caching/rate-limiting paths and authentication.
Complementary AI layers:
MarketAnalysis uses Groq LLM to synthesize trader-friendly HTML output from indicators + news/sentiment. It is presentation-focused and educational.
AdvancedAnalysis uses deterministic indicators + TFJS ML estimations to compute structured analytics, ranges, risk, and strategies.
Data Flows Between Sections

Overlapping inputs: history, price, news, sentiment.
Outputs differ and can be combined:
MarketAnalysis yields human-readable narrative + extracted signals/levels.
AdvancedAnalysis yields a structured analytics object with predictions, risk, and strategy. External predictions can be merged into both UIs (already merged into MarketAnalysis via props).
Shared Resources

Core utilities and services:
priceStore: central price cache/subscription (real-time via WS or fallbacks).
api: normalized access to backend endpoints and local caching.
websocket: manages WS connection to /ws; integrates with price handling.
Auth state is gate-kept at backend and checked on frontend before rendering gated content.
Potential Synergies or Issues

LLM call frequency: MarketAnalysis effect depends on currentPrice; although the 15-minute Groq cache prevents LLM spam, the rest of the pipeline may still recompute often. Add a client-side time gate for the fetch to reduce load.
News schema consistency: AdvancedAnalysis expects newsData?.news; ensure backend/API returns that exact shape or adapt client parsing to articles consistently.
Move heavy computations server-side for consistency and security (optional): AdvancedAnalysis currently runs TFJS in the browser; server-side inference could enable shared caching and lighter clients.
WebSocket-only advanced updates: Consider a WS channel for analytical snapshots to push updates at controlled intervals.
High-Level Diagram

Textual flow
Frontend (React + Vite)

MarketAnalysis UI
subscribes priceStore -> currentPrice
calls analysisService.getDetailedAnalysis -> Groq LLM + TA
AdvancedAnalysis UI
uses useAdvancedAnalysis -> advancedAnalysis.getFullAnalysis -> TA/ML/strategy
Shared Frontend Services

priceStore -> fetches via API + WS, caches, broadcasts updates
api -> GET /api/... history, news, sentiment
websocket -> ws(s)://host/ws, subscribes coin
Backend (Express + ws)

REST endpoints -> CoinGecko (prices/history), NewsData (news), in-memory cache, rate limits
WebSocketServer -> periodic price broadcasts; client selects coin
Auth -> passport-discord, premium role check
Auth Flow

Frontend checks /api/check-verification
Backend session gated; in dev can bypass if configured
Mermaid-style text flowchart TD UI_Market[MarketAnalysis.tsx] --> S_AnalysisService[services/analysis.ts] UI_Market --> S_PriceStore[services/priceStore.ts] UI_Advanced[AdvancedAnalysis.tsx] --> H_UseAdv[hooks/useAdvancedAnalysis.ts] H_UseAdv --> S_Advanced[services/advancedAnalysis.ts] S_Advanced --> S_PriceStore S_Advanced --> S_Api[services/api.ts] S_AnalysisService --> S_Api S_Api --> BE_Express[src/server/index.ts] S_PriceStore --> WS_Client[services/websocket.ts] --> BE_WS[wss on server] BE_Express --> CoinGecko & NewsData

Recommendations

Client-side time gate on MarketAnalysis fetch:
Add a 15-minute UI-side throttle in MarketAnalysis to avoid calling getDetailedAnalysis unless 15 minutes passed or the crypto changed. The service already caches LLM results, but this reduces redundant TA work and parsing.
Standardize news schema end-to-end:
Ensure both analysisService and advancedAnalysis use the same key (news vs articles) from api.getNews and backend responses.
Server-side compute option:
Add a backend route to compute AdvancedAnalysis and cache results per coin for N minutes; frontend retrieves a compact payload. This helps with consistency, security for premium content, and rate limiting external calls.
WebSocket enhancements:
Add an analysis snapshot WS channel that publishes at fixed intervals (e.g., every 2–5 minutes) to decouple UI from frequent recomputations.
Auth DX in development:
Continue using dev-only bypass or configure a dedicated Discord app with localhost redirect to test role-based gating locally.
Testing and resilience:
Add health endpoints (/api/health), schema validators for responses, and unit tests for indicator math and strategy generation.
Education enrichment:
Enhance the AI output with explicit “teaching mode” blocks (e.g., explain why signals matter) to align with Grid Zero’s education goals. Include code snippets or links to scripting examples that replicate the indicators.
If you want, I can add the MarketAnalysis client-side time gate and normalize the news schema across services next.
