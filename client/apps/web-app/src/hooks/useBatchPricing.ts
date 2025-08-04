import { useLazyQuery } from '@apollo/client';
import { CALCULATE_PRICES_BATCH } from '@/lib/graphql/mutations';
import { CalculatePricesBatchQuery, PaymentMethod } from '@/__generated__/types';
import { useEffect, useMemo, useState } from 'react';
import { WEB_APP_BUNDLE_GROUP } from '@/lib/constants/bundle-groups';

interface UseBatchPricingParams {
  regionId?: string;
  countryId?: string;
  paymentMethod?: PaymentMethod;
  maxDays?: number;
}

interface PricingData {
  // Basic pricing info
  dailyPrice: number;
  totalPrice: number; // Final price after discount (what users pay)
  originalPrice: number; // Price before discount (totalCost)
  discountAmount: number; // Discount value
  hasDiscount: boolean;
  days: number;
  currency: string;
  
  // Bundle information
  bundle: {
    id: string;
    name: string;
    duration: number;
    isUnlimited: boolean;
    data?: number | null;
    group?: string | null;
    country: {
      iso: string;
      name: string;
    };
  };
  
  // Country information
  country: {
    iso: string;
    name: string;
    nameHebrew?: string | null;
    region?: string | null;
    flag?: string | null;
  };
}

export function useBatchPricing({ regionId, countryId, paymentMethod, maxDays = 30 }: UseBatchPricingParams) {
  const [calculatePricesBatch, { data: batchData, loading: batchLoading, error }] = 
    useLazyQuery<CalculatePricesBatchQuery>(CALCULATE_PRICES_BATCH);
  
  const [pricingCache, setPricingCache] = useState<Map<number, PricingData>>(new Map());

  // Fetch all prices when parameters change
  useEffect(() => {
    // Only trigger when we have a countryId (now required)
    if (countryId) {
      // Clear existing cache when parameters change
      setPricingCache(new Map());
      
      // Web-app configuration: Only request available bundle groups  
      // Using shared constant to ensure consistency with checkout
      const WEB_APP_BUNDLE_GROUPS = [WEB_APP_BUNDLE_GROUP];
      
      // Create inputs for all days from 1 to maxDays
      const inputs = Array.from({ length: maxDays }, (_, i) => ({
        numOfDays: i + 1,
        countryId: countryId.toUpperCase(),
        paymentMethod,
        groups: WEB_APP_BUNDLE_GROUPS,
      }));

      calculatePricesBatch({
        variables: { inputs }
      });
    } else {
      // Reset when no country
      setPricingCache(new Map());
    }
  }, [regionId, countryId, paymentMethod, maxDays, calculatePricesBatch]);

  // Process batch data into cache
  useEffect(() => {
    if (batchData?.calculatePrices2) {
      const newCache = new Map<number, PricingData>();
      
      batchData.calculatePrices2.forEach((result) => {
        const originalPrice = result.totalCost;
        const discountAmount = result.discountValue;
        const totalPrice = result.finalPrice;
        const dailyPrice = totalPrice / result.duration;
        const hasDiscount = discountAmount > 0;

        newCache.set(result.duration, {
          // Basic pricing info
          dailyPrice,
          totalPrice,
          originalPrice,
          discountAmount,
          hasDiscount,
          days: result.duration,
          currency: result.currency,
          
          // Bundle information
          bundle: {
            id: result.bundle.id,
            name: result.bundle.name,
            duration: result.bundle.duration,
            isUnlimited: result.bundle.isUnlimited,
            data: result.bundle.data,
            group: result.bundle.group,
            country: {
              iso: result.bundle.country.iso,
              name: result.bundle.country.name,
            },
          },
          
          // Country information
          country: {
            iso: result.country.iso,
            name: result.country.name,
            nameHebrew: result.country.nameHebrew,
            region: result.country.region,
            flag: result.country.flag,
          },
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
    return pricingCache.size > 0 && !batchLoading;
  }, [pricingCache.size, batchLoading]);

  return {
    getPricing,
    loading: batchLoading,
    error,
    isReady,
    pricingCache
  };
}