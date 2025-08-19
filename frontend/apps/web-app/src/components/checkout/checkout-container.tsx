"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useCheckoutUrlState } from "@/hooks/useCheckoutUrlState";
import { useCheckoutSession } from "@/hooks/useCheckoutSession";
import { useCheckoutSteps, useCheckoutPayment } from "@/hooks/useCheckoutSteps";
import { useOrderValidation } from "@/hooks/useOrderValidation";
import { OrderDetailsSection } from "./order-details-section";
import { PaymentSection } from "./payment-section";
import { LoginSection } from "./login-section";
import { DeliveryMethodSection } from "./delivery-method-section";
import { CheckoutSkeleton } from "./checkout-skeleton";
import { CheckoutStepType } from "@/__generated__/graphql";
import { ErrorDisplay } from "@/components/error-display";
import { parseGraphQLError, ErrorType } from "@/lib/error-types";

interface PaymentIntentUrls {
  paymentIntentId?: string;
  url?: string;
  applePayJavaScriptUrl?: string;
}

export function CheckoutContainer() {
  const router = useRouter();
  const { user } = useAuth();
  
  // URL state management with nuqs
  const {
    token,
    setToken,
    hasToken,
    clearCheckoutState,
  } = useCheckoutUrlState();

  // UI state
  const [isProcessing, setIsProcessing] = useState(false);
  const [validationStatus, setValidationStatus] = useState<"pending" | "valid" | "invalid" | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  
  // Default to EMAIL delivery method since we're not selecting anymore
  const [selectedMethod] = useState<"QR" | "EMAIL">("EMAIL");
  const [email] = useState("");

  // Backend session
  const {
    session,
    refetch: refetchSession,
    loading: sessionLoading,
    error: sessionError,
  } = useCheckoutSession(token as string | undefined);

  // Step and payment hooks
  const { updateStepWithData } = useCheckoutSteps((token as string) || "");
  const { handlePayment } = useCheckoutPayment();
  
  // Order validation hook
  const { validateOrder } = useOrderValidation();

  // Handle session errors (expired token, invalid session, etc.)
  useEffect(() => {
    if (sessionError && token) {
      console.warn("Session error detected, clearing token:", sessionError);
      setToken("");
    }
  }, [sessionError, token, setToken]);

  // Note: Token clearing when params change is now handled by updateCheckoutParams in useCheckoutUrlState

  // Validate order when session and plan snapshot are available
  useEffect(() => {
    const performValidation = async () => {
      if (session?.planSnapshot && validationStatus === null) {
        setValidationStatus("pending");
        setValidationError(null);
        
        try {
          console.log("Session planSnapshot:", session.planSnapshot);
          
          const planSnapshot = session.planSnapshot as { name?: string };
          const bundleName = planSnapshot?.name;
          
          if (!bundleName) {
            throw new Error("Bundle name not found in plan snapshot");
          }
          
          const quantity = 1; // Always 1 for now
          const customerReference = session.orderId;
          
          console.log("Validating order:", { bundleName, quantity, customerReference });
          
          const result = await validateOrder(bundleName, quantity, customerReference || undefined);
          
          if (result?.success && result?.isValid) {
            setValidationStatus("valid");
            setValidationError(null);
            console.log("Order validation successful");
          } else {
            setValidationStatus("invalid");
            const errorMessage = result?.appError?.message || result?.error || "Order validation failed";
            setValidationError(errorMessage);
            console.warn("Order validation failed:", errorMessage, result?.appError);
          }
        } catch (error) {
          setValidationStatus("invalid");
          setValidationError("Failed to validate order");
          console.error("Order validation error:", error);
        }
      }
    };

    performValidation();
  }, [session?.planSnapshot, session?.orderId, validationStatus, validateOrder]);

  // Auto-complete delivery step if auth is already completed when session loads
  useEffect(() => {
    if (
      session &&
      session.steps?.authentication?.completed &&
      !session.steps?.delivery?.completed &&
      token
    ) {
      // User is already authenticated, auto-complete delivery with EMAIL method
      // The actual email will be determined based on auth type
      const deliveryEmail = user?.email && !user.email.includes('@phone.esim-go.com') ? user.email : undefined;
      updateStepWithData(CheckoutStepType.Delivery, {
        method: "EMAIL",
        email: deliveryEmail,
      }).then(() => {
        refetchSession();
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    session?.steps?.authentication?.completed,
    session?.steps?.delivery?.completed,
    token,
    user?.email,
    updateStepWithData,
    refetchSession,
  ]);


  // Delivery step is now handled automatically after auth
  // Remove manual delivery update since it's automatic

  // Auth step completion
  const handleAuthComplete = useCallback(async () => {
    if (token && user) {
      console.log("handleAuthComplete", user.id);
      await updateStepWithData(CheckoutStepType.Authentication, {
        userId: user.id,
      });
      refetchSession();
    }
  }, [token, user, updateStepWithData, refetchSession]);

  useEffect(() => {
    // When user authenticates, complete the auth step (only if not already completed)
    if (
      user &&
      session &&
      (!session.steps.authentication?.completed ||
        !session.steps.authentication?.userId)
    ) {
      handleAuthComplete();
    }
  }, [user, session, handleAuthComplete]);

  // Payment callback from PaymentSection
  const handlePaymentSubmit = useCallback(
    async (paymentMethodId: string) => {
      if (!token) return;
      setIsProcessing(true);
      try {
        // Send payment method to backend - this triggers webhook waiting process
        // Backend will wait for payment provider webhook to confirm final status
        const result = await handlePayment(token, paymentMethodId);
        if (result.data?.processCheckoutPayment?.success) {
          // Payment initiated successfully - backend is now waiting for webhook
          // Start polling to monitor webhook completion
          await refetchSession();
        }
      } catch {
        // handle error - stop processing on actual errors
        setIsProcessing(false);
      }
      // Note: We don't setIsProcessing(false) on success because we need to keep
      // polling until the webhook completes and session.isComplete = true
    },
    [token, handlePayment, refetchSession]
  );

  // Handle webhook completion and redirect (now triggered by subscription)
  useEffect(() => {
    if (session?.isComplete && session?.orderId) {
      // Webhook has completed successfully - stop processing and redirect
      setIsProcessing(false);
      
      // Small delay to ensure UI updates before navigation
      setTimeout(() => {
        router.push(`/order/${session.orderId}`);
      }, 100);

      return () => {
        // clearCheckoutState();
      }
    }
  }, [session, clearCheckoutState, router]);

  // UI helpers
  const canSubmitPayment = session?.steps.authentication?.completed && 
    validationStatus === "valid" && 
    user?.firstName && 
    user?.lastName;

  // Session creation is now handled server-side
  // If we don't have a token, the server should have redirected us
  if (!hasToken) {
    return <CheckoutSkeleton />;
  }

  // Loading and error states
  // Show skeleton until we have both token AND session data loaded
  if (sessionLoading || !session) {
    return <CheckoutSkeleton />;
  }
  if (sessionError) {
    return (
      <div className="max-w-2xl mx-auto p-4">
        <ErrorDisplay
          error={parseGraphQLError(sessionError)}
          onRetry={() => {
            setToken(""); // Clear token to restart session creation
            refetchSession();
          }}
          onGoHome={() => clearCheckoutState()}
        />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto" dir="rtl">
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Left Column - Order Details */}
        <div className="space-y-6">
          <OrderDetailsSection
            session={session}
            sectionNumber={1}
            validationStatus={validationStatus}
            isCompleted={validationStatus === "valid"}
          />
          
          {/* Validation Error Display */}
          {validationStatus === "invalid" && validationError && (
            <ErrorDisplay
              error={{
                type: ErrorType.VALIDATION_FAILED,
                message: validationError,
                retryable: true,
              }}
              onRetry={() => {
                setValidationStatus(null);
                setValidationError(null);
                // Trigger re-validation
                if (session?.planSnapshot) {
                  const planSnapshot = session.planSnapshot as { name?: string };
                  const bundleName = planSnapshot?.name;
                  if (bundleName) {
                    validateOrder(bundleName, 1, session.orderId || undefined);
                  }
                }
              }}
              compact
            />
          )}
        </div>
        {/* Right Column - Payment & Login */}
        <div className="space-y-6">
          <LoginSection sectionNumber={2} />
          
          <DeliveryMethodSection
            sectionNumber={3}
            selectedMethod={selectedMethod}
            setSelectedMethod={() => {}}
            email={email}
            setEmail={() => {}}
            isCompleted={!!session?.steps?.delivery?.completed}
          />
          
          <PaymentSection
            sectionNumber={4}
            onPaymentSubmit={handlePaymentSubmit}
            isProcessing={isProcessing}
            canSubmit={canSubmitPayment}
            isCompleted={!!session?.steps?.payment?.completed}
            paymentIntentUrls={(session?.metadata as Record<string, unknown>)?.paymentIntent as PaymentIntentUrls}
          />
          {/* Payment processing screen */}
          {isProcessing && (
            <div className="p-6 text-center">
              <div className="spinner mb-2">מעבד תשלום...</div>
              <p>אנא המתן, אנחנו מעבדים את ההזמנה שלך</p>
              {session?.timeRemaining && (
                <p>זמן נותר: {Math.floor(session.timeRemaining / 60)} דקות</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
