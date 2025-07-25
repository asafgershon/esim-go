import { useLazyQuery } from '@apollo/client';
import { CALCULATE_ADMIN_PRICE, CALCULATE_BATCH_ADMIN_PRICING } from '@/lib/graphql/queries';
import { CalculateAdminPriceQuery, CalculateBatchAdminPricingQuery, PaymentMethod } from '@/__generated__/graphql';
import { useEffect, useMemo, useRef, useState } from 'react';

interface UseAdminPricingParams {
  numOfDays: number;
  regionId?: string;
  countryId?: string;
  paymentMethod?: PaymentMethod;
  debounceMs?: number;
}

interface UseBatchAdminPricingParams {
  regionId?: string;
  countryId?: string;
  paymentMethod?: PaymentMethod;
  maxDays?: number;
}

interface AdminPricingData {
  // Basic pricing info (public)
  dailyPrice: number;
  totalPrice: number; // Final price after discount (what users pay)
  originalPrice: number; // Price before discount (totalCost)
  discountAmount: number; // Discount value
  hasDiscount: boolean;
  days: number;
  currency: string;
  
  // Admin-only business sensitive fields
  cost: number; // Base cost from supplier
  costPlus: number; // Cost + markup
  discountRate: number; // Discount percentage
  processingRate: number; // Processing fee percentage
  processingCost: number; // Processing fee amount
  finalRevenue: number; // Revenue after processing
  netProfit: number; // Final profit
  discountPerDay: number; // Per-day discount rate
  totalCostBeforeProcessing: number; // Price before processing fees
  
  // Pipeline metadata
  unusedDays?: number | null; // Days not used from selected bundle
  selectedReason?: string | null; // Bundle selection reason
  
  // Rule-based pricing breakdown
  appliedRules: Array<{
    name: string;
    type: string;
    impact: number;
  }>;
  discounts: Array<{
    type: string;
    amount: number;
  }>;
  
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
    appliedRules: Array<{
      name: string;
      type: string;
      impact: number;
    }>;
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

/**
 * Admin pricing hook with access to all pricing data including business-sensitive fields
 * Requires admin authentication to access cost, profit, and rule data
 */
export function useAdminPricing({ numOfDays, regionId, countryId, paymentMethod, debounceMs = 300 }: UseAdminPricingParams) {
  const [calculatePrice, { data: priceData, loading: priceLoading, error }] = useLazyQuery<CalculateAdminPriceQuery>(CALCULATE_ADMIN_PRICE);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Trigger price calculation with debouncing
  useEffect(() => {
    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new timer if we have valid parameters - countryId is required
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
  const pricing: AdminPricingData | null = useMemo(() => {
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
      
      // Admin-only business sensitive fields
      cost: result.cost,
      costPlus: result.costPlus,
      discountRate: result.discountRate,
      processingRate: result.processingRate,
      processingCost: result.processingCost,
      finalRevenue: result.finalRevenue,
      netProfit: result.netProfit,
      discountPerDay: result.discountPerDay,
      totalCostBeforeProcessing: result.totalCostBeforeProcessing,
      
      // Pipeline metadata
      unusedDays: result.unusedDays,
      selectedReason: result.selectedReason,
      
      // Rule-based pricing breakdown
      appliedRules: result.appliedRules || [],
      discounts: result.discounts || [],
      
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
        appliedRules: result.bundle.appliedRules || [],
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

/**
 * Admin batch pricing hook for calculating multiple days at once
 * Includes all admin-only pricing data
 */
export function useBatchAdminPricing({ regionId, countryId, paymentMethod, maxDays = 30 }: UseBatchAdminPricingParams) {
  const [calculateBatchPricing, { data: batchData, loading: batchLoading, error }] = 
    useLazyQuery<CalculateBatchAdminPricingQuery>(CALCULATE_BATCH_ADMIN_PRICING);
  
  const [pricingCache, setPricingCache] = useState<Map<number, AdminPricingData>>(new Map());

  // Fetch all prices when parameters change
  useEffect(() => {
    // Only trigger when we have a countryId
    if (countryId) {
      // Clear existing cache when parameters change
      setPricingCache(new Map());
      
      // Create requests for all days from 1 to maxDays
      const requests = Array.from({ length: maxDays }, (_, i) => ({
        numOfDays: i + 1,
        countryId: countryId.toUpperCase(),
        paymentMethod,
      }));

      calculateBatchPricing({
        variables: { requests }
      });
    } else {
      // Reset when no country
      setPricingCache(new Map());
    }
  }, [regionId, countryId, paymentMethod, maxDays, calculateBatchPricing]);

  // Process batch data into cache
  useEffect(() => {
    if (batchData?.calculateBatchPricing) {
      const newCache = new Map<number, AdminPricingData>();
      
      batchData.calculateBatchPricing.forEach((result) => {
        const originalPrice = result.totalCost;
        const discountAmount = result.discountValue;
        const totalPrice = result.priceAfterDiscount;
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
          
          // Admin-only business sensitive fields
          cost: result.cost,
          costPlus: result.costPlus,
          discountRate: result.discountRate,
          processingRate: result.processingRate,
          processingCost: result.processingCost,
          finalRevenue: result.finalRevenue,
          netProfit: result.netProfit,
          discountPerDay: result.discountPerDay,
          totalCostBeforeProcessing: result.totalCostBeforeProcessing,
          
          // Pipeline metadata
          unusedDays: result.unusedDays,
          selectedReason: result.selectedReason,
          
          // Rule-based pricing breakdown
          appliedRules: result.appliedRules || [],
          discounts: result.discounts || [],
          
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
            appliedRules: result.bundle.appliedRules || [],
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
    return (numOfDays: number): AdminPricingData | null => {
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