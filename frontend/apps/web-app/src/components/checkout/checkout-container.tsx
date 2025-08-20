"use client";

import { useState, useCallback, useEffect } from "react";
import { useCheckoutUrlState } from "@/hooks/useCheckoutUrlState";
import { useCheckoutSession } from "@/hooks/useCheckoutSession";
import { useCheckoutSteps, useCheckoutPayment } from "@/hooks/useCheckoutSteps";
import { useCheckoutValidation } from "@/hooks/checkout/useCheckoutValidation";
import { useCheckoutStateMachine } from "@/hooks/checkout/useCheckoutStateMachine";
import { useCheckoutAutoComplete } from "@/hooks/checkout/useCheckoutAutoComplete";
import { OrderDetailsSection } from "./order-details-section";
import { PaymentSection } from "./payment-section";
import { LoginSection } from "./login-section";
import { DeliveryMethodSection } from "./delivery-method-section";
import { CheckoutSkeleton } from "./checkout-skeleton";
import { ErrorDisplay } from "@/components/error-display";
import { parseGraphQLError, ErrorType } from "@/lib/error-types";
import { extractPaymentIntentUrls, formatTimeRemaining, extractBundleName } from "@/utils/checkout-helpers";

export function CheckoutContainer() {
  // Core hooks
  const {
    token,
    setToken,
    hasToken,
    clearCheckoutState,
  } = useCheckoutUrlState();

  // Session management
  const {
    session,
    refetch: refetchSession,
    loading: sessionLoading,
    error: sessionError,
  } = useCheckoutSession(token as string | undefined);

  // Step management
  const { updateStepWithData } = useCheckoutSteps((token as string) || "");
  const { handlePayment } = useCheckoutPayment();

  // Validation hook
  const {
    validationStatus,
    validationError,
    retryValidation,
  } = useCheckoutValidation({ session });

  // State machine hook
  const {
    isProcessing,
    canSubmitPayment,
    startProcessing,
    stopProcessing,
  } = useCheckoutStateMachine({
    session,
    validationStatus,
    token: token as string | undefined,
  });

  // Auto-complete hook
  useCheckoutAutoComplete({
    session,
    token: token as string | undefined,
    updateStepWithData,
    refetchSession,
  });

  // Fixed delivery method (always EMAIL for now)
  const [selectedMethod] = useState<"QR" | "EMAIL">("EMAIL");
  const [email] = useState("");

  // Handle session errors (expired token, invalid session, etc.)
  useEffect(() => {
    if (sessionError && token) {
      console.warn("Session error detected, clearing token:", sessionError);
      setToken("");
    }
  }, [sessionError, token, setToken]);

  // Payment submission handler
  const handlePaymentSubmit = useCallback(
    async (paymentMethodId: string) => {
      if (!token) return;
      
      startProcessing();
      try {
        const result = await handlePayment(token, paymentMethodId);
        if (result.data?.processCheckoutPayment?.success) {
          await refetchSession();
        }
      } catch (error) {
        console.error("Payment processing error:", error);
        stopProcessing();
      }
    },
    [token, handlePayment, refetchSession, startProcessing, stopProcessing]
  );

  // Retry validation handler
  const handleRetryValidation = useCallback(() => {
    retryValidation();
    const bundleName = extractBundleName(session?.planSnapshot);
    if (bundleName && session) {
      // Validation will auto-trigger via the hook
      console.log("Retrying validation for bundle:", bundleName);
    }
  }, [retryValidation, session]);

  // Loading states
  if (!hasToken) {
    return <CheckoutSkeleton />;
  }

  if (sessionLoading || !session) {
    return <CheckoutSkeleton />;
  }

  // Error state
  if (sessionError) {
    return (
      <div className="max-w-2xl mx-auto p-4">
        <ErrorDisplay
          error={parseGraphQLError(sessionError)}
          onRetry={() => {
            setToken("");
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
              onRetry={handleRetryValidation}
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
            paymentIntentUrls={extractPaymentIntentUrls(session?.metadata)}
          />

          {/* Payment processing screen */}
          {isProcessing && (
            <div className="p-6 text-center">
              <div className="spinner mb-2">מעבד תשלום...</div>
              <p>אנא המתן, אנחנו מעבדים את ההזמנה שלך</p>
              {session?.timeRemaining && (
                <p>זמן נותר: {formatTimeRemaining(session.timeRemaining)}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}