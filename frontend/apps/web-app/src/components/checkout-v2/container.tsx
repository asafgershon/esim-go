"use client";

import { useCheckout } from "@/hooks/checkout/useCheckoutV2";
import { useAuth } from "@/hooks/useAuth";
import { useSelectorQueryState } from "@/hooks/useSelectorQueryState";
// --- שינוי 1: מייבאים את הרכיב החדש ---
import { CouponCard } from "./coupon-card"; 
import { DeliveryCard } from "./delivery-card";
import { OrderCard } from "./order-card";
import { PaymentCard } from "./payment-card";

export const CheckoutContainerV2 = () => {
  const { numOfDays, countryId } = useSelectorQueryState();
  const { refreshAuth } = useAuth();
  const { checkout, loading} = useCheckout({
    numOfDays,
    countryId,
  });

  const handleAuthUpdate = () => {
    refreshAuth();
  };

  return (
    <main className="flex flex-col gap-8 max-w-7xl mx-auto">
      <OrderCard
        completed={Boolean(checkout?.bundle?.completed)}
        data={checkout}
        sectionNumber={1}
      />

      {/* --- שינוי 2: משתמשים ברכיב החדש ומסירים props מיותרים --- */}
      <CouponCard
        loading={loading}
        completed={false} // אין לנו עדיין לוגיקה לקופון שהושלם
        data={checkout}
        sectionNumber={2}
      />

       <DeliveryCard
        completed={Boolean(checkout?.delivery?.completed)}
        sectionNumber={3}
        loading={loading}
        data={checkout}
        onDeliveryUpdateAction={handleAuthUpdate}
      />

      <PaymentCard
        completed={Boolean(checkout?.payment?.completed)}
        loading={loading}
        data={checkout}
      />

    </main>
  );
};