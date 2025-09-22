"use client";

import { useBundleSelector } from "@/contexts/bundle-selector-context";
import type { Destination } from "@/contexts/bundle-selector-context";
import { useCountries } from "@/hooks/useCountries";
import { useTrips } from "@/hooks/useTrips";
import { useMemo } from "react";
import {
  SelectorAction,
  SelectorButton,
  SelectorContent,
  SelectorHeader,
  SelectorSection,
} from "@workspace/ui";
import { CalendarIcon } from "./icons";
import { DestinationSelector } from "./destination-selector";
// import { DestinationTabs } from "./destination-tabs";
import { Pricing } from "./pricing";
import { SliderWithValue } from "@workspace/ui";

interface MainViewProps {
  pricing: {
    finalPrice?: number;
    currency?: string;
    days?: number;
    totalPrice?: number;
    hasDiscount?: boolean;
    discountAmount?: number;
    pricingSteps?: Array<{
      order: number;
      name: string;
      priceBefore: number;
      priceAfter: number;
      impact: number;
      ruleId?: string | null;
      metadata?: Record<string, unknown> | null;
      timestamp?: number | null;
    }> | null;
  } | null;
  shouldShowStreamingUI?: boolean;
  isStreamingData?: boolean;
  hasDataForDay?: (day: number) => boolean;
  handlePurchase: () => void;
}

export function MainView({
  pricing,
  shouldShowStreamingUI = false,
  isStreamingData = false,
  hasDataForDay,
  handlePurchase,
}: MainViewProps) {
  // Get UI state and handlers from context
  const {
    // activeTab,
    numOfDays,
    countryId,
    tripId,
    // handleTabChange,
    setNumOfDays,
    setCurrentView,
    setCountryId,
    setTripId,
    isPricingValid,
    triggerDestinationSelectorFocus,
  } = useBundleSelector();

  // Fetch data for destination display
  const { countries = [] } = useCountries();
  const { trips = [] } = useTrips();

  // Compute destination for display in pricing section
  const destination: Destination | null = useMemo(() => {
    if (countryId) {
      const country = countries.find((c) => c.id === countryId);
      if (country) {
        return {
          id: country.iso.toLowerCase(),
          name: country.nameHebrew || country.name || "",
          icon: country.flag || "",
        };
      }
    } else if (tripId) {
      const trip = trips.find((t) => t.id === tripId);
      if (trip) {
        return {
          id: trip.id,
          name: trip.nameHebrew || trip.name || "",
          icon: trip.icon || "",
        };
      }
    }
    return null;
  }, [countryId, tripId, countries, trips]);

  return (
    <>
      <SelectorHeader>
        <h2 className="text-2xl text-center font-medium text-brand-dark">
          איזה כיף! לאן טסים? 🌏
        </h2>
      </SelectorHeader>

      <SelectorContent>
        {/* Tab Container with smooth sliding transition */}
        {/* <DestinationTabs activeTab={activeTab} onTabChange={handleTabChange} /> */}

        {/* Destination Selection */}
        <DestinationSelector />

        {/* Days Selection */}
        <SelectorSection>
          <div className="flex items-center gap-[4px] md:gap-2 justify-start">
            <CalendarIcon className="w-3 h-3 md:w-[19px] md:h-[19px]" />
            <p className="text-base md:text-xl leading-[26px] md:leading-normal text-brand-dark">
              כמה ימים?
            </p>
          </div>

          {/* Slider Container */}
          <div className="relative h-[21px] md:h-[38px]">
            <SliderWithValue
              dir={"rtl"}
              value={[numOfDays]}
              onValueChange={(value) => setNumOfDays(value[0])}
              min={1}
              max={30}
            />
          </div>

          {/* Date Selection Link */}
          <div className="text-right">
            <button
              className="text-sm md:text-[12px] leading-[26px] font-bold text-brand-dark hover:text-brand-purple transition-colors cursor-pointer focus:outline-none focus:underline"
              onClick={() => setCurrentView("datePicker")}
              aria-label="עבור לבחירת תאריכים מדויקים"
            >
              לבחירת תאריכים מדויקים »
            </button>
          </div>
        </SelectorSection>

        {/* Selected Destination and Pricing */}
        {destination && (
          <Pricing
            destination={destination}
            pricing={pricing}
            shouldShowStreamingUI={shouldShowStreamingUI}
            isStreamingData={isStreamingData}
            hasDataForDay={hasDataForDay}
            countryId={countryId}
            tripId={tripId}
            numOfDays={numOfDays}
            onRemoveDestination={() => {
              setCountryId(null);
              setTripId(null);
            }}
          />
        )}
      </SelectorContent>

      {/* Purchase Button - Always visible */}
      <SelectorAction className="mt-5">
        <SelectorButton
          onClick={() => {
            // Always trigger the destination selector to open
            triggerDestinationSelectorFocus();

            // If valid pricing, also proceed with purchase
            if (isPricingValid) {
              handlePurchase();
            }
          }}
          aria-label={
            isPricingValid ? "המשך לרכישת חבילת eSIM" : "בחר יעד לצפייה בחבילות"
          }
          variant={isPricingValid ? "brand-success" : undefined}
          emphasized={isPricingValid}
        >
          {isPricingValid ? "לרכישת החבילה" : "לצפייה בחבילה המשתלמת ביותר"}
        </SelectorButton>
      </SelectorAction>
    </>
  );
}
