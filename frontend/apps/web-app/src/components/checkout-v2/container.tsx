"use client";

import { useCheckout } from "@/hooks/checkout/useCheckoutV2";
import { useAuth } from "@/hooks/useAuth";
import { useSelectorQueryState } from "@/hooks/useSelectorQueryState";
import { AuthCard } from "./auth-card";
import { DeliveryCard } from "./delivery-card";
import { OrderCard } from "./order-card";
import { PaymentCard } from "./payment-card";

export const CheckoutContainerV2 = () => {
  const { numOfDays, countryId } = useSelectorQueryState();
  const { refreshAuth } = useAuth();
  const { data, loading} = useCheckout({
    numOfDays,
    countryId,
  });

  const handleAuthUpdate = () => {
    refreshAuth();
  };

  //   if (loading) return <div>Loading...</div>;
  //   if (error) return <div>Error: {error.message}</div>;
  //   if (!data) return <div>No data</div>;

  return (
    <main className="flex flex-col gap-8 max-w-7xl mx-auto">
      <OrderCard
        completed={Boolean(data?.checkout.bundle?.completed)}
        data={data?.checkout}
        sectionNumber={1}
      />

      <AuthCard
        loading={loading}
        completed={Boolean(data?.checkout.auth?.completed)}
        data={data?.checkout}
        sectionNumber={2}
        onAuthUpdate={handleAuthUpdate}
      />

       <DeliveryCard
        completed={Boolean(data?.checkout.delivery?.completed)}
        sectionNumber={3}
        loading={loading}
        data={data?.checkout}
        onDeliveryUpdate={handleAuthUpdate}
      />

      <PaymentCard
        completed={Boolean(data?.checkout.payment?.completed)}
        loading={loading}
        data={data?.checkout}
      />

    </main>
  );
};
