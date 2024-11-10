import { useState, useEffect } from 'react';
import { advancedAnalysis, AdvancedAnalysis } from '../services/advancedAnalysis';

export function useAdvancedAnalysis(crypto: string) {
  const [analysis, setAnalysis] = useState<AdvancedAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchAnalysis = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await advancedAnalysis.getFullAnalysis(crypto);
        if (mounted) {
          setAnalysis(result);
          setError(null);
        }
      } catch (err) {
        console.error('Error fetching analysis:', err);
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to fetch analysis');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchAnalysis();
    const interval = setInterval(fetchAnalysis, 60000); // Update every minute

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [crypto]);

  return { analysis, loading, error };
} 