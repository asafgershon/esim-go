"use client";

import { Checkout } from "@/__generated__/types";
import { Card } from "@workspace/ui";
// import { Loader2Icon } from "lucide-react"; 
import { ShoppingCart } from "lucide-react";
import { lazy, useEffect } from "react";
import { useDebounceValue } from "usehooks-ts";
import { SectionHeader } from "./section-header";

const CountUp = lazy(() => import("react-countup"));

interface OrderDetailsSectionProps {
  data: Pick<Checkout, "bundle"> | undefined;
  sectionNumber?: number;
  completed?: boolean;
}

export function OrderCard({
  data,
  sectionNumber,
  completed = false,
}: OrderDetailsSectionProps) {
  const [isCompleted, setIsCompleted] = useDebounceValue(completed, 1300);

  useEffect(() => {
    setIsCompleted(completed);
  }, [completed, setIsCompleted]);

  if (!data || !data.bundle) return <OrderDetailsSkeleton />;
  const { bundle } = data;
  const {
    // dataAmount,
  price,
    numOfDays,
    country,
    // pricePerDay,
    // speed,
    // discounts,
  } = bundle;

  const currencySymbol =
    Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    })
      .formatToParts(price || 0)
      .find((part) => part.type === "currency")?.value || "";

  const Row = ({ label, value }: { label: string; value: React.ReactNode }) => {
    return (
      <div className="flex justify-between">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{value}</span>
      </div>
    );
  };

  return (
    <Card dir="rtl" className="flex flex-col gap-4 shadow-xl">
      <div className="flex items-center gap-2">
        <SectionHeader
          sectionNumber={sectionNumber || 1}
          title="פרטי הזמנה"
          icon={<ShoppingCart className="h-5 w-5 text-primary" />}
          isCompleted={isCompleted}
        />
        {/* {!isCompleted && (
          <span
            dir={"ltr"}
            className=" h-full text-sm text-muted-foreground flex items-center gap-1"
          >
            ...מוודא זמינות מול הספק
            <Loader2Icon className="h-4 w-4 text-muted-foreground animate-spin" />
          </span>
        )} */}
      </div>

      <div className="space-y-4">
        {/* Destination Info */}
        <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
          <span className="text-2xl">🌍</span>
          <div>
            <h3 className="font-medium">{country?.name || bundle?.id}</h3>
            <p className="text-sm text-muted-foreground">{bundle?.id}</p>
          </div>
        </div>

        {/* Package Details */}
        <div className="space-y-3">
          <Row label="משך זמן" value={`${numOfDays} ימים`} />
        </div>

        {/* <Row label="נתונים" value={dataAmount} /> */}

        {/* <Row label="מהירות" value={speed.join(", ")} /> */}

        {/* <Row
          label="מחיר יומי"
          value={
            <CountUp
              end={pricePerDay}
              decimals={2}
              prefix={currencySymbol}
              duration={0.5}
              preserveValue
            />
          }
        /> */}
      </div>

      {/* Pricing Section */}
      <div className="border-t pt-4 space-y-3">
        {/* {hasDiscount && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">מחיר מקורי</span>
              <span className="line-through text-muted-foreground">
                ${originalPrice.toFixed(2)}
              </span>
            </div>
          )} */}
        {/* Show discount amount if exists */}
        {/* {hasDiscount && (
            <div className="flex justify-between">
              <span className="text-green-600">הנחה</span>
              <span className="text-green-600 font-medium">
                -${discountAmount.toFixed(2)}
              </span>
            </div>
          )} */}
        {/* Final Price */}
        <div className="flex justify-between items-center">
          <span className="text-lg font-semibold">סה״כ מחיר</span>
          <span className="text-xl font-bold text-primary">
            <CountUp
              end={price}
              decimals={2}
              prefix={currencySymbol}
              duration={0.5}
              preserveValue
            />
          </span>
        </div>
        {/* You Save message */}
        {/* {hasDiscount && (
            <div className="text-center py-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <span className="text-green-700 dark:text-green-300 font-medium">
                חסכת ${discountAmount.toFixed(2)}!
              </span>
            </div>
          )} */}
      </div>
    </Card>
  );
}

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