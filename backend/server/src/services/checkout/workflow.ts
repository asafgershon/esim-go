import { QuickStatusFilterTypeEnum } from "@hiilo/easycard";
import {
  BundleOrderTypeEnum,
  OrderRequestTypeEnum,
  type ESimGoClient,
  type OrderResponseTransaction,
} from "@hiilo/esim-go";
import * as pricingEngine from "@hiilo/rules-engine-2";
import { createLogger } from "@hiilo/utils";
import { z } from "zod";
import type { PubSubInstance } from "../../context/pubsub";
import { supabaseAdmin } from "../../context/supabase-auth";
import { WEB_APP_BUNDLE_GROUP } from "../../lib/constants/bundle-groups";
import type { BundleRepository, OrderRepository, UserRepository } from "../../repositories";
import { OrderStatus, type Checkout } from "../../types";
import type {
  CreatePaymentIntentRequest,
  PaymentServiceInstance,
  TransactionResponse,
} from "../payment";
import type { CheckoutSessionServiceV2 } from "./session";
import type { DeliveryService, ESIMDeliveryData } from "../delivery";
import { env } from "../../config/env";
import { mockESIMData } from "../esim-purchase";
import { getCountryData, type TCountryCode } from "countries-list";
import { OrderStatusEnum } from "../../repositories/order.repository";

/* ===============================
 * Variables
 * =============================== */
const logger = createLogger({ component: "checkout-workflow" });
let pubsub: PubSubInstance | null = null;
let sessionService: CheckoutSessionServiceV2 | null = null;
let userRepository: UserRepository | null = null;
let esimAPI: ESimGoClient | null = null;
let paymentAPI: PaymentServiceInstance | null = null;
let engine: typeof pricingEngine | null = null;
let deliveryService: DeliveryService | null = null;
let bundleRepository: BundleRepository | null = null;
let orderRepository: OrderRepository | null = null;

/* ===============================
 * Helper Functions
 * =============================== */
export const isAuthComplete = (
  userId?: string | null,
  email?: string | null,
  phone?: string | null,
  firstName?: string | null,
  lastName?: string | null
): boolean => {
  const hasUserId = Boolean(userId);
  const hasContactInfo = Boolean(
    (email && email !== "") || (phone && phone !== "")
  );
  const hasFirstName = Boolean(firstName && firstName !== "");
  const hasLastName = Boolean(lastName && lastName !== "");

  return hasUserId && hasContactInfo && hasFirstName && hasLastName;
};

const init = async (context: {
  pubsub: PubSubInstance;
  sessionService: CheckoutSessionServiceV2;
  userRepository: UserRepository;
  esimAPI: ESimGoClient;
  paymentAPI: PaymentServiceInstance;
  deliveryService: DeliveryService;
  bundleRepository: BundleRepository;
  orderRepository: OrderRepository;
}) => {
  pubsub = context.pubsub;
  sessionService = context.sessionService;
  userRepository = context.userRepository;
  esimAPI = context.esimAPI;
  paymentAPI = context.paymentAPI;
  engine = pricingEngine;
  deliveryService = context.deliveryService;
  bundleRepository = context.bundleRepository;
  orderRepository = context.orderRepository;
  return checkoutWorkflow;
};

const selectBundle = async ({
  numOfDays,
  countryId,
  sessionId,
  group = WEB_APP_BUNDLE_GROUP,
}: {
  numOfDays: number;
  countryId: string;
  sessionId: string;
  group?: string;
}) => {
  if (!sessionService) {
    throw new NotInitializedError();
  }

  const session = await sessionService.getSession(sessionId);
  if (!session) {
    throw new SessionNotFound();
  }

  const result = await engine?.calculatePricingEnhanced({
    days: numOfDays,
    country: countryId,
    group,
  });

  const selectedBundle = result?.selectedBundle;

  if (!selectedBundle || !selectedBundle.esim_go_name) {
    throw new CheckoutStepError("selectBundle", "Engine returned no bundle");
  }

  const nextSession = await sessionService.updateSessionStep(
    sessionId,
    "bundle",
    {
      completed: false,
      externalId: selectedBundle.esim_go_name,
      numOfDays,
      dataAmount: selectedBundle.data_amount_readable || "",
      discounts: [],
      speed: selectedBundle.speed || [],
      pricePerDay: result.pricing.finalPrice / numOfDays,
      countryId,
      validated: false,
      price: result.pricing.finalPrice,
    }
  );

  return nextSession;
};

