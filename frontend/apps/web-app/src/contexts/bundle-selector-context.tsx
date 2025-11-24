"use client";

import type { Bundle } from "@/__generated__/types";
import {
  useSelectorQueryState,
  type ActiveTab,
} from "@/hooks/useSelectorQueryState";
import type { CountryISOCode } from "@/lib/types";
import { useHasScrollContext, useScrollContext } from "@workspace/ui";
import { useRouter } from "next/navigation";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

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

  // Query State (from URL)
  numOfDays: number;
  setNumOfDays: (days: number) => void;
  countryId: string;
  setCountryId: (id: string | null) => void;
  tripId: string;
  setTripId: (id: string | null) => void;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;

  numOfEsims: number;
  setNumOfEsims: (n: number) => void;

  // Date State
  startDate: Date | null;
  setStartDate: (date: Date | null) => void;
  endDate: Date | null;
  setEndDate: (date: Date | null) => void;

  // Destination State (will be computed from queryStates in the component that has access to countries/trips data)
  destination: Destination | null;

  // Pricing State
  pricing: { totalPrice?: number } | null;
  setPricing: (pricing: { totalPrice?: number } | null) => void;
  isPricingValid: boolean;

  // Destination selector control
  shouldFocusDestinationSelector: boolean;
  setShouldFocusDestinationSelector: (should: boolean) => void;
  triggerDestinationSelectorFocus: () => void;

  // Complex handlers
  handleTabChange: (tab: ActiveTab) => void;
  handleDestinationChange: (value: string) => void;
  handlePurchase: (pricing?: { totalPrice?: number } | null) => void;
}

// Create the context
const BundleSelectorContext = createContext<BundleSelectorContextValue | null>(
  null
);

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
      if (
        !smallestSuitable ||
        bundle.validityInDays < smallestSuitable.validityInDays
      ) {
        smallestSuitable = bundle;
      }
    }

    // Track largest bundle overall
    if (
      !largestBundle ||
      bundle.validityInDays > largestBundle.validityInDays
    ) {
      secondLargest = largestBundle;
      largestBundle = bundle;
    } else if (
      !secondLargest ||
      bundle.validityInDays > secondLargest.validityInDays
    ) {
      secondLargest = bundle;
    }
  }

  // Return exact match if found
  if (exactMatch) {
    return {
      selectedBundle: exactMatch,
      previousBundle: undefined,
    };
  }

  // Return smallest suitable bundle if found
  if (smallestSuitable) {
    // Find the largest bundle smaller than selected in another pass - still O(n)
    let previousBundle = undefined;
    for (const bundle of bundles) {
      if (bundle.validityInDays < smallestSuitable.validityInDays) {
        if (
          !previousBundle ||
          bundle.validityInDays > previousBundle.validityInDays
        ) {
          previousBundle = bundle;
        }
      }
    }

    return {
      selectedBundle: smallestSuitable,
      previousBundle,
    };
  }

  if (!largestBundle) {
    throw new Error("No bundle found");
  }

  return {
    selectedBundle: largestBundle,
    previousBundle: largestBundle === largestBundle ? secondLargest : undefined,
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
    (bundle) =>
      bundle.groups.some((group) => selectedBundle.groups.includes(group)) &&
      bundle.countries.some((country) =>
        selectedBundle.countries.includes(country)
      )
  );

  // Get all available durations, sorted
  const availableDurations = [
    ...new Set(sameCategoryBundles.map((bundle) => bundle.validityInDays)),
  ].sort((a, b) => a - b);

  // Find the previous duration (closest duration less than requested)
  const previousDuration = availableDurations
    .filter((duration) => duration < requestedDuration)
    .pop();

  if (!previousDuration) {
    return 0;
  }

  // Find the previous bundle
  const previousBundle = sameCategoryBundles.find(
    (bundle) => bundle.validityInDays === previousDuration
  );

  if (!previousBundle) {
    return 0;
  }

  // Calculate discount per day using the markup difference formula
  const priceDifference = selectedBundle.basePrice - previousBundle.basePrice;
  const daysDifference =
    selectedBundle.validityInDays - previousBundle.validityInDays;

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

