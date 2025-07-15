"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card } from "@workspace/ui";
import { Button } from "@workspace/ui";
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
  const { isAuthenticated, user } = useAuth();
  const { token, saveToken, clearToken } = useSessionToken();

  // Get checkout parameters from URL
  const numOfDays = parseInt(searchParams.get("numOfDays") || "7");
  const countryId = searchParams.get("countryId");
  const tripId = searchParams.get("tripId");
  const planId = countryId || tripId || "";

  // UI state
  const [selectedMethod, setSelectedMethod] = useState<"qr" | "email">("qr");
  const [email, setEmail] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState<CheckoutStepType | null>(null);

  // Backend session
  const {
    session,
    createSession,
    refetch: refetchSession,
    loading: sessionLoading,
    error: sessionError,
  } = useCheckoutSession(token || undefined, isProcessing);

  // Step and payment hooks
  const { updateStepWithData } = useCheckoutSteps(token || "");
  const { handlePayment } = useCheckoutPayment();

  // Initialize session if needed
  useEffect(() => {
    if (!token && planId) {
      (async () => {
        try {
          const result = await createSession({ variables: { input: { planId } } });
          const newToken = result.data?.createCheckoutSession?.session?.token;
          if (newToken) {
            saveToken(newToken);
          }
        } catch {
          // handle error
        }
      })();
    }
  }, [token, planId, createSession, saveToken]);

  // Set current step from backend session
  useEffect(() => {
    if (session?.steps) {
      if (!session.steps.authentication?.completed) setCurrentStep(CheckoutStepType.Authentication);
      else if (!session.steps.delivery?.completed) setCurrentStep(CheckoutStepType.Delivery);
      else if (!session.steps.payment?.completed) setCurrentStep(CheckoutStepType.Payment);
      else if (session.isComplete) setCurrentStep(null);
    }
  }, [session]);

  // Delivery step completion
  const handleDeliveryComplete = useCallback(async () => {
    if (token) {
      await updateStepWithData(CheckoutStepType.Delivery, {
        method: selectedMethod,
        email: selectedMethod === "email" ? email : undefined,
      });
      refetchSession();
    }
  }, [token, selectedMethod, email, updateStepWithData, refetchSession]);

  // Auth step completion
  const handleAuthComplete = useCallback(async () => {
    if (token && user) {
      await updateStepWithData(CheckoutStepType.Authentication, { userId: user.id });
      refetchSession();
    }
  }, [token, user, updateStepWithData, refetchSession]);

  // Payment step completion
  const handlePaymentSubmit = useCallback(async () => {
    if (!token) return;
    setIsProcessing(true);
    try {
      // For now, use a mock payment method ID
      const mockPaymentMethodId = `pm_mock_${Date.now()}`;
      const result = await handlePayment(token, mockPaymentMethodId);
      if (result.data?.processCheckoutPayment?.success) {
        await refetchSession();
      }
    } catch {
      // handle error
    } finally {
      setIsProcessing(false);
    }
  }, [token, handlePayment, refetchSession]);

  // Poll for completion and redirect
  useEffect(() => {
    if (session?.isComplete && session?.metadata?.orderId) {
      clearToken();
      router.push(`/order/${session.metadata.orderId}`);
    }
  }, [session, clearToken, router]);

  // UI helpers
  const isPaymentValid = cardNumber.replace(/\s/g, "").length >= 16 && expiry.length === 5 && cvv.length >= 3;
  const isDeliveryValid = selectedMethod === "qr" || (selectedMethod === "email" && email.length > 3);
  const allSectionsCompleted = isAuthenticated && isPaymentValid && isDeliveryValid;

  // Loading and error states
  if (sessionLoading) {
    return <div className="p-8 text-center">טוען...</div>;
  }
  if (sessionError) {
    return <div className="p-8 text-center text-red-500">שגיאה בטעינת ההזמנה</div>;
  }

  return (
    <div className="max-w-4xl mx-auto" dir="rtl">
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Left Column - Order Details */}
        <div className="space-y-6">
          <OrderDetailsSection 
            numOfDays={numOfDays}
            countryId={countryId}
            tripId={tripId}
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
          {/* Delivery step completion button */}
          {currentStep === CheckoutStepType.Delivery && (
            <Button onClick={handleDeliveryComplete} disabled={!isDeliveryValid} className="w-full">
              המשך לאימות
            </Button>
          )}
        </div>
        {/* Right Column - Payment & Login */}
        <div className="space-y-6">
          <LoginSection sectionNumber={3} />
          {/* Auth step completion button */}
          {currentStep === CheckoutStepType.Authentication && isAuthenticated && (
            <Button onClick={handleAuthComplete} className="w-full">
              המשך למשלוח
            </Button>
          )}
          <PaymentSection 
            sectionNumber={4}
            cardNumber={cardNumber}
            setCardNumber={setCardNumber}
            expiry={expiry}
            setExpiry={setExpiry}
            cvv={cvv}
            setCvv={setCvv}
          />
          {/* Payment step completion button */}
          {currentStep === CheckoutStepType.Payment && (
            <Card className="p-6">
              <Button
                onClick={handlePaymentSubmit}
                disabled={!allSectionsCompleted || isProcessing}
                className="w-full h-12 text-lg font-medium"
              >
                {isProcessing 
                  ? "מעבד..." 
                  : "קבל קוד"
                }
              </Button>
              {!allSectionsCompleted && (
                <p className="text-sm text-muted-foreground text-center mt-2">
                  יש להשלים את כל השלבים כדי להמשיך
                </p>
              )}
            </Card>
          )}
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