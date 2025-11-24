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

  console.log("========== COUPON RESPONSE START ==========");

  console.log("RAW RES:", res);
  console.log("applyCouponToCheckout:", res?.applyCouponToCheckout);

  const result = res?.applyCouponToCheckout;

  console.log("✔️ success:", result?.success);
  console.log("❌ error:", result?.error);
  console.log("📦 checkout:", result?.checkout);

  if (result?.checkout) {
    console.log("checkout keys:", Object.keys(result.checkout));
  }

  console.log("📦 checkout.bundle:", result?.checkout?.bundle);

  if (result?.checkout?.bundle) {
    console.log("bundle keys:", Object.keys(result.checkout.bundle));
    console.log("bundle JSON:", JSON.stringify(result.checkout.bundle, null, 2));
  }

  console.log("📌 bundle.price:", result?.checkout?.bundle?.price);
  console.log("📌 bundle.discounts:", result?.checkout?.bundle?.discounts);

  if (Array.isArray(result?.checkout?.bundle?.discounts)) {
    console.log(
      "discounts array detail:",
      result.checkout.bundle.discounts.map((d:number, i:number) => ({
        index: i,
        type: typeof d,
        value: d,
      }))
    );
  }

  console.log("========== COUPON RESPONSE END ==========");

  // ==== existing logic ====

  if (!result) {
    setMessage("שגיאה בלתי צפויה");
    return;
  }

  if (result.success) {
    onCouponApplied?.(result.checkout.bundle);
    setMessage("✅ הקופון הוחל בהצלחה");
  } else {
    setMessage(`❌ ${result.error?.message || "קוד לא תקף"}`);
  }
} catch (err:any) {
  console.log("========== COUPON ERROR ==========");

  console.error("FULL ERROR OBJECT:", err);
  console.error("GRAPHQL ERRORS:", err?.graphQLErrors);
  console.error("NETWORK ERROR:", err?.networkError);

  // ניסוי לתפוס עוד מידע
  try {
    console.error(
      "STRINGIFIED ERROR:",
      JSON.stringify(err, Object.getOwnPropertyNames(err), 2)
    );
  } catch {}

  console.log("========== END ERROR ==========");

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
