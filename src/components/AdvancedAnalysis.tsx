import { useAdvancedAnalysis } from '../hooks/useAdvancedAnalysis';
import { MarketPhase } from './analysis/MarketPhase';
import { TechnicalSignals } from './analysis/TechnicalSignals';
import { SentimentOverview } from './analysis/SentimentOverview';
import { PricePredictions } from './analysis/PricePredictions';
import { RiskAnalysis } from './analysis/RiskAnalysis';
import { TradingStrategy } from './analysis/TradingStrategy';
import { Loader2 } from 'lucide-react';

export const AdvancedAnalysis = ({ crypto }: { crypto: string }) => {
  const { analysis, loading, error } = useAdvancedAnalysis(crypto);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8 text-white">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <p>Loading advanced analysis...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-red-400">
        <p>Error loading analysis: {error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="p-8 text-center text-slate-400">
        <p>No analysis data available</p>
      </div>
    );
  }

  // Validate required data
  const isValidData = analysis.marketCondition && 
                     analysis.technicalSignals && 
                     analysis.sentimentAnalysis && 
                     analysis.predictions && 
                     analysis.riskAnalysis && 
                     analysis.tradingStrategy;

  if (!isValidData) {
    return (
      <div className="p-8 text-center text-yellow-400">
        <p>Incomplete analysis data. Please try again later.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 text-white">
      <MarketPhase data={analysis.marketCondition} />
      <TechnicalSignals data={analysis.technicalSignals} />
      <SentimentOverview data={analysis.sentimentAnalysis} />
      <PricePredictions data={analysis.predictions} />
      <RiskAnalysis data={analysis.riskAnalysis} />
      <TradingStrategy data={analysis.tradingStrategy} />
    </div>
  );
}; 