"use client";

import { useCheckout } from "@/hooks/checkout/useCheckoutV2";
import { useAuth } from "@/hooks/useAuth";
import { useSelectorQueryState } from "@/hooks/useSelectorQueryState";
import { AuthCard } from "./auth-card";
import { OrderCard } from "./order-card";

export const CheckoutContainerV2 = () => {
  const { numOfDays, countryId } = useSelectorQueryState();
  const { refreshAuth } = useAuth();
  const { data, loading, error, checkout} = useCheckout({
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
        completed={Boolean(data?.checkout.auth?.completed)}
        data={data?.checkout}
        sectionNumber={2}
        onAuthUpdate={handleAuthUpdate}
      />
    </main>
  );
};
