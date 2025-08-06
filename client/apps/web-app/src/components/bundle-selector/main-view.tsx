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
    isMobile,
    handleTabChange,
    setNumOfDays,
    setCurrentView,
    setCountryId,
    setTripId,
    isPricingValid,
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
        <h2 className="text-[18px] md:text-[30px] font-medium text-brand-dark">
          איזה כיף! לאן טסים? 🌏
        </h2>
      </SelectorHeader>

      <SelectorContent>
        {/* Tab Container */}
        <div className="bg-[#F1F5FA] rounded-[10px] md:rounded-2xl p-[2px] md:p-1">
          <div className="flex" role="tablist" aria-label="בחירת סוג יעד">
            <button
              onClick={() => handleTabChange("countries")}
              role="tab"
              aria-selected={activeTab === "countries"}
              aria-controls="countries-panel"
              id="countries-tab"
              className={`
                flex-1 h-[34px] md:h-[60px] text-[12px] md:text-[18px] 
                leading-[26px] md:leading-normal font-medium 
                rounded-lg md:rounded-xl transition-all duration-200
                focus:outline-none focus:ring-2 focus:ring-brand-purple focus:ring-offset-2
                ${
                  activeTab === "countries"
                    ? "bg-brand-dark text-brand-white"
                    : "text-brand-dark bg-transparent hover:bg-gray-100"
                }
              `}
            >
              מדינות
            </button>
            <button
              onClick={() => handleTabChange("trips")}
              role="tab"
              aria-selected={activeTab === "trips"}
              aria-controls="trips-panel"
              id="trips-tab"
              className={`
                flex-1 h-[34px] md:h-[60px] text-[12px] md:text-[18px] 
                leading-[26px] md:leading-normal font-medium 
                rounded-lg md:rounded-xl transition-all duration-200
                focus:outline-none focus:ring-2 focus:ring-brand-purple focus:ring-offset-2
                ${
                  activeTab === "trips"
                    ? "bg-brand-dark text-brand-white"
                    : "text-brand-dark bg-transparent hover:bg-gray-100"
                }
              `}
            >
              טיולים
            </button>
          </div>
        </div>

        {/* Destination Selection */}
        <DestinationSelector />

        {/* Days Selection */}
        <SelectorSection>
          <div className="flex items-center gap-[4px] md:gap-2 justify-start">
            <CalendarIcon className="w-3 h-3 md:w-[19px] md:h-[19px]" />
            <p className="text-[12px] md:text-[20px] leading-[26px] md:leading-normal text-brand-dark">
              כמה ימים?
            </p>
          </div>

          {/* Slider Container */}
          <div className="relative h-[21px] md:h-[38px]">
            {/* Track Background */}
            <div className="absolute top-[9px] md:top-[15px] bg-[rgba(10,35,46,0.05)] h-[3px] md:h-[9px] rounded-[50px] w-full" />

            {/* Track Fill */}
            <div
              className="absolute top-[9px] md:top-[15px] right-0 bg-brand-dark h-[3px] md:h-[9px] rounded-[50px] transition-all duration-150"
              style={{ width: `${(numOfDays / 30) * 100}%` }}
            />

            {/* Thumb */}
            <div
              className="absolute top-0 transition-all duration-150"
              style={{
                right: `calc(${(numOfDays / 30) * 100}% - ${
                  isMobile ? "10.5px" : "19px"
                })`,
              }}
            >
              <div
                className="
                w-[21px] h-[21px] md:w-[38px] md:h-[38px] bg-brand-white rounded-full 
                border border-brand-dark shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)]
                flex items-center justify-center cursor-pointer
              "
              >
                <span className="text-[8px] md:text-[16px] leading-[20px] font-bold text-brand-dark">
                  {numOfDays}
                </span>
              </div>
            </div>

            <input
              type="range"
              min="1"
              max="30"
              value={numOfDays}
              onChange={(e) => setNumOfDays(Number(e.target.value))}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              aria-label="בחר מספר ימים"
              aria-valuenow={numOfDays}
              aria-valuemin={1}
              aria-valuemax={30}
              aria-valuetext={`${numOfDays} ימים`}
            />
          </div>

          {/* Date Selection Link */}
          <div className="text-right">
            <button
              className="text-[10px] md:text-[12px] leading-[26px] font-bold text-brand-dark hover:text-brand-purple transition-colors cursor-pointer focus:outline-none focus:underline"
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
            <div className="bg-brand-white border border-[rgba(10,35,46,0.2)] rounded-lg md:rounded-[15px] p-3 md:p-4">
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
              <div className="pt-3 border-t border-[rgba(10,35,46,0.1)]">
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
          onClick={handlePurchase}
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
