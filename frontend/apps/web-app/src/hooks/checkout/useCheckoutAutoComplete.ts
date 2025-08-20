import { useEffect, useCallback } from "react";
import { useAuth } from "../useAuth";
import { CheckoutStepType } from "@/__generated__/graphql";

interface UseCheckoutAutoCompleteProps {
  session: {
    steps?: {
      authentication?: { 
        completed?: boolean;
        userId?: string | null;
      };
      delivery?: { 
        completed?: boolean;
      };
    };
  } | null | undefined;
  token?: string;
  updateStepWithData: (stepType: CheckoutStepType, data: Record<string, unknown>) => Promise<unknown>;
  refetchSession: () => void;
}

export const useCheckoutAutoComplete = ({
  session,
  token,
  updateStepWithData,
  refetchSession,
}: UseCheckoutAutoCompleteProps) => {
  const { user } = useAuth();

  // Get appropriate email for delivery
  const getDeliveryEmail = useCallback(() => {
    if (!user?.email) return undefined;
    // Filter out phone-based emails
    if (user.email.includes('@phone.esim-go.com')) return undefined;
    return user.email;
  }, [user?.email]);

  // Auto-complete authentication step
  const handleAuthComplete = useCallback(async () => {
    if (!token || !user) return;
    
    console.log("Auto-completing authentication step for user:", user.id);
    await updateStepWithData(CheckoutStepType.Authentication, {
      userId: user.id,
    });
    refetchSession();
  }, [token, user, updateStepWithData, refetchSession]);

  // Auto-complete delivery step
  const handleDeliveryAutoComplete = useCallback(async () => {
    if (!token || !session) return;
    
    const deliveryEmail = getDeliveryEmail();
    console.log("Auto-completing delivery step with EMAIL method");
    
    await updateStepWithData(CheckoutStepType.Delivery, {
      method: "EMAIL",
      email: deliveryEmail,
    });
    refetchSession();
  }, [token, session, getDeliveryEmail, updateStepWithData, refetchSession]);

  // Auto-complete auth step when user authenticates
  useEffect(() => {
    if (
      user &&
      session &&
      (!session.steps?.authentication?.completed ||
        !session.steps?.authentication?.userId)
    ) {
      handleAuthComplete();
    }
  }, [user, session, handleAuthComplete]);

  // Auto-complete delivery step after auth is completed
  useEffect(() => {
    if (
      session &&
      session.steps?.authentication?.completed &&
      !session.steps?.delivery?.completed &&
      token
    ) {
      handleDeliveryAutoComplete();
    }
  }, [
    session,
    token,
    handleDeliveryAutoComplete,
  ]);

  return {
    getDeliveryEmail,
    handleAuthComplete,
    handleDeliveryAutoComplete,
  };
};