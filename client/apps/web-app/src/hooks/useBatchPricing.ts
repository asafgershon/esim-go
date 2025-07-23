import { useLazyQuery } from '@apollo/client';
import { CALCULATE_PRICES_BATCH } from '@/lib/graphql/mutations';
import { CalculatePricesBatchQuery } from '@/__generated__/graphql';
import { useEffect, useMemo, useState, useRef } from 'react';

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
  const isRequestingRef = useRef(false);
  const lastRequestKeyRef = useRef<string>('');

  // Fetch all prices when parameters change
  useEffect(() => {
    const requestKey = `${regionId || ''}-${countryId || ''}-${maxDays}`;
    
    // Only trigger when we have a region/country
    if ((regionId || countryId)) {
      // Avoid duplicate requests for the same parameters
      if (isRequestingRef.current || batchLoading || lastRequestKeyRef.current === requestKey) {
        return;
      }
      
      isRequestingRef.current = true;
      lastRequestKeyRef.current = requestKey;
      
      // Clear existing cache when parameters change
      setPricingCache(new Map());
      
      // Create inputs for all days from 1 to maxDays
      const inputs = Array.from({ length: maxDays }, (_, i) => ({
        numOfDays: i + 1,
        regionId: regionId || "",
        countryId: countryId ? countryId.toUpperCase() : ""
      }));

      calculatePricesBatch({
        variables: { inputs }
      }).finally(() => {
        isRequestingRef.current = false;
      });
    } else {
      // Reset when no region/country
      lastRequestKeyRef.current = '';
      setPricingCache(new Map());
    }
  }, [regionId, countryId, maxDays, batchLoading]);

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
    return pricingCache.size > 0 && !batchLoading && !isRequestingRef.current;
  }, [pricingCache.size, batchLoading]);

  return {
    getPricing,
    loading: batchLoading || isRequestingRef.current,
    error,
    isReady,
    pricingCache
  };
}