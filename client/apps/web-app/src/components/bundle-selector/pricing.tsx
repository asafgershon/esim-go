"use client";

import CountUp from "react-countup";
import { PricingSkeleton } from "./skeleton";
import type { Destination } from "@/contexts/bundle-selector-context";
import { useBundleSelector } from "@/contexts/bundle-selector-context";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { usePricingSteps } from "@/hooks/usePricingSteps";
import { Sparkles, Loader2 } from "lucide-react";
import { PricingStepsDisplay } from "./pricing-steps-display";
import { useRef, useEffect } from "react";

interface PricingProps {
  destination: Destination;
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
  countryId: string | null;
  tripId: string | null;
  numOfDays: number;
  onRemoveDestination: () => void;
}

export function Pricing({
  destination,
  pricing,
  shouldShowStreamingUI = false,
  isStreamingData = false,
  countryId,
  tripId,
  numOfDays,
  onRemoveDestination,
}: PricingProps) {
  const previousPriceRef = useRef<number>(0);
  const previousDestinationRef = useRef<string | null>(null);
  const { startDate, endDate } = useBundleSelector();

  // Track destination changes
  const currentDestination = tripId || countryId;
  const destinationChanged = previousDestinationRef.current !== currentDestination;
  
  useEffect(() => {
    if (currentDestination !== previousDestinationRef.current) {
      previousDestinationRef.current = currentDestination;
    }
  }, [currentDestination]);

  // Show streaming animation when destination changes and we have pricing steps
  const shouldShowSteps = Boolean(
    (shouldShowStreamingUI || destinationChanged) && 
    (countryId || tripId) && 
    pricing?.pricingSteps?.length
  );

  const {
    isAnimating: isCalculating,
    progress,
    steps: calculationSteps,
    totalSteps,
    completedSteps,
  } = usePricingSteps({
    pricingSteps: pricing?.pricingSteps,
    enabled: shouldShowSteps,
  });

  // Track price changes for smooth CountUp transitions
  const currentPrice = pricing?.totalPrice || pricing?.finalPrice || 0;
  if (currentPrice > 0) {
    previousPriceRef.current = currentPrice;
  }

  // Display values with fallback to original pricing
  const displayPricing = {
    finalPrice: pricing?.finalPrice || pricing?.totalPrice || 0,
    totalPrice: pricing?.totalPrice || pricing?.finalPrice || 0,
    days: numOfDays,
    hasDiscount: pricing?.hasDiscount ?? false,
    discountAmount: pricing?.discountAmount || 0,
  };
  // Only show skeleton when we have absolutely no data
  if (!pricing) {
    if (shouldShowStreamingUI) {
      return <PricingSkeleton />;
    }
    return null;
  }

  // Show pricing steps animation when destination changes
  if (isCalculating && shouldShowSteps) {
    return (
      <div className="relative">
        <PricingStepsDisplay
          steps={calculationSteps || []}
          isCalculating={isCalculating}
          progress={progress}
          totalSteps={totalSteps || 0}
          completedSteps={completedSteps || 0}
        />
      </div>
    );
  }

  return (
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
          <div className="flex items-center gap-2">
            <h3 className="text-[14px] md:text-[18px] font-medium text-brand-dark flex items-center gap-2">
              {destination.name}
              {/* Show streaming indicator next to country name */}
              {isStreamingData && (
                <Loader2 className="h-3 w-3 animate-spin text-brand-purple opacity-60" />
              )}
            </h3>
          </div>
        </div>
        <button
          onClick={onRemoveDestination}
          className="text-brand-dark opacity-50 hover:opacity-100 text-sm p-1 focus:outline-none focus:ring-2 focus:ring-brand-purple focus:ring-offset-2 rounded"
          aria-label="הסר בחירת יעד"
        >
          ✕
        </button>
      </div>

      {/* Pricing Summary */}
      <div className="pt-3 border-t border-brand-dark/10">
        {/* Show dates if available */}
        {startDate && endDate && (
          <div className="text-[10px] md:text-[12px] text-brand-dark opacity-60 mb-2">
            {format(startDate, "dd/MM", { locale: he })} -{" "}
            {format(endDate, "dd/MM/yyyy", { locale: he })}
          </div>
        )}



        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] md:text-[14px] text-brand-dark opacity-50">
            {displayPricing.days} ימים ללא הגבלה
          </span>
          <span className="text-[14px] md:text-[18px] font-bold text-brand-dark">
            <CountUp
              key={`total-${countryId || tripId}-${numOfDays}`}
              start={previousPriceRef.current}
              end={displayPricing.totalPrice || 0}
              decimals={2}
              prefix="$"
              duration={0.8}
              preserveValue
              useEasing
            />
          </span>
        </div>

        {/* Enhanced discount display with real-time updates */}
        {displayPricing.hasDiscount && (
          <div className="space-y-1">
            {/* Total savings */}
            <div
              className="text-center py-1 text-[8px] md:text-[10px] rounded bg-green-50 text-green-600"
              role="status"
              aria-live="polite"
            >
              <div className="flex items-center justify-center gap-1">
                {displayPricing.discountAmount > 0 && (
                  <Sparkles className="h-3 w-3" />
                )}
                <span>חסכת ${displayPricing.discountAmount.toFixed(2)}!</span>
              </div>
              {displayPricing.discountAmount > 0 &&
                displayPricing.totalPrice > 0 && (
                  <div className="text-[6px] md:text-[8px] opacity-75">
                    {(
                      (displayPricing.discountAmount /
                        (displayPricing.totalPrice +
                          displayPricing.discountAmount)) *
                      100
                    ).toFixed(1)}
                    % הנחה
                  </div>
                )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
