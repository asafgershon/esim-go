"use client";

import { CountUp } from "../ui/count-up";
import { PricingSkeleton } from "./skeleton";
import type { Destination } from "@/contexts/bundle-selector-context";
import { useBundleSelector } from "@/contexts/bundle-selector-context";
import { format } from "date-fns";
import { he } from "date-fns/locale";

interface PricingProps {
  destination: Destination;
  pricing: {
    finalPrice?: number;
    currency?: string;
    days?: number;
    totalPrice?: number;
    hasDiscount?: boolean;
    discountAmount?: number;
  } | null;
  isLoadingPricing?: boolean;
  countryId: string | null;
  tripId: string | null;
  numOfDays: number;
  onRemoveDestination: () => void;
}

export function Pricing({
  destination,
  pricing,
  isLoadingPricing = false,
  countryId,
  tripId,
  numOfDays,
  onRemoveDestination,
}: PricingProps) {
  const { startDate, endDate } = useBundleSelector();
  if (isLoadingPricing) {
    return <PricingSkeleton />;
  }

  if (!pricing) {
    return null;
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
            {format(startDate, "dd/MM", { locale: he })} - {format(endDate, "dd/MM/yyyy", { locale: he })}
          </div>
        )}
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] md:text-[14px] text-brand-dark opacity-50">
            {pricing.days} ימים ללא הגבלה
          </span>
          <span className="text-[14px] md:text-[18px] font-bold text-brand-dark">
            <CountUp
              key={`total-${countryId || tripId}-${numOfDays}`}
              end={pricing.totalPrice || 0}
              decimals={2}
              prefix="$"
              duration={0.2}
              preserveValue
              fallback={
                <span>${pricing.totalPrice?.toFixed(2) || 0}</span>
              }
            />
          </span>
        </div>
        {pricing.hasDiscount && (
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
  );
}