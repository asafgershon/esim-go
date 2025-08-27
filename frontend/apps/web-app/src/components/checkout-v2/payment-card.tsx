"use client";
import { gql } from "@/__generated__";
import {
  Checkout,
  TriggerCheckoutPaymentMutation,
  TriggerCheckoutPaymentMutationVariables,
} from "@/__generated__/graphql";
import { useMutation } from "@apollo/client";
import { Button, Card } from "@workspace/ui";
import { useEffect, useMemo } from "react";

type PaymentCardProps = {
  completed: boolean;
  data: Pick<Checkout, "payment" | "id" | "auth" | "delivery"> | undefined;
  loading: boolean;
};

const UPDATE_CHECKOUT_PAYMENT_MUTATION = gql(`
  mutation TriggerCheckoutPayment($sessionId: String!, $nameForBilling: String, $redirectUrl: String!) {
    triggerCheckoutPayment(sessionId: $sessionId, nameForBilling: $nameForBilling, redirectUrl: $redirectUrl) {
      intent {
        id
        url
        applePayJavaScriptUrl
      }
      phone
      email
      nameForBilling
    }
  }
`);

export const PaymentCard = ({
  data,
  loading,
}: PaymentCardProps) => {
  const { payment, auth } = data || {};

  const [triggerCheckoutPayment] = useMutation<
    TriggerCheckoutPaymentMutation,
    TriggerCheckoutPaymentMutationVariables
  >(UPDATE_CHECKOUT_PAYMENT_MUTATION);

  useEffect(() => {
    if (auth?.completed && data?.id) {
      triggerCheckoutPayment({
        variables: {
          sessionId: data?.id,
          nameForBilling: payment?.nameForBilling,
          redirectUrl: process.env.NODE_ENV === "production" ? `${window.location.href}/payment/callback` : "https://app.hiilo.yarinsa.me/payment/callback",
        },
      });
    }
  }, [
    auth?.completed,
    payment?.nameForBilling,
    data?.id,
    triggerCheckoutPayment,
  ]);

  const getButtonLabel = () => {
    if (loading) return "מעביר לתשלום...";
    return "המשך לתשלום";
  };

  if (loading) return <DeliveryCardSkeleton />;

  return (
    <Card dir="rtl" className="flex flex-col gap-4 shadow-xl h-fit">
      <Button
        disabled={!payment?.intent?.url}
        type="button"
        className="w-full"
        onClick={() => window.open(payment?.intent?.url, "_blank")}
      >
        {getButtonLabel()}
      </Button>
    </Card>
  );
};

const DeliveryCardSkeleton = () => {
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
        <div className="space-y-2">
          <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
          <div className="h-10 w-full bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="space-y-2">
          <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
          <div className="h-10 w-full bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
    </Card>
  );
};
