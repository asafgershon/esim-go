import { createLogger } from "@hiilo/utils";
import type { PubSubInstance } from "../../context/pubsub";
import type { CheckoutSessionServiceV2 } from "./session";
import type { ESimGoClient } from "@hiilo/esim-go";
import type { EasyCardClient } from "@hiilo/easycard";
import type { UserRepository } from "../../repositories";
import * as pricingEngine from "@hiilo/rules-engine-2";
import { WEB_APP_BUNDLE_GROUP } from "../../lib/constants/bundle-groups";
import { supabaseAdmin } from "../../context/supabase-auth";
import { z } from "zod";

/* ===============================
 * Variables
 * =============================== */
const logger = createLogger({ component: "checkout-workflow" });
let pubsub: PubSubInstance | null = null;
let sessionService: CheckoutSessionServiceV2 | null = null;
let userRepository: UserRepository | null = null;
let esimAPI: ESimGoClient | null = null;
let paymentAPI: EasyCardClient | null = null;
let engine: typeof pricingEngine | null = null;

const init = async (context: {
  pubsub: PubSubInstance;
  sessionService: CheckoutSessionServiceV2;
  userRepository: UserRepository;
  esimAPI: ESimGoClient;
  paymentAPI: EasyCardClient;
}) => {
  pubsub = context.pubsub;
  sessionService = context.sessionService;
  userRepository = context.userRepository;
  esimAPI = context.esimAPI;
  paymentAPI = context.paymentAPI;
  engine = pricingEngine;

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
      const phoneValidation = z.e164().safeParse(phone);
      if (!phoneValidation.success) {
        throw new CheckoutStepError("authenticate", "Phone number must be in E164 format");
      }
      await supabaseAdmin.auth.signInWithOtp({
        phone: phoneValidation.data,
        options: { shouldCreateUser: true },
      });
    }

    // Update the session with the email, phone and otpSent status
    const session = await sessionService.updateSessionStep(sessionId, "auth", {
      completed: false,
      email: email !== "" ? email : undefined,
      phone: phone !== "" ? (phone || undefined) : undefined,
      otpSent: true,
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

  const isCompleted =
    (user.email || user.user_metadata?.phone_number) &&
    user.user_metadata?.first_name &&
    user.user_metadata?.last_name;

  const nextSession = await sessionService.updateSessionStep(
    sessionId,
    "auth",
    {
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
  const isCompleted =
    data?.user?.id && session.auth.phone && firstName && lastName;

  const nextSession = await sessionService.updateSessionStep(
    sessionId,
    "auth",
    {
      otpVerified: true,
      userId: data?.user?.id,
      completed: Boolean(isCompleted),
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

  const nextSession = await sessionService.updateSessionStep(
    sessionId,
    "auth",
    {
      firstName: updatedUser?.user_metadata?.first_name,
      lastName: updatedUser?.user_metadata?.last_name,
      completed: Boolean(
        updatedUser?.user_metadata?.first_name &&
          updatedUser?.user_metadata?.last_name
      ),
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

const preparePayment = async ({}) => {
  throw new Error("Not implemented");
};

// For success page only
const completePayment = async ({}) => {
  throw new Error("Not implemented");
};

// For webhoooks only
const captruePayment = async ({ sessionId }: { sessionId: string }) => {
  throw new Error("Not implemented");
};

export const checkoutWorkflow = {
  init,
  selectBundle,
  validateBundle,
  authenticate,
  verifyOTP,
  updateAuthName,
  setDelivery,
  preparePayment,
  completePayment,
  captruePayment,
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
