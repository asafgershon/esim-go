"use client";

import { useBatchPricing } from "@/hooks/useBatchPricing";
import { useCountries } from "@/hooks/useCountries";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useTrips } from "@/hooks/useTrips";
import type { CountryISOCode } from "@/lib/types";
import { Selector, SelectorCard } from "@workspace/ui";
import { useRouter } from "next/navigation";
import {
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
  useQueryStates,
} from "nuqs";
import { useMemo, useState } from "react";
import { DatePickerView } from "./date-picker-view";
import { ErrorState } from "./error-state";
import { MainView } from "./main-view";
import { PricingSkeleton, SelectorSkeleton } from "./skeleton";

function BundleSelectorInternal() {
  const router = useRouter();

  // View state
  const [currentView, setCurrentView] = useState<"main" | "datePicker">("main");

  // URL state management
  const [queryStates, setQueryStates] = useQueryStates(
    {
      numOfDays: parseAsInteger.withDefault(7),
      countryId: parseAsString.withDefault(""),
      tripId: parseAsString.withDefault(""),
      activeTab: parseAsStringLiteral(["countries", "trips"]).withDefault(
        "countries"
      ),
    },
    { shallow: true }
  );

  const { numOfDays, countryId, tripId, activeTab } = queryStates;

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

  // Get selected destination details
  const selectedDestinationData = useMemo(() => {
    if (countryId) {
      return {
        type: "country" as const,
        data: countries.find((c) => c.id === countryId),
      };
    } else if (tripId) {
      return {
        type: "trip" as const,
        data: trips.find((t) => t.id === tripId),
      };
    }
    return null;
  }, [countryId, tripId, countries, trips]);

  // Calculate pricing using backend with batch loading
  const {
    getPricing,
    loading: pricingLoading,
    error: pricingError,
  } = useBatchPricing({
    regionId:
      selectedDestinationData?.type === "trip"
        ? selectedDestinationData.data?.id
        : undefined,
    countryId:
      selectedDestinationData?.type === "country"
        ? selectedDestinationData.data?.id
        : undefined,
  });

  // Get pricing for current number of days
  const pricing = useMemo(() => {
    return getPricing(numOfDays);
  }, [getPricing, numOfDays]);

  // Check if pricing is loading for current selection
  const isLoadingPricing = useMemo(() => {
    return Boolean(selectedDestinationData && pricingLoading && !pricing);
  }, [selectedDestinationData, pricingLoading, pricing]);

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

  const isReadyToPurchase = (countryId || tripId) && pricing && !pricingError;

  const handlePurchase = () => {
    if (!isReadyToPurchase) return;
    // Navigate to checkout with current parameters
    const params = new URLSearchParams();
    params.set("numOfDays", numOfDays.toString());
    if (countryId) params.set("countryId", countryId.toUpperCase());
    if (tripId) params.set("tripId", tripId);
    if (pricing?.totalPrice)
      params.set("totalPrice", pricing.totalPrice.toString());
    router.push(`/checkout?${params.toString()}`);
  };

  const isMobile = useIsMobile();
  const [showMobileSheet, setShowMobileSheet] = useState(false);

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
  if (pricingError && selectedDestinationData) {
    console.error("Pricing error:", pricingError);
  }

  const handleTabChange = (tab: "countries" | "trips") => {
    setQueryStates((state) => ({
      ...state,
      activeTab: tab,
    }));
  };

  const setNumOfDays = (days: number) => {
    setQueryStates((state) => ({
      ...state,
      numOfDays: days,
    }));
  };

  const setCountryId = (id: string | null) => {
    setQueryStates((state) => ({
      ...state,
      countryId: id || "",
    }));
  };

  const setTripId = (id: string | null) => {
    setQueryStates((state) => ({
      ...state,
      tripId: id || "",
    }));
  };

  return (
    <Selector>
      <SelectorCard>
        {currentView === "datePicker" ? (
          <DatePickerView setCurrentView={setCurrentView} />
        ) : (
          <MainView
            activeTab={activeTab}
            numOfDays={numOfDays}
            selectedDestinationData={selectedDestinationData}
            pricing={pricing}
            comboboxOptions={comboboxOptions}
            countryId={countryId}
            tripId={tripId}
            isMobile={isMobile}
            showMobileSheet={showMobileSheet}
            footerVisible={true} // Always show footer
            isLoadingPricing={isLoadingPricing}
            handleTabChange={handleTabChange}
            handleDestinationChange={handleDestinationChange}
            setNumOfDays={setNumOfDays}
            setCurrentView={setCurrentView}
            setShowMobileSheet={setShowMobileSheet}
            setCountryId={setCountryId}
            setTripId={setTripId}
            handlePurchase={handlePurchase}
          />
        )}
      </SelectorCard>
    </Selector>
  );
}

export const BundleSelector = Object.assign(BundleSelectorInternal, {
  Skeleton: SelectorSkeleton,
  PricingSkeleton,
});
