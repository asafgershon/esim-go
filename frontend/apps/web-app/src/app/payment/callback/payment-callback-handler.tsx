"use client";

import { gql } from "@apollo/client";
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
    { error, loading },
  ] = useMutation<
    ProcessPaymentCallbackMutation,
    ProcessPaymentCallbackMutationVariables
  >(PROCESS_PAYMENT_CALLBACK_MUTATION, {
    variables: {
      transactionId: transactionID || "",
    },
    onCompleted: (data) => {
      if (data?.processPaymentCallback) {
        // ✅ השאר את המשתמש בעמוד ההצלחה (אין ניתוב)
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
    return (
      <Card className="p-8 max-w-md mx-auto text-center" dir="rtl">
        <Loader2 className="h-12 w-12 mx-auto mb-4 text-green-500 animate-spin" />
        <h2 className="text-2xl font-bold mb-2">מעבד תשלום...</h2>
      </Card>
    );
  }

  return (
  <div
    className="flex min-h-screen items-center justify-center bg-secondary/30 p-4"
    dir="rtl"
  >
    <Card className="w-full max-w-lg p-8 shadow-lg">
      <div className="text-center">
        
        {/* Success Icon */}
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-success/10 p-4">
            <CheckCircle className="h-16 w-16 text-success" />
          </div>
        </div>

        {/* Title */}
        <h1 className="mb-3 text-3xl font-bold text-foreground">
          ההזמנה הושלמה בהצלחה!
        </h1>

        {/* Description */}
        <div className="mb-8 space-y-2 text-muted-foreground">
          <p className="text-lg">
            התשלום התקבל ומעבד התשלום אישר את העסקה.
          </p>
          <p className="text-sm">
            ניתן לסגור את העמוד הזה או לחזור לעמוד הבית.
          </p>
        </div>

        {/* Buttons */}
        <div className="space-y-3">
          <Button
            variant="secondary"
            className="w-full"
            size="lg"
            onClick={() => router.push("/how-to-install")}
          >
           למדריך התקנה
          </Button>
        </div>
      </div>
    </Card>
  </div>
);
}
