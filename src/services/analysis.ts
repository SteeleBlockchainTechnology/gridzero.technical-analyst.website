import { GoogleGenerativeAI } from "@google/generative-ai";
import axios from 'axios';
import { api } from "./api";

const genAI = new GoogleGenerativeAI("AIzaSyA4cz4YSwsIJmtlh4ml1MNoNeLu43oQqFw");

interface TechnicalIndicators {
  currentPrice: number;
  rsi: number;
  macd: {
    value: number;
    signal: number;
    histogram: number;
  };
  ma20: number;
  ma50: number;
  ma200: number;
  volumeChange: number;
  marketPhase: string;
  volatility: number;
  support: number;
  resistance: number;
}

interface DetailedAnalysis {
  summary: string;
  technicalAnalysis: {
    rsi: { value: number; interpretation: string };
    macd: {
      value: number;
      signal: number;
      histogram: number;
      interpretation: string;
    };
    movingAverages: {
      ma20: number;
      ma50: number;
      ma200: number;
      interpretation: string;
    };
    volume: {
      current: number;
      change: number;
      interpretation: string;
    };
    volatility: number;
  };
  sentimentAnalysis: {
    overall: string;
    newsScore: number;
    socialScore: number;
    marketMood: string;
  };
  aiPrediction: {
    shortTerm: string;
    midTerm: string;
    longTerm: string;
    confidence: number;
    reasoning: string[];
  };
  marketStructure: {
    trend: string;
    support: number;
    resistance: number;
    breakoutPotential: string;
  };
  priceTargets: {
    '24H': {
      range: string;
      confidence: string;
    };
    '7D': {
      range: string;
      confidence: string;
    };
    '30D': {
      range: string;
      confidence: string;
    };
  };
  signals: Array<{
    text: string;
    importance: string;
  }>;
  strategy: {
    position: string;
    entry: string;
    stop: string;
    target: string;
  };
  marketConditions: {
    trend: string;
    support: string;
    resistance: string;
    distanceToResistance: string;
    distanceToSupport: string;
  };
  sentiment: {
    overall: string;
    newsScore: string;
    recentNews: Array<{
      title: string;
      sentiment: string;
    }>;
  };
}

interface ParsedSections {
  summary: string[];
  predictions: {
    shortTerm: string;
    midTerm: string;
    longTerm: string;
  };
  signals: Array<{ text: string; type: string }>;
  strategy: Array<{
    position: string;
    entry: string;
    stop: string;
    target: string;
  }>;
  reasoning: string[];
}

interface TimeframeWeights {
  rsi: number;
  macd: number;
  trend: number;
  volatility: number;
}

