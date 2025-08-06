"use client";

import { createContext, useContext, ReactNode, useState, useMemo } from 'react';
import { useQueryStates, parseAsInteger, parseAsString, parseAsStringLiteral } from 'nuqs';
import { useIsMobile } from '@workspace/ui';
import { useRouter } from 'next/navigation';
import type { Bundle } from '@/__generated__/types';
import type { CountryISOCode } from '@/lib/types';

// Types for the bundle selector functions
export type BundleSelector = (
  bundles: Bundle[],
  requestedDuration: number
) => {
  selectedBundle: Bundle;
  previousBundle?: Bundle;
};

export type UnusedDayDiscountCalculator = (
  availableBundles: Bundle[],
  selectedBundle: Bundle,
  requestedDuration: number
) => number;

// UI State types
export type ViewState = "main" | "datePicker";
export type ActiveTab = "countries" | "trips";

// Clean destination type
export interface Destination {
  id: string; // ISO code for countries, region id for trips
  name: string; // Display name (preferably Hebrew)
  icon: string; // Emoji or icon
}

// Context interface
interface BundleSelectorContextValue {
  // Bundle selector functions
  findOptimalBundle: BundleSelector;
  calculateUnusedDayDiscount: UnusedDayDiscountCalculator;
  
  // UI State
  currentView: ViewState;
  setCurrentView: (view: ViewState) => void;
  isMobile: boolean;
  
  // Query State (from URL)
  numOfDays: number;
  setNumOfDays: (days: number) => void;
  countryId: string;
  setCountryId: (id: string | null) => void;
  tripId: string;
  setTripId: (id: string | null) => void;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  
  // Destination State (will be computed from queryStates in the component that has access to countries/trips data)
  destination: Destination | null;
  
  // Pricing State
  pricing: { totalPrice?: number } | null;
  setPricing: (pricing: { totalPrice?: number } | null) => void;
  isPricingValid: boolean;
  
  // Complex handlers
  handleTabChange: (tab: ActiveTab) => void;
  handleDestinationChange: (value: string) => void;
  handlePurchase: (pricing?: { totalPrice?: number } | null) => void;
}

// Create the context
const BundleSelectorContext = createContext<BundleSelectorContextValue | null>(null);

// Bundle selector logic implementation (ported from server package)

/**
 * Find the optimal bundle for the requested duration
 * 1. Try exact match first
 * 2. Find smallest bundle that covers the requested duration
 * 3. Fallback to largest bundle if none can cover the duration
 */
const findOptimalBundle: BundleSelector = (bundles, requestedDuration) => {
  let exactMatch = undefined;
  let smallestSuitable = undefined;
  let largestBundle = undefined;
  let secondLargest = undefined;

  // Single pass through all bundles - O(n)
  for (const bundle of bundles) {
    // Check for exact match
    if (bundle.validityInDays === requestedDuration) {
      exactMatch = bundle;
    }

    // Track smallest bundle that covers requested duration
    if (bundle.validityInDays >= requestedDuration) {
      if (!smallestSuitable || bundle.validityInDays < smallestSuitable.validityInDays) {
        smallestSuitable = bundle;
      }
    }

    // Track largest bundle overall
    if (!largestBundle || bundle.validityInDays > largestBundle.validityInDays) {
      secondLargest = largestBundle;
      largestBundle = bundle;
    } else if (!secondLargest || bundle.validityInDays > secondLargest.validityInDays) {
      secondLargest = bundle;
    }
  }

  // Return exact match if found
  if (exactMatch) {
    return {
      selectedBundle: exactMatch,
      previousBundle: undefined
    };
  }

  // Return smallest suitable bundle if found
  if (smallestSuitable) {
    // Find the largest bundle smaller than selected in another pass - still O(n)
    let previousBundle = undefined;
    for (const bundle of bundles) {
      if (bundle.validityInDays < smallestSuitable.validityInDays) {
        if (!previousBundle || bundle.validityInDays > previousBundle.validityInDays) {
          previousBundle = bundle;
        }
      }
    }
    
    return {
      selectedBundle: smallestSuitable,
      previousBundle
    };
  }

  if (!largestBundle) {
    throw new Error("No bundle found");
  }

  return {
    selectedBundle: largestBundle,
    previousBundle: largestBundle === largestBundle ? secondLargest : undefined
  };
};

/**
 * Calculate discount per unused day based on markup difference formula
 * Formula: (selectedBundlePrice - previousBundlePrice) / (selectedDuration - previousDuration)
 */
