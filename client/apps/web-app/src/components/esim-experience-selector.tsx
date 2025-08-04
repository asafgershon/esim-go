"use client";

import { ComboboxOption } from "@workspace/ui";
import { FuzzyCombobox } from "@workspace/ui";
import { Selector, SelectorCard, SelectorHeader, SelectorAction, SelectorButton } from "@workspace/ui";
import type { CountryISOCode } from "@/lib/types";
import { AnimatePresence, motion } from "framer-motion";
import {
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
  useQueryState,
} from "nuqs";
import { lazy, useEffect, useMemo, useState, Suspense } from "react";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useRouter } from "next/navigation";
import { EsimSkeleton } from "./esim-skeleton";
import { EnhancedCountry, useCountries } from "@/hooks/useCountries";
import { EnhancedTrip, useTrips } from "@/hooks/useTrips";
import { useBatchPricing } from "@/hooks/useBatchPricing";

const CountUp = lazy(() => import("react-countup"));

// Lazy load the mobile bottom sheet
const MobileDestinationDrawer = lazy(() => import("./mobile-destination-drawer"));

// SVG Icons as components for pixel-perfect rendering
const CalendarIcon = () => (
  <svg width="12" height="11" viewBox="0 0 12 11" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4.125 0.5V2M7.875 0.5V2M1.5 4.025H10.5M10.5 3.5V8C10.5 9.5 9.75 10.5 7.875 10.5H4.125C2.25 10.5 1.5 9.5 1.5 8V3.5C1.5 2 2.25 1 4.125 1H7.875C9.75 1 10.5 2 10.5 3.5Z" stroke="#0A232E" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ChevronsUpDownIcon = () => (
  <svg width="11" height="6" viewBox="0 0 11 6" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 1L5.5 5.5L1 1" stroke="#0A232E" strokeOpacity="0.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ArrowIcon = () => (
  <svg width="14" height="8" viewBox="0 0 14 8" fill="none" xmlns="http://www.w3.org/2000/svg" className="rotate-180">
    <path d="M0.646447 3.64645C0.451184 3.84171 0.451184 4.15829 0.646447 4.35355L3.82843 7.53553C4.02369 7.7308 4.34027 7.7308 4.53553 7.53553C4.7308 7.34027 4.7308 7.02369 4.53553 6.82843L1.70711 4L4.53553 1.17157C4.7308 0.976311 4.7308 0.659728 4.53553 0.464466C4.34027 0.269204 4.02369 0.269204 3.82843 0.464466L0.646447 3.64645ZM14 3.5L1 3.5V4.5L14 4.5V3.5Z" fill="#FEFEFE"/>
  </svg>
);