const validateBundle = async ({ sessionId }: { sessionId: string }) => {
  if (!sessionService) {
    throw new NotInitializedError();
  }

  const session = await sessionService.getSession(sessionId);
  if (!session) {
    throw new SessionNotFound();
  }
  const bundleName = session.bundle.externalId;

  if (!bundleName) {
    throw new CheckoutStepError("validateBundle", "Bundle name not found");
  }

  const validation = await esimAPI?.validateOrder(bundleName);
  if (!validation) {
    throw new CheckoutStepError("validateBundle", "Failed to validate bundle");
  }

  const nextSession = await sessionService.updateSessionStep(
    sessionId,
    "bundle",
    {
      validated: Boolean(validation),
      completed: Boolean(validation),
    }
  );

  return nextSession;
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
  if (!sessionService || !userRepository) {
    throw new NotInitializedError();
  }

  if (!userId) {
    // We need to autheticate this session using OTP to email or phone
    // Send OTP to email or phone (validate E164 format first)
    if (phone) {
      // remove the + from the phone number
      const phoneValidation = z.e164().parse(phone).replace("+", "");
      const { data, error } = await supabaseAdmin.auth.signInWithOtp({
        phone: phoneValidation,
        options: { shouldCreateUser: true },
      });

      if (error) {
        throw new CheckoutStepError(
          "authenticate",
          "Failed to sign in with OTP"
        );
      }
    }

    // Update the session with the email, phone and otpSent status
    const session = await sessionService.updateSessionStep(sessionId, "auth", {
      completed: false,
      email: email && email !== "" ? email : undefined,
      phone: phone !== "" ? phone || undefined : undefined,
      otpSent: true,
      userId,
      firstName: firstName && firstName !== "" ? firstName : undefined,
      lastName: lastName && lastName !== "" ? lastName : undefined,
      method: "phone",
      otpVerified: false,
    });

    return session;
  }

  const session = await sessionService.getSession(sessionId);
  if (!session) {
    throw new SessionNotFound();
  }

  let user = await userRepository.getUserById(userId);
  if (!user) {
    throw new CheckoutStepError("authenticate", "User not found");
  }

  const phoneNumber = phone || user.user_metadata?.phone_number;
  const emailAddress = email || user.email;

  // If the user dont have a phone number or email, we need to update the user as well.
  if (!phoneNumber || !emailAddress) {
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      {
        email: emailAddress || undefined,
        phone: phoneNumber || undefined,
      }
    );
    if (data?.user) {
      user = {
        ...user,
        email: data?.user?.email || emailAddress,
        user_metadata: {
          ...user.user_metadata,
          phone_number: phoneNumber,
          first_name: firstName,
          last_name: lastName,
        },
      };
    }
  }

  const isCompleted = isAuthComplete(
    userId,
    user.email,
    user.user_metadata?.phone_number,
    user.user_metadata?.first_name,
    user.user_metadata?.last_name
  );

  const nextSession = await sessionService.updateSessionStep(
    sessionId,
    "auth",
    {
      ...session.auth,
      completed: isCompleted,
      userId,
      email: user.email,
      phone: user.user_metadata?.phone_number,
      firstName: user.user_metadata?.first_name,
      lastName: user.user_metadata?.last_name,
    }
  );

  if (!pubsub) {
    throw new NotInitializedError();
  }

  return nextSession;
};

