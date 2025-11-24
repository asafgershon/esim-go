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
  session: any,
  token?: string
): CheckoutSessionDTO {

  const planSnapshot =
    session.metadata?.planSnapshot ||
    (typeof session.plan_snapshot === "string"
      ? JSON.parse(session.plan_snapshot)
      : session.plan_snapshot);

  const { mapStateToSteps } = require("../../services/checkout-session.service");

  const currentState =
    (session.state ||
      session.metadata?.state ||
      CheckoutState.INITIALIZED) as CheckoutState;

  const steps = mapStateToSteps({
    state: currentState,
    userId: session.user_id || session.userId,
    paymentIntentId:
      session.payment_intent_id || session.paymentIntentId,
    metadata: session.metadata || {},
  });

  const paymentUrl =
    session.metadata?.paymentIntent?.url || null;

  const paymentIntentId =
    session.payment_intent_id || session.paymentIntentId || null;

  // 🟢 COUNTRY
  const countryIso = session.metadata?.countries?.[0] || null;

  // 🟢 PRICING
  const pricing = session.pricing || null;

  // 🟢 BUNDLE (חדש!)
let bundle: CheckoutSessionDTO["bundle"] = undefined;

if (pricing) {
  bundle = {
    id: pricing.bundleName,
    price: pricing.finalPrice,
    pricePerDay: 0,
    currency: "USD",
    numOfDays: pricing.requestedDays,
    discounts: pricing.discount ? [pricing.discount.amount] : [],
    country: countryIso
      ? {
          iso: countryIso,
          name: countryIso,
          nameHebrew: null,
        }
      : null,
    completed: false,
    dataAmount: "Unlimited",
    speed: [],
  };
}


  // 🟢 RETURN FIXED DTO
  return {
    id: session.id,
    token: token || "",
    expiresAt: session.expiresAt || session.expires_at || "",
    isComplete: session.state === CheckoutState.PAYMENT_COMPLETED,
    isValidated: Boolean(session.metadata?.isValidated),
    timeRemaining: Math.max(
      0,
      Math.floor(
        (new Date(
          session.expiresAt || session.expires_at || ""
        ).getTime() -
          Date.now()) /
          1000
      )
    ),
    createdAt: session.createdAt || session.created_at || "",
    planSnapshot,
    pricing,
    bundle, 
    steps:
      steps || session.metadata?.steps || session.steps,
    paymentStatus: mapStateToPaymentStatus(
      session.state ||
        session.metadata?.state ||
        CheckoutState.INITIALIZED
    ),
    paymentUrl,
    paymentIntentId,
    orderId: session.orderId || session.order_id || null,
    metadata: session.metadata,
  };
}
