import { CheckoutState } from "../../services/checkout-session.service";
import type { CheckoutSessionDTO, CheckoutSessionData } from "./types";

/**
 * Maps the internal CheckoutState to a payment status string for GraphQL
 */
export function mapStateToPaymentStatus(state: CheckoutState): string {
  switch (state) {
    case CheckoutState.PAYMENT_PROCESSING:
      return "PROCESSING";
    case CheckoutState.PAYMENT_COMPLETED:
      return "SUCCEEDED";
    case CheckoutState.PAYMENT_FAILED:
      return "FAILED";
    default:
      return "PENDING";
  }
}

/**
 * Determines the next step in the checkout flow based on current state
 */
export function determineNextStep(state: CheckoutState): string | null {
  switch (state) {
    case CheckoutState.INITIALIZED:
      return "AUTHENTICATION";
    case CheckoutState.AUTHENTICATED:
      return "DELIVERY";
    case CheckoutState.DELIVERY_SET:
      return "PAYMENT";
    case CheckoutState.PAYMENT_READY:
      return null; // Ready for payment processing
    default:
      return null;
  }
}

/**
 * Formats a checkout session for GraphQL response
 */
export function formatSessionForGraphQL(
  session: CheckoutSessionData,
  token?: string
): CheckoutSessionDTO {
  // Parse plan snapshot if it's a string
  const planSnapshot = session.metadata?.planSnapshot || 
    (typeof session.plan_snapshot === 'string' 
      ? JSON.parse(session.plan_snapshot) 
      : session.plan_snapshot);
  
  // Import the mapStateToSteps function from the service
  const { mapStateToSteps } = require('../../services/checkout-session.service');
  
  // Generate steps from the current state
  const steps = mapStateToSteps({
    state: session.state || session.metadata?.state || CheckoutState.INITIALIZED,
    userId: session.user_id || session.userId,
    paymentIntentId: session.payment_intent_id || session.paymentIntentId,
    metadata: session.metadata || {}
  });
  
  // Extract payment information from metadata
  const paymentUrl = session.metadata?.paymentIntent?.url || null;
  const paymentIntentId = session.payment_intent_id || session.paymentIntentId || null;
  
  return {
    id: session.id,
    token: token || "",
    expiresAt: session.expiresAt || session.expires_at || "",
    isComplete: session.state === CheckoutState.PAYMENT_COMPLETED,
    isValidated: Boolean(session.metadata?.isValidated),
    timeRemaining: Math.max(
      0,
      Math.floor(
        (new Date(session.expiresAt || session.expires_at || "").getTime() - Date.now()) / 1000
      )
    ),
    createdAt: session.createdAt || session.created_at || "",
    planSnapshot,
    pricing: session.pricing,
    steps: steps || session.metadata?.steps || session.steps,
    paymentStatus: mapStateToPaymentStatus(
      session.state || session.metadata?.state || CheckoutState.INITIALIZED
    ),
    paymentUrl,
    paymentIntentId,
    orderId: session.orderId || session.order_id || null,
    metadata: session.metadata,
  };
}