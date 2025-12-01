"use client";

import { useBundleSelector } from "@/contexts/bundle-selector-context";
import type { Destination } from "@/contexts/bundle-selector-context";
import { useCountries } from "@/hooks/useCountries";
import { useTrips } from "@/hooks/useTrips";
// 1. הוספת useState לייבוא
import { useMemo } from "react"; 
import { useState } from "react";
import {
    SelectorAction,
    SelectorButton,
    SelectorContent,
    SelectorHeader,
    SelectorSection,
} from "@workspace/ui";
import { CalendarIcon } from "./icons";
import { DestinationSelector } from "./destination-selector";
import { Pricing } from "./pricing";
import { SliderWithValue } from "@workspace/ui";
import { useEffect } from "react";
import { getFlagUrl } from "@/utils/flags";
import { Users2Icon } from "lucide-react";

interface MainViewProps {
    // ... (שדות Pricing)
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

    const [isPricingThinking, setIsPricingThinking] = useState(false);
    const [isPurchasing, setIsPurchasing] = useState(false);

    const [isLoading, setIsLoading] = useState(false)
    // 2. הגדרת מצב מקומי לכמות ה-eSIMs
    const { numOfEsims, setNumOfEsims } = useBundleSelector();
    
    // Get UI state and handlers from context
    const {
        numOfDays,
        countryId,
        tripId,
        setNumOfDays,
        setCurrentView,
        setCountryId,
        setTripId,
        isPricingValid,
        triggerDestinationSelectorFocus,
        // 3. הסרת numOfEsims ו-setNumOfEsims מה-useBundleSelector 
        // כי הם לא קיימים שם, ומוגדרים עכשיו מקומית.
    } = useBundleSelector();

    useEffect(() => {
        const navEntry = performance.getEntriesByType(
            "navigation"
        )[0] as PerformanceNavigationTiming;
        const isReload = navEntry?.type === "reload";

        if (isReload) {
            const urlParams = new URLSearchParams(window.location.search);

            if (urlParams.toString().length > 0) {
                window.location.href = window.location.pathname;
            }
        }
    }, []);

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
                    icon: getFlagUrl(country.iso),
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
                    איזה כיף! לאן טסים? ✈️
                </h2>
            </SelectorHeader>

            <SelectorContent>
                {/* Destination Selection */}
                <DestinationSelector />

                {/* Day Selector Section */}
                <SelectorSection>
                    <div className="flex items-center gap-[4px] md:gap-2 justify-start">
                        <CalendarIcon className="w-3 h-3 md:w-[19px] md:h-[19px]" />
                        <p className="text-base md:text-xl leading-[26px] md:leading-normal text-brand-dark">
                            כמה ימים?
                        </p>
                    </div>

                    {/* Slider Container - Days */}
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

                <SelectorSection>
                    <div className="flex items-center gap-[4px] md:gap-2 justify-start">
                        <Users2Icon className="w-4 h-4 md:w-[20px] md:h-[20px] text-brand-dark" />
                        <p className="text-base md:text-xl leading-[26px] md:leading-normal text-brand-dark">
                            כמה eSIMs צריך?
                            {countryId && numOfEsims > 1}
                        </p>
                    </div>

                    <div className="relative h-[21px] md:h-[38px]">
                        <SliderWithValue
                            dir={"rtl"}
                            value={[numOfEsims]}
                            onValueChange={(value) => setNumOfEsims(value[0])}
                            min={1}
                            max={10} // טווח בין 1 ל-10
                        />
                    </div>
                    <div className="text-right text-xs text-gray-500 mt-1">
                        לכל מטייל נפרד דרוש eSIM משלו.
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
    numOfEsims={numOfEsims}
    onThinkingStateChange={(state) => setIsPricingThinking(state)} // 👈 חדש
/>
                )}
            </SelectorContent>

            {/* Purchase Button - Always visible */}
            <SelectorAction className="mt-5">
<SelectorButton
    onClick={async () => {
    if (!isPricingValid || isPricingThinking || isPurchasing) return;

    setIsPurchasing(true);

    try {
        await handlePurchase(); // your purchase flow
    } finally {
        setIsPurchasing(false);
    }
}}
disabled={!isPricingValid || isPricingThinking || isPurchasing}
    variant={isPricingValid && !isPricingThinking ? "brand-success" : undefined}
    emphasized={isPricingValid && !isPricingThinking}
>
{isPricingThinking
    ? "מחשב..."
    : isPurchasing
        ? "מבצע רכישה..."
        : isPricingValid
            ? "לרכישת החבילה"
            : "לצפייה בחבילה המשתלמת ביותר"}
</SelectorButton>

            </SelectorAction>
        </>
    );
}