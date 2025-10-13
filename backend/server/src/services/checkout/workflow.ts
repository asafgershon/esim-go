import { GraphQLError } from "graphql";
import { createLogger } from "@hiilo/utils";
import * as pricingEngine from "@hiilo/rules-engine-2";
import { env } from "../../config/env";
import type { PubSubInstance } from "../../context/pubsub";
import type { CheckoutSessionServiceV2 } from "./session";
import { calculateSimplePrice } from "../../../../packages/rules-engine-2/src/simple-pricer/simple-pricer.ts";
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
// ✅ Internal Global Context
// ==========================
let pubsub: PubSubInstance | null = null;
let sessionService: CheckoutSessionServiceV2 | null = null;
let userRepository: UserRepository | null = null;
let esimAPI: ESimGoClient | null = null;
let mayaAPI: MayaApi | null = null;
let paymentAPI: PaymentServiceInstance | null = null;
let deliveryService: DeliveryService | null = null;
let bundleRepository: BundleRepository | null = null;
let orderRepository: OrderRepository | null = null;
let esimRepository: ESIMRepository | null = null;
let couponRepository: CouponRepository | null = null;

// ======================
// ✅ Helper: Auth Check
// ======================
export const isAuthComplete = (
  userId?: string | null,
  email?: string | null,
  phone?: string | null,
  firstName?: string | null,
  lastName?: string | null
): boolean => {
  return Boolean(
    userId &&
      ((email && email !== "") || (phone && phone !== "")) &&
      firstName &&
      lastName
  );
};

// ======================
// ✅ Init
// ======================
const init = async (context: {
  pubsub: PubSubInstance;
  sessionService: CheckoutSessionServiceV2;
  userRepository: UserRepository;
  esimAPI: ESimGoClient;
  mayaAPI?: MayaApi;
  paymentAPI: PaymentServiceInstance;
  deliveryService: DeliveryService;
  bundleRepository: BundleRepository;
  orderRepository: OrderRepository;
  esimRepository: ESIMRepository;
  couponRepository: CouponRepository;
}) => {
  pubsub = context.pubsub;
  sessionService = context.sessionService;
  userRepository = context.userRepository;
  esimAPI = context.esimAPI;
  mayaAPI =
    context.mayaAPI ||
    (env.MAYA_API_KEY
      ? new MayaApi({ auth: env.MAYA_API_KEY, baseUrl: env.MAYA_BASE_URL })
      : null);
  paymentAPI = context.paymentAPI;
  deliveryService = context.deliveryService;
  bundleRepository = context.bundleRepository;
  orderRepository = context.orderRepository;
  esimRepository = context.esimRepository;
  couponRepository = context.couponRepository;
  return checkoutWorkflow;
};

// ==================================
// ✅ Basic Steps (simplified stubs)
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
  const session = await sessionService.getSession(sessionId);
  if (!session) throw new SessionNotFound();

  // simulate pricing logic
  const result = await calculateSimplePrice(countryId, numOfDays);
  const price = result.finalPrice;
  const next = await sessionService.updateSessionStep(sessionId, "bundle", {
    ...session.bundle,
    completed: false,
    countryId,
    numOfDays,
    price,
    pricePerDay: price / numOfDays,
    externalId: `bundle-${countryId}-${numOfDays}`,
  });
  return next;
};

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

const authenticate = async ({
  sessionId,
  userId,
  firstName,
  lastName,
  email,
  phone,
}: {
  sessionId: string;
  userId: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  phone?: string | null;
}) => {
  if (!sessionService) throw new NotInitializedError();
  const session = await sessionService.getSession(sessionId);
  if (!session) throw new SessionNotFound();

  return sessionService.updateSessionStep(sessionId, "auth", {
    userId,
    firstName: firstName ?? undefined,
    lastName: lastName ?? undefined,
    email: email ?? undefined,
    phone: phone ?? undefined,
    completed: isAuthComplete(userId, email, phone, firstName, lastName),
  });
};

const setDelivery = async ({
  sessionId,
  email,
  phone,
}: {
  sessionId: string;
  email?: string | null;
  phone?: string | null;
}) => {
  if (!sessionService) throw new NotInitializedError();
  const session = await sessionService.getSession(sessionId);
  if (!session) throw new SessionNotFound();

  return sessionService.updateSessionStep(sessionId, "delivery", {
    email,
    phone,
    completed: true,
  });
};

// ===========================
// ✅ Apply Coupon to Checkout
// ===========================
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
    const updated = await couponRepository.applyCoupon({
      sessionId,
      couponCode,
      userId: session.auth.userId,
    });

    return sessionService.updateSessionStep(sessionId, "bundle", {
      ...session.bundle,
      discounts: updated.discounts,
      price: updated.finalPrice ?? session.bundle.price,
    });
  } catch (err: any) {
    logger.error("Coupon failed", err);
    throw new GraphQLError(err.message || "Invalid or expired coupon", {
      extensions: { code: "COUPON_VALIDATION_FAILED" },
    });
  }
};

// ===========================
// ✅ Final Exported Workflow
// ===========================
export const checkoutWorkflow = {
  init,
  selectBundle,
  validateBundle,
  authenticate,
  setDelivery,
  applyCoupon,
};

export type CheckoutWorkflowInstance = typeof checkoutWorkflow;

// ===========================
// ✅ Internal Errors
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
