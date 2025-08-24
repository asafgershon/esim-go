import { getEasyCardClient } from "@hiilo/easycard";
import { logger } from "../../lib/logger";
import type {
  CreatePaymentIntentRequest,
  PaymentIntent,
  PaymentResult,
  PaymentWebhookEvent,
} from "./types";

// Import payment operations
import {
  createPaymentIntent as createIntent,
  getPaymentIntent as getIntent,
  cancelPaymentIntent as cancelIntent,
  refundPaymentIntent,
} from "./intent";
import {
  processWebhookEvent as processWebhook,
  verifyWebhookSignature as verifySignature,
  handleWebhook as handleWebhookEvent,
} from "./webhook";

/**
 * Get the EasyCard client instance
 * This is a thin wrapper around the singleton client
 */
export async function getClient() {
  return getEasyCardClient();
}

/**
 * Initialize the EasyCard payment service
 * This sets up the singleton client instance
 */
export async function init() {
  const client = await getEasyCardClient();

  logger.info("EasyCard payment service initialized", {
    operationType: "payment-service-init",
  });

  return client;
}

/**
 * Create a payment intent for processing
 */
export async function createPaymentIntent(
  request: CreatePaymentIntentRequest
): Promise<PaymentResult> {
  return createIntent(request);
}

/**
 * Retrieve a payment intent by ID
 */
export async function getPaymentIntent(
  paymentIntentId: string
): Promise<PaymentIntent | null> {
  return getIntent(paymentIntentId);
}

/**
 * Cancel a payment intent
 */
export async function cancelPaymentIntent(
  paymentIntentId: string
): Promise<PaymentResult> {
  return cancelIntent(paymentIntentId);
}

/**
 * Process webhook events from payment provider
 */
export async function processWebhookEvent(event: PaymentWebhookEvent): Promise<{
  success: boolean;
  payment_intent?: PaymentIntent;
  error?: string;
}> {
  return processWebhook(event);
}

/**
 * Verify webhook signature for security
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string
): boolean {
  return verifySignature(payload, signature);
}

/**
 * Get supported payment methods
 */
export function getSupportedPaymentMethods(): string[] {
  // EasyCard typically supports various card types and potentially digital wallets
  return [
    "visa",
    "mastercard",
    "amex",
    "diners",
    "discover",
    "isracard",
    "apple_pay",
    "google_pay",
  ];
}

/**
 * Get service provider name
 */
export function getProviderName(): string {
  return "EasyCard";
}

/**
 * Handle webhook events - convenience method for GraphQL resolver
 */
export async function handleWebhook(payload: any): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  return handleWebhookEvent(payload);
}

/**
 * Refund a payment
 */
export async function refundPayment(
  paymentIntentId: string,
  amount?: number
): Promise<PaymentResult> {
  return refundPaymentIntent(paymentIntentId, amount);
}

// Export singleton functions as default
export default {
  initialize: init,
  createPaymentIntent,
  getPaymentIntent,
  cancelPaymentIntent,
  processWebhookEvent,
  verifyWebhookSignature,
  getSupportedPaymentMethods,
  getProviderName,
};

// Re-export types for convenience
export type { EasyCardClient } from "@hiilo/easycard";
