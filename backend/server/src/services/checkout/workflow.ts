import { GraphQLError } from "graphql";
import { createLogger } from "@hiilo/utils";
import { env } from "../../config/env";
import type { PubSubInstance } from "../../context/pubsub";
import type { CheckoutSessionServiceV2 } from "./session";
import { calculateSimplePrice, type SimplePricingResult, type SimplePricingDiscount } from "../../../../packages/rules-engine-2/src/simple-pricer/simple-pricer";
import type {
  BundleRepository,
  CouponRepository,
  OrderRepository,
  UserRepository,
} from "../../repositories";
import type { ESIMRepository } from "../../repositories/esim.repository";
import type { DeliveryService } from "../delivery";
import type { ESimGoClient } from "@hiilo/esim-go";
import { MayaApi } from "@hiilo/esim-go/maya";
import type { PaymentServiceInstance } from "../payment";

const logger = createLogger({ component: "checkout-workflow" });

// ==========================
// Internal Global Context
// ==========================
let pubsub: PubSubInstance | null = null;
let sessionService: CheckoutSessionServiceV2 | null = null;
let bundleRepository: BundleRepository | null = null;
let couponRepository: CouponRepository | null = null;
let userRepository: UserRepository | null = null;
let esimAPI: ESimGoClient | null = null;
let mayaAPI: MayaApi | null = null;
let paymentAPI: PaymentServiceInstance | null = null;
let deliveryService: DeliveryService | null = null;
let orderRepository: OrderRepository | null = null;
let esimRepository: ESIMRepository | null = null;

// ======================
// Init
// ======================
const init = async (context: {
  pubsub: PubSubInstance;
  sessionService: CheckoutSessionServiceV2;
  bundleRepository: BundleRepository;
  userRepository: UserRepository;
  esimAPI: ESimGoClient;
  paymentAPI: PaymentServiceInstance;
  deliveryService: DeliveryService;
  orderRepository: OrderRepository;
  esimRepository: ESIMRepository;
  couponRepository: CouponRepository;
  mayaAPI?: MayaApi;
}) => {
  pubsub = context.pubsub;
  sessionService = context.sessionService;
  bundleRepository = context.bundleRepository;
  userRepository = context.userRepository;
  esimAPI = context.esimAPI;
  paymentAPI = context.paymentAPI;
  deliveryService = context.deliveryService;
  orderRepository = context.orderRepository;
  esimRepository = context.esimRepository;
  couponRepository = context.couponRepository;
  mayaAPI =
    context.mayaAPI ||
    (env.MAYA_API_KEY
      ? new MayaApi({ auth: env.MAYA_API_KEY, baseUrl: env.MAYA_BASE_URL })
      : null);
  return checkoutWorkflow;
};

// ==================================
// selectBundle – now adds country
// ==================================
const selectBundle = async ({
  sessionId,
  countryId,
  numOfDays,
}: {
  sessionId: string;
  countryId: string;
  numOfDays: number;
}) => {
  if (!sessionService) throw new NotInitializedError();
  if (!bundleRepository) throw new NotInitializedError();

  const session = await sessionService.getSession(sessionId);
  if (!session) throw new SessionNotFound();

  let country: { iso2: string; name: string } | null = null;
  try {
    const found = await bundleRepository.getCountryByIso(countryId);
    if (found) country = found;
  } catch (err: any) {
    logger.warn(`[WARN] Could not fetch country ${countryId}:`, err.message);
  }

  const result = await calculateSimplePrice(countryId, numOfDays);
  const price = result.finalPrice;

  const next = await sessionService.updateSessionStep(
    sessionId,
    "bundle",
    {
      ...session.bundle,
      completed: false,
      validated: false,
      countryId,
      country,
      numOfDays,
      price,
      pricePerDay: price / numOfDays,
      externalId: `bundle-${countryId}-${numOfDays}`,
    }
  );

  return next;
};

// ==================================
// Other workflow methods
// ==================================
const validateBundle = async ({ sessionId }: { sessionId: string }) => {
  if (!sessionService) throw new NotInitializedError();
  const session = await sessionService.getSession(sessionId);
  if (!session) throw new SessionNotFound();
  return sessionService.updateSessionStep(sessionId, "bundle", {
    ...session.bundle,
    completed: true,
    validated: true,
  });
};

const setDelivery = async ({
  sessionId,
  email,
  phone,
  firstName,
  lastName,
}: {
  sessionId: string;
  email?: string | null;
  phone?: string | null;
  firstName?: string | null;
  lastName?: string | null;
}) => {
  if (!sessionService) throw new NotInitializedError();
  console.log(`[DEBUG] setDelivery: Attempting to getSession with ID: ${sessionId}`);
  const session = await sessionService.getSession(sessionId);
  console.log(`[DEBUG] setDelivery: Got session successfully:`, session ? session.id : 'null');
  if (!session) throw new Error(`SessionNotFound in setDelivery: ID ${sessionId} not found`);

  return sessionService.updateSessionStep(sessionId, "delivery", {
    email,
    phone,
    firstName,
    lastName,
    completed: true,
  });
};

const applyCoupon = async ({
  sessionId,
  couponCode,
}: {
  sessionId: string;
  couponCode: string;
}) => {
  if (!sessionService || !couponRepository)
    throw new NotInitializedError();

  const session = await sessionService.getSession(sessionId);
  if (!session) throw new SessionNotFound();

  try {
    const updatedSession = await couponRepository.applyCoupon({
      sessionId,
      couponCode,
      userId: session.auth.userId,
    });

    const updatedPricing = updatedSession.pricing as unknown as SimplePricingResult;

    return sessionService.updateSessionStep(sessionId, "bundle", {
      ...session.bundle,
      discounts: updatedPricing.discount ? [updatedPricing.discount] : [],
      price: updatedPricing.finalPrice ?? session.bundle.price,
    });
  } catch (err: any) {
    logger.error("Coupon failed", err);
    throw new GraphQLError(err.message || "Invalid or expired coupon", {
      extensions: { code: "COUPON_VALIDATION_FAILED" },
    });
  }
};

// ===========================
// Export workflow
// ===========================
export const checkoutWorkflow = {
  init,
  selectBundle,
  validateBundle,
  setDelivery,
  applyCoupon,
};

export type CheckoutWorkflowInstance = typeof checkoutWorkflow;

// ===========================
// Errors
// ===========================
class NotInitializedError extends Error {
  constructor() {
    super("Workflow not initialized");
  }
}
class SessionNotFound extends Error {
  constructor() {
    super("Session not found");
  }
}