const verifyOTP = async ({
  sessionId,
  otp,
}: {
  sessionId: string;
  otp: string;
}) => {
  if (!sessionService) {
    throw new NotInitializedError();
  }

  const session = await sessionService.getSession(sessionId);
  if (!session || !session.auth.phone) {
    throw new SessionNotFound();
  }

  const { data, error } = await supabaseAdmin.auth.verifyOtp({
    phone: session.auth.phone || "",
    token: otp,
    type: "sms",
  });

  // Update the user with the phone number (validate E164 format first)
  if (data?.user?.id && session.auth.phone) {
    // The phone should already be in E164 format from frontend, but validate to be safe
    const phoneValidation = z.e164().safeParse(session.auth.phone);
    if (phoneValidation.success) {
      userRepository?.updateProfile(data?.user?.id, {
        phoneNumber: phoneValidation.data,
      });
    } else {
      logger.warn("Phone number not in E164 format, skipping profile update", {
        phone: session.auth.phone,
      });
    }
  }

  if (error) {
    throw new CheckoutStepError("verifyOTP", "Failed to verify OTP");
  }

  const firstName = data?.user?.user_metadata?.first_name;
  const lastName = data?.user?.user_metadata?.last_name;
  const email = data?.user?.email;
  const phone = session.auth.phone;
  const isCompleted = isAuthComplete(
    data?.user?.id,
    email,
    phone,
    firstName,
    lastName
  );

  const nextSession = await sessionService.updateSessionStep(
    sessionId,
    "auth",
    {
      otpVerified: true,
      otpSent: true,
      userId: data?.user?.id,
      completed: isCompleted,
      firstName: firstName,
      lastName: lastName,
      email: email === "" ? undefined : email,
      phone: phone === "" ? undefined : phone,
      method: "phone",
    }
  );

  return {
    ...nextSession,
    auth: {
      ...nextSession.auth,
      authToken: data?.session?.access_token || "",
      refreshToken: data?.session?.refresh_token || "",
    },
  };
};

const updateAuthName = async ({
  sessionId,
  firstName,
  lastName,
}: {
  sessionId: string;
  firstName: string;
  lastName: string;
}) => {
  if (!sessionService || !userRepository) {
    throw new NotInitializedError();
  }

  const session = await sessionService.getSession(sessionId);
  if (!session) {
    throw new SessionNotFound();
  }

  if (!session.auth.userId) {
    throw new CheckoutStepError("updateAuthName", "User ID not found");
  }

  const user = await userRepository?.getUserById(session.auth.userId);

  if (!user) {
    throw new CheckoutStepError("updateAuthName", "User not found");
  }

  // Update the user
  const { success, user: updatedUser } = await userRepository?.updateProfile(
    session.auth.userId,
    {
      firstName,
      lastName,
    }
  );

  // Get current session to have all auth fields for completion check
  const currentSession = await sessionService.getSession(sessionId);

  const isCompleted = isAuthComplete(
    session.auth.userId,
    currentSession?.auth.email,
    currentSession?.auth.phone,
    updatedUser?.user_metadata?.first_name,
    updatedUser?.user_metadata?.last_name
  );

  const nextSession = await sessionService.updateSessionStep(
    sessionId,
    "auth",
    {
      firstName: updatedUser?.user_metadata?.first_name,
      lastName: updatedUser?.user_metadata?.last_name,
      completed: isCompleted,
    }
  );

  return nextSession;
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
  if (!sessionService) {
    throw new NotInitializedError();
  }

  const session = await sessionService.getSession(sessionId);
  if (!session) {
    throw new SessionNotFound();
  }

  const nextSession = await sessionService.updateSessionStep(
    sessionId,
    "delivery",
    {
      completed: true,
      email,
      phone,
    }
  );

  return nextSession;
};

