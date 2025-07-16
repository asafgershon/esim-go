"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useSessionToken } from "@/hooks/useSessionToken";
import { useCheckoutSession } from "@/hooks/useCheckoutSession";
import { useCheckoutSteps, useCheckoutPayment } from "@/hooks/useCheckoutSteps";
import { OrderDetailsSection } from "./order-details-section";
import { PaymentSection } from "./payment-section";
import { LoginSection } from "./login-section";
import { DeliveryMethodSection } from "./delivery-method-section";
import { CheckoutStepType } from "@/__generated__/graphql";

export function CheckoutContainer() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const { token, saveToken, clearToken } = useSessionToken();

  // Get checkout parameters from URL
  const numOfDays = parseInt(searchParams.get("numOfDays") || "7");
  const countryId = searchParams.get("countryId") || "";
  const regionId = searchParams.get("regionId") || "";

  // UI state
  const [selectedMethod, setSelectedMethod] = useState<"QR" | "EMAIL">("QR");
  const [email, setEmail] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Backend session
  const {
    session,
    createSession,
    refetch: refetchSession,
    loading: sessionLoading,
    error: sessionError,
  } = useCheckoutSession(token || undefined, isProcessing);

  // Handle session errors (expired token, invalid session, etc.)
  useEffect(() => {
    if (sessionError && token) {
      console.warn("Session error detected, clearing token:", sessionError);
      clearToken();
    }
  }, [sessionError, token, clearToken]);

  // Step and payment hooks
  const { updateStepWithData, updateStepError } = useCheckoutSteps(token || "");
  const { handlePayment } = useCheckoutPayment();

  // Initialize session if needed
  useEffect(() => {
    const initializeSession = async () => {
      // Create new session with current parameters
      if (countryId || regionId) {
        try {
          const result = await createSession({
            variables: { input: { numOfDays, regionId, countryId } },
          });
          const newToken = result.data?.createCheckoutSession?.session?.token;
          if (newToken) {
            saveToken(newToken);
          }
        } catch (error) {
          console.error("Failed to create checkout session:", error);
        }
      }
    };

    // Only create session if we don't have a valid one and have checkout parameters
    if ((countryId || regionId) && !token && !sessionLoading) {
      initializeSession();
    }
  }, [
    numOfDays,
    regionId,
    countryId,
    token,
    createSession,
    saveToken,
    sessionLoading,
  ]);

  // Clear token when checkout parameters change (different order)
  useEffect(() => {
    if (token) {
      clearToken();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [numOfDays, regionId, countryId]); // Only depend on the parameters, not token functions

  // Auto-complete delivery step if auth is already completed when session loads
  useEffect(() => {
    if (
      session &&
      session.steps?.authentication?.completed &&
      !session.steps?.delivery?.completed &&
      token
    ) {
      // User is already authenticated, auto-complete delivery with default QR method
      updateStepWithData(CheckoutStepType.Delivery, {
        method: "QR",
      }).then(() => {
        refetchSession();
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    session?.steps?.authentication?.completed,
    session?.steps?.delivery?.completed,
    token,
    updateStepWithData,
    refetchSession,
  ]);

  const isDeliveryValid =
    selectedMethod === "QR" || (selectedMethod === "EMAIL" && email.length > 3);

  // Delivery step completion or update
  const handleDeliveryUpdate = useCallback(async () => {
    if (updateStepError) {
      console.error("Error updating delivery step", updateStepError);
      return;
    }
    if (token) {
      await updateStepWithData(CheckoutStepType.Delivery, {
        method: selectedMethod,
        email: selectedMethod === "EMAIL" ? email : undefined,
      });
      refetchSession();
    }
  }, [
    token,
    selectedMethod,
    email,
    updateStepWithData,
    refetchSession,
    updateStepError,
  ]);

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

  useEffect(() => {
    // When delivery method changes, update it if the step is already completed.
    if (isDeliveryValid && session?.steps.delivery?.completed) {
      const deliveryData = session.steps.delivery;
      if (
        deliveryData?.method !== selectedMethod ||
        (selectedMethod === "EMAIL" && deliveryData?.email !== email)
      ) {
        console.log(
          "Delivery method changed, updating step",
          deliveryData?.method,
          selectedMethod,
          deliveryData?.email,
          email
        );
        handleDeliveryUpdate();
      }
    }
  }, [selectedMethod, email, isDeliveryValid, session, handleDeliveryUpdate]);

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

  // Poll for webhook completion and redirect
  useEffect(() => {
    if (session?.isComplete && session?.metadata?.orderId) {
      // Webhook has completed successfully - stop processing and redirect
      setIsProcessing(false);
      clearToken();
      router.push(`/order/${session.metadata.orderId}`);
    }
  }, [session, clearToken, router]);

  // UI helpers
  const canSubmitPayment = session?.steps.authentication?.completed;

  // Loading and error states
  if (sessionLoading) {
    return <div className="p-8 text-center">טוען...</div>;
  }
  if (sessionError) {
    return (
      <div className="p-8 text-center text-red-500">שגיאה בטעינת ההזמנה</div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto" dir="rtl">
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Left Column - Order Details */}
        <div className="space-y-6">
          <OrderDetailsSection
            numOfDays={numOfDays}
            countryId={countryId}
            tripId={regionId}
            totalPrice={session?.pricing?.total || 0}
            sectionNumber={1}
          />
          <DeliveryMethodSection
            sectionNumber={2}
            selectedMethod={selectedMethod}
            setSelectedMethod={setSelectedMethod}
            email={email}
            setEmail={setEmail}
          />
        </div>
        {/* Right Column - Payment & Login */}
        <div className="space-y-6">
          <LoginSection sectionNumber={3} />
          <PaymentSection
            sectionNumber={4}
            cardNumber={cardNumber}
            setCardNumber={setCardNumber}
            expiry={expiry}
            setExpiry={setExpiry}
            cvv={cvv}
            setCvv={setCvv}
            onPaymentSubmit={handlePaymentSubmit}
            isProcessing={isProcessing}
            canSubmit={canSubmitPayment}
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
