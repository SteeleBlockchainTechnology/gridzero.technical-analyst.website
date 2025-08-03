import { useAdvancedAnalysis } from '../hooks/useAdvancedAnalysis';
import { MarketPhase } from './analysis/MarketPhase';
import { TechnicalSignals } from './analysis/TechnicalSignals';
import { SentimentOverview } from './analysis/SentimentOverview';
import { PricePredictions } from './analysis/PricePredictions';
import { RiskAnalysis } from './analysis/RiskAnalysis';
import { TradingStrategy } from './analysis/TradingStrategy';
import { PredictionData } from '@/services/types';
import { LoadingSpinner, ErrorDisplay } from './ErrorBoundary';

interface AdvancedAnalysisProps {
  crypto: string;
  predictions: PredictionData[];
}

export const AdvancedAnalysis = ({ crypto, predictions }: AdvancedAnalysisProps) => {
  const { analysis, loading, error, refetch } = useAdvancedAnalysis(crypto);

  if (loading) {
    return <LoadingSpinner message="Loading advanced analysis..." />;
  }

  if (error) {
    return <ErrorDisplay error={error} onRetry={refetch} />;
  }

  if (!analysis) {
    return (
      <div className="p-8 text-center text-slate-400">
        <p>No analysis data available</p>
      </div>
    );
  }

  // Merge external predictions with analysis predictions
  const mergedPredictions = {
    ...analysis.predictions,
    externalPredictions: predictions
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <MarketPhase data={analysis.marketCondition} />
      <TechnicalSignals data={analysis.technicalSignals} />
      <SentimentOverview data={analysis.sentimentAnalysis} />
      <PricePredictions data={mergedPredictions} />
      <div className="md:col-span-2">
        <RiskAnalysis data={analysis.riskAnalysis} />
      </div>
      <div className="md:col-span-2">
        <TradingStrategy data={analysis.tradingStrategy} />
      </div>
    </div>
  );
}; 