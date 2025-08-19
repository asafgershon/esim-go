import { useMemo, useCallback } from "react";

type ValidationStatus = "pending" | "valid" | "invalid" | null;

interface UseCheckoutValidationProps {
  session: {
    isValidated?: boolean;
    metadata?: unknown;
    planSnapshot?: unknown;
    orderId?: string | null;
  } | null | undefined;
}

export const useCheckoutValidation = ({ session }: UseCheckoutValidationProps) => {
  // Derive validation status from backend isValidated field
  const validationStatus = useMemo<ValidationStatus>(() => {
    if (!session) return null;
    
    // If session doesn't have planSnapshot, no validation needed
    if (!session.planSnapshot) return null;
    
    // Check the backend validation status
    if (session.isValidated === true) {
      return "valid";
    }
    
    // Check metadata for more details
    const metadata = session.metadata as { isValidated?: boolean; validationError?: string } | undefined;
    
    if (session.isValidated === false) {
      // If explicitly false, it's invalid
      if (metadata?.isValidated === false && metadata?.validationError) {
        return "invalid";
      }
      // Otherwise still pending
      return "pending";
    }
    
    // If isValidated is undefined, check metadata
    if (metadata?.isValidated === true) {
      return "valid";
    } else if (metadata?.isValidated === false) {
      return "invalid";
    }
    
    // Default to pending if we have a planSnapshot but no validation status yet
    return "pending";
  }, [session]);

  // Extract validation error from metadata if available
  const validationError = useMemo<string | null>(() => {
    if (validationStatus !== "invalid") return null;
    
    const metadata = session?.metadata as { 
      validationError?: string;
      validationDetails?: { error?: string };
    } | undefined;
    
    return metadata?.validationError || 
           metadata?.validationDetails?.error || 
           "Order validation failed";
  }, [session?.metadata, validationStatus]);

  // Retry function (no-op since validation happens on backend)
  const retryValidation = useCallback(() => {
    // In the future, this could trigger a backend refresh
    console.log("Validation retry requested - validation happens automatically on backend");
  }, []);

  return {
    validationStatus,
    validationError,
    retryValidation,
    isValidating: validationStatus === "pending",
    isValid: validationStatus === "valid",
    isInvalid: validationStatus === "invalid",
  };
};