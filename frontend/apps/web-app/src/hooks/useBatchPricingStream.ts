import { useEffect, useMemo, useState } from "react";
import type { PaymentMethod } from "@/__generated__/types";

// The data structures remain the same, no need to change them
interface UseBatchPricingParams {
  regionId?: string;
  countryId?: string;
  paymentMethod?: PaymentMethod;
  maxDays?: number;
  requestedDays?: number; // Priority - load this day first
}

interface PricingStep {
  order: number;
  name: string;
  priceBefore: number;
  priceAfter: number;

  impact: number;
  ruleId?: string | null;
  metadata?: Record<string, unknown> | null;
  timestamp?: number | null;
}

interface PricingData {
  finalPrice: number; // Changed names to match the new engine
  totalPrice: number;
  hasDiscount: boolean;
  discountAmount: number;
  days: number;
  currency: string;
  pricingSteps?: PricingStep[] | null;
}

export function useBatchPricingStream({
  countryId,
  requestedDays,
}: UseBatchPricingParams) {
  const [pricingCache, setPricingCache] = useState<Map<number, PricingData>>(
    new Map()
  );
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!countryId || !requestedDays) {
      setPricingCache(new Map());
      return;
    }

    const fetchPricing = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        console.log(`[DEBUG] Firing fetch for country: ${countryId}, days: ${requestedDays}`);

        // --- The fetch call to our new API will be here ---
        // For example:
        // const response = await fetch(`/api/calculate-price?countryId=${countryId}&numOfDays=${requestedDays}`);
        // const data: PricingData = await response.json();
        
        // Using mock data for now to ensure the plumbing works
        const mockData: PricingData = {
          finalPrice: 19.99,
          totalPrice: 19.99,
          hasDiscount: false,
          discountAmount: 0,
          days: requestedDays,
          currency: "USD",
          pricingSteps: [],
        };

        setPricingCache(() => { // The unused 'prev' variable is removed here
          const newCache = new Map(); // Reset cache for new selection
          newCache.set(requestedDays, mockData);
          return newCache;
        });

      } catch (err) {
        console.error("Failed to fetch pricing:", err);
        setError(err instanceof Error ? err : new Error('An unknown error occurred'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchPricing();

  }, [countryId, requestedDays]);

  const getPricing = useMemo(() => {
    return (numOfDays: number): PricingData | null => {
      return pricingCache.get(numOfDays) || null;
    };
  }, [pricingCache]);

  return {
    getPricing,
    loading: isLoading,
    error,
    hasDataForDay: (numOfDays: number) => pricingCache.has(numOfDays),
    isReady: !isLoading,
    isStreamingData: false, 
    isNewCountryLoading: isLoading,
  };
}