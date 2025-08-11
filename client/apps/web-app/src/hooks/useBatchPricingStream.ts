import { useSubscription } from "@apollo/client";
import { CALCULATE_PRICES_BATCH_STREAM } from "@/lib/graphql/subscriptions/batch-pricing";
import { PaymentMethod } from "@/__generated__/types";
import { useEffect, useMemo, useState, useRef } from "react";
import { WEB_APP_BUNDLE_GROUP } from "@/lib/constants/bundle-groups";

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

  // Pricing steps from backend
  pricingSteps?: PricingStep[] | null;
}

export function useBatchPricingStream({
  regionId,
  countryId,
  paymentMethod,
  maxDays = 30,
  requestedDays,
}: UseBatchPricingParams) {
  const [pricingCache, setPricingCache] = useState<Map<number, PricingData>>(
    new Map()
  );
  const [loadedDays, setLoadedDays] = useState<Set<number>>(new Set());
  const [isInitialLoadComplete, setIsInitialLoadComplete] = useState(false);
  const [isNewCountryLoading, setIsNewCountryLoading] = useState(false);
  const previousDestinationRef = useRef<string | undefined>(undefined);

  // Create inputs for subscription
  const inputs = useMemo(() => {
    if (!countryId) return [];

    const WEB_APP_BUNDLE_GROUPS = [WEB_APP_BUNDLE_GROUP];

    return Array.from({ length: maxDays }, (_, i) => ({
      numOfDays: i + 1,
      countryId: countryId.toUpperCase(),
      paymentMethod,
      groups: WEB_APP_BUNDLE_GROUPS,
    }));
  }, [countryId, paymentMethod, maxDays]);

  // Check if destination (country or region) changed
  const currentDestination = regionId || countryId;
  const destinationChanged = previousDestinationRef.current !== currentDestination;
  if (destinationChanged && currentDestination) {
    previousDestinationRef.current = currentDestination;
    setIsNewCountryLoading(true);
  }

  // Subscribe to batch pricing stream
  const { loading, error } = useSubscription(CALCULATE_PRICES_BATCH_STREAM, {
    variables: {
      inputs,
      requestedDays,
    },
    skip: !countryId || inputs.length === 0,
    onData: ({ data }) => {
      if (data?.data?.calculatePricesBatchStream) {
        const result = data.data.calculatePricesBatchStream;

        const originalPrice = result.totalCost;
        const discountAmount = result.discountValue;
        const totalPrice = result.finalPrice;
        const dailyPrice = totalPrice / result.duration;
        const hasDiscount = discountAmount > 0;

        const pricingData: PricingData = {
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

          // Pricing steps from backend
          pricingSteps: result.pricingSteps || null,
        };

        // Update cache
        setPricingCache((prev) => {
          const newCache = new Map(prev);
          newCache.set(result.duration, pricingData);
          return newCache;
        });

        // Track loaded days
        setLoadedDays((prev) => {
          const newSet = new Set(prev);
          newSet.add(result.duration);
          return newSet;
        });

        // Mark initial load complete when requested day loads
        if (requestedDays && result.duration === requestedDays) {
          setIsInitialLoadComplete(true);
          setIsNewCountryLoading(false); // New country data is ready
        }
      }
    },
    onError: (err) => {
      console.error("Batch pricing subscription error:", err);
    },
  });

  // Reset cache when destination changes
  useEffect(() => {
    if (destinationChanged && currentDestination) {
      setPricingCache(new Map());
      setLoadedDays(new Set());
      setIsInitialLoadComplete(false);
      // isNewCountryLoading is already set to true when destination changes
    }
  }, [destinationChanged, currentDestination]);

  // Get pricing for specific number of days
  const getPricing = useMemo(() => {
    return (numOfDays: number): PricingData | null => {
      return pricingCache.get(numOfDays) || null;
    };
  }, [pricingCache]);

  // Check if specific day is loaded
  const isDayLoaded = useMemo(() => {
    return (numOfDays: number): boolean => {
      return loadedDays.has(numOfDays);
    };
  }, [loadedDays]);

  // Loading state for specific day
  const isDayLoading = useMemo(() => {
    return (numOfDays: number): boolean => {
      return loading && !isDayLoaded(numOfDays);
    };
  }, [loading, isDayLoaded]);

  // Progress percentage
  const loadingProgress = useMemo(() => {
    return (loadedDays.size / maxDays) * 100;
  }, [loadedDays.size, maxDays]);

  return {
    getPricing,
    loading: loading && !isInitialLoadComplete, // Only show loading until requested day loads
    error,
    isReady: isInitialLoadComplete,
    pricingCache,
    loadedDays: loadedDays.size,
    totalDays: maxDays,
    loadingProgress,
    isDayLoaded,
    isDayLoading,

    // New states for enhanced UX
    isNewCountryLoading, // True only when country/trip changes
    isStreamingData: loading && isInitialLoadComplete, // Background loading after initial load
    hasDataForDay: (numOfDays: number) => pricingCache.has(numOfDays), // Check if we have cached data
  };
}