export function EsimExperienceSelector() {
  const router = useRouter();
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
  const { countries, loading: countriesLoading } = useCountries();
  const { trips, loading: tripsLoading } = useTrips();
  // Loading state - show skeleton while countries or trips are loading or initial load
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setIsInitialLoading(false), 1200);
    return () => clearTimeout(timer);
  }, []);
  
  // Check if we have data - if we do, don't show skeleton even if refetching
  const hasData = countries.length > 0 || trips.length > 0;
  const isLoading = isInitialLoading || (!hasData && (countriesLoading || tripsLoading));
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
  const { getPricing, isReady } = useBatchPricing({
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
  const isReadyToPurchase = (countryId || tripId);
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
  const [footerVisible, setFooterVisible] = useState(false);
  const [firstSelectionMade, setFirstSelectionMade] = useState(false);
  const [, setPendingFooter] = useState(false);
  // Effect: On mobile, delay footer appearance after first selection
  useEffect(() => {
    if (!isMobile) {
      setFooterVisible(!!isReadyToPurchase);
      setFirstSelectionMade(false);
      setPendingFooter(false);
      return;
    }
    if (!isReadyToPurchase) {
      setFooterVisible(false);
      setFirstSelectionMade(false);
      setPendingFooter(false);
      return;
    }
    // On mobile, first selection: delay
    if (isReadyToPurchase && !firstSelectionMade) {
      setPendingFooter(true);
      const timeout = setTimeout(() => {
        setFooterVisible(true);
        setFirstSelectionMade(true);
        setPendingFooter(false);
      }, 400);
      return () => clearTimeout(timeout);
    }
    // On mobile, subsequent selections: show immediately
    if (isReadyToPurchase && firstSelectionMade) {
      setFooterVisible(true);
      setPendingFooter(false);
    }
  }, [isReadyToPurchase, isMobile, firstSelectionMade]);
  // Only render after all hooks
  if (isLoading) {
    return <EsimSkeleton />;
  }

  return (
    <Selector>
      <SelectorCard>
        <SelectorHeader>
          <h2 className="text-lg md:text-3xl font-medium text-brand-dark">
            איזה כיף! לאן טסים? 🌏
          </h2>
        </SelectorHeader>

        {/* Content */}
        <div>
          {/* Tab Container */}
          <div className="bg-[#F1F5FA] rounded-[10px] md:rounded-2xl p-[2px] md:p-1 mb-4">
            <div className="flex">
              <button
                onClick={() => handleTabChange("trips")}
                className={`
                  flex-1 h-[34px] md:h-[60px] text-[12px] md:text-lg leading-[26px] md:leading-normal font-medium rounded-lg transition-all duration-200
                  ${activeTab === "trips" 
                    ? "bg-[#0A232E] text-[#FEFEFE]" 
                    : "text-[#0A232E] bg-transparent"
                  }
                `}
              >
                טיולים
              </button>
              <button
                onClick={() => handleTabChange("countries")}
                className={`
                  flex-1 h-[34px] md:h-[60px] text-[12px] md:text-lg leading-[26px] md:leading-normal font-medium rounded-lg transition-all duration-200
                  ${activeTab === "countries" 
                    ? "bg-[#0A232E] text-[#FEFEFE]" 
                    : "text-[#0A232E] bg-transparent"
                  }
                `}
              >
                מדינות
              </button>
            </div>
          </div>

          {/* Destination Selection */}
          <div className="mb-5">
            <label className="block text-[12px] md:text-xl leading-[26px] md:leading-normal text-[#0A232E] mb-2 md:mb-4">
              לאן נוסעים?
            </label>
            {isMobile ? (
              <div className="relative">
                <div className="
                  bg-[#FEFEFE] border border-[rgba(10,35,46,0.2)] rounded-lg 
                  h-[34px] px-3 flex items-center cursor-pointer
                  hover:border-[#535FC8] transition-colors relative
                ">
                  <span className="text-[#0A232E] text-[12px] leading-[26px] opacity-50">
                    {selectedDestinationData?.data?.nameHebrew || "לאן נוסעים?"}
                  </span>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <ChevronsUpDownIcon />
                  </div>
                </div>
                {/* Overlay button to open sheet */}
                <div
                  className="absolute inset-0 z-10 cursor-pointer"
                  onClick={(e) => {
                    e.preventDefault();
                    setShowMobileSheet(true);
                  }}
                />
                <Suspense fallback={<div>...</div>}>
                  {showMobileSheet && (
                    <MobileDestinationDrawer
                      options={comboboxOptions as ComboboxOption[]}
                      value={
                        countryId
                          ? `country-${countryId}`
                          : tripId
                          ? `trip-${tripId}`
                          : ""
                      }
                      onValueChange={(v) => {
                        handleDestinationChange(v);
                        setShowMobileSheet(false);
                      }}
                      onClose={() => setShowMobileSheet(false)}
                      isOpen={showMobileSheet}
                    />
                  )}
                </Suspense>
              </div>
            ) : (
              <div className="relative">
                <FuzzyCombobox
                  options={comboboxOptions as ComboboxOption[]}
                  value={
                    countryId
                      ? `country-${countryId}`
                      : tripId
                      ? `trip-${tripId}`
                      : ""
                  }
                  onValueChange={handleDestinationChange}
                  placeholder="לאן נוסעים?"
                  searchPlaceholder="חפש..."
                  emptyMessage="לא נמצאו תוצאות"
                  className="[&>button]:bg-[#FEFEFE] [&>button]:border [&>button]:border-[rgba(10,35,46,0.2)] [&>button]:rounded-lg [&>button]:h-[34px] [&>button]:hover:border-[#535FC8] [&>button]:transition-colors [&>button]:text-[12px]"
                />
              </div>
            )}
          </div>

          {/* Days Selection */}
          <div className="mb-4">
            <div className="flex items-center gap-[4px] mb-2 md:mb-4">
              <CalendarIcon />
              <p className="text-[12px] md:text-xl leading-[26px] md:leading-normal text-[#0A232E]">כמה ימים?</p>
            </div>

            {/* Slider Container */}
            <div className="relative h-[21px]">
              {/* Track Background */}
              <div className="absolute top-[9px] bg-[rgba(10,35,46,0.05)] h-[3px] rounded-[50px] w-full" />
              
              {/* Track Fill */}
              <div 
                className="absolute top-[9px] right-0 bg-[#0A232E] h-[3px] rounded-[50px] transition-all duration-150"
                style={{ width: `${(numOfDays / 30) * 100}%` }}
              />
              
              {/* Thumb */}
              <div 
                className="absolute top-0 transition-all duration-150"
                style={{ right: `calc(${(numOfDays / 30) * 100}% - 10.5px)` }}
              >
                <div className="
                  w-[21px] h-[21px] bg-[#FEFEFE] rounded-full 
                  border border-[#0A232E] shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)]
                  flex items-center justify-center cursor-pointer
                ">
                  <span className="text-[8px] leading-[20px] font-bold text-[#0A232E]">{numOfDays}</span>
                </div>
              </div>

              <input
                type="range"
                min="1"
                max="30"
                value={numOfDays}
                onChange={(e) => setNumOfDays(Number(e.target.value))}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
            </div>

            {/* Date Selection Link */}
            <div className="text-right">
              <button className="text-[10px] leading-[26px] font-bold text-[#0A232E] hover:text-[#535FC8] transition-colors">
                לבחירת תאריכים מדויקים »
              </button>
            </div>
          </div>

          {/* Selected Destination and Pricing */}
          {selectedDestinationData && pricing && (
            <div className="bg-[#FEFEFE] border border-[rgba(10,35,46,0.2)] rounded-lg p-3 mb-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">
                    {selectedDestinationData.type === "country"
                      ? (selectedDestinationData.data as EnhancedCountry)?.flag || ""
                      : (selectedDestinationData.data as EnhancedTrip)?.icon || ""}
                  </span>
                  <div>
                    <h3 className="text-[14px] font-medium text-[#0A232E]">
                      {selectedDestinationData.data?.nameHebrew}
                    </h3>
                    <p className="text-[10px] text-[#0A232E] opacity-50">
                      {selectedDestinationData.type === "country"
                        ? (selectedDestinationData.data as EnhancedCountry)?.tagline
                        : (selectedDestinationData.data as EnhancedTrip)?.description}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setCountryId(null);
                    setTripId(null);
                  }}
                  className="text-[#0A232E] opacity-50 hover:opacity-100 text-sm p-1"
                >
                  ✕
                </button>
              </div>

              {/* Pricing Summary */}
              <div className="pt-3 border-t border-[rgba(10,35,46,0.1)]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] text-[#0A232E] opacity-50">
                    {pricing?.days} ימים ללא הגבלה
                  </span>
                  <span className="text-[14px] font-bold text-[#0A232E]">
                    <Suspense fallback={<span>${pricing?.totalPrice?.toFixed(2) || 0}</span>}>
                      <CountUp
                        key={`total-${countryId || tripId}-${numOfDays}`}
                        end={pricing?.totalPrice || 0}
                        decimals={2}
                        prefix="$"
                        duration={0.2}
                        preserveValue
                      />
                    </Suspense>
                  </span>
                </div>
                {pricing?.hasDiscount && (
                  <div className="text-center py-1 text-[8px] bg-green-50 rounded text-green-600">
                    חסכת ${pricing.discountAmount.toFixed(2)}!
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Purchase Button */}
        <AnimatePresence>
          {footerVisible && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.2 }}
            >
              <SelectorAction>
                <SelectorButton onClick={handlePurchase}>
                  לצפייה בחבילה המשתלמת ביותר
                </SelectorButton>
              </SelectorAction>
            </motion.div>
          )}
        </AnimatePresence>
      </SelectorCard>
    </Selector>
  );
}