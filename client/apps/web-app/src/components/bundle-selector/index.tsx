"use client";

import { useBatchPricing } from "@/hooks/useBatchPricing";
import { useCountries } from "@/hooks/useCountries";
import { useTrips } from "@/hooks/useTrips";
import { Selector, SelectorCard } from "@workspace/ui";
import { useMemo, useEffect } from "react";
import { DatePickerView } from "./date-picker-view";
import { ErrorState } from "./error-state";
import { MainView } from "./main-view";
import { PricingSkeleton, SelectorSkeleton } from "./skeleton";
import { BundleSelectorRoot } from "./root";
import { useBundleSelector } from "@/contexts/bundle-selector-context";
import type { Destination } from "@/contexts/bundle-selector-context";

// Re-export the hook and types for convenience
export { useBundleSelector } from "@/contexts/bundle-selector-context";
export type { Destination } from "@/contexts/bundle-selector-context";

function BundleSelectorInternal() {
  // Get UI state from context
  const {
    currentView,
    numOfDays,
    countryId,
    tripId,
    activeTab,
    handlePurchase,
    setPricing,
  } = useBundleSelector();

  // Fetch countries and trips data from GraphQL
  const {
    countries = [],
    loading: countriesLoading,
    error: countriesError,
    refetch: refetchCountries,
  } = useCountries();

  const {
    trips = [],
    loading: tripsLoading,
    error: tripsError,
    refetch: refetchTrips,
  } = useTrips();

  // Loading state - show skeleton while countries or trips are loading or initial load
  const isInitialLoading = useMemo(() => {
    return (
      (countriesLoading || tripsLoading) && !countries.length && !trips.length
    );
  }, [countriesLoading, tripsLoading, countries.length, trips.length]);

  // Check if we have data - if we do, don't show skeleton even if refetching
  const isLoading = isInitialLoading || countriesLoading || tripsLoading;

  // Error state
  const hasError = !isLoading && (countriesError || tripsError);
  const errorMessage = countriesError?.message || tripsError?.message;

  // Create combobox options based on active tab
  const comboboxOptions = useMemo(() => {
    if (activeTab === "countries") {
      return countries.map((country) => ({
        value: `country-${country.id}`,
        label: country.nameHebrew || country.name || "",
        icon: country.flag || undefined,
        keywords: [country.nameHebrew, country.name].filter(
          Boolean
        ) as string[], // Hebrew and English names
      }));
    } else {
      return trips.map((trip) => ({
        value: `trip-${trip.id}`,
        label: trip.nameHebrew || trip.name || "",
        icon: trip.icon,
        keywords: [trip.nameHebrew, trip.name].filter(Boolean) as string[], // Hebrew and English names
      }));
    }
  }, [activeTab, countries, trips]);

  // Compute destination from current selection
  const destination: Destination | null = useMemo(() => {
    if (countryId) {
      const country = countries.find((c) => c.id === countryId);
      if (country) {
        return {
          id: country.iso.toLowerCase(), // ISO code for countries
          name: country.nameHebrew || country.name || "",
          icon: country.flag || "",
        };
      }
    } else if (tripId) {
      const trip = trips.find((t) => t.id === tripId);
      if (trip) {
        return {
          id: trip.id, // Region ID for trips
          name: trip.nameHebrew || trip.name || "",
          icon: trip.icon || "",
        };
      }
    }
    return null;
  }, [countryId, tripId, countries, trips]);

  // Calculate pricing using backend with batch loading
  const {
    getPricing,
    loading: pricingLoading,
    error: pricingError,
  } = useBatchPricing({
    regionId: tripId || undefined,
    countryId: countryId || undefined,
  });

  // Get pricing for current number of days
  const pricing = useMemo(() => {
    return getPricing(numOfDays);
  }, [getPricing, numOfDays]);

  // Check if pricing is loading for current selection
  const isLoadingPricing = useMemo(() => {
    return Boolean(destination && pricingLoading && !pricing);
  }, [destination, pricingLoading, pricing]);

  // Sync pricing with context
  useEffect(() => {
    setPricing(pricing);
  }, [pricing, setPricing]);

  // Handle retry
  const handleRetry = () => {
    refetchCountries();
    refetchTrips();
  };

  // // Keyboard navigation support
  // useEffect(() => {
  //   const handleKeyDown = (e: KeyboardEvent) => {
  //     // Escape key to close mobile sheet or date picker
  //     if (e.key === "Escape") {
  //       if (showMobileSheet) {
  //         setShowMobileSheet(false);
  //       } else if (currentView === "datePicker") {
  //         setCurrentView("main");
  //       }
  //     }

  //     // Tab navigation between tabs
  //     if (
  //       e.key === "Tab" &&
  //       !e.shiftKey &&
  //       document.activeElement?.id === "trips-tab"
  //     ) {
  //       e.preventDefault();
  //       document.getElementById("countries-tab")?.focus();
  //     } else if (
  //       e.key === "Tab" &&
  //       e.shiftKey &&
  //       document.activeElement?.id === "countries-tab"
  //     ) {
  //       e.preventDefault();
  //       document.getElementById("trips-tab")?.focus();
  //     }

  //     // Arrow keys for slider when focused
  //     if ((document.activeElement as HTMLInputElement)?.type === "range") {
  //       if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
  //         e.preventDefault();
  //         setQueryStates((state) => ({
  //           ...state,
  //           numOfDays: Math.max(1, state.numOfDays - 1),
  //         }));
  //       } else if (e.key === "ArrowRight" || e.key === "ArrowUp") {
  //         e.preventDefault();
  //         setQueryStates((state) => ({
  //           ...state,
  //           numOfDays: Math.min(30, state.numOfDays + 1),
  //         }));
  //       }
  //     }
  //   };

  //   window.addEventListener("keydown", handleKeyDown);
  //   return () => window.removeEventListener("keydown", handleKeyDown);
  // }, [showMobileSheet, currentView, numOfDays, setQueryStates]);

  // Loading state
  if (isLoading) {
    return <SelectorSkeleton />;
  }

  // Error state
  if (hasError) {
    return (
      <Selector>
        <SelectorCard>
          <ErrorState
            message={
              errorMessage || "לא הצלחנו לטעון את רשימת היעדים. אנא נסו שוב."
            }
            onRetry={handleRetry}
          />
        </SelectorCard>
      </Selector>
    );
  }

  // Pricing error state (shown inline)
  if (pricingError && destination) {
    console.error("Pricing error:", pricingError);
  }


  return (
    <Selector>
      <SelectorCard>
        {currentView === "datePicker" ? (
          <DatePickerView />
        ) : (
          <MainView
            pricing={pricing}
            comboboxOptions={comboboxOptions}
            isLoadingPricing={isLoadingPricing}
            handlePurchase={() => handlePurchase(pricing)}
            destination={destination}
          />
        )}
      </SelectorCard>
    </Selector>
  );
}

// Main BundleSelector component that includes the provider
function BundleSelector() {
  return (
    <BundleSelectorRoot>
      <BundleSelectorInternal />
    </BundleSelectorRoot>
  );
}

// Export with subcomponents
export default Object.assign(BundleSelector, {
  Root: BundleSelectorRoot,
  Skeleton: SelectorSkeleton,
  PricingSkeleton,
});

// Also export as named export for backwards compatibility
export { BundleSelector };