const calculateUnusedDayDiscount: UnusedDayDiscountCalculator = (
  availableBundles,
  selectedBundle,
  requestedDuration
) => {
  // Find all bundles in the same group/category
  const sameCategoryBundles = availableBundles.filter(
    bundle =>
      bundle.groups.some(group => selectedBundle.groups.includes(group)) &&
      bundle.countries.some(country => selectedBundle.countries.includes(country))
  );

  // Get all available durations, sorted
  const availableDurations = [...new Set(
    sameCategoryBundles.map(bundle => bundle.validityInDays)
  )].sort((a, b) => a - b);

  // Find the previous duration (closest duration less than requested)
  const previousDuration = availableDurations
    .filter(duration => duration < requestedDuration)
    .pop();

  if (!previousDuration) {
    return 0;
  }

  // Find the previous bundle
  const previousBundle = sameCategoryBundles.find(
    bundle => bundle.validityInDays === previousDuration
  );

  if (!previousBundle) {
    return 0;
  }

  // Calculate discount per day using the markup difference formula
  const priceDifference = selectedBundle.basePrice - previousBundle.basePrice;
  const daysDifference = selectedBundle.validityInDays - previousBundle.validityInDays;

  if (daysDifference <= 0) {
    return 0;
  }

  const discountPerDay = priceDifference / daysDifference;
  return Math.max(0, discountPerDay); // Ensure non-negative discount
};

// Provider component
interface BundleSelectorProviderProps {
  children: ReactNode;
}

export function BundleSelectorProvider({ children }: BundleSelectorProviderProps) {
  // UI State
  const [currentView, setCurrentView] = useState<ViewState>("main");
  const [pricing, setPricing] = useState<{ totalPrice?: number } | null>(null);
  const isMobile = useIsMobile({ tablet: true });
  const router = useRouter();

  // URL state management
  const [queryStates, setQueryStates] = useQueryStates(
    {
      numOfDays: parseAsInteger.withDefault(7),
      countryId: parseAsString.withDefault(""),
      tripId: parseAsString.withDefault(""),
      activeTab: parseAsStringLiteral(["countries", "trips"]).withDefault("countries"),
    },
    { shallow: true }
  );

  const { numOfDays, countryId, tripId, activeTab } = queryStates;

  // State setters that work with query states
  const setNumOfDays = (days: number) => {
    setQueryStates((state) => ({ ...state, numOfDays: days }));
  };

  const setCountryId = (id: string | null) => {
    setQueryStates((state) => ({ ...state, countryId: id || "" }));
  };

  const setTripId = (id: string | null) => {
    setQueryStates((state) => ({ ...state, tripId: id || "" }));
  };

  const setActiveTab = (tab: ActiveTab) => {
    setQueryStates((state) => ({ ...state, activeTab: tab }));
  };

  // Complex handlers
  const handleTabChange = (tab: ActiveTab) => {
    setActiveTab(tab);
  };

  const handleDestinationChange = (value: string) => {
    if (!value) {
      setQueryStates((state) => ({
        ...state,
        countryId: "",
        tripId: "",
      }));
      return;
    }
    const [type, id] = value.split("-");
    if (type === "country") {
      setQueryStates((state) => ({
        ...state,
        countryId: id as CountryISOCode,
        tripId: "",
      }));
    } else if (type === "trip") {
      setQueryStates((state) => ({
        ...state,
        tripId: id,
        countryId: "",
      }));
    }
  };

  const handlePurchase = (pricingData?: { totalPrice?: number } | null) => {
    // Use the passed pricing data or fall back to context pricing
    const effectivePricing = pricingData ?? pricing;
    const isReadyToPurchase = (countryId || tripId) && effectivePricing && effectivePricing.totalPrice !== undefined;
    if (!isReadyToPurchase) return;
    
    // Navigate to checkout with current parameters
    const params = new URLSearchParams();
    params.set("numOfDays", numOfDays.toString());
    if (countryId) params.set("countryId", countryId.toUpperCase());
    if (tripId) params.set("tripId", tripId);
    if (effectivePricing?.totalPrice) params.set("totalPrice", effectivePricing.totalPrice.toString());
    router.push(`/checkout?${params.toString()}`);
  };

  // Computed property: Check if pricing is valid
  const isPricingValid = useMemo(() => {
    return Boolean(
      numOfDays > 0 && 
      (countryId || tripId) && 
      pricing && 
      pricing.totalPrice !== undefined &&
      pricing.totalPrice > 0
    );
  }, [numOfDays, countryId, tripId, pricing]);

  const value: BundleSelectorContextValue = {
    // Bundle selector functions
    findOptimalBundle,
    calculateUnusedDayDiscount,
    
    // UI State
    currentView,
    setCurrentView,
    isMobile,
    
    // Query State
    numOfDays,
    setNumOfDays,
    countryId,
    setCountryId,
    tripId,
    setTripId,
    activeTab,
    setActiveTab,
    
    // Destination State (computed - null for now, will be set by parent component)
    destination: null,
    
    // Pricing State
    pricing,
    setPricing,
    isPricingValid,
    
    // Complex handlers
    handleTabChange,
    handleDestinationChange,
    handlePurchase,
  };

  return (
    <BundleSelectorContext.Provider value={value}>
      {children}
    </BundleSelectorContext.Provider>
  );
}

// Custom hook to use the context
export function useBundleSelector() {
  const context = useContext(BundleSelectorContext);
  
  if (!context) {
    throw new Error('useBundleSelector must be used within a BundleSelectorProvider');
  }
  
  return context;
}