const triggerPayment = async ({
  sessionId,
  redirectUrl,
  ...details
}: { sessionId: string } & NonNullable<Checkout["payment"]>) => {
  if (!sessionService) {
    throw new NotInitializedError();
  }

  const session = await sessionService.getSession(sessionId);
  if (!session) {
    throw new SessionNotFound();
  }

  if (!session.bundle.price || session.bundle.price === 0) {
    throw new CheckoutStepError("triggerPayment", "Price is required");
  }

  if (!session.bundle.externalId) {
    throw new CheckoutStepError("triggerPayment", "Bundle ID is required");
  }

  if (!session.auth.userId) {
    throw new CheckoutStepError("triggerPayment", "User ID is required");
  }
  // email or phone is required
  if (!session.auth.email && !session.auth.phone) {
    throw new CheckoutStepError("triggerPayment", "Email or phone is required");
  }

  const request: CreatePaymentIntentRequest = {
    userId: session.auth.userId,
    bundleId: session.bundle.externalId,
    price: session.bundle.price,
    description: "Test payment",
    redirectUrl: redirectUrl || session.payment.intent?.redirectUrl || "",
    firstName: session.payment.nameForBilling || session.auth.firstName || "",
    lastName: session.payment.nameForBilling || session.auth.lastName || "",
    orderRef: session.id,
    phoneNumber: session.auth.phone || "",
    email: session.auth.email,
  };

  const result = await paymentAPI?.createPaymentIntent(request);

  if (!result || !result.success || !result.payment_intent) {
    throw new CheckoutStepError(
      "triggerPayment",
      "Failed to create payment intent"
    );
  }

  const intent = {
    id: result.payment_intent.entityUID || "",
    url: result.payment_intent.additionalData?.url || "",
    applePayJavaScriptUrl:
      result.payment_intent.additionalData?.applePayJavaScriptUrl || "",
  };

  const nextSession = await sessionService.updateSessionStep(
    sessionId,
    "payment",
    {
      ...session.payment,
      completed: details.completed,
      intent: {
        id: intent.id,
        url: intent.url,
        applePayJavaScriptUrl: intent.applePayJavaScriptUrl,
      },
      transaction: {
        id: result.payment_intent.entityUID || "",
        amount: request.price,
        currency: env.isDev ? "ILS" : "USD",
      },
      phone: session.auth.phone || undefined,
      email: session.auth.email || undefined,
      nameForBilling: session.payment.nameForBilling || undefined,
    }
  );
  return nextSession;
};

// For webhoooks only
const captruePayment = async ({ transactionId }: { transactionId: string }) => {
  if (!paymentAPI) {
    throw new NotInitializedError();
  }

  let response: { success: boolean; transaction: TransactionResponse } | null =
    null;
  try {
    response = await paymentAPI?.getTransaction(transactionId);
  } catch (error) {
    throw new CheckoutStepError("captruePayment", "Failed to get transaction");
  }

  const quickStatus = response?.transaction.quickStatus;
  const paymentIntentId = response?.transaction.paymentIntentID;
  if (!paymentIntentId) {
    throw new CheckoutStepError(
      "captruePayment",
      "Payment intent ID not found"
    );
  }
  const isSuccess = isSuccessStatus(quickStatus);
  if (!isSuccess) {
    throw new CheckoutStepError(
      "captruePayment",
      "Transaction is not successful"
    );
  }
  const session = await sessionService?.getSessionByPaymentIntentId(
    paymentIntentId
  );

  if (!session) {
    logger.error("Session not found for payment intent", { 
      paymentIntentId, 
      transactionId,
      quickStatus 
    });
    throw new CheckoutStepError("captruePayment", "Session not found");
  }

  const nextSession = await sessionService?.updateSessionStep(
    session.id,
    "payment",
    {
      completed: isSuccess,
      nameForBilling:
        response.transaction.creditCardDetails?.cardOwnerName || undefined,
      transaction: {
        id: transactionId,
      },
    }
  );
  return nextSession;
};

