"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Button } from "@workspace/ui";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { useCheckoutSession } from "@/hooks/useCheckoutSession";
import { useCheckoutPayment } from "@/hooks/useCheckoutSteps";

interface PaymentCallbackHandlerProps {
  params: {
    token?: string;
    status?: string;
    transactionId?: string;
    error?: string;
  };
}

export function PaymentCallbackHandler({ params }: PaymentCallbackHandlerProps) {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { session, refetch } = useCheckoutSession(params.token);
  const { handlePayment } = useCheckoutPayment();

  useEffect(() => {
    const processPaymentCallback = async () => {
      if (!params.token) {
        setError("חסר טוקן של סשן התשלום");
        setIsProcessing(false);
        return;
      }

      // Check payment status from callback params
      if (params.status === "success" || params.status === "approved") {
        // Payment was successful
        try {
          // Notify backend about payment completion if transaction ID is provided
          if (params.transactionId) {
            await handlePayment(params.token, params.transactionId);
          }
          
          // Refetch session to get latest status
          await refetch();
          
          // Check if order was created
          if (session?.orderId) {
            // Redirect to order page
            setTimeout(() => {
              router.push(`/order/${session.orderId}`);
            }, 1500);
          } else {
            // Wait for webhook to complete
            setIsProcessing(true);
          }
        } catch (err) {
          console.error("Error processing payment callback:", err);
          setError("שגיאה בעיבוד התשלום");
          setIsProcessing(false);
        }
      } else if (params.status === "failed" || params.status === "cancelled") {
        // Payment failed or was cancelled
        setError(params.error || "התשלום נכשל או בוטל");
        setIsProcessing(false);
      } else {
        // Unknown status - wait for webhook
        setIsProcessing(true);
      }
    };

    processPaymentCallback();
  }, [params, session, refetch, handlePayment, router]);

  // Monitor session for completion
  useEffect(() => {
    if (session?.isComplete && session?.orderId) {
      // Order created successfully
      setTimeout(() => {
        router.push(`/order/${session.orderId}`);
      }, 1500);
    }
  }, [session, router]);

  if (isProcessing) {
    return (
      <Card className="p-8 max-w-md mx-auto text-center" dir="rtl">
        <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
        <h2 className="text-2xl font-bold mb-2">מעבד תשלום</h2>
        <p className="text-muted-foreground">
          אנא המתן בזמן שאנחנו מאשרים את התשלום שלך...
        </p>
        {session?.timeRemaining && (
          <p className="text-sm text-muted-foreground mt-2">
            זמן נותר: {Math.floor(session.timeRemaining / 60)} דקות
          </p>
        )}
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-8 max-w-md mx-auto text-center" dir="rtl">
        <XCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
        <h2 className="text-2xl font-bold mb-2 text-red-600">התשלום נכשל</h2>
        <p className="text-muted-foreground mb-4">{error}</p>
        <div className="space-y-2">
          <Button
            onClick={() => {
              // Go back to checkout with the same token
              if (params.token) {
                router.push(`/checkout?token=${params.token}`);
              } else {
                router.push("/");
              }
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
      <p className="text-muted-foreground">
        מעביר אותך לדף ההזמנה...
      </p>
    </Card>
  );
}