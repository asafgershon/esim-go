"use client";

import { gql, useMutation } from "@apollo/client"; // ✅ ודא ייבוא
import {
  TriggerCheckoutPaymentMutation,
  TriggerCheckoutPaymentMutationVariables
} from "@/__generated__/graphql"; // ✅ ודא ייבוא
import { useCheckout } from "@/hooks/checkout/useCheckoutV2";
import { useAuth } from "@/hooks/useAuth";
import { CouponCard } from "./coupon-card";
import { DeliveryCard } from "./delivery-card";
import { OrderCard } from "./order-card";
import { useState } from "react";
import { Checkout } from "@/__generated__/graphql";
import { CheckoutErrorBoundary } from "./error-boundary";
import { Card } from "@workspace/ui";
// import { PaymentCard } from "./payment-card"; // עדיין מייבאים אותו

// ✅ המוטציה שהועברה לכאן
const UPDATE_CHECKOUT_PAYMENT_MUTATION = gql(`
  mutation TriggerCheckoutPayment($sessionId: String!, $nameForBilling: String, $redirectUrl: String!) {
    triggerCheckoutPayment(sessionId: $sessionId, nameForBilling: $nameForBilling, redirectUrl: $redirectUrl) {
      intent {
        id
        url
        applePayJavaScriptUrl
      }
      # שדות נוספים אם צריך
    }
  }
`);

export const CheckoutContainerV2 = () => {
  const { refreshAuth } = useAuth();
  const { checkout, loading, error } = useCheckout();
  const [updatedPricing, setUpdatedPricing] = useState<{
    priceAfter: number;
    priceBefore: number;
    hasDiscount: boolean;
  } | null>(null);
  // ✅ ההוק של התשלום הועבר לכאן
  const [triggerCheckoutPayment, { loading: triggerLoading, error: triggerError }] =
    useMutation<TriggerCheckoutPaymentMutation, TriggerCheckoutPaymentMutationVariables>(
      UPDATE_CHECKOUT_PAYMENT_MUTATION
    );

  const handleAuthUpdate = () => {
    refreshAuth();
  };

  // 🛡️ Show error state if checkout data is invalid
  if (error && !loading) {
    return (
      <Card className="p-8 text-center border-red-500" dir="rtl">
        <h2 className="text-2xl font-bold mb-4 text-red-600">
          שגיאה בטעינת נתוני הסשן
        </h2>
        <p className="text-gray-600 mb-4">
          לא הצלחנו לטעון את פרטי ההזמנה. אנא נסה שוב.
        </p>
        <button
          onClick={() => window.location.href = '/'}
          className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
        >
          חזור לדף הבית
        </button>
      </Card>
    );
  }

  return (
    <CheckoutErrorBoundary>
      <main className="flex flex-col gap-8 max-w-7xl mx-auto">
        <OrderCard
          completed={Boolean(checkout?.bundle?.completed)}
          updatedPricing={updatedPricing}
          data={checkout}
          sectionNumber={1}
        />

        <CouponCard
          loading={loading}
          onCouponApplied={(bundle) => setUpdatedPricing(bundle)}
          completed={false} // לוגיקה זמנית
          data={checkout}
          sectionNumber={2}
        />

        {/* ✅ מעבירים את הפונקציה והטעינה ל-DeliveryCard */}
        <DeliveryCard
          completed={Boolean(checkout?.delivery?.completed)}
          sectionNumber={3}
          loading={loading} // הטעינה הכללית
          data={checkout}
          onDeliveryUpdateAction={handleAuthUpdate}
          // 👇👇👇 הוספנו את ה-props החדשים האלה 👇👇👇
          triggerPayment={triggerCheckoutPayment}
          isPaymentLoading={triggerLoading}
          paymentError={triggerError}
        />

        {/* ⚠️ נשאיר את PaymentCard בינתיים, אולי נצטרך חלקים ממנו לעיצוב */}
        {/* אפשר להסתיר אותו לגמרי עם תנאי אם רוצים */}
        {/* <PaymentCard
        completed={Boolean(checkout?.payment?.completed)}
        loading={loading} // רק הטעינה הכללית
        data={checkout}
      /> 
      */}
      </main>
    </CheckoutErrorBoundary>
  );
};