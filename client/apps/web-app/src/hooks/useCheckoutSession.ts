import { useEffect } from "react";
import {
  GetCheckoutSessionQuery,
  GetCheckoutSessionQueryVariables,
  CheckoutSessionUpdatedSubscription,
  CheckoutSessionUpdatedSubscriptionVariables,
} from "@/__generated__/graphql";
import {
  GetCheckoutSession,
  CheckoutSessionUpdated,
} from "@/lib/graphql/checkout";
import { useQuery, useSubscription } from "@apollo/client";

export const useCheckoutSession = (token?: string) => {
  // Initial query to get the session
  const { data, loading, error, refetch } = useQuery<
    GetCheckoutSessionQuery,
    GetCheckoutSessionQueryVariables
  >(GetCheckoutSession, {
    variables: { token: token! },
    skip: !token,
    // Remove polling since we'll use subscription
    pollInterval: 0,
  });

  // Subscribe to session updates
  const { data: subscriptionData } = useSubscription<
    CheckoutSessionUpdatedSubscription,
    CheckoutSessionUpdatedSubscriptionVariables
  >(CheckoutSessionUpdated, {
    variables: { token: token! },
    skip: !token, // Subscribe whenever we have a token
  });

  // Merge subscription data with query data
  const session = subscriptionData?.checkoutSessionUpdated?.session || 
                  data?.getCheckoutSession?.session;

  // Refetch when subscription indicates completion
  useEffect(() => {
    if (subscriptionData?.checkoutSessionUpdated?.updateType === "PAYMENT_COMPLETED") {
      refetch();
    }
  }, [subscriptionData, refetch]);

  return {
    session,
    refetch,
    loading,
    error,
  };
};
