"use client";

import { Card } from "@workspace/ui";
import { lazy } from "react";
import type { GetCheckoutSessionQuery } from "@/__generated__/graphql";
import { SectionHeader } from "./section-header";
import { ShoppingCart } from "lucide-react";

const CountUp = lazy(() => import("react-countup"));

interface OrderDetailsSectionProps {
  session: GetCheckoutSessionQuery['getCheckoutSession']['session'] | null | undefined;
  sectionNumber?: number;
  validationStatus?: "pending" | "valid" | "invalid" | null;
  isCompleted?: boolean;
}

export function OrderDetailsSection({
  session,
  sectionNumber,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  validationStatus: _validationStatus,
  isCompleted = false,
}: OrderDetailsSectionProps) {
  // Extract session data (already parsed JSON objects, not strings)
  const planSnapshot = session?.planSnapshot || null;
  const pricing = session?.pricing || null;



  // If no session data, show loading state
  if (!session || !planSnapshot) {
    return (
      <Card dir="rtl">
        <div className="flex items-center justify-between">
          <SectionHeader
            sectionNumber={sectionNumber || 1}
            title="פרטי הזמנה"
            icon={<ShoppingCart className="h-5 w-5 text-primary" />}
            isCompleted={isCompleted}
          />
        </div>
        <div className="text-center py-8 text-muted-foreground">
          <p>טוען פרטי הזמנה...</p>
        </div>
      </Card>
    );
  }

  // Extract data from planSnapshot and pricing
  const numOfDays = planSnapshot.duration || 0;
  const displayPrice = pricing?.priceAfterDiscount || planSnapshot.price || 0;
  const originalPrice = pricing?.totalCost || planSnapshot.price || 0;
  const discountAmount = pricing?.discountValue || 0;
  const hasDiscount = discountAmount > 0;
  const dailyPrice = displayPrice / (numOfDays || 1);
  
  // Extract bundle and country information
  const bundleName = planSnapshot.name || "";
  const countryName = planSnapshot.countries?.[0] || "";
  const dataAmount = planSnapshot.dataAmount || "ללא הגבלה";
  const isUnlimited = planSnapshot.dataAmount?.toLowerCase().includes('unlimited') || 
                     planSnapshot.dataAmount?.toLowerCase().includes('ללא הגבלה');

  return (
    <Card dir="rtl">
      <div className="flex items-center justify-between">
        <SectionHeader
          sectionNumber={sectionNumber || 1}
          title="פרטי הזמנה"
          icon={<ShoppingCart className="h-5 w-5 text-primary" />}
          isCompleted={isCompleted}
        />
      </div>
      
      <div className="space-y-4">
        {/* Destination Info */}
        <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
          <span className="text-2xl">🌍</span>
          <div>
            <h3 className="font-medium">{countryName || bundleName}</h3>
            <p className="text-sm text-muted-foreground">eSIM</p>
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
            <span className="font-medium">{isUnlimited ? "ללא הגבלה" : dataAmount}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-muted-foreground">מהירות</span>
            <span className="font-medium">4G/5G</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-muted-foreground">מחיר יומי</span>
            <span className="font-medium">
              ${dailyPrice.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Pricing Section */}
        <div className="border-t pt-4 space-y-3">
          {/* Show original price if discount exists */}
          {hasDiscount && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">מחיר מקורי</span>
              <span className="line-through text-muted-foreground">
                ${originalPrice.toFixed(2)}
              </span>
            </div>
          )}
          
          {/* Show discount amount if exists */}
          {hasDiscount && (
            <div className="flex justify-between">
              <span className="text-green-600">הנחה</span>
              <span className="text-green-600 font-medium">
                -${discountAmount.toFixed(2)}
              </span>
            </div>
          )}
          
          {/* Final Price */}
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
          
          {/* You Save message */}
          {hasDiscount && (
            <div className="text-center py-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <span className="text-green-700 dark:text-green-300 font-medium">
                חסכת ${discountAmount.toFixed(2)}!
              </span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
} 