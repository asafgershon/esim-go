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
function BundleSelector({
  id,
  ariaLabel,
  speed,
}: {
  id: string;
  ariaLabel: string;
  speed?: string;
}) {
  return (
    <BundleSelectorRoot>
      <section
        id={id}
        aria-label={ariaLabel}
        className="relative -mt-[200px] z-20"
        data-speed={speed}
      >
        <div className="container mx-auto px-4 max-w-[880px]">
          <BundleSelectorInternal />
        </div>
      </section>
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
