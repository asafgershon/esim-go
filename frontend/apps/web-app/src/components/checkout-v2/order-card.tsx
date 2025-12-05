"use client";

// 1. ייבוא הטיפוס החדש מההוּק
import { type CheckoutData } from "@/hooks/checkout/useCheckoutV2";
import { Card } from "@workspace/ui";
import { ShoppingCart } from "lucide-react";
import { lazy, useEffect } from "react";
import { useDebounceValue } from "usehooks-ts";
import { SectionHeader } from "./section-header";
import { getFlagUrl } from "@/utils/flags";
import Image from "next/image"; // 2. ייבוא של Next/Image

const CountUp = lazy(() => import("react-countup"));

// 3. שימוש בטיפוס הנכון במקום any
interface OrderDetailsSectionProps {
  data: CheckoutData | undefined;
    updatedPricing?: {
      priceAfter: number;
      priceBefore: number;
      hasDiscount: boolean;
    } | null;
  sectionNumber?: number;
  completed?: boolean;
}

export function OrderCard({
  data,
  updatedPricing,
  sectionNumber,
  completed = false,
}: OrderDetailsSectionProps) {
  const [isCompleted, setIsCompleted] = useDebounceValue(completed, 1300);

  useEffect(() => {
    setIsCompleted(completed);
  }, [completed, setIsCompleted]);

  if (!data || !data.bundle) return <OrderDetailsSkeleton />;

  const bundle = updatedPricing || data.bundle;

  // Extract bundle meta (unchanged)
  const { numOfDays, country, numOfEsims } = data.bundle;
  // Determine final displayed prices
  const priceAfter = updatedPricing?.priceAfter ?? data.bundle.price;

  const priceBefore = updatedPricing?.priceBefore ?? data.bundle.price;

  const hasDiscount = updatedPricing?.hasDiscount ?? false;

  const totalPriceAfter = priceAfter * (numOfEsims ?? 1);
  const totalPriceBefore = priceBefore * (numOfEsims ?? 1);

  const currencySymbol =
    Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    })
      .formatToParts(priceAfter || 0)
      .find((part) => part.type === "currency")?.value || "";

  return (
    <Card dir="rtl" className="flex flex-col gap-4 shadow-xl">
      <div className="flex items-center gap-2">
        <SectionHeader
          sectionNumber={sectionNumber || 1}
          title="פרטי הזמנה"
          icon={<ShoppingCart className="h-5 w-5 text-primary" />}
          isCompleted={isCompleted}
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
          {country?.iso ? (
            <Image
              src={getFlagUrl(country.iso, 80)}
              alt={country?.nameHebrew || country?.name || "flag"}
              width={32}
              height={24}
              className="rounded-md object-cover ring-1 ring-gray-200"
            />
          ) : (
            <span className="text-2xl">🌍</span>
          )}
          <div>
            <h3 className="font-medium">
              {`${country?.nameHebrew || country?.name || "מדינה לא ידועה"} `}
            </h3>
          </div>
        </div>

        {/* Package Details */}
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-muted-foreground">משך זמן</span>
            <span className="font-medium">{numOfDays} ימים</span>
          </div>
        </div>
          <div className="flex justify-between">
    <span className="text-muted-foreground">נפח גלישה</span>
    <span className="font-medium">ללא הגבלה</span>
  </div>
      </div>

<div className="border-t pt-4 space-y-3">
  <div className="flex justify-between items-center">
    <span className="text-lg font-semibold">סה״כ מחיר</span>

    <div className="flex flex-col items-end">

      {/* ✔ BIG PRICE — price of ONE eSIM */}
      <span className="text-xl font-bold text-primary">
        <CountUp
          end={priceAfter}
          decimals={2}
          prefix={currencySymbol}
          duration={0.5}
          preserveValue
        />
      </span>

      {/* ✔ Small line: single × quantity = TOTAL */}
      {numOfEsims > 1 && (
        <span className="text-xs text-gray-500 mt-1">
          {priceAfter.toFixed(2)} {currencySymbol} × {numOfEsims} ={" "}
          <span className="font-bold">
            {(priceAfter * numOfEsims).toFixed(2)}{currencySymbol}
          </span>
        </span>
      )}

      {/* ✔ If discount → show ONLY single-esim original price */}
      {hasDiscount && (
        <span className="text-gray-400 line-through text-sm">
          {currencySymbol}{priceBefore.toFixed(2)}
        </span>
      )}

    </div>
  </div>
</div>
</Card>
);
}

// ... (קוד הסקלטון נשאר זהה)
const OrderDetailsSkeleton = () => {
  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-6 h-6 md:w-8 md:h-8 bg-gray-200 rounded-full animate-pulse" />
        <div>
          <div className="h-4 md:h-5 w-24 bg-gray-200 rounded animate-pulse mb-1" />
          <div className="h-3 md:h-4 w-16 bg-gray-100 rounded animate-pulse" />
        </div>
      </div>

      <div className="space-y-4">
        {/* Plan details */}
        <div className="flex justify-between items-center">
          <div className="h-4 w-20 bg-gray-100 rounded animate-pulse" />
          <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="flex justify-between items-center">
          <div className="h-4 w-16 bg-gray-100 rounded animate-pulse" />
          <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="flex justify-between items-center">
          <div className="h-4 w-20 bg-gray-100 rounded animate-pulse" />
          <div className="h-4 w-28 bg-gray-200 rounded animate-pulse" />
        </div>

        {/* Pricing breakdown */}
        <div className="border-t pt-4 mt-4">
          <div className="flex justify-between items-center mb-2">
            <div className="h-4 w-16 bg-gray-100 rounded animate-pulse" />
            <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="flex justify-between items-center mb-2">
            <div className="h-4 w-20 bg-gray-100 rounded animate-pulse" />
            <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="flex justify-between items-center font-bold">
            <div className="h-5 w-12 bg-gray-200 rounded animate-pulse" />
            <div className="h-5 w-24 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
      </div>
    </Card>
  );
};