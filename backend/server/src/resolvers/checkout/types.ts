import type { CheckoutState } from "../../services/checkout-session.service";

/**
 * Database session data with multiple possible field formats
 */
export interface CheckoutSessionData {
  id: string;
  state?: CheckoutState;
  userId?: string;
  user_id?: string;
  plan_id?: string;
  plan_snapshot?: string | Record<string, any>;
  pricing: any;
  paymentIntentId?: string;
  payment_intent_id?: string;
  orderId?: string;
  order_id?: string;
  expiresAt?: string;
  expires_at?: string;
  createdAt?: string;
  created_at?: string;
  steps?: any;
  metadata?: CheckoutMetadata;
}

/**
 * Session metadata structure
 */
export interface CheckoutMetadata {
  state?: CheckoutState;
  isValidated?: boolean;
  validationError?: string;
  validationDetails?: {
    error?: string;
    bundleDetails?: any;
    totalPrice?: number;
    currency?: string;
  };
  planSnapshot?: any;
  steps?: any;
  paymentIntent?: {
    url?: string;
    id?: string;
  };
  [key: string]: any;
}

/**
 * GraphQL response DTO for checkout session
 */
export interface CheckoutSessionDTO {
  id: string;
  token: string;
  expiresAt: string;
  isComplete: boolean;
  isValidated: boolean;
  timeRemaining: number;
  createdAt: string;
  planSnapshot: any;
  pricing: any;
  steps: any;
  paymentStatus: string;
  paymentUrl: string | null;
  paymentIntentId: string | null;
  orderId: string | null;
  metadata: any;
}

/**
 * Token payload structure
 */
export interface CheckoutSessionTokenPayload {
  userId: string;
  sessionId: string;
  exp: number;
  iss: string;
}

/**
 * Checkout error codes
 */
export enum CheckoutErrorCode {
  INVALID_TOKEN = "INVALID_TOKEN",
  SESSION_NOT_FOUND = "SESSION_NOT_FOUND",
  SESSION_EXPIRED = "SESSION_EXPIRED",
  VALIDATION_ERROR = "VALIDATION_ERROR",
  PAYMENT_FAILED = "PAYMENT_FAILED",
  UNAUTHORIZED = "UNAUTHORIZED",
}

/**
 * Service initialization state
 */
export interface CheckoutServiceState {
  isInitialized: boolean;
  initializationError?: Error;
}