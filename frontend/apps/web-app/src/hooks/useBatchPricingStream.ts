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
        // ---> !!! שים לב !!! <---
        // החלף את הכתובת הבאה בכתובת האמיתית של השרת שלך מ-Railway
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'https://api.hiiloworld.com';
        
        console.log(`[REAL] Firing fetch to: ${backendUrl}`);

        // --- This is the real call to the server! ---
        const response = await fetch(`${backendUrl}/api/calculate-price?countryId=${countryId}&numOfDays=${requestedDays}`);
        
        if (!response.ok) {
          const errorBody = await response.json();
          throw new Error(`API responded with status ${response.status}: ${errorBody.error}`);
        }

        const data: PricingData = await response.json();
        
        // Update the cache with the real data from the server
        setPricingCache(() => {
          const newCache = new Map();
          newCache.set(requestedDays, data);
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