class AnalysisService {
  private async getHistoricalData(crypto: string, days: number = 200) {
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
      console.log('Historical data response:', response.data);
      
      if (response.data && Array.isArray(response.data.prices)) {
        const sortedPrices = response.data.prices.sort((a: any, b: any) => 
          new Date(a.date).getTime() - new Date(b.date).getTime()
        );
        const sortedVolumes = response.data.total_volumes.sort((a: any, b: any) => 
          new Date(a.date).getTime() - new Date(b.date).getTime()
        );
        
        return {
          prices: sortedPrices.map((item: any) => item.price),
          volumes: sortedVolumes.map((item: any) => item.value),
          current_price: response.data.current_price,
          market_cap: response.data.market_cap,
          price_change_24h: response.data.price_change_24h
        };
      }
      
      throw new Error('Invalid data format from API');
    } catch (error) {
      console.error('Error fetching historical data:', error);
      throw error;
    }
  }

  private calculateRSI(prices: number[], period: number = 14): number {
    let gains = 0;
    let losses = 0;

    for (let i = 1; i < period + 1; i++) {
      const difference = prices[i] - prices[i - 1];
      if (difference >= 0) {
        gains += difference;
      } else {
        losses -= difference;
      }
    }

    let avgGain = gains / period;
    let avgLoss = losses / period;

    for (let i = period + 1; i < prices.length; i++) {
      const difference = prices[i] - prices[i - 1];
      if (difference >= 0) {
        avgGain = (avgGain * 13 + difference) / period;
        avgLoss = (avgLoss * 13) / period;
      } else {
        avgGain = (avgGain * 13) / period;
        avgLoss = (avgLoss * 13 - difference) / period;
      }
    }

    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }

  private calculateMACD(prices: number[]) {
    const ema12 = this.calculateEMA(prices, 12);
    const ema26 = this.calculateEMA(prices, 26);
    const macdLine = ema12[ema12.length - 1] - ema26[ema26.length - 1];
    const signalLine = this.calculateEMA([macdLine], 9)[0];
    const histogram = macdLine - signalLine;
    
    return {
      value: macdLine,
      signal: signalLine,
      histogram,
      interpretation: this.interpretMACD(macdLine, signalLine, histogram)
    };
  }

  private interpretMACD(macdLine: number, signalLine: number, histogram: number): string {
    let interpretation = '';

    if (histogram > 0) {
      interpretation = histogram > histogram * 0.1 
        ? 'Strong bullish momentum' 
        : 'Bullish momentum';
    } else {
      interpretation = histogram < -histogram * 0.1 
        ? 'Strong bearish momentum' 
        : 'Bearish momentum';
    }

    if (macdLine > 0 && signalLine > 0) {
      interpretation += ', upward trend';
    } else if (macdLine < 0 && signalLine < 0) {
      interpretation += ', downward trend';
    }

    if (Math.abs(macdLine - signalLine) < 0.1) {
      interpretation += ', potential trend reversal';
    }

    return interpretation;
  }

  private calculateEMA(prices: number[], period: number): number[] {
    const multiplier = 2 / (period + 1);
    const ema = [prices[0]];

    for (let i = 1; i < prices.length; i++) {
      ema.push(
        (prices[i] - ema[i - 1]) * multiplier + ema[i - 1]
      );
    }

    return ema;
  }

  private calculateSMA(prices: number[], period: number = 20): number {
    if (!prices || prices.length === 0) return 0;
    const slice = prices.slice(-period);
    return slice.reduce((sum, price) => sum + price, 0) / slice.length;
  }

  private findSupportResistance(prices: number[]) {
    const sortedPrices = [...prices].sort((a, b) => a - b);
    const q1Index = Math.floor(prices.length * 0.25);
    const q3Index = Math.floor(prices.length * 0.75);

    return {
      support: sortedPrices[q1Index],
      resistance: sortedPrices[q3Index]
    };
  }

  private async getMarketSentiment(crypto: string) {
    try {
      const newsResponse = await api.getNews(crypto);
      const newsItems = newsResponse.news; // Extract the news array
      
      const positiveCount = newsItems.filter(n => n.sentiment === 'positive').length;
      const negativeCount = newsItems.filter(n => n.sentiment === 'negative').length;
      const total = newsItems.length || 1;

      return {
        newsScore: (positiveCount / total) * 100,
        socialScore: Math.random() * 100, // Placeholder for social score
        marketMood: positiveCount > negativeCount ? 'Bullish' : 
                   negativeCount > positiveCount ? 'Bearish' : 'Neutral'
      };
    } catch (error) {
      console.error('Error getting market sentiment:', error);
      return {
        newsScore: 50,
        socialScore: 50,
        marketMood: 'Neutral'
      };
    }
  }

  private calculateStochRSI(prices: number[], period: number = 14): number {
    const rsiValues = [];
    let minRSI = Infinity;
    let maxRSI = -Infinity;
    
    // Calculate RSI values
    for (let i = period; i < prices.length; i++) {
      const rsi = this.calculateRSI(prices.slice(i - period, i + 1));
      rsiValues.push(rsi);
      minRSI = Math.min(minRSI, rsi);
      maxRSI = Math.max(maxRSI, rsi);
    }

    // Calculate Stochastic RSI
    const lastRSI = rsiValues[rsiValues.length - 1];
    return ((lastRSI - minRSI) / (maxRSI - minRSI)) * 100;
  }

  private interpretStochRSI(stochRSI: number): string {
    if (stochRSI > 80) return 'Extremely overbought';
    if (stochRSI > 60) return 'Overbought';
    if (stochRSI < 20) return 'Extremely oversold';
    if (stochRSI < 40) return 'Oversold';
    return 'Neutral';
  }

  private calculateOBV(prices: number[], volumes: number[]): string {
    let obv = 0;
    const obvValues = [0];

    for (let i = 1; i < prices.length; i++) {
      if (prices[i] > prices[i - 1]) {
        obv += volumes[i];
      } else if (prices[i] < prices[i - 1]) {
        obv -= volumes[i];
      }
      obvValues.push(obv);
    }

    // Determine trend
    const recentOBV = obvValues.slice(-5);
    const trend = recentOBV[recentOBV.length - 1] > recentOBV[0] ? 'Bullish' : 'Bearish';
    return trend;
  }

  private calculateVolumeRatio(volumes: number[], period: number = 20): number {
    const currentVolume = volumes[volumes.length - 1];
    const avgVolume = volumes.slice(-period).reduce((a, b) => a + b, 0) / period;
    return currentVolume / avgVolume;
  }

  private determineMarketPhase(prices: number[], ma50: number, ma200: number): string {
    const currentPrice = prices[prices.length - 1];
    const priceAboveMA50 = currentPrice > ma50;
    const priceAboveMA200 = currentPrice > ma200;
    const ma50AboveMA200 = ma50 > ma200;

    if (priceAboveMA50 && priceAboveMA200 && ma50AboveMA200) {
      return 'Bull Market';
    } else if (!priceAboveMA50 && !priceAboveMA200 && !ma50AboveMA200) {
      return 'Bear Market';
    } else if (priceAboveMA200 && !priceAboveMA50) {
      return 'Correction';
    } else {
      return 'Accumulation';
    }
  }

  private calculateVolatility(prices: number[], period: number = 20): number {
    const returns = prices.slice(1).map((price, i) => 
      Math.log(price / prices[i])
    );
    
    return Math.sqrt(
      returns.reduce((sum, ret) => sum + Math.pow(ret, 2), 0) / returns.length
    ) * Math.sqrt(365) * 100;
  }



  private async getAIAnalysis(
    crypto: string,
    technicalIndicators: TechnicalIndicators,
    news: any[],
    sentiment: any
  ): Promise<string> {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `
      Analyze ${crypto} market data and provide a structured analysis in HTML format:

      TECHNICAL METRICS:
      • Price: ${technicalIndicators.currentPrice} USD
      • RSI(14): ${technicalIndicators.rsi}
      • MACD: ${JSON.stringify(technicalIndicators.macd)}
      • Moving Averages: MA20=${technicalIndicators.ma20}, MA50=${technicalIndicators.ma50}, MA200=${technicalIndicators.ma200}
      • Volume Change: ${technicalIndicators.volumeChange}%

      MARKET CONTEXT:
      • Current Phase: ${technicalIndicators.marketPhase}
      • Volatility: ${technicalIndicators.volatility}%
       Support: ${technicalIndicators.support}
      • Resistance: ${technicalIndicators.resistance}

      SENTIMENT:
      • News Sentiment: ${sentiment.newsScore}% positive
       Market Mood: ${sentiment.marketMood}
      • News: ${JSON.stringify(news)}

      Format your response in this exact HTML structure and make sure they are higly concise and accurate. Use all the information above and be very analytical and act like a professional trader. Once You have information precisely format them in the following struture precisely following what each section is asking. Do not make up any information use the information to make a very accurate information:

      <div class="analysis">
        <div class="summary">
          <h3>Executive Summary</h3>
          <p class="highlight">[2-line market summary]</p>
        </div>

        <div class="signals">
          <h3>Key Signals</h3>
          <ul>
            <li class="signal-item [positive/negative/neutral]">[Signal 1]</li>
            <li class="signal-item [positive/negative/neutral]">[Signal 2]</li>
            <li class="signal-item [positive/negative/neutral]">[Signal 3]</li>
          </ul>
        </div>

       
          <div class="levels">
            <div class="entry">Entry: $[price]</div>
            <div class="stop">Stop Loss: $[price]</div>
            <div class="target">Target: $[price]</div>
          </div>
        </div>
      </div>

      Keep all explanations brief and focused. Use appropriate class names (positive/negative/neutral) based on the nature of each signal.
      Remove any markdown formatting (**) from the output.
      Ensure all price levels are properly formatted with $ symbol.
    `;

    const result = await model.generateContent(prompt);
    return result.response.text();
  }

  private interpretRSI(rsi: number): string {
    if (rsi >= 70) return 'Overbought - Consider taking profits';
    if (rsi <= 30) return 'Oversold - Potential buying opportunity';
    if (rsi >= 60) return 'Bullish momentum building';
    if (rsi <= 40) return 'Bearish pressure present';
    return 'Neutral momentum';
  }

  private calculateConfidence(
    rsi: number,
    macd: { value: number; signal: number; histogram: number },
    volumeRatio: number,
    sentiment: any,
    volatilityIndex: number
  ): number {
    // RSI confidence (0-100)
    const rsiConfidence = (() => {
      if (rsi > 70 || rsi < 30) return 90; // Strong signal (overbought/oversold)
      if (rsi > 60 || rsi < 40) return 75; // Moderate signal
      return 50; // Neutral
    })();

    // MACD confidence (0-100)
    const macdConfidence = (() => {
      const signalStrength = Math.abs(macd.histogram) / Math.abs(macd.signal);
      const normalizedStrength = Math.min(100, signalStrength * 100);
      return normalizedStrength;
    })();

    // Volume confidence (0-100)
    const volumeConfidence = (() => {
      if (volumeRatio > 2) return 90; // Very high volume
      if (volumeRatio > 1.5) return 80; // High volume
      if (volumeRatio > 1) return 70; // Above average
      if (volumeRatio > 0.7) return 50; // Normal
      return 30; // Low volume
    })();

    // Sentiment confidence (0-100)
    const sentimentConfidence = (() => {
      const newsScore = sentiment.newsScore || 50;
      const socialScore = sentiment.socialScore || 50;
      return (newsScore + socialScore) / 2;
    })();

    // Volatility impact (0-1)
    const volatilityFactor = Math.max(0.5, 1 - (volatilityIndex / 100));

    // Weight the different components
    const weights = {
      rsi: 0.25,
      macd: 0.25,
      volume: 0.20,
      sentiment: 0.20,
      volatility: 0.10
    };

    // Calculate weighted confidence
    const weightedConfidence = (
      (rsiConfidence * weights.rsi) +
      (macdConfidence * weights.macd) +
      (volumeConfidence * weights.volume) +
      (sentimentConfidence * weights.sentiment)
    ) * volatilityFactor;

    // Ensure confidence is between 30 and 95
    return Math.min(95, Math.max(30, weightedConfidence));
  }

  private async generatePredictions(
    prices: number[],
    currentPrice: number,
    volatility: number,
    marketPhase: string,
    signals: any[],
    obvTrend: string,
    stochRSI: number
  ) {
    // Calculate support and resistance levels first
    const { support, resistance } = this.findSupportResistance(prices);

    // Calculate price targets
    const priceTargets = this.calculatePriceTargets(
      currentPrice,
      prices,
      volatility,
      support,
      resistance
    );

    // Calculate confidence levels
    const shortTermConfidence = parseFloat((85 - volatility / 2).toFixed(2));
    const midTermConfidence = Math.max(30, shortTermConfidence * 0.9);
    const longTermConfidence = Math.max(30, shortTermConfidence * 0.8);

    // Generate reasoning array
    const reasoning = [
      `Market is in ${marketPhase} phase`,
      ...signals.map(s => `${s.indicator}: ${s.signal}`),
      `Volume trend: ${obvTrend}`,
      `StochRSI indicates ${this.interpretStochRSI(stochRSI)}`
    ];

    return {
      aiPrediction: {
        shortTerm: `$${priceTargets.shortTerm.low.toFixed(2)} - $${priceTargets.shortTerm.high.toFixed(2)}`,
        midTerm: `$${priceTargets.midTerm.low.toFixed(2)} - $${priceTargets.midTerm.high.toFixed(2)}`,
        longTerm: `$${priceTargets.longTerm.low.toFixed(2)} - $${priceTargets.longTerm.high.toFixed(2)}`,
        confidence: shortTermConfidence,
        reasoning
      },
      priceTargets: {
        '24H': {
          range: `$${priceTargets.shortTerm.low.toFixed(2)} - $${priceTargets.shortTerm.high.toFixed(2)}`,
          confidence: shortTermConfidence.toString()
        },
        '7D': {
          range: `$${priceTargets.midTerm.low.toFixed(2)} - $${priceTargets.midTerm.high.toFixed(2)}`,
          confidence: midTermConfidence.toString()
        },
        '30D': {
          range: `$${priceTargets.longTerm.low.toFixed(2)} - $${priceTargets.longTerm.high.toFixed(2)}`,
          confidence: longTermConfidence.toString()
        }
      }
    };
  }

  async getDetailedAnalysis(crypto: string): Promise<DetailedAnalysis> {
    try {
      const historicalData = await this.getHistoricalData(crypto);
      const prices = historicalData.prices;
      const volumes = historicalData.volumes;
      const currentPrice = historicalData.current_price;

      // Calculate all technical indicators
      const rsi = this.calculateRSI(prices);
      const macd = this.calculateMACD(prices);
      const ma20 = this.calculateSMA(prices, 20);
      const ma50 = this.calculateSMA(prices, 50);
      const ma200 = this.calculateSMA(prices, 200);
      const { support, resistance } = this.findSupportResistance(prices);
      const volumeRatio = this.calculateVolumeRatio(volumes);
      const volatilityIndex = this.calculateVolatility(prices);
      const stochRSI = this.calculateStochRSI(prices);
      const obvTrend = this.calculateOBV(prices, volumes);
      const marketPhase = this.determineMarketPhase(prices, ma50, ma200);

      // Updated market summary with date-based formatting and current trend lines
      const latestDateIndex = prices.length - 1;
      const latestPrice = prices[latestDateIndex];
      const latestVolume = volumes[latestDateIndex];
      const marketSummary = `${crypto.charAt(0).toUpperCase() + crypto.slice(1)} as of ${new Date().toLocaleDateString()} is in a ${marketPhase} phase, trading at $${latestPrice.toFixed(2)}. RSI is ${rsi.toFixed(2)} (${this.interpretRSI(rsi)}), with MACD indicating ${macd.interpretation}. The volume trend is ${obvTrend} with a ${volumeRatio.toFixed(2)}x change compared to the average volume.`;

      // Get market sentiment and news
      const sentiment = await this.getMarketSentiment(crypto);
      const newsResponse = await api.getNews(crypto);
      const newsItems = newsResponse.news; // Extract the news array

      // Generate signals based on all indicators
      const signals = [
        {
          indicator: 'RSI',
          value: rsi,
          signal: this.interpretRSI(rsi),
          strength: rsi > 70 || rsi < 30 ? 0.8 : 0.5
        },
        {
          indicator: 'MACD',
          value: macd.value,
          signal: macd.interpretation,
          strength: Math.abs(macd.histogram) > 0.1 ? 0.8 : 0.5
        },
        {
          indicator: 'StochRSI',
          value: stochRSI,
          signal: this.interpretStochRSI(stochRSI),
          strength: stochRSI > 80 || stochRSI < 20 ? 0.8 : 0.5
        },
        {
          indicator: 'OBV',
          value: 0,
          signal: obvTrend,
          strength: 0.5
        },
        {
          indicator: 'Market Phase',
          value: 0,
          signal: marketPhase,
          strength: 0.7
        }
      ];

      // Calculate predictions
      const predictions = await this.generatePredictions(
        prices,
        currentPrice,
        volatilityIndex,
        marketPhase,
        signals,
        obvTrend,
        stochRSI
      );

      // Generate AI analysis
      const technicalIndicators = {
        currentPrice,
        rsi,
        macd,
        ma20,
        ma50,
        ma200,
        volumeChange: volumeRatio,
        marketPhase,
        volatility: volatilityIndex,
        support,
        resistance
      };

      const aiAnalysis = await this.getAIAnalysis(
        crypto,
        technicalIndicators,
        newsItems, // Pass the news array
        sentiment
      );

      // Parse AI analysis
      const parsedAnalysis = this.parseAIAnalysis(aiAnalysis);

   

      // Calculate confidence for each timeframe
      const shortTermConfidence = this.calculateConfidence(rsi, macd, volumeRatio, sentiment, volatilityIndex);
      const midTermConfidence = Math.max(30, shortTermConfidence * 0.9); // Slightly lower confidence for mid-term
      const longTermConfidence = Math.max(30, shortTermConfidence * 0.8); // Even lower for long-term
      const volatility = this.calculateVolatility(prices);

      // Calculate price targets
      const priceTargets = {
        shortTerm: {
          low: currentPrice * (1 - volatility * 0.1),
          high: currentPrice * (1 + volatility * 0.1)
        },
        midTerm: {
          low: currentPrice * (1 - volatility * 0.2),
          high: currentPrice * (1 + volatility * 0.2)
        },
        longTerm: {
          low: currentPrice * (1 - volatility * 0.3),
          high: currentPrice * (1 + volatility * 0.3)
        }
      };

      return {
        summary: parsedAnalysis.summary[0] || marketSummary,
        technicalAnalysis: {
          rsi: { value: rsi, interpretation: this.interpretRSI(rsi) },
          macd: {
            value: macd.value,
            signal: macd.signal,
            histogram: macd.histogram,
            interpretation: macd.interpretation
          },
          movingAverages: {
            ma20: this.calculateSMA(prices, 20),
            ma50: this.calculateSMA(prices, 50),
            ma200: this.calculateSMA(prices, 200),
            interpretation: marketPhase
          },
          volume: {
            current: volumes[volumes.length - 1] || 0,
            change: volumeRatio,
            interpretation: obvTrend
          },
          volatility: volatilityIndex
        },
        sentimentAnalysis: {
          overall: sentiment.marketMood,
          newsScore: parseFloat(sentiment.newsScore.toFixed(2)),
          socialScore: parseFloat(sentiment.socialScore.toFixed(2)),
          marketMood: sentiment.marketMood
        },
        aiPrediction: {
          shortTerm: predictions.aiPrediction.shortTerm,
          midTerm: predictions.aiPrediction.midTerm,
          longTerm: predictions.aiPrediction.longTerm,
          confidence: parseFloat((85 - volatilityIndex / 2).toFixed(2)),
          reasoning: [
            parsedAnalysis.summary[0] || marketSummary,
            ...signals.map(s => `${s.indicator}: ${s.signal}`),
            `Volume trend: ${obvTrend}`,
            `StochRSI indicates ${this.interpretStochRSI(stochRSI)}`,
            `Market is in ${marketPhase} phase`
          ]
        },
        marketStructure: {
          trend: marketPhase,
          support: parseFloat(support.toFixed(2)),
          resistance: parseFloat(resistance.toFixed(2)),
          breakoutPotential: currentPrice > resistance ? 'Bullish Breakout Potential' :
                            currentPrice < support ? 'Bearish Breakdown Risk' : 'Range Bound'
        },
        priceTargets: {
          '24H': {
            range: `$${priceTargets.shortTerm.low.toFixed(2)} - $${priceTargets.shortTerm.high.toFixed(2)}`,
            confidence: shortTermConfidence.toString()
          },
          '7D': {
            range: `$${priceTargets.midTerm.low.toFixed(2)} - $${priceTargets.midTerm.high.toFixed(2)}`,
            confidence: midTermConfidence.toString()
          },
          '30D': {
            range: `$${priceTargets.longTerm.low.toFixed(2)} - $${priceTargets.longTerm.high.toFixed(2)}`,
            confidence: longTermConfidence.toString()
          }
        },
        signals: signals.map(s => ({
          text: `${s.indicator}: ${s.signal}`,
          importance: s.strength > 0.7 ? 'high' : s.strength > 0.4 ? 'medium' : 'low'
        })),
        strategy: {
          position: marketPhase === 'Bull Market' ? 'Long' : 'Short',
          entry: (support + (resistance - support) * 0.382).toString(),
          stop: (support * 0.95).toString(),
          target: resistance.toString()
        },
        marketConditions: {
          trend: marketPhase,
          support: support.toFixed(2),
          resistance: resistance.toFixed(2),
          distanceToResistance: ((resistance - currentPrice) / currentPrice * 100).toFixed(2),
          distanceToSupport: ((currentPrice - support) / currentPrice * 100).toFixed(2)
        },
        sentiment: {
          overall: sentiment.marketMood,
          newsScore: sentiment.newsScore.toString(),
          recentNews: newsItems.slice(0, 3).map(n => ({
            title: n.title,
            sentiment: n.sentiment
          }))
        }
      };
    } catch (error) {
      console.error('Error in analysis service:', error);
      throw error;
    }
  }

  private parseAIAnalysis(html: string): ParsedSections {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    const sections: ParsedSections = {
      summary: [],
      predictions: {
        shortTerm: '',
        midTerm: '',
        longTerm: ''
      },
      signals: [],
      strategy: [],
      reasoning: []
    };

    try {
      // Parse summary
      const summaryElement = doc.querySelector('.summary p.highlight');
      if (summaryElement?.textContent) {
        sections.summary = [summaryElement.textContent.trim()];
      }

      // Parse predictions
      const predictionsDiv = doc.querySelector('.predictions');
      if (predictionsDiv) {
        const shortTerm = predictionsDiv.querySelector('.prediction.short .price');
        const midTerm = predictionsDiv.querySelector('.prediction.medium .price');
        const longTerm = predictionsDiv.querySelector('.prediction.long .price');

        sections.predictions = {
          shortTerm: shortTerm?.textContent?.trim() || '',
          midTerm: midTerm?.textContent?.trim() || '',
          longTerm: longTerm?.textContent?.trim() || ''
        };
      }

      // Parse signals
      const signalsList = doc.querySelectorAll('.signals .signal-item');
      signalsList.forEach(signal => {
        const type = signal.classList.contains('positive') ? 'positive' :
                     signal.classList.contains('negative') ? 'negative' : 'neutral';
        sections.signals.push({
          text: signal.textContent?.trim() || '',
          type
        });
      });

      // Parse strategy
      const strategyDiv = doc.querySelector('.strategy');
      if (strategyDiv) {
        const position = strategyDiv.querySelector('.position .value')?.textContent?.trim();
        const entry = strategyDiv.querySelector('.levels .entry')?.textContent?.trim();
        const stop = strategyDiv.querySelector('.levels .stop')?.textContent?.trim();
        const target = strategyDiv.querySelector('.levels .target')?.textContent?.trim();

        if (position || entry || stop || target) {
          sections.strategy.push({
            position: position || 'N/A',
            entry: entry || 'N/A',
            stop: stop || 'N/A',
            target: target || 'N/A'
          });
        }
      }

      // Combine all relevant information into reasoning
      sections.reasoning = [
        ...sections.summary,
        ...sections.signals.map(s => s.text),
        ...(sections.strategy.length > 0 ? [
          `Position: ${sections.strategy[0].position}`,
          `Entry: ${sections.strategy[0].entry}`,
          `Stop: ${sections.strategy[0].stop}`,
          `Target: ${sections.strategy[0].target}`
        ] : [])
      ].filter(Boolean);

    } catch (error) {
      console.error('Error parsing AI analysis:', error);
    }

    return sections;
  }

 

  private calculatePriceTargets(
    currentPrice: number,
    prices: number[],
    volatility: number,
    support: number,
    resistance: number
  ) {
    // Calculate historical volatility
    const dailyReturns = prices.slice(1).map((price, i) => 
      Math.log(price / prices[i])
    );
    const stdDev = Math.sqrt(
      dailyReturns.reduce((sum, ret) => sum + Math.pow(ret, 2), 0) / dailyReturns.length
    );
    const annualizedVol = stdDev * Math.sqrt(365);

    // Calculate momentum and trend strength
    const sma20 = this.calculateSMA(prices, 20);
    const sma50 = this.calculateSMA(prices, 50);
    const momentum = (sma20 - sma50) / sma50;
    const rsi = this.calculateRSI(prices);
    const macd = this.calculateMACD(prices);
    const trendStrength = Math.abs((currentPrice - sma50) / sma50);

    // Calculate dynamic confidence based on multiple factors
    const calculateConfidence = (timeframe: string): number => {
      // Base confidence from technical indicators
      const rsiConfidence = Math.abs(50 - rsi) / 50; // How far from neutral
      const macdConfidence = Math.abs(macd.histogram) / Math.abs(macd.signal);
      const trendConfidence = Math.min(1, trendStrength * 2);
      
      // Define timeframe specific weights with proper typing
      const timeframeWeights: Record<string, TimeframeWeights> = {
        '24H': {
          rsi: 0.4,
          macd: 0.3,
          trend: 0.2,
          volatility: 0.1
        },
        '7D': {
          rsi: 0.3,
          macd: 0.3,
          trend: 0.3,
          volatility: 0.1
        },
        '30D': {
          rsi: 0.2,
          macd: 0.2,
          trend: 0.4,
          volatility: 0.2
        }
      };

      const weights = timeframeWeights[timeframe];
      if (!weights) {
        // Fallback weights if timeframe is not found
        return 50; // Default confidence
      }

      // Calculate weighted confidence
      const baseConfidence = (
        rsiConfidence * weights.rsi +
        macdConfidence * weights.macd +
        trendConfidence * weights.trend +
        (1 - Math.min(1, annualizedVol / 100)) * weights.volatility
      ) * 100;

      // Adjust confidence based on market conditions
      const marketConditions = momentum > 0 ? 1.1 : momentum < 0 ? 0.9 : 1;
      const volatilityPenalty = Math.max(0, 1 - (annualizedVol / 200));
      const timeDecay = timeframe === '24H' ? 1 : timeframe === '7D' ? 0.9 : 0.8;

      // Final confidence calculation
      return Math.min(95, Math.max(30, 
        baseConfidence * marketConditions * volatilityPenalty * timeDecay
      ));
    };

    // Calculate price ranges based on volatility and market structure
    const ranges = {
      '24H': {
        volatilityRange: currentPrice * annualizedVol * 0.1,
        supportRange: Math.abs(currentPrice - support) * 0.2,
        resistanceRange: Math.abs(resistance - currentPrice) * 0.2
      },
      '7D': {
        volatilityRange: currentPrice * annualizedVol * 0.2,
        supportRange: Math.abs(currentPrice - support) * 0.4,
        resistanceRange: Math.abs(resistance - currentPrice) * 0.4
      },
      '30D': {
        volatilityRange: currentPrice * annualizedVol * 0.3,
        supportRange: Math.abs(currentPrice - support) * 0.6,
        resistanceRange: Math.abs(resistance - currentPrice) * 0.6
      }
    };

    // Calculate predictions with momentum bias
    const momentumBias = momentum * currentPrice * 0.1;

    const shortTerm = {
      low: Math.max(
        support,
        currentPrice - ranges['24H'].volatilityRange - ranges['24H'].supportRange + momentumBias
      ),
      high: Math.min(
        resistance,
        currentPrice + ranges['24H'].volatilityRange + ranges['24H'].resistanceRange + momentumBias
      ),
      confidence: calculateConfidence('24H')
    };

    const midTerm = {
      low: Math.max(
        support * 0.95,
        currentPrice - ranges['7D'].volatilityRange - ranges['7D'].supportRange + (momentumBias * 2)
      ),
      high: Math.min(
        resistance * 1.05,
        currentPrice + ranges['7D'].volatilityRange + ranges['7D'].resistanceRange + (momentumBias * 2)
      ),
      confidence: calculateConfidence('7D')
    };

    const longTerm = {
      low: Math.max(
        support * 0.9,
        currentPrice - ranges['30D'].volatilityRange - ranges['30D'].supportRange + (momentumBias * 3)
      ),
      high: Math.min(
        resistance * 1.1,
        currentPrice + ranges['30D'].volatilityRange + ranges['30D'].resistanceRange + (momentumBias * 3)
      ),
      confidence: calculateConfidence('30D')
    };

    console.log('Price Targets Calculation:', {
      currentPrice,
      volatility: annualizedVol,
      momentum,
      rsi,
      macd: macd.histogram,
      trendStrength,
      shortTerm,
      midTerm,
      longTerm
    });

    return {
      shortTerm,
      midTerm,
      longTerm
    };
  }

  async getFullAnalysis(crypto: string): Promise<DetailedAnalysis> {
    try {
      // Fetch historical data
      const historicalData = await api.getHistoricalData(crypto);
      console.log('Fetching historical data for', crypto, '...');
      console.log('Historical data response:', historicalData);

      const prices = historicalData.prices;
      const volumes = historicalData.volumes;
      const currentPrice = historicalData.current_price;

      // Calculate technical indicators
      const rsi = this.calculateRSI(prices);
      const macd = this.calculateMACD(prices);
      const stochRSI = this.calculateStochRSI(prices);
      const ma50 = this.calculateSMA(prices, 50);
      const ma200 = this.calculateSMA(prices, 200);
      const { support, resistance } = this.findSupportResistance(prices);
      const volumeRatio = this.calculateVolumeRatio(volumes);
      const volatility = this.calculateVolatility(prices);
      const obvTrend = this.calculateOBV(prices, volumes);
      const marketPhase = this.determineMarketPhase(prices, ma50, ma200);

      // Calculate market sentiment
      const sentiment = await this.getMarketSentiment(crypto);
      const newsResponse = await api.getNews(crypto);
      const newsItems = newsResponse.news;

      // Calculate price targets
      const priceTargets = {
        shortTerm: {
          low: currentPrice * (1 - volatility * 0.1),
          high: currentPrice * (1 + volatility * 0.1)
        },
        midTerm: {
          low: currentPrice * (1 - volatility * 0.2),
          high: currentPrice * (1 + volatility * 0.2)
        },
        longTerm: {
          low: currentPrice * (1 - volatility * 0.3),
          high: currentPrice * (1 + volatility * 0.3)
        }
      };

           // Generate signals based on all indicators
      const signals = [
        {
          indicator: 'RSI',
          value: rsi,
          signal: this.interpretRSI(rsi),
          strength: Math.abs(50 - rsi) / 50
        },
        {
          indicator: 'MACD',
          value: macd.value,
          signal: macd.interpretation,
          strength: Math.abs(macd.value / currentPrice)
        },
        {
          indicator: 'StochRSI',
          value: stochRSI,
          signal: this.interpretStochRSI(stochRSI),
          strength: Math.abs(50 - stochRSI) / 50
        },
        {
          indicator: 'OBV',
          value: 0,
          signal: obvTrend,
          strength: volumeRatio - 1
        }
      ];

      // Calculate predictions
      const predictions = await this.generatePredictions(
        prices,
        currentPrice,
        volatility,
        marketPhase,
        signals,
        obvTrend,
        stochRSI
      );

      // Generate AI analysis
      const technicalIndicators = {
        currentPrice,
        rsi,
        macd,
        ma20: this.calculateSMA(prices, 20),
        ma50,
        ma200,
        volumeChange: volumeRatio,
        marketPhase,
        volatility: volatility,
        support,
        resistance
      };

      const aiAnalysis = await this.getAIAnalysis(
        crypto,
        technicalIndicators,
        newsItems, // Pass the news array
        sentiment
      );

      // Parse AI analysis
      const parsedAnalysis = this.parseAIAnalysis(aiAnalysis);

 

      // Updated market summary with date-based formatting and current trend lines
      const latestDateIndex = prices.length - 1;
      const latestPrice = prices[latestDateIndex];
      const latestVolume = volumes[latestDateIndex];
      const marketSummary = `${crypto.charAt(0).toUpperCase() + crypto.slice(1)} as of ${new Date().toLocaleDateString()} is in a ${marketPhase.toLowerCase()} with ${
        signals[0].signal.toLowerCase()
      } momentum and a ${macd.interpretation.toLowerCase()}. Price is ${
        latestPrice > ma50 ? 'above' : 'below'
      } most moving averages, indicating ${
        latestPrice > ma50 && latestPrice > ma200 ? 'bullish momentum' : 'potential trend reversal'
      }.`;

      console.log('Price Targets Calculation:', {
        currentPrice,
        volatility,
        momentum: signals[0].strength,
        rsi,
        macd: macd.value,
        stochRSI
      });
      const baseConfidence = parseFloat((85 - volatility / 2).toFixed(2));


      return {
        summary: marketSummary,
        technicalAnalysis: {
          rsi: {
            value: rsi,
            interpretation: this.interpretRSI(rsi)
          },
          macd: {
            value: macd.value,
            signal: macd.signal,
            histogram: macd.histogram,
            interpretation: macd.interpretation
          },
          movingAverages: {
            ma20: this.calculateSMA(prices, 20),
            ma50: this.calculateSMA(prices, 50),
            ma200: this.calculateSMA(prices, 200),
            interpretation: marketPhase
          },
          volume: {
            current: volumes[volumes.length - 1],
            change: volumeRatio,
            interpretation: obvTrend
          },
          volatility: volatility
        },
        sentimentAnalysis: {
          overall: sentiment.marketMood,
          newsScore: parseFloat(sentiment.newsScore.toFixed(2)),
          socialScore: parseFloat(sentiment.socialScore.toFixed(2)),
          marketMood: sentiment.marketMood
        },
        aiPrediction: {
          shortTerm: predictions.aiPrediction.shortTerm,
          midTerm: predictions.aiPrediction.midTerm,
          longTerm: predictions.aiPrediction.longTerm,
          confidence: parseFloat((85 - volatility/ 2).toFixed(2)),
          reasoning: [
            marketSummary,
            ...signals.map(s => `${s.indicator}: ${s.signal}`),
            `Volume trend: ${obvTrend}`,
            `StochRSI indicates ${this.interpretStochRSI(stochRSI)}`,
            `Market is in ${marketPhase} phase`
          ]
        },
        marketStructure: {
          trend: marketPhase,
          support,
          resistance,
          breakoutPotential: currentPrice > resistance ? 'Bullish Breakout Potential' :
                            currentPrice < support ? 'Bearish Breakdown Risk' : 'Range Bound'
        },
        priceTargets: {
          '24H': {
            range: `$${priceTargets.shortTerm.low.toFixed(2)} - $${priceTargets.shortTerm.high.toFixed(2)}`,
            confidence: baseConfidence.toString()
          },
          '7D': {
            range: `$${priceTargets.midTerm.low.toFixed(2)} - $${priceTargets.midTerm.high.toFixed(2)}`,
            confidence: Math.max(30, baseConfidence * 0.9).toString()
          },
          '30D': {
            range: `$${priceTargets.longTerm.low.toFixed(2)} - $${priceTargets.longTerm.high.toFixed(2)}`,
            confidence: Math.max(30, baseConfidence * 0.8).toString()
          }
        },
        signals: signals.map(s => ({
          text: `${s.indicator}: ${s.signal}`,
          importance: s.strength > 0.7 ? 'high' : s.strength > 0.4 ? 'medium' : 'low'
        })),
        strategy: {
          position: marketPhase === 'Bull Market' ? 'Long' : 'Short',
          entry: (support + (resistance - support) * 0.382).toString(),
          stop: (support * 0.95).toString(),
          target: resistance.toString()
        },
        marketConditions: {
          trend: marketPhase,
          support: support.toFixed(2),
          resistance: resistance.toFixed(2),
          distanceToResistance: ((resistance - currentPrice) / currentPrice * 100).toFixed(2),
          distanceToSupport: ((currentPrice - support) / currentPrice * 100).toFixed(2)
        },
        sentiment: {
          overall: sentiment.marketMood,
          newsScore: sentiment.newsScore.toString(),
          recentNews: newsItems.slice(0, 3).map(n => ({
            title: n.title,
            sentiment: n.sentiment
          }))
        }
      };
    } catch (error) {
      console.error('Error in analysis:', error);
      throw error;
    }
  }
}

export const analysisService = new AnalysisService();