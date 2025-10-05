"use client";

import { Checkout } from "@/__generated__/types";
import { Card, Button, Input } from "@workspace/ui";
import { Loader2Icon, ShoppingCart, GiftIcon, UserIcon } from "lucide-react";
import { lazy, useEffect, useState } from "react";
import { SectionHeader } from "./section-header";
import Image from "next/image";

const CountUp = lazy(() => import("react-countup"));

interface OrderDetailsSectionProps {
  data: Pick<Checkout, "bundle"> | undefined;
  sectionNumber?: number;
}

export function OrderCard({ data, sectionNumber }: OrderDetailsSectionProps) {
  const [isCompleted, setIsCompleted] = useState(false);
  const [coupon, setCoupon] = useState("");
  const [couponMessage, setCouponMessage] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [confirmEmail, setConfirmEmail] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setIsCompleted(true), 800); // זמן טעינה מדומה
    return () => clearTimeout(timer);
  }, []);

  if (!data || !data.bundle) return <OrderDetailsSkeleton />;

  const { bundle } = data;
  const { price, numOfDays, country, pricePerDay } = bundle;

  const currencySymbol =
    Intl.NumberFormat("en-US", { style: "currency", currency: "USD" })
      .formatToParts(price || 0)
      .find((part) => part.type === "currency")?.value || "";

  const Row = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );

  const handleApplyCoupon = () => {
    if (coupon.trim().toLowerCase() === "discount10") {
      setCouponMessage("🎉 קוד הקופון הופעל! קיבלת 10% הנחה");
    } else {
      setCouponMessage("❌ קוד הקופון שהוזן אינו תקף");
    }
  };

  const handleGoogleLogin = () => {
    alert("חיבור עם Google (בשלב זה Mock בלבד)");
  };

  const emailsMatch = email && confirmEmail && email === confirmEmail;

  return (
    <div className="flex flex-col gap-8 max-w-lg mx-auto mt-6">
      {/* 1️⃣ פרטי הזמנה */}
      <Card dir="rtl" className="flex flex-col gap-4 shadow-xl">
        <div className="flex items-center gap-2">
          <SectionHeader
            sectionNumber={sectionNumber || 1}
            title="פרטי הזמנה"
            icon={<ShoppingCart className="h-5 w-5 text-primary" />}
            isCompleted={isCompleted}
          />
          {!isCompleted && (
            <span
              dir="ltr"
              className="h-full text-sm text-muted-foreground flex items-center gap-1"
            >
              ...מוודא זמינות מול הספק
              <Loader2Icon className="h-4 w-4 text-muted-foreground animate-spin" />
            </span>
          )}
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
            <Row
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
            />
          </div>
        </div>

        {/* Pricing Section */}
        <div className="border-t pt-4 space-y-3">
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
        </div>
      </Card>

      {/* 2️⃣ קוד קופון */}
      <Card dir="rtl" className="flex flex-col gap-4 shadow-xl p-5">
        <SectionHeader
          sectionNumber={2}
          title="קוד קופון"
          icon={<GiftIcon className="h-5 w-5 text-primary" />}
        />

        <div className="flex gap-2">
          <Input
            placeholder="הזן קוד קופון"
            value={coupon}
            onChange={(e) => setCoupon(e.target.value)}
            className="text-right"
          />
          <Button onClick={handleApplyCoupon}>החל</Button>
        </div>

        {couponMessage && (
          <p
            className={`text-sm font-medium ${
              couponMessage.includes("❌")
                ? "text-red-600"
                : "text-green-600"
            }`}
          >
            {couponMessage}
          </p>
        )}
      </Card>

      {/* 3️⃣ פרטי משלוח */}
      <Card dir="rtl" className="flex flex-col gap-4 shadow-xl p-5">
        <SectionHeader
          sectionNumber={3}
          title="פרטי משלוח"
          icon={<UserIcon className="h-5 w-5 text-primary" />}
        />

        {/* התחברות עם Google */}
        <Button
          variant="outline"
          onClick={handleGoogleLogin}
          className="flex items-center gap-2 justify-center"
        >
          <Image
            src="https://www.svgrepo.com/show/475656/google-color.svg"
            alt="Google"
            width={18}
            height={18}
          />
          התחבר עם Google
        </Button>

        {/* או הזנת מייל כפול */}
        <div className="flex flex-col gap-3 mt-2">
          <div>
            <label className="text-sm font-medium">כתובת אימייל</label>
            <Input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="text-right"
            />
          </div>

          <div>
            <label className="text-sm font-medium">אימות אימייל</label>
            <Input
              type="email"
              placeholder="הקלד שוב את האימייל"
              value={confirmEmail}
              onChange={(e) => setConfirmEmail(e.target.value)}
              onPaste={(e) => e.preventDefault()} // ❌ מניעת הדבקה
              className="text-right"
            />
            {confirmEmail && !emailsMatch && (
              <p className="text-sm text-red-600 mt-1">האימיילים אינם תואמים</p>
            )}
          </div>
        </div>

        <Button
          disabled={!emailsMatch}
          className="mt-3"
        >
          המשך לתשלום
        </Button>
      </Card>
    </div>
  );
}

const OrderDetailsSkeleton = () => (
  <Card className="p-6">
    <div className="flex items-center gap-3 mb-4">
      <div className="w-6 h-6 md:w-8 md:h-8 bg-gray-200 rounded-full animate-pulse" />
      <div>
        <div className="h-4 md:h-5 w-24 bg-gray-200 rounded animate-pulse mb-1" />
        <div className="h-3 md:h-4 w-16 bg-gray-100 rounded animate-pulse" />
      </div>
    </div>

    <div className="space-y-4">
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
