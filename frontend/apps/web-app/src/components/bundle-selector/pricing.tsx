"use client";

import type { Destination } from "@/contexts/bundle-selector-context";
import { useBundleSelector } from "@/contexts/bundle-selector-context";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { Loader2, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import CountUp from "react-countup";
import { PricingThinkingDisplay } from "./pricing-thinking-display";
import { PricingSkeleton } from "./skeleton";

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
  const [showThinkingAnimation, setShowThinkingAnimation] = useState(false);
  const { startDate, endDate } = useBundleSelector();

  // Track destination changes for thinking animation
  const currentDestination = tripId || countryId;

  useEffect(() => {
    // Show thinking animation only when destination changes
    const destinationChanged =
      currentDestination &&
      currentDestination !== previousDestinationRef.current;

    if (destinationChanged) {
      previousDestinationRef.current = currentDestination;
      // Show thinking animation for new destination
      setShowThinkingAnimation(true);
    }
  }, [currentDestination]);

  // Hide thinking animation when we get pricing data
  useEffect(() => {
    if (pricing?.finalPrice) {
      setShowThinkingAnimation(false);
    }
  }, [pricing?.finalPrice]);

  // Determine if we should show the thinking UI
  const shouldShowThinking =
    showThinkingAnimation && !pricing?.finalPrice && (countryId || tripId);

  // Simple progress simulation for thinking animation
  const [thinkingProgress, setThinkingProgress] = useState(0);

  useEffect(() => {
    if (shouldShowThinking) {
      setThinkingProgress(0);
      const interval = setInterval(() => {
        setThinkingProgress((prev) => {
          if (prev >= 95) {
            clearInterval(interval);
            return 95; // Cap at 95% until we get real data
          }
          return prev + 10;
        });
      }, 300);

      return () => clearInterval(interval);
    } else {
      setThinkingProgress(100);
    }
  }, [shouldShowThinking]);

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

  // Show thinking animation when destination changes and we're loading data
  if (shouldShowThinking) {
    return (
      <div className="relative">
        <PricingThinkingDisplay
          isCalculating={true}
          progress={thinkingProgress}
          countryName={destination.name}
          numOfDays={numOfDays}
          onAnimationDone={() => setShowThinkingAnimation(false)}
        />
      </div>
    );
  }

  return (
    <div className="bg-brand-white border border-brand-dark/10 rounded-lg md:rounded-[15px] p-3 md:p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <img
            src={destination.icon}
            alt={destination.name}
            className="w-6 h-4 md:w-8 md:h-5 rounded-sm object-cover"
          />
          <div className="flex items-center gap-2">
            <h3 className="text-[14px] md:text-[18px] font-medium text-brand-dark flex items-center gap-2">
              {destination.name}
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
