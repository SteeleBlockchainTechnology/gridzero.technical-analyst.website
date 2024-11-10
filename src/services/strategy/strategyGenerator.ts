import { TradingStrategy } from '../types';

export class StrategyGenerator {
  calculateEntryPoints(analysis: any) {
    const { support, resistance, currentPrice } = analysis;
    const range = resistance - support;
    
    return {
      conservative: support + range * 0.236,
      moderate: support + range * 0.382,
      aggressive: support + range * 0.5
    };
  }

  calculateStopLosses(analysis: any) {
    const { support, volatility } = analysis;
    const volMultiplier = Math.max(0.5, Math.min(2, volatility / 50));
    
    return {
      tight: support * (1 - 0.02 * volMultiplier),
      normal: support * (1 - 0.05 * volMultiplier),
      wide: support * (1 - 0.08 * volMultiplier)
    };
  }

  calculateTargets(analysis: any) {
    const { resistance, currentPrice } = analysis;
    const upside = resistance - currentPrice;
    
    return {
      primary: currentPrice + upside * 0.618,
      secondary: resistance,
      final: resistance * 1.236
    };
  }

  recommendTimeframe(analysis: any): string {
    if (!analysis?.volatility || !analysis?.trend) {
      return 'Medium-term'; // Default timeframe if data is missing
    }
    
    const { volatility, trend } = analysis;
    
    if (volatility > 70) return 'Short-term';
    if (trend.strength > 0.7) return 'Long-term';
    return 'Medium-term';
  }

  generateRecommendation(analysis: any): string {
    const { 
      marketPhase,
      technicalSignals,
      sentiment,
      riskScore
    } = analysis;

    if (riskScore > 70) return 'Wait for lower risk';
    
    const bullishConditions = [
      marketPhase === 'accumulation',
      technicalSignals?.trend === 'bullish',
      sentiment?.overall?.score > 60
    ].filter(Boolean).length;

    const bearishConditions = [
      marketPhase === 'distribution',
      technicalSignals?.trend === 'bearish',
      sentiment?.overall?.score < 40
    ].filter(Boolean).length;

    if (bullishConditions >= 2) return 'Strong Buy';
    if (bearishConditions >= 2) return 'Strong Sell';
    if (bullishConditions > bearishConditions) return 'Buy';
    if (bearishConditions > bullishConditions) return 'Sell';
    return 'Hold';
  }

  calculateStrategyConfidence(analysis: any): number {
    if (!analysis) return 50;

    const factors = [
      { value: analysis.marketPhase?.confidence || 50, weight: 0.3 },
      { value: analysis.technicalSignals?.trend?.strength * 100 || 50, weight: 0.3 },
      { value: analysis.sentiment?.overall?.confidence || 50, weight: 0.2 },
      { value: analysis.predictions?.shortTerm?.confidence || 50, weight: 0.2 }
    ];

    const totalWeight = factors.reduce((sum, f) => sum + f.weight, 0);
    const weightedSum = factors.reduce((sum, f) => sum + f.value * f.weight, 0);
    
    return Math.round(weightedSum / totalWeight);
  }

  generateStrategyRationale(analysis: any): string[] {
    const rationale = [];
    
    if (!analysis) {
      return ['Market analysis in progress'];
    }

    const { marketPhase, technicalSignals, sentiment } = analysis;

    if (marketPhase?.phase && marketPhase?.strength) {
      rationale.push(
        `Market is in ${marketPhase.phase} phase with ${
          typeof marketPhase.strength === 'number' 
            ? marketPhase.strength.toFixed(1) 
            : '0'
        }% strength`
      );
    }

    if (technicalSignals?.trend?.strength > 0.7 && technicalSignals?.trend?.primary) {
      rationale.push(`Strong ${technicalSignals.trend.primary} trend detected`);
    }

    if (technicalSignals?.momentum) {
      Object.entries(technicalSignals.momentum).forEach(([indicator, data]: [string, any]) => {
        if (data?.signal && data.signal !== 'neutral') {
          rationale.push(`${indicator.toUpperCase()}: ${data.signal}`);
        }
      });
    }

    if (technicalSignals?.volume?.significance && technicalSignals?.volume?.trend) {
      if (technicalSignals.volume.significance !== 'weak') {
        rationale.push(
          `${technicalSignals.volume.significance} volume trend: ${technicalSignals.volume.trend}`
        );
      }
    }

    if (sentiment?.overall?.confidence && sentiment?.overall?.signal) {
      if (sentiment.overall.confidence > 70) {
        rationale.push(
          `Strong ${sentiment.overall.signal} sentiment with ${sentiment.overall.confidence}% confidence`
        );
      }
    }

    if (rationale.length === 0) {
      rationale.push('Analyzing market conditions');
    }

    return rationale;
  }

  async generateStrategy(data: {
    currentPrice: number;
    marketCondition: any;
    technicalSignals: any;
    sentimentAnalysis: any;
    riskAnalysis: any;
    predictions: any;
  }) {
    const { currentPrice, marketCondition, technicalSignals, sentimentAnalysis, riskAnalysis } = data;

    // Calculate entry points
    const entries = this.calculateEntryPoints({
      support: marketCondition.keyLevels.support,
      resistance: marketCondition.keyLevels.resistance,
      currentPrice
    });

    // Calculate stop losses
    const stopLoss = this.calculateStopLosses({
      support: marketCondition.keyLevels.support,
      volatility: technicalSignals.volatility.current
    });

    // Calculate targets
    const targets = this.calculateTargets({
      resistance: marketCondition.keyLevels.resistance,
      currentPrice
    });

    // Generate recommendation
    const recommendation = this.generateRecommendation({
      technicalSignals,
      sentimentAnalysis,
      marketCondition
    });

    // Calculate confidence
    const confidence = this.calculateStrategyConfidence({
      marketPhase: marketCondition,
      technicalSignals,
      sentiment: sentimentAnalysis,
      predictions: data.predictions
    });

    // Generate rationale by passing a combined analysis object
    const rationale = this.generateStrategyRationale({
      technicalSignals,
      sentimentAnalysis,
      marketCondition
    });

    return {
      recommendation,
      confidence,
      entries,
      stopLoss,
      targets,
      timeframe: this.recommendTimeframe({
        volatility: technicalSignals.volatility,
        trend: technicalSignals.trend
      }),
      rationale
    };
  }
}

export const strategyGenerator = new StrategyGenerator(); 