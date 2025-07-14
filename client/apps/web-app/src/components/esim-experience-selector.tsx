"use client";

import { Button } from "@workspace/ui";
import { Card } from "@workspace/ui";
import { FuzzyCombobox, SliderWithValue } from "@workspace/ui";
import type { CountryISOCode } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Calendar, Info } from "lucide-react";
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
import { usePricing } from "@/hooks/usePricing";

const CountUp = lazy(() => import("react-countup"));
// Backend handles discount logic, so this is no longer needed

// Lazy load the mobile bottom sheet
const MobileDestinationSheet = lazy(() => import("./mobile-destination-sheet"));

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
  const isLoading = isInitialLoading || countriesLoading || tripsLoading;
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
  // Calculate pricing using backend
  const { pricing, loading: priceLoading } = usePricing({
    numOfDays,
    regionId:
      selectedDestinationData?.type === "trip"
        ? selectedDestinationData.data?.id
        : undefined,
    countryId:
      selectedDestinationData?.type === "country"
        ? selectedDestinationData.data?.id
        : undefined,
  });
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
  const isReadyToPurchase = (countryId || tripId) && numOfDays >= 7;
  const handlePurchase = () => {
    if (!isReadyToPurchase) return;
    // Navigate to checkout with current parameters
    const params = new URLSearchParams();
    params.set("numOfDays", numOfDays.toString());
    if (countryId) params.set("countryId", countryId);
    if (tripId) params.set("tripId", tripId);
    if (pricing?.totalPrice) params.set("totalPrice", pricing.totalPrice.toString());
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
    <div
      className="w-full mx-auto bg-card rounded-2xl shadow-lg overflow-hidden"
      dir="rtl"
      style={{
        fontFamily: '"Segoe UI", "Tahoma", "Helvetica Neue", Arial, sans-serif',
      }}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-muted to-secondary p-6 text-center">
        <div className="text-2xl mb-2">🌍</div>
        <h1 className="text-xl font-bold text-card-foreground mb-1">
          חבילות eSIM לטיולים
        </h1>
        <p className="text-sm text-muted-foreground">
          חיבור מושלם בכל מקום בעולם
        </p>
      </div>

      {/* Tabs */}
      <div className="flex bg-muted p-1 m-4 rounded-xl">
        <button
          onClick={() => handleTabChange("countries")}
          className={cn(
            "flex-1 py-3 px-4 text-sm font-medium rounded-lg transition-all duration-200",
            activeTab === "countries"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          מדינות
        </button>
        <button
          onClick={() => handleTabChange("trips")}
          className={cn(
            "flex-1 py-3 px-4 text-sm font-medium rounded-lg transition-all duration-200",
            activeTab === "trips"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          טיולים
        </button>
      </div>

      {/* Destination Selection */}
      <div className="px-4 mb-6">
        {isMobile ? (
          <div className="relative">
            <FuzzyCombobox
              options={comboboxOptions}
              value={
                countryId
                  ? `country-${countryId}`
                  : tripId
                  ? `trip-${tripId}`
                  : ""
              }
              onValueChange={() => {}} // No-op, selection handled by sheet
              placeholder={countryId || tripId ? "שנה יעד..." : "לאן נוסעים?"}
              searchPlaceholder="חפש..."
              emptyMessage="לא נמצאו תוצאות"
              className="border-border focus:border-ring focus:ring-ring/20 pointer-events-none select-none"
              disabled
            />
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
                <MobileDestinationSheet
                  options={comboboxOptions}
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
                />
              )}
            </Suspense>
          </div>
        ) : (
          <FuzzyCombobox
            options={comboboxOptions}
            value={
              countryId
                ? `country-${countryId}`
                : tripId
                ? `trip-${tripId}`
                : ""
            }
            onValueChange={handleDestinationChange}
            placeholder={countryId || tripId ? "שנה יעד..." : "לאן נוסעים?"}
            searchPlaceholder="חפש..."
            emptyMessage="לא נמצאו תוצאות"
            className="border-border focus:border-ring focus:ring-ring/20"
          />
        )}
      </div>

      {/* Duration Selection - Always Visible */}
      <div className="px-4 mb-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <h3 className="font-medium text-card-foreground">כמה ימים?</h3>
          </div>

          <div className="space-y-4">
            <div className="px-2">
              <SliderWithValue
                value={[numOfDays]}
                onValueChange={(value) => setNumOfDays(value[0])}
                max={30}
                min={1}
                className={`w-full ${isMobile ? 'slider-thumb-lg' : ''}`}
                dir="rtl"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Selected Destination and Pricing */}
      {selectedDestinationData && (
        <div className="px-4 mb-6">
          <Card className="p-4 border-primary bg-primary/5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">
                  {selectedDestinationData.type === "country"
                    ? (selectedDestinationData.data as EnhancedCountry)?.flag ||
                      ""
                    : (selectedDestinationData.data as EnhancedTrip)?.icon ||
                      ""}
                </span>
                <div>
                  <h3 className="font-medium text-card-foreground">
                    {selectedDestinationData.data?.nameHebrew}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedDestinationData.type === "country"
                      ? (selectedDestinationData.data as EnhancedCountry)
                          ?.tagline
                      : (selectedDestinationData.data as EnhancedTrip)
                          ?.description}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setCountryId(null);
                  setTripId(null);
                }}
                className="text-muted-foreground hover:text-foreground p-1"
              >
                ✕
              </button>
            </div>

            {/* Pricing Summary */}
            {priceLoading ? (
              <div className="space-y-3 pt-3 border-t">
                {/* Days skeleton */}
                <div className="flex items-center justify-between">
                  <div className="h-4 w-32 bg-muted animate-pulse rounded"></div>
                </div>

                {/* Daily price skeleton */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-8 bg-muted animate-pulse rounded"></div>
                    <div className="h-2 w-4 bg-muted animate-pulse rounded"></div>
                  </div>
                </div>

                {/* Discount message skeleton */}
                <div className="h-4 w-40 bg-muted animate-pulse rounded"></div>

                {/* Total price skeleton */}
                <div className="border-t pt-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-12 bg-muted animate-pulse rounded"></div>
                      <div className="h-6 w-20 bg-muted animate-pulse rounded"></div>
                    </div>
                  </div>
                </div>

                {/* Loading indicator */}
                <div className="text-center">
                  <span className="text-sm text-muted-foreground">
                    מחשב מחיר...
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-3 pt-3 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">
                    {pricing?.days} ימים ללא הגבלה
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-lg">
                      <CountUp
                        key={`daily-${countryId || tripId}-${numOfDays}`}
                        end={pricing?.dailyPrice || 0}
                        decimals={2}
                        enableScrollSpy
                        prefix="$"
                        duration={0.2}
                        preserveValue
                      />
                    </span>
                    <span className="text-sm text-muted-foreground">ליום</span>
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>

                {pricing?.hasDiscount && (
                  <div className="text-sm text-primary font-medium">
                    יותר ימים = מחירים נמוכים יותר!
                  </div>
                )}

                <div className="border-t pt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold">
                      סה״כ:{" "}
                      <CountUp
                        key={`total-${countryId || tripId}-${numOfDays}`}
                        end={pricing?.totalPrice || 0}
                        decimals={2}
                        prefix="$"
                        duration={0.2}
                        preserveValue
                      />
                    </span>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Animated Purchase Button/Footer */}
      <AnimatePresence>
        {footerVisible && (
          <motion.div
            key="footer"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ duration: 0.3 }}
            className="p-4 border-t bg-muted"
          >
            <Button
              className={cn(
                "w-full h-12 font-medium transition-all duration-200 bg-primary hover:bg-primary/90 text-primary-foreground"
              )}
              onClick={handlePurchase}
            >
              קנה עכשיו
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