/**
 * BundleSelectorProvider - Context provider for bundle selector state
 *
 * Manages bundle selection logic, UI state, and URL query parameters.
 * Automatically scrolls to selector when destination changes.
 *
 * Features:
 * - Syncs state with URL query parameters
 * - Manages pricing calculations and bundle selection
 * - Handles tab switching between countries and trips
 * - Auto-scrolls to selector on destination change
 *
 * @example
 * ```tsx
 * <BundleSelectorProvider>
 *   <BundleSelector />
 * </BundleSelectorProvider>
 * ```
 */
export function BundleSelectorProvider({
  children,
}: BundleSelectorProviderProps) {
  // UI State
  const [currentView, setCurrentView] = useState<ViewState>("main");
  const [pricing, setPricing] = useState<{ totalPrice?: number } | null>(null);
  const [shouldFocusDestinationSelector, setShouldFocusDestinationSelector] =
    useState(false);
  const [numOfEsims, setNumOfEsims] = useState(1);
  const router = useRouter();

  // Date State
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  // URL state management using custom hook
  const {
    numOfDays,
    countryId,
    tripId,
    activeTab,
    setNumOfDays,
    setCountryId,
    setTripId,
    setActiveTab,
    setQueryStates,
  } = useSelectorQueryState();

  // Complex handlers
  const handleTabChange = (tab: ActiveTab) => {
    setActiveTab(tab);
  };

  const handleDestinationChange = (value: string) => {
    if (!value) {
      setQueryStates({
        countryId: "",
        tripId: "",
      });
      return;
    }
    const [type, id] = value.split("-");
    if (type === "country") {
      setQueryStates({
        countryId: id as CountryISOCode,
        tripId: "",
      });
    } else if (type === "trip") {
      setQueryStates({
        tripId: id,
        countryId: "",
      });
    }
  };

  // Check if we have ScrollContext available
  const hasScrollContext = useHasScrollContext();
  // TODO: FIX THIS
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const scrollContext = hasScrollContext ? useScrollContext() : null;

  // Scroll to selector when country/trip changes
  useEffect(() => {
    if ((countryId || tripId) && scrollContext) {
      // Small delay to ensure the UI has updated
      setTimeout(() => {
        scrollContext.scrollTo("#esim-selector", {
          duration: 0.8,
          offset: 100, // Additional offset to account for header and visual comfort
        });
      }, 100);
    }
  }, [countryId, tripId, scrollContext]);

  const handlePurchase = (pricingData?: { totalPrice?: number } | null) => {
    // Use the passed pricing data or fall back to context pricing
    const effectivePricing = pricingData ?? pricing;
    const isReadyToPurchase =
      (countryId || tripId) &&
      effectivePricing &&
      effectivePricing.totalPrice !== undefined;
    if (!isReadyToPurchase) return;

    // Navigate to checkout with current parameters
    const params = new URLSearchParams();
    params.set("numOfDays", numOfDays.toString());
    if (countryId) params.set("countryId", countryId.toUpperCase());
    if (numOfEsims) params.set("numOfEsims", numOfEsims.toString());
    if (tripId) params.set("tripId", tripId);
    if (effectivePricing?.totalPrice)
      params.set("totalPrice", effectivePricing.totalPrice.toString());
    console.log("[CLIENT] pushing checkout params:", Object.fromEntries(params.entries()));
    router.push(`/checkout?${params.toString()}`);
  };

  const triggerDestinationSelectorFocus = () => {
    setShouldFocusDestinationSelector(true);
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

    // Query State
    numOfDays,
    setNumOfDays,
    countryId,
    setCountryId,
    tripId,
    setTripId,
    activeTab,
    setActiveTab,

    numOfEsims,
    setNumOfEsims,

    // Date State
    startDate,
    setStartDate,
    endDate,
    setEndDate,

    // Destination State (computed - null for now, will be set by parent component)
    destination: null,

    // Pricing State
    pricing,
    setPricing,
    isPricingValid,

    // Destination selector control
    shouldFocusDestinationSelector,
    setShouldFocusDestinationSelector,
    triggerDestinationSelectorFocus,

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
    throw new Error(
      "useBundleSelector must be used within a BundleSelectorProvider"
    );
  }

  return context;
}
