"use client";

import { gql } from "@/__generated__";
import {
  ProcessPaymentCallbackMutation,
  ProcessPaymentCallbackMutationVariables,
} from "@/__generated__/graphql";
import { useCheckoutPayment } from "@/hooks/useCheckoutSteps";
import { useMutation } from "@apollo/client";
import { Button, Card } from "@workspace/ui";
import { CheckCircle, Loader2, XCircle } from "lucide-react";
import { Jacques_Francois } from "next/font/google";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface PaymentCallbackHandlerProps {
  params: {
    transactionID?: string;
  };
}

const PROCESS_PAYMENT_CALLBACK_MUTATION = gql(`
  mutation ProcessPaymentCallback($transactionId: String!) {
    processPaymentCallback(transactionId: $transactionId)
  }
`);

export function PaymentCallbackHandler({
  params,
}: PaymentCallbackHandlerProps) {
  const router = useRouter();
  const [processPaymentCallback, { error, loading: isProcessing }] =
    useMutation<
      ProcessPaymentCallbackMutation,
      ProcessPaymentCallbackMutationVariables
    >(PROCESS_PAYMENT_CALLBACK_MUTATION);
  const { handlePayment } = useCheckoutPayment();

  useEffect(() => {
    if (error || isProcessing) {
      return;
    }

    const handlePaymentCallback = async () => {
      if (!params.transactionID) {
        throw new Error("Transaction ID is required");
      }

      const { data } = await processPaymentCallback({
        variables: { transactionId: params.transactionID },
      });

      if (data?.processPaymentCallback) {
        router.push(`/orders/orderId`);
      } else {
        throw new Error("Failed to process payment callback");
      }
    };

    handlePaymentCallback();
  }, [params, handlePayment, router, processPaymentCallback]);


  if (error) {
    return (
      <Card className="p-8 max-w-md mx-auto text-center" dir="rtl">
        <XCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
        <h2 className="text-2xl font-bold mb-2 text-red-600">התשלום נכשל</h2>
        <p className="text-muted-foreground mb-4">{error.message}</p>
        <div className="space-y-2">
          <Button
            onClick={() => {
              router.push("/");
            }}
            className="w-full"
          >
            נסה שוב
          </Button>
          <Button
            onClick={() => router.push("/")}
            variant="outline"
            className="w-full"
          >
            חזור לדף הבית
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-8 max-w-md mx-auto text-center" dir="rtl">
      <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
      <h2 className="text-2xl font-bold mb-2">התשלום אושר!</h2>
      <p className="text-muted-foreground">מעביר אותך לדף ההזמנה...</p>
    </Card>
  );
}
