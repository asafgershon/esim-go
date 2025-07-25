import { useLazyQuery } from '@apollo/client';
import { CALCULATE_PRICE } from '@/lib/graphql/mutations';
import { CalculatePriceQuery, PaymentMethod } from '@/__generated__/types';
import { useEffect, useMemo, useRef } from 'react';

interface UsePricingParams {
  numOfDays: number;
  regionId?: string;
  countryId?: string;
  paymentMethod?: PaymentMethod;
  debounceMs?: number; // Optional debounce delay in milliseconds
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

export function usePricing({ numOfDays, regionId, countryId, paymentMethod, debounceMs = 300 }: UsePricingParams) {
  const [calculatePrice, { data: priceData, loading: priceLoading, error }] = useLazyQuery<CalculatePriceQuery>(CALCULATE_PRICE);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Trigger price calculation with debouncing
  useEffect(() => {
    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new timer if we have valid parameters - countryId is now required
    if (numOfDays >= 1 && countryId) {
      debounceTimerRef.current = setTimeout(() => {
        calculatePrice({
          variables: {
            numOfDays,
            countryId: countryId.toUpperCase(),
            paymentMethod,
            regionId,
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
  }, [numOfDays, regionId, countryId, paymentMethod, calculatePrice, debounceMs]);

  // Transform pricing data
  const pricing: PricingData | null = useMemo(() => {
    if (!priceData?.calculatePrice) return null;

    const result = priceData.calculatePrice;
    const originalPrice = result.totalCost;
    const discountAmount = result.discountValue;
    const totalPrice = result.priceAfterDiscount;
    const dailyPrice = totalPrice / numOfDays;
    const hasDiscount = discountAmount > 0;

    return {
      // Basic pricing info
      dailyPrice,
      totalPrice,
      originalPrice,
      discountAmount,
      hasDiscount,
      days: numOfDays,
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
    };
  }, [priceData, numOfDays]);

  return {
    pricing,
    loading: priceLoading,
    error,
  };
} 