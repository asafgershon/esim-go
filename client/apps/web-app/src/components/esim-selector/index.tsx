"use client";

import type { CountryISOCode } from "@/lib/types";
import {
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
  useQueryState,
} from "nuqs";
import { useEffect, useMemo, useState } from "react";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useRouter } from "next/navigation";
import { EsimSkeleton } from "../esim-skeleton";
import { useCountries } from "@/hooks/useCountries";
import { useTrips } from "@/hooks/useTrips";
import { useBatchPricing } from "@/hooks/useBatchPricing";
import { Selector, SelectorCard } from "@workspace/ui";
import { MainView } from "./main-view";
import { DatePickerView } from "./date-picker-view";
import { ErrorState } from "./error-state";

export function EsimSelector() {
  const router = useRouter();
  
  // View state
  const [currentView, setCurrentView] = useState<'main' | 'datePicker'>('main');
  
  // URL state management
  const [numOfDays, setNumOfDays] = useQueryState(
    "numOfDays",
    parseAsInteger.withDefault(7)
  );
  const [countryId, setCountryId] = useQueryState("countryId", parseAsString);
  const [tripId, setTripId] = useQueryState("tripId", parseAsString);
  
  // Local state for UI
  const [activeTab, setActiveTab] = useQueryState(
    "activeTab",
    parseAsStringLiteral(["countries", "trips"]).withDefault("countries")
  );
  
  // Fetch countries and trips data from GraphQL
  const { 
    countries, 
    loading: countriesLoading, 
    error: countriesError 
  } = useCountries();
  
  const { 
    trips, 
    loading: tripsLoading, 
    error: tripsError 
  } = useTrips();
  
  // Loading state - show skeleton while countries or trips are loading or initial load
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setIsInitialLoading(false), 1200);
    return () => clearTimeout(timer);
  }, []);
  
  // Check if we have data - if we do, don't show skeleton even if refetching
  const hasData = countries.length > 0 || trips.length > 0;
  const isLoading = isInitialLoading || (!hasData && (countriesLoading || tripsLoading));
  
  // Error state
  const hasError = !isLoading && (countriesError || tripsError);
  const errorMessage = countriesError?.message || tripsError?.message;
  
  // Create combobox options based on active tab
  const comboboxOptions = useMemo(() => {
    if (activeTab === "countries") {
      return countries.map((country) => ({
        value: `country-${country.id}`,
        label: country.nameHebrew,
        icon: country.flag || undefined,
        keywords: [country.nameHebrew, country.name], // Hebrew and English names
      }));
    } else {
      return trips.map((trip) => ({
        value: `trip-${trip.id}`,
        label: trip.nameHebrew,
        icon: trip.icon,
        keywords: [trip.nameHebrew, trip.name], // Hebrew and English names
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
    error: pricingError 
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
    return selectedDestinationData && pricingLoading && !pricing;
  }, [selectedDestinationData, pricingLoading, pricing]);
  
  const handleTabChange = (tab: "countries" | "trips") => {
    setActiveTab(tab);
    // Clear selection when switching tabs
    setCountryId(null);
    setTripId(null);
  };
  
  const handleDestinationChange = (value: string) => {
    if (!value) {
      setCountryId(null);
      setTripId(null);
      return;
    }
    const [type, id] = value.split("-");
    if (type === "country") {
      setCountryId(id as CountryISOCode);
      setTripId(null);
    } else if (type === "trip") {
      setTripId(id);
      setCountryId(null);
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
    window.location.reload();
  };

  // Keyboard navigation support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape key to close mobile sheet or date picker
      if (e.key === 'Escape') {
        if (showMobileSheet) {
          setShowMobileSheet(false);
        } else if (currentView === 'datePicker') {
          setCurrentView('main');
        }
      }
      
      // Tab navigation between tabs
      if (e.key === 'Tab' && !e.shiftKey && document.activeElement?.id === 'trips-tab') {
        e.preventDefault();
        document.getElementById('countries-tab')?.focus();
      } else if (e.key === 'Tab' && e.shiftKey && document.activeElement?.id === 'countries-tab') {
        e.preventDefault();
        document.getElementById('trips-tab')?.focus();
      }
      
      // Arrow keys for slider when focused
      if (document.activeElement?.type === 'range') {
        if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
          e.preventDefault();
          setNumOfDays(Math.max(1, numOfDays - 1));
        } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
          e.preventDefault();
          setNumOfDays(Math.min(30, numOfDays + 1));
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showMobileSheet, currentView, numOfDays, setNumOfDays]);

  // Loading state
  if (isLoading) {
    return <EsimSkeleton />;
  }

  // Error state
  if (hasError) {
    return (
      <Selector>
        <SelectorCard>
          <ErrorState 
            message={errorMessage || "לא הצלחנו לטעון את רשימת היעדים. אנא נסו שוב."}
            onRetry={handleRetry}
          />
        </SelectorCard>
      </Selector>
    );
  }

  // Pricing error state (shown inline)
  if (pricingError && selectedDestinationData) {
    console.error('Pricing error:', pricingError);
  }

  return (
    <Selector>
      <SelectorCard>
        {currentView === 'datePicker' ? (
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