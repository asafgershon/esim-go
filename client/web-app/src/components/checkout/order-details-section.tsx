"use client";

import { Card } from "@/components/ui/card";
import { useCountries, type EnhancedCountry } from "@/hooks/useCountries";
import { useTrips, type EnhancedTrip } from "@/hooks/useTrips";
import { usePricing } from "@/hooks/usePricing";
import { lazy } from "react";

const CountUp = lazy(() => import("react-countup"));

interface OrderDetailsSectionProps {
  numOfDays: number;
  countryId: string | null;
  tripId: string | null;
  totalPrice: number;
}

export function OrderDetailsSection({
  numOfDays,
  countryId,
  tripId,
  totalPrice,
}: OrderDetailsSectionProps) {
  const { countries } = useCountries();
  const { trips } = useTrips();
  
  // Get real-time pricing
  const { pricing } = usePricing({
    numOfDays,
    regionId: tripId || undefined,
    countryId: countryId || undefined,
  });

  // Get selected destination details
  const selectedDestination = countryId
    ? countries.find((c) => c.id === countryId)
    : trips.find((t) => t.id === tripId);

  const displayPrice = pricing?.totalPrice || totalPrice;

  return (
    <Card className="p-6" dir="rtl">
      <h2 className="text-xl font-semibold mb-4">פרטי הזמנה</h2>
      
      {selectedDestination && (
        <div className="space-y-4">
          {/* Destination Info */}
          <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
            <span className="text-2xl">
              {countryId 
                ? (selectedDestination as EnhancedCountry)?.flag || "🌍"
                : (selectedDestination as EnhancedTrip)?.icon || "✈️"
              }
            </span>
            <div>
              <h3 className="font-medium">{selectedDestination.nameHebrew}</h3>
              <p className="text-sm text-muted-foreground">
                {countryId ? "מדינה" : "חבילת טיול"}
              </p>
            </div>
          </div>

          {/* Package Details */}
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">משך זמן</span>
              <span className="font-medium">{numOfDays} ימים</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-muted-foreground">נתונים</span>
              <span className="font-medium">ללא הגבלה</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-muted-foreground">מהירות</span>
              <span className="font-medium">4G/5G</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-muted-foreground">מחיר יומי</span>
              <span className="font-medium">
                ${pricing ? (pricing.totalPrice / numOfDays).toFixed(2) : (displayPrice / numOfDays).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Total Price */}
          <div className="border-t pt-4">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold">סה״כ מחיר</span>
              <span className="text-xl font-bold text-primary">
                <CountUp
                  end={displayPrice}
                  decimals={2}
                  prefix="$"
                  duration={0.5}
                  preserveValue
                />
              </span>
            </div>
          </div>
        </div>
      )}
      
      {!selectedDestination && (
        <div className="text-center py-8 text-muted-foreground">
          <p>לא נבחר יעד</p>
        </div>
      )}
    </Card>
  );
} 