"use client";

import { useBatchPricingStream } from "@/hooks/useBatchPricingStream";
import { cn, Selector, SelectorCard } from "@workspace/ui";
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
    isNewCountryLoading,
    isStreamingData,
    hasDataForDay,
  } = useBatchPricingStream({
    regionId: tripId || undefined,
    countryId: countryId || undefined,
    requestedDays: numOfDays,
  });

  // Get pricing for current number of days
  const pricing = useMemo(() => {
    return getPricing(numOfDays);
  }, [getPricing, numOfDays]);

  // Check if we should show streaming UI (new country/trip change)
  const shouldShowStreamingUI = useMemo(() => {
    return Boolean(isNewCountryLoading || (pricingLoading && !hasDataForDay(numOfDays)));
  }, [isNewCountryLoading, pricingLoading, hasDataForDay, numOfDays]);

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
            shouldShowStreamingUI={shouldShowStreamingUI}
            isStreamingData={isStreamingData}
            hasDataForDay={hasDataForDay}
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
  className,
}: {
  id: string;
  ariaLabel: string;
  speed?: string;
  className?: string;
}) {
  return (
    <BundleSelectorRoot>
      <section
        id={id}
        aria-label={ariaLabel}
        className="relative -mt-[400px] z-20"
        data-speed={speed}
      >
        <div className={cn("mx-auto px-4", className)}>
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
