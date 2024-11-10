import { TradingStrategy } from '../types';

export const strategyGenerator = {
  async generateStrategy(data: {
    currentPrice: number;
    marketCondition: any;
    technicalSignals: any;
    sentimentAnalysis: any;
    riskAnalysis: any;
    predictions: any;
  }): Promise<TradingStrategy> {
    try {
      const { currentPrice, marketCondition, technicalSignals } = data;

      // Ensure currentPrice is valid
      if (!currentPrice || isNaN(currentPrice)) {
        throw new Error('Invalid current price');
      }

      // Calculate entries
      const conservative = this.calculateConservativeEntry(currentPrice, technicalSignals, marketCondition);
      const aggressive = this.calculateAggressiveEntry(currentPrice, technicalSignals, marketCondition);

      const entries = {
        conservative: Number(conservative.toFixed(2)),
        moderate: Number(currentPrice.toFixed(2)),
        aggressive: Number(aggressive.toFixed(2))
      };

      // Validate entries
      if (isNaN(entries.aggressive) || entries.aggressive === 0) {
        entries.aggressive = Number((currentPrice * 1.02).toFixed(2)); // Default to 2% above current price
      }

      // Determine base recommendation
      const recommendation = this.determineRecommendation(technicalSignals, marketCondition);
      const confidence = this.calculateConfidence(technicalSignals, marketCondition);

      const stopLoss = {
        tight: Number((currentPrice * 0.98).toFixed(2)),    // 2% below entry
        normal: Number((currentPrice * 0.97).toFixed(2)),   // 3% below entry
        wide: Number((currentPrice * 0.95).toFixed(2))      // 5% below entry
      };

      const targets = {
        primary: Number((currentPrice * 1.03).toFixed(2)),    // 3% above entry
        secondary: Number((currentPrice * 1.05).toFixed(2)),  // 5% above entry
        final: Number((currentPrice * 1.08).toFixed(2))       // 8% above entry
      };

      const rationale = this.generateRationale(technicalSignals, marketCondition);

      return {
        recommendation: `${recommendation} (${confidence}%)`,
        confidence,
        entries,
        stopLoss,
        targets,
        timeframe: this.determineTimeframe(technicalSignals, marketCondition),
        rationale
      };
    } catch (error) {
      console.error('Error generating strategy:', error);
      return this.getDefaultStrategy();
    }
  },

  determineRecommendation(technicalSignals: any, _marketCondition: any): string {
    const { rsi, macd } = technicalSignals.momentum;
    const trend = technicalSignals.trend.primary;

    if (rsi.value > 70 && trend === 'bullish') return 'Take Profit';
    if (rsi.value < 30 && trend === 'bearish') return 'Buy';
    if (rsi.value > 60 && macd.signal.includes('bullish')) return 'Hold Long';
    if (rsi.value < 40 && macd.signal.includes('bearish')) return 'Hold Short';
    return 'Hold';
  },

  calculateConfidence(technicalSignals: any, marketCondition: any): number {
    const trendStrength = technicalSignals.trend.strength * 100;
    const marketStrength = marketCondition.strength * 100;
    const momentumStrength = 
      (technicalSignals.momentum.rsi.value > 50 ? 60 : 40) +
      (technicalSignals.momentum.macd.value > 0 ? 10 : -10);

    return Math.min(95, Math.max(30,
      (trendStrength * 0.4 + marketStrength * 0.3 + momentumStrength * 0.3)
    ));
  },

  calculateConservativeEntry(currentPrice: number, technicalSignals: any, marketCondition: any): number {
    const support = marketCondition.keyLevels.support;
    const volatility = technicalSignals.volatility.current / 100;
    
    // Conservative entry near support level
    return Math.max(
      support,
      currentPrice * (1 - Math.min(0.05, volatility)) // Max 5% below current price
    );
  },

  calculateAggressiveEntry(currentPrice: number, technicalSignals: any, marketCondition: any): number {
    const resistance = marketCondition.keyLevels.resistance;
    const volatility = technicalSignals.volatility.current / 100;
    
    // Aggressive entry should be between current price and resistance
    const entryPoint = currentPrice * (1 + Math.min(0.03, volatility)); // Max 3% above current price
    
    // Ensure entry doesn't exceed resistance
    return Math.min(
      entryPoint,
      resistance
    );
  },

  calculateStopLoss(price: number, percentage: number): number {
    return price * (1 - percentage);
  },

  calculateTarget(price: number, percentage: number): number {
    return price * (1 + percentage);
  },

  determineTimeframe(technicalSignals: any, marketCondition: any): string {
    const volatility = technicalSignals.volatility.current;
    if (volatility > 50) return 'Short-term';
    if (volatility < 20) return 'Long-term';
    return 'Medium-term';
  },

  generateRationale(technicalSignals: any, marketCondition: any): string[] {
    const rationale = [];
    
    rationale.push(`RSI: ${technicalSignals.momentum.rsi.signal}`);
    rationale.push(`MACD: ${technicalSignals.momentum.macd.signal}`);
    rationale.push(`STOCHRSI: ${technicalSignals.momentum.stochRSI.signal}`);

    if (marketCondition.strength > 0.6) {
      rationale.push(`Strong ${marketCondition.phase} phase`);
    }

    return rationale;
  },

  getDefaultStrategy(): TradingStrategy {
    const defaultPrice = 76000;
    return {
      recommendation: 'Hold (50%)',
      confidence: 50,
      entries: {
        conservative: defaultPrice * 0.98,
        moderate: defaultPrice,
        aggressive: defaultPrice * 1.02
      },
      stopLoss: {
        tight: defaultPrice * 0.95,
        normal: defaultPrice * 0.97,
        wide: defaultPrice * 0.93
      },
      targets: {
        primary: defaultPrice * 1.03,
        secondary: defaultPrice * 1.05,
        final: defaultPrice * 1.08
      },
      timeframe: 'Medium-term',
      rationale: ['Using default strategy due to insufficient data']
    };
  }
};