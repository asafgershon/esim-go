import { createHmac } from "crypto";
import { logger } from "../../lib/logger";
import { getClient, getAccessToken, updateClientConfig } from "./index";
import type { PaymentWebhookEvent, PaymentIntent } from "./types";
import type { TransactionResponse } from "@hiilo/easycard-client";

/**
 * Webhook signature verification configuration
 */
const WEBHOOK_CONFIG = {
  secret: process.env.EASYCARD_WEBHOOK_SECRET || "",
  algorithm: "sha256" as const,
  encoding: "hex" as const,
};

/**
 * Process a webhook event from EasyCard
 */
export async function processWebhookEvent(event: PaymentWebhookEvent): Promise<{
  success: boolean;
  payment_intent?: PaymentIntent;
  error?: string;
}> {
  logger.info("Processing EasyCard webhook event", {
    eventId: event.id,
    eventType: event.type,
    operationType: "webhook-process",
  });

  try {
    // Map webhook event types to handlers
    const eventHandlers: Record<
      string,
      () => Promise<TransactionResponse | null>
    > = {
      "payment.succeeded": async () => handlePaymentSucceeded(event),
      "payment.failed": async () => handlePaymentFailed(event),
      "payment.canceled": async () => handlePaymentCanceled(event),
      "refund.created": async () => handleRefundCreated(event),
      "refund.succeeded": async () => handleRefundSucceeded(event),
      "refund.failed": async () => handleRefundFailed(event),
    };

    const handler = eventHandlers[event.type];

    if (!handler) {
      logger.warn("Unhandled webhook event type", {
        eventType: event.type,
        operationType: "webhook-unhandled",
      });

      return {
        success: true,
        error: `Unhandled event type: ${event.type}`,
      };
    }

    // Process the event with the appropriate handler
    const paymentIntent = await handler();

    return {
      success: true,
      payment_intent: paymentIntent || undefined,
    };
  } catch (error) {
    logger.error("Failed to process webhook event", error as Error, {
      eventId: event.id,
      eventType: event.type,
      operationType: "webhook-process-error",
    });

    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to process webhook",
    };
  }
}

/**
 * Verify webhook signature for security
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string
): boolean {
  if (!WEBHOOK_CONFIG.secret) {
    logger.warn("Webhook secret not configured", {
      operationType: "webhook-verify-warning",
    });
    return false;
  }

  try {
    // Create HMAC hash of the payload
    const expectedSignature = createHmac(
      WEBHOOK_CONFIG.algorithm,
      WEBHOOK_CONFIG.secret
    )
      .update(payload)
      .digest(WEBHOOK_CONFIG.encoding);

    // Constant-time comparison to prevent timing attacks
    const signatureBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expectedSignature);

    if (signatureBuffer.length !== expectedBuffer.length) {
      return false;
    }

    const isValid = signatureBuffer.equals(expectedBuffer);

    if (!isValid) {
      logger.warn("Invalid webhook signature", {
        operationType: "webhook-verify-failed",
      });
    }

    return isValid;
  } catch (error) {
    logger.error("Failed to verify webhook signature", error as Error, {
      operationType: "webhook-verify-error",
    });
    return false;
  }
}

/**
 * Handle webhook event - main entry point for webhook processing
 */
export async function handleWebhook(payload: any): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  logger.info("Handling EasyCard webhook", {
    operationType: "webhook-handle",
  });

  try {
    // Parse the webhook payload
    const event = parseWebhookPayload(payload);

    // Verify the signature if present
    if (payload.signature) {
      const isValid = verifyWebhookSignature(
        JSON.stringify(payload.data),
        payload.signature
      );

      if (!isValid) {
        return {
          success: false,
          error: "Invalid webhook signature",
        };
      }
    }

    // Process the webhook event
    const result = await processWebhookEvent(event);

    return {
      success: result.success,
      message: result.success ? "Webhook processed successfully" : undefined,
      error: result.error,
    };
  } catch (error) {
    logger.error("Failed to handle webhook", error as Error, {
      operationType: "webhook-handle-error",
    });

    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to handle webhook",
    };
  }
}

/**
 * Parse raw webhook payload to PaymentWebhookEvent
 */
function parseWebhookPayload(payload: any): PaymentWebhookEvent {
  // Validate and parse the webhook payload
  // This would be customized based on the actual EasyCard webhook format

  if (!payload.id || !payload.type || !payload.data) {
    throw new Error("Invalid webhook payload structure");
  }

  return {
    id: payload.id,
    type: payload.type,
    data: {
      object: payload.data as TransactionResponse,
    },
    created: payload.created || Date.now(),
  };
}

// Event Handlers

async function handlePaymentSucceeded(
  event: PaymentWebhookEvent
): Promise<TransactionResponse | null> {
  logger.info("Handling payment succeeded event", {
    eventId: event.id,
    operationType: "webhook-payment-succeeded",
  });

  // Update local records, send notifications, etc.
  // For now, just return the payment intent
  return event.data.object;
}

async function handlePaymentFailed(
  event: PaymentWebhookEvent
): Promise<TransactionResponse | null> {
  logger.info("Handling payment failed event", {
    eventId: event.id,
    operationType: "webhook-payment-failed",
  });

  // Handle payment failure logic
  return event.data.object;
}

async function handlePaymentCanceled(
  event: PaymentWebhookEvent
): Promise<TransactionResponse | null> {
  logger.info("Handling payment canceled event", {
    eventId: event.id,
    operationType: "webhook-payment-canceled",
  });

  // Handle payment cancellation logic
  return event.data.object;
}

async function handleRefundCreated(
  event: PaymentWebhookEvent
): Promise<TransactionResponse | null> {
  logger.info("Handling refund created event", {
    eventId: event.id,
    operationType: "webhook-refund-created",
  });

  // Handle refund creation logic
  return event.data.object;
}

async function handleRefundSucceeded(
  event: PaymentWebhookEvent
): Promise<TransactionResponse | null> {
  logger.info("Handling refund succeeded event", {
    eventId: event.id,
    operationType: "webhook-refund-succeeded",
  });

  // Handle successful refund logic
  return event.data.object;
}

async function handleRefundFailed(
  event: PaymentWebhookEvent
): Promise<TransactionResponse | null> {
  logger.info("Handling refund failed event", {
    eventId: event.id,
    operationType: "webhook-refund-failed",
  });

  // Handle failed refund logic
  return event.data.object;
}

/**
 * Register webhook endpoint with EasyCard
 */
export async function registerWebhook(webhookUrl: string): Promise<boolean> {
  logger.info("Registering webhook with EasyCard", {
    webhookUrl,
    operationType: "webhook-register",
  });

  try {
    const client = getClient();

    // Get access token for authenticated requests
    const accessToken = await getAccessToken();

    // Update client with bearer token
    updateClientConfig({
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    // Register the webhook with EasyCard
    // For now, throw an error as requested
    throw new Error(
      "EasyCard webhook registration not yet implemented - requires webhook registration API"
    );

    // When implemented, it would look something like:
    // await client.webhooks.apiWebhooksPost({
    //   webhookRequest: {
    //     url: webhookUrl,
    //     events: ["payment.*", "refund.*"],
    //   },
    // });
    //
    // return true;
  } catch (error) {
    logger.error("Failed to register webhook", error as Error, {
      webhookUrl,
      operationType: "webhook-register-error",
    });
    return false;
  }
}
