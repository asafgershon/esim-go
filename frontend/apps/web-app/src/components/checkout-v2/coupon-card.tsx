"use client";

import {
  Button,
  Card,
  CardContent,
  Input,
  Label,
} from "@workspace/ui";
import { Ticket as TicketIcon, Loader2 } from "lucide-react";
import { SectionHeader } from "./section-header";
import { Checkout } from "@/__generated__/graphql";
import { gql, useMutation } from "@apollo/client";
import { useState } from "react";

// ✅ GraphQL Mutation
const APPLY_COUPON_TO_CHECKOUT = gql`
  mutation ApplyCouponToCheckout($input: ApplyCouponToCheckoutInput!) {
    applyCouponToCheckout(input: $input) {
      success
      error {
        message
        code
      }
      checkout {
        id
        bundle {
          id
          currency
          price
          pricePerDay
          discounts
        }
      }
    }
  }
`;

type CouponCardProps = {
  completed: boolean;
  sectionNumber?: number;
  data: Pick<Checkout, "auth" | "id"> | undefined;
  loading: boolean;
  onCouponApplied?: (info: {
    priceAfter: number;
    priceBefore: number;
    hasDiscount: boolean;
  }) => void;
};

// ✅ CouponCard Component
export const CouponCard = ({
  sectionNumber,
  completed,
  data,
  loading,
  onCouponApplied,
}: CouponCardProps) => {
  const [coupon, setCoupon] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [applyCoupon, { loading: applying }] = useMutation(
    APPLY_COUPON_TO_CHECKOUT
  );

  if (loading) return <AuthCardSkeleton />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!coupon.trim()) {
      setMessage("אנא הזן קוד קופון");
      return;
    }

    try {
      const { data: res } = await applyCoupon({
        variables: {
          input: {
            sessionId: data?.id || "",
            couponCode: coupon.trim().toUpperCase(),
          },
        },
      });

      const result = res?.applyCouponToCheckout;
      if (!result) {
        setMessage("שגיאה בלתי צפויה");
        return;
      }

      if (result.success) {
        const newPrice = result.checkout.bundle.price;
        const discounts = result.checkout.bundle.discounts || [];
        const discountAmount = discounts.reduce((sum: number, d: number) => sum + d, 0);

          // שולחים רק מה שאתה צריך להצגה
        onCouponApplied?.(result.checkout.bundle);
        setMessage("✅ הקופון הוחל בהצלחה");
      } else {
        setMessage(`❌ ${result.error?.message || "קוד לא תקף"}`);
      }
    } catch (err) {
        console.error("FULL GRAPHQL ERROR:", JSON.stringify(err, null, 2));
        console.error("RAW ERROR:", err);
        setMessage("אירעה שגיאה בעת ניסיון להחיל את הקופון");
    }
  };

  return (
    <Card dir="rtl" className="flex flex-col gap-4 shadow-xl">
      <SectionHeader
        sectionNumber={sectionNumber || 2}
        title="קוד קופון"
        icon={<TicketIcon className="h-5 w-5 text-primary" />}
        isCompleted={completed}
      />
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="coupon">יש לך קוד קופון?</Label>

            <div className="flex items-center gap-2">
              <Input
                id="coupon"
                name="coupon"
                placeholder="הזן קוד קופון"
                className="flex-1 text-[16px]"
                value={coupon}
                onChange={(e) => setCoupon(e.target.value)}
                disabled={applying}
              />
              <Button
                type="submit"
                size="sm"
                disabled={applying}
                className="bg-green-500 hover:bg-green-600 text-white flex items-center gap-1"
              >
                {applying && <Loader2 className="h-4 w-4 animate-spin" />}
                החל
              </Button>
            </div>

            {message && (
              <p
                className={`text-sm mt-2 ${
                  message.startsWith("✅")
                    ? "text-green-600"
                    : "text-red-500"
                }`}
              >
                {message}
              </p>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

// ✅ Skeleton
const AuthCardSkeleton = () => {
  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-6 h-6 md:w-8 md:h-8 bg-gray-200 rounded-full animate-pulse" />
        <div>
          <div className="h-4 md:h-5 w-20 bg-gray-200 rounded animate-pulse mb-1" />
          <div className="h-3 md:h-4 w-16 bg-gray-100 rounded animate-pulse" />
        </div>
      </div>
      <div className="space-y-4">
        <div className="h-10 w-full bg-gray-200 rounded animate-pulse" />
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-32 bg-gray-100 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="h-10 w-full bg-gray-200 rounded animate-pulse" />
          <div className="h-10 w-full bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
    </Card>
  );
};
