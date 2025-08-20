interface PaymentIntentUrls {
  paymentIntentId?: string;
  url?: string;
  applePayJavaScriptUrl?: string;
}

/**
 * Extracts payment intent URLs from session metadata
 */
export const extractPaymentIntentUrls = (
  metadata?: Record<string, unknown> | null
): PaymentIntentUrls | undefined => {
  if (!metadata?.paymentIntent) return undefined;
  
  return metadata.paymentIntent as PaymentIntentUrls;
};

/**
 * Extracts bundle name from plan snapshot
 */
export const extractBundleName = (
  planSnapshot?: unknown
): string | undefined => {
  if (!planSnapshot) return undefined;
  
  const snapshot = planSnapshot as { name?: string };
  return snapshot?.name;
};

/**
 * Formats remaining time in minutes
 */
export const formatTimeRemaining = (
  timeRemaining?: number
): string | undefined => {
  if (!timeRemaining) return undefined;
  
  const minutes = Math.floor(timeRemaining / 60);
  return `${minutes} דקות`;
};

/**
 * Validates if user has required fields for payment
 */
export const validateUserForPayment = (user?: {
  firstName?: string | null;
  lastName?: string | null;
}): boolean => {
  return !!(user?.firstName && user?.lastName);
};

/**
 * Determines if email should be used for delivery
 */
export const isValidDeliveryEmail = (email?: string | null): boolean => {
  if (!email) return false;
  return !email.includes('@phone.esim-go.com');
};