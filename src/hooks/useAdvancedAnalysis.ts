import { useState, useEffect, useRef } from 'react';
import { advancedAnalysis, AdvancedAnalysis } from '../services/advancedAnalysis';
import { priceStore } from '../services/priceStore';

export function useAdvancedAnalysis(crypto: string) {
  const [analysis, setAnalysis] = useState<AdvancedAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const reqCounter = useRef(0);

  // Wait until the price store reports a non-zero price for the selected asset
  const waitForPriceReady = async (maxWaitMs = 2000) => {
    const start = Date.now();
    while (Date.now() - start < maxWaitMs) {
      const pd = await priceStore.getPrice(crypto);
      if (pd.price > 0) return;
      await new Promise(r => setTimeout(r, 200));
    }
  };

  const fetchAnalysis = async () => {
    const thisReq = ++reqCounter.current;
    try {
      setLoading(true);
      setError(null);
      // Give the price store a moment to populate after crypto switch
      await waitForPriceReady();
      const result = await advancedAnalysis.getFullAnalysis(crypto);
      // Ignore stale responses if crypto changed during the request
      if (thisReq === reqCounter.current) {
        setAnalysis(result);
        setError(null);
      }
    } catch (err) {
      console.error('Error fetching analysis:', err);
      if (thisReq === reqCounter.current) {
        setError(err instanceof Error ? err.message : 'Failed to fetch analysis');
      }
    } finally {
      if (thisReq === reqCounter.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
  // Ensure price store is actively fetching the selected asset
  priceStore.setActiveCrypto(crypto).catch(() => {});

    // Small debounce to avoid racing the first WS tick after crypto changes
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
  timeoutRef.current = window.setTimeout(fetchAnalysis, 500) as unknown as number;
    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, [crypto]);

  return { analysis, loading, error, refetch: fetchAnalysis };
} 