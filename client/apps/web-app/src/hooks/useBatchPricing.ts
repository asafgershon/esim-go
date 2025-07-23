import { useLazyQuery } from '@apollo/client';
import { CALCULATE_PRICES_BATCH } from '@/lib/graphql/mutations';
import { CalculatePricesBatchQuery } from '@/__generated__/graphql';
import { useEffect, useMemo, useState } from 'react';

interface UseBatchPricingParams {
  regionId?: string;
  countryId?: string;
  maxDays?: number;
}

interface PricingData {
  dailyPrice: number;
  totalPrice: number; // Final price after discount (what users pay)
  originalPrice: number; // Price before discount (totalCost)
  discountAmount: number; // Discount value
  hasDiscount: boolean;
  days: number;
}

export function useBatchPricing({ regionId, countryId, maxDays = 30 }: UseBatchPricingParams) {
  const [calculatePricesBatch, { data: batchData, loading: batchLoading, error }] = 
    useLazyQuery<CalculatePricesBatchQuery>(CALCULATE_PRICES_BATCH);
  
  const [pricingCache, setPricingCache] = useState<Map<number, PricingData>>(new Map());
  const [isInitializing, setIsInitializing] = useState(false);

  // Fetch all prices when parameters change
  useEffect(() => {
    if ((regionId || countryId) && !batchLoading && !isInitializing) {
      setIsInitializing(true);
      
      // Create inputs for all days from 1 to maxDays
      const inputs = Array.from({ length: maxDays }, (_, i) => ({
        numOfDays: i + 1,
        regionId: regionId || "",
        countryId: countryId ? countryId.toUpperCase() : ""
      }));

      calculatePricesBatch({
        variables: { inputs }
      }).finally(() => {
        setIsInitializing(false);
      });
    }
  }, [regionId, countryId, maxDays, calculatePricesBatch, batchLoading, isInitializing]);

  // Process batch data into cache
  useEffect(() => {
    if (batchData?.calculatePrices) {
      const newCache = new Map<number, PricingData>();
      
      batchData.calculatePrices.forEach((price) => {
        const originalPrice = price.totalCost;
        const discountAmount = price.discountValue;
        const totalPrice = price.priceAfterDiscount;
        const dailyPrice = totalPrice / price.duration;
        const hasDiscount = discountAmount > 0;

        newCache.set(price.duration, {
          dailyPrice,
          totalPrice,
          originalPrice,
          discountAmount,
          hasDiscount,
          days: price.duration,
        });
      });
      
      setPricingCache(newCache);
    }
  }, [batchData]);

  // Get pricing for specific number of days
  const getPricing = useMemo(() => {
    return (numOfDays: number): PricingData | null => {
      return pricingCache.get(numOfDays) || null;
    };
  }, [pricingCache]);

  // Check if data is ready
  const isReady = useMemo(() => {
    return pricingCache.size > 0 && !batchLoading && !isInitializing;
  }, [pricingCache.size, batchLoading, isInitializing]);

  return {
    getPricing,
    loading: batchLoading || isInitializing,
    error,
    isReady,
    pricingCache
  };
}