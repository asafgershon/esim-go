import { useLazyQuery } from '@apollo/client';
import { CALCULATE_PRICE } from '@/lib/graphql/mutations';
import { useEffect, useMemo, useRef } from 'react';

interface UsePricingParams {
  numOfDays: number;
  regionId?: string;
  countryId?: string;
  debounceMs?: number; // Optional debounce delay in milliseconds
}

interface PricingData {
  dailyPrice: number;
  totalPrice: number;
  hasDiscount: boolean;
  days: number;
}

export function usePricing({ numOfDays, regionId, countryId, debounceMs = 300 }: UsePricingParams) {
  const [calculatePrice, { data: priceData, loading: priceLoading, error }] = useLazyQuery(CALCULATE_PRICE);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Trigger price calculation with debouncing
  useEffect(() => {
    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new timer if we have valid parameters
    if (numOfDays >= 1 && (regionId || countryId)) {
      debounceTimerRef.current = setTimeout(() => {
        calculatePrice({
          variables: {
            numOfDays,
            regionId: regionId || "",
            countryId: countryId || "",
          },
        });
      }, debounceMs);
    }

    // Cleanup function
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [numOfDays, regionId, countryId, calculatePrice, debounceMs]);

  // Transform pricing data
  const pricing: PricingData | null = useMemo(() => {
    if (!priceData?.calculatePrice) return null;

    const totalPrice = priceData.calculatePrice;
    const dailyPrice = totalPrice / numOfDays;

    return {
      dailyPrice,
      totalPrice,
      hasDiscount: false, // Backend handles discount logic
      days: numOfDays,
    };
  }, [priceData, numOfDays]);

  return {
    pricing,
    loading: priceLoading,
    error,
  };
} 