"use client";

import { useBatchPricing } from "@/hooks/useBatchPricing";
import { Selector, SelectorCard } from "@workspace/ui";
import { useMemo, useEffect } from "react";
import { DatePickerView } from "./date-picker-view";
import { MainView } from "./main-view";
import { PricingSkeleton, SelectorSkeleton } from "./skeleton";
import { BundleSelectorRoot } from "./root";
import { useBundleSelector } from "@/contexts/bundle-selector-context";

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
    handlePurchase,
    setPricing,
  } = useBundleSelector();

  // Individual components now handle their own data fetching and error states

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
    return Boolean((countryId || tripId) && pricingLoading && !pricing);
  }, [countryId, tripId, pricingLoading, pricing]);

  // Sync pricing with context
  useEffect(() => {
    setPricing(pricing);
  }, [pricing, setPricing]);

  // Components now handle their own error recovery

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

  // Pricing error logging (components handle their own loading/error states now)
  if (pricingError) {
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
            isLoadingPricing={isLoadingPricing}
            handlePurchase={() => handlePurchase(pricing)}
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
