"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Combobox } from "@/components/ui/combobox";
import { SliderWithValue } from "@/components/ui/slider";
import type { CountryISOCode } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Calendar, Info } from "lucide-react";
import {
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
  useQueryState,
} from "nuqs";
import { useEffect, useMemo, useState } from "react";
import { EsimSkeleton } from "./esim-skeleton";
import { EnhancedCountry, useCountries } from "@/hooks/useCountries";
import { EnhancedTrip, useTrips } from "@/hooks/useTrips";
import { usePricing } from "@/hooks/usePricing";

// Backend handles discount logic, so this is no longer needed

export function EsimExperienceSelector() {
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

  // Simulate initial loading for better UX
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
    regionId: selectedDestinationData?.type === "trip" 
      ? selectedDestinationData.data?.id 
      : undefined,
    countryId: selectedDestinationData?.type === "country" 
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

  // Show loading skeleton initially
  if (isLoading) {
    return <EsimSkeleton />;
  }

  return (
    <div
      className="w-full max-w-sm mx-auto bg-card rounded-2xl shadow-lg overflow-hidden"
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
        <Combobox
          options={comboboxOptions}
          value={
            countryId ? `country-${countryId}` : tripId ? `trip-${tripId}` : ""
          }
          onValueChange={handleDestinationChange}
          placeholder={countryId || tripId ? "שנה יעד..." : "לאן נוסעים?"}
          emptyMessage="לא נמצאו תוצאות"
          className="border-border focus:border-ring focus:ring-ring/20 rtl"
        />
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
                className="w-full"
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
                    : (selectedDestinationData.data as EnhancedTrip)?.icon || ""}
                </span>
                <div>
                  <h3 className="font-medium text-card-foreground">
                    {selectedDestinationData.data?.nameHebrew}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedDestinationData.type === "country"
                      ? (selectedDestinationData.data as EnhancedCountry)
                          ?.tagline
                      : (selectedDestinationData.data as EnhancedTrip)?.description}
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
            {pricing && (
              <div className="space-y-3 pt-3 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">
                    {pricing.days} ימים ללא הגבלה
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {priceLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-16 bg-muted animate-pulse rounded"></div>
                        <span className="text-sm text-muted-foreground">מחשב מחיר...</span>
                      </div>
                    ) : (
                      <>
                        <span className="font-bold text-lg">
                          ${pricing.dailyPrice.toFixed(2)}
                        </span>
                        <span className="text-sm text-muted-foreground">ליום</span>
                        <Info className="h-4 w-4 text-muted-foreground" />
                      </>
                    )}
                  </div>
                </div>

                {priceLoading ? (
                  <div className="h-4 w-32 bg-muted animate-pulse rounded"></div>
                ) : (
                  pricing.hasDiscount && (
                    <div className="text-sm text-primary font-medium">
                      יותר ימים = מחירים נמוכים יותר!
                    </div>
                  )
                )}

                <div className="border-t pt-3">
                  <div className="flex items-center justify-between">
                    {priceLoading ? (
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold">סה״כ:</span>
                        <div className="h-5 w-20 bg-muted animate-pulse rounded"></div>
                      </div>
                    ) : (
                      <span className="text-lg font-bold">
                        סה״כ: ${pricing.totalPrice.toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Purchase Button */}
      <div className="p-4 border-t bg-muted">
        <Button
          className={cn(
            "w-full h-12 font-medium transition-all duration-200",
            isReadyToPurchase
              ? "bg-primary hover:bg-primary/90 text-primary-foreground"
              : "bg-muted-foreground/20 text-muted-foreground cursor-not-allowed"
          )}
          disabled={!isReadyToPurchase}
        >
          {isReadyToPurchase ? "קנה עכשיו" : "בחר יעד ומשך זמן"}
        </Button>
      </div>
    </div>
  );
}
