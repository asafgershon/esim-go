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
import { CountUp } from "../ui/count-up";
import { CalendarIcon } from "./icons";
import { PricingSkeleton } from "./skeleton";
import { DestinationSelector } from "./destination-selector";
import { DestinationTabs } from "./destination-tabs";
import { SliderWithValue } from "@workspace/ui";

interface MainViewProps {
  pricing: {
    finalPrice?: number;
    currency?: string;
    days?: number;
    totalPrice?: number;
    hasDiscount?: boolean;
    discountAmount?: number;
  } | null;
  isLoadingPricing?: boolean;
  handlePurchase: () => void;
}

export function MainView({
  pricing,
  isLoadingPricing = false,
  handlePurchase,
}: MainViewProps) {
  // Get UI state and handlers from context
  const {
    activeTab,
    numOfDays,
    countryId,
    tripId,
    handleTabChange,
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
        <DestinationTabs activeTab={activeTab} onTabChange={handleTabChange} />

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
        {destination &&
          (isLoadingPricing ? (
            <PricingSkeleton />
          ) : pricing ? (
            <div className="bg-brand-white border border-brand-dark/10 rounded-lg md:rounded-[15px] p-3 md:p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span
                    className="text-xl md:text-2xl"
                    role="img"
                    aria-label={destination.name || undefined}
                  >
                    {destination.icon}
                  </span>
                  <div>
                    <h3 className="text-[14px] md:text-[18px] font-medium text-brand-dark">
                      {destination.name}
                    </h3>
                    <p className="text-[10px] md:text-[14px] text-brand-dark opacity-50">
                      {/* We can add tagline/description here if needed in the future */}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setCountryId(null);
                    setTripId(null);
                  }}
                  className="text-brand-dark opacity-50 hover:opacity-100 text-sm p-1 focus:outline-none focus:ring-2 focus:ring-brand-purple focus:ring-offset-2 rounded"
                  aria-label="הסר בחירת יעד"
                >
                  ✕
                </button>
              </div>

              {/* Pricing Summary */}
              <div className="pt-3 border-t border-brand-dark/10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] md:text-[14px] text-brand-dark opacity-50">
                    {pricing?.days} ימים ללא הגבלה
                  </span>
                  <span className="text-[14px] md:text-[18px] font-bold text-brand-dark">
                    <CountUp
                      key={`total-${countryId || tripId}-${numOfDays}`}
                      end={pricing?.totalPrice || 0}
                      decimals={2}
                      prefix="$"
                      duration={0.2}
                      preserveValue
                      fallback={
                        <span>${pricing?.totalPrice?.toFixed(2) || 0}</span>
                      }
                    />
                  </span>
                </div>
                {pricing?.hasDiscount && (
                  <div
                    className="text-center py-1 text-[8px] md:text-[10px] bg-green-50 rounded text-green-600"
                    role="status"
                    aria-live="polite"
                  >
                    חסכת ${pricing.discountAmount?.toFixed(2) || 0}!
                  </div>
                )}
              </div>
            </div>
          ) : null)}
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
