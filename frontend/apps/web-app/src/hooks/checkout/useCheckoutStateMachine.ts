import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../useAuth";

type CheckoutState = 
  | "initializing" 
  | "validating" 
  | "ready" 
  | "processing" 
  | "completing"
  | "complete"
  | "error";

interface UseCheckoutStateMachineProps {
  session: {
    isComplete?: boolean;
    orderId?: string | null;
    steps?: {
      authentication?: { completed?: boolean };
      delivery?: { completed?: boolean };
      payment?: { completed?: boolean };
    };
    timeRemaining?: number | null;
  } | null | undefined;
  validationStatus: "pending" | "valid" | "invalid" | null;
  token?: string;
}

export const useCheckoutStateMachine = ({
  session,
  validationStatus,
}: UseCheckoutStateMachineProps) => {
  const router = useRouter();
  const { user } = useAuth();
  const [state, setState] = useState<CheckoutState>("initializing");
  const [isProcessing, setIsProcessing] = useState(false);

  // Determine current state based on session and validation
  useEffect(() => {
    if (!session) {
      setState("initializing");
      return;
    }

    if (validationStatus === "pending") {
      setState("validating");
      return;
    }

    if (validationStatus === "invalid") {
      setState("error");
      return;
    }

    if (session.isComplete && session.orderId) {
      setState("complete");
      return;
    }

    if (isProcessing) {
      setState("processing");
      return;
    }

    if (validationStatus === "valid") {
      setState("ready");
      return;
    }

    setState("initializing");
  }, [session, validationStatus, isProcessing]);

  // Handle completion and redirect
  useEffect(() => {
    if (state === "complete" && session?.orderId) {
      setIsProcessing(false);
      
      // Small delay to ensure UI updates before navigation
      const timer = setTimeout(() => {
        router.push(`/order/${session.orderId}`);
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [state, session?.orderId, router]);

  // Start payment processing
  const startProcessing = useCallback(() => {
    setIsProcessing(true);
    setState("processing");
  }, []);

  // Stop payment processing (on error)
  const stopProcessing = useCallback(() => {
    setIsProcessing(false);
  }, []);

  // Check if payment can be submitted
  const canSubmitPayment = 
    session?.steps?.authentication?.completed && 
    validationStatus === "valid" && 
    user?.firstName && 
    user?.lastName &&
    state === "ready";

  return {
    state,
    isProcessing,
    canSubmitPayment,
    startProcessing,
    stopProcessing,
    isInitializing: state === "initializing",
    isValidating: state === "validating",
    isReady: state === "ready",
    isComplete: state === "complete",
    hasError: state === "error",
  };
};