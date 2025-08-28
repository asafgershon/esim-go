"use client";

import { gql } from "@/__generated__";
import {
  ProcessPaymentCallbackMutation,
  ProcessPaymentCallbackMutationVariables,
} from "@/__generated__/graphql";
import { useMutation } from "@apollo/client";
import { Button, Card } from "@workspace/ui";
import { CheckCircle, Loader2, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

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
  const { transactionID } = params;
  const hasAttempted = useRef(false);
  
  const [
    processPaymentCallback,
    { error,loading },
  ] = useMutation<
    ProcessPaymentCallbackMutation,
    ProcessPaymentCallbackMutationVariables
  >(PROCESS_PAYMENT_CALLBACK_MUTATION,{
    variables:{
      transactionId: transactionID || "",
    },
    onCompleted: (data) => {
      if (data?.processPaymentCallback) {
        router.push(`/order/${data.processPaymentCallback}`);
      }
    },
  });

  useEffect(() => {
    if (hasAttempted.current) return;
    if (transactionID) {
      hasAttempted.current = true;
      processPaymentCallback();
    }
  }, [transactionID, processPaymentCallback]);
  

  if (error) {
    return (
      <Card className="p-8 max-w-md mx-auto text-center" dir="rtl">
        <XCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
        <h2 className="text-2xl font-bold mb-2 text-red-600">התשלום נכשל</h2>
        <p className="text-muted-foreground mb-4">{error.message}</p>
        <div className="space-y-2">
          <Button
            onClick={() => {
              router.refresh();
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

  if (loading) {
    return     <Card className="p-8 max-w-md mx-auto text-center" dir="rtl">
    <Loader2 className="h-12 w-12 mx-auto mb-4 text-green-500 animate-spin" />
    <h2 className="text-2xl font-bold mb-2">מעביר אותך לדף ההזמנה...</h2>
  </Card>
  }

  return (
    <Card className="p-8 max-w-md mx-auto text-center" dir="rtl">
      <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
      <h2 className="text-2xl font-bold mb-2">התשלום אושר!</h2>
      <p className="text-muted-foreground">מעביר אותך לדף ההזמנה...</p>
    </Card>
  );
}