const completeCheckout = async ({ sessionId }: { sessionId: string }) => {
  if (!sessionService || !esimAPI || !deliveryService || !bundleRepository || !orderRepository) {
    throw new NotInitializedError();
  }

  const session = await sessionService.getSession(sessionId);
  if (!session) {
    throw new SessionNotFound();
  }

  let orderResponse: OrderResponseTransaction | null = null;
  if (env.ESIM_GO_MODE === "mock") {
    orderResponse = {
      order: [
        {
          esims: [mockESIMData],
        },
      ],
    } as OrderResponseTransaction;
  } else {
    orderResponse = await esimAPI?.ordersApi
      .ordersPost({
        orderRequest: {
          type: OrderRequestTypeEnum.TRANSACTION,
          assign: true, // Auto-assign eSIM
          order: [
            {
              type: BundleOrderTypeEnum.BUNDLE,
              item: session.bundle.externalId || "",
              quantity: 1,
            },
          ],
        },
      })
      .then((res) => res.data);
  }

  const orderReference = orderResponse?.orderReference;
  // Create a new order in the database
  const order = await orderRepository.create({
    reference: orderReference || session.id,
    user_id: session.auth.userId!,
    data_plan_id: session.bundle.externalId,
    total_price: session.bundle.price || 0,
    plan_data: {
      ...session.bundle,
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    status: OrderStatus.Completed,
    esim_go_order_ref: orderReference,
    // Don't set id - let the database generate a UUID
    quantity: 1,
  });

  const esimInfo = orderResponse?.order?.[0]?.esims?.[0];
  const { iccid, matchingId, smdpAddress } = esimInfo ?? {};

  if (!iccid || !matchingId || !smdpAddress) {
    throw new Error("No eSIM data returned from eSIM Go API");
  }

  const lpaString = `LPA:1$${smdpAddress}$${matchingId}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(
    lpaString
  )}&size=400x400`;

  const bundleSearchResult = await bundleRepository.search({
    name: session.bundle.externalId || "",
    limit: 1
  });

  const bundle = bundleSearchResult.data[0] ?? null;
  const country = getCountryData(bundle?.countries?.[0] as TCountryCode || "");
  const { getCountryNameHebrew } = await import("../../datasources/esim-go/hebrew-names");

  const hebrewName = getCountryNameHebrew(country?.iso2 || "");
  const period = `${bundle?.validity_in_days} ${bundle?.validity_in_days === 1 ? 'יום' : 'ימים'}`;
  const bundleNiceName = `${period} ל${hebrewName || country?.name || ''}`;

  const deliveryData: ESIMDeliveryData = {
    esimId: iccid,
    iccid,
    qrCode: qrCodeUrl,
    activationCode: matchingId,
    activationUrl: smdpAddress,
    instructions: `1. Go to Settings > Cellular > Add eSIM
    2. Select "Use QR Code" 
    3. Scan the QR code or enter details manually
    4. Follow the on-screen instructions to complete setup`,
    planName: bundleNiceName,
    customerName: session.auth?.firstName || "",
    orderReference: session.payment.intent?.id || "",
    matchingId,
    validity: String(bundle?.validity_in_days || 0),
    smdpAddress,
  };

  const deliveryResult = await deliveryService.deliverESIM(
    deliveryData,
    {
      type: "EMAIL",
      email: session.delivery?.email || "yarinsasson2@gmail.com",
      phoneNumber: session.delivery?.phone || "",
    }
  );

  const nextSession = await sessionService.updateSessionStep(sessionId, "delivery", {
    completed: deliveryResult.success,
      email: session.delivery?.email || "yarinsasson2@gmail.com",
      phone: session.delivery?.phone || "",
    }
  );

  return {
    order,
    session
  };
  // TODO: Save the session to the database
};

/**
 * Check if a transaction status represents a successful payment
 * @param quickStatus - The quickStatus from EasyCard transaction
 * @returns true if the payment was successful
 */
const isSuccessStatus = (
  quickStatus: QuickStatusFilterTypeEnum | undefined
): boolean => {
  // EasyCard successful statuses
  const successStatuses = [
    "Approved",
    QuickStatusFilterTypeEnum.COMPLETED,
    QuickStatusFilterTypeEnum.AWAITING_FOR_TRANSMISSION,
    QuickStatusFilterTypeEnum.PENDING,
  ];

  return (
    Boolean(quickStatus) &&
    successStatuses.includes(quickStatus as (typeof successStatuses)[number])
  );
};

export const checkoutWorkflow = {
  init,
  selectBundle,
  validateBundle,
  authenticate,
  verifyOTP,
  updateAuthName,
  setDelivery,
  triggerPayment,
  captruePayment,
  completeCheckout,
};
export type CheckoutWorkflowInstance = typeof checkoutWorkflow;

/* ===============================
 * Errors
 * =============================== */
class NotInitializedError extends Error {
  constructor() {
    super("Not initialized");
  }
}

class SessionNotFound extends Error {
  constructor() {
    super("Not found");
  }
}

class CheckoutStepError extends Error {
  constructor(step: string, reason: string) {
    super(`Checkout step error: ${step} - ${reason}`);
  }
}
