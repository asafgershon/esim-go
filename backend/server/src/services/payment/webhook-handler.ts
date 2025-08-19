import { createLogger } from "../../lib/logger";
import { createCheckoutSessionService } from "../checkout-session.service";
import type { Context } from "../../context/types";
import type { PaymentWebhookEvent } from "./types";

const logger = createLogger({ component: "payment-webhook-handler" });

/**
 * Handles incoming webhook events from EasyCard payment provider
 * This integrates with the checkout session service for state management
 */
export async function handlePaymentWebhook(
  context: Context,
  payload: any,
  signature?: string
): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  try {
    // Verify webhook signature if provided
    if (signature && context.services.easycardPayment.verifyWebhookSignature) {
      const isValid = context.services.easycardPayment.verifyWebhookSignature(
        JSON.stringify(payload),
        signature
      );
      
      if (!isValid) {
        logger.warn("Invalid webhook signature", {
          operationType: "webhook-validation",
        });
        return {
          success: false,
          error: "Invalid webhook signature",
        };
      }
    }
    
    // Parse webhook event
    const event = parseWebhookEvent(payload);
    
    if (!event) {
      logger.warn("Unable to parse webhook event", {
        payload,
        operationType: "webhook-parse",
      });
      return {
        success: false,
        error: "Invalid webhook payload",
      };
    }
    
    logger.info("Processing webhook event", {
      eventType: event.type,
      paymentIntentId: event.paymentIntentId,
      operationType: "webhook-processing",
    });
    
    // Initialize checkout session service
    if (!context.services.checkoutSessionService) {
      context.services.checkoutSessionService = createCheckoutSessionService(context);
    }
    
    const service = context.services.checkoutSessionService;
    
    // Handle different event types
    switch (event.type) {
      case "payment.succeeded":
        await service.handlePaymentWebhook(
          event.paymentIntentId,
          'succeeded',
          event.data
        );
        
        logger.info("Payment succeeded webhook processed", {
          paymentIntentId: event.paymentIntentId,
          operationType: "webhook-success",
        });
        
        return {
          success: true,
          message: "Payment succeeded",
        };
        
      case "payment.failed":
        await service.handlePaymentWebhook(
          event.paymentIntentId,
          'failed',
          event.data
        );
        
        logger.info("Payment failed webhook processed", {
          paymentIntentId: event.paymentIntentId,
          operationType: "webhook-failed",
        });
        
        return {
          success: true,
          message: "Payment failure recorded",
        };
        
      case "payment.processing":
        // Log but don't update state - already handled by processPayment
        logger.info("Payment processing webhook received", {
          paymentIntentId: event.paymentIntentId,
          operationType: "webhook-processing-status",
        });
        
        return {
          success: true,
          message: "Payment processing acknowledged",
        };
        
      default:
        logger.warn("Unhandled webhook event type", {
          eventType: event.type,
          operationType: "webhook-unhandled",
        });
        
        return {
          success: true,
          message: `Unhandled event type: ${event.type}`,
        };
    }
  } catch (error) {
    logger.error("Failed to process payment webhook", error as Error, {
      operationType: "webhook-error",
    });
    
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Parse webhook payload into a standardized event format
 * Handles different webhook formats from EasyCard
 */
function parseWebhookEvent(payload: any): PaymentWebhookEvent | null {
  // EasyCard webhook format
  if (payload.eventType && payload.data) {
    return {
      id: payload.id || crypto.randomUUID(),
      type: mapEasyCardEventType(payload.eventType),
      paymentIntentId: payload.data.entityUID || payload.data.entityReference || payload.data.paymentIntentId,
      data: payload.data,
      createdAt: payload.createdAt || new Date().toISOString(),
    };
  }
  
  // Alternative format (if EasyCard changes their format)
  if (payload.type && payload.payment_intent_id) {
    return {
      id: payload.id || crypto.randomUUID(),
      type: payload.type,
      paymentIntentId: payload.payment_intent_id,
      data: payload,
      createdAt: payload.created_at || new Date().toISOString(),
    };
  }
  
  // Legacy format support
  if (payload.paymentIntent && payload.status) {
    return {
      id: payload.id || crypto.randomUUID(),
      type: mapStatusToEventType(payload.status),
      paymentIntentId: payload.paymentIntent,
      data: payload,
      createdAt: new Date().toISOString(),
    };
  }
  
  return null;
}

/**
 * Map EasyCard event types to our internal event types
 */
function mapEasyCardEventType(eventType: string): string {
  const mappings: Record<string, string> = {
    "PAYMENT_SUCCEEDED": "payment.succeeded",
    "PAYMENT_FAILED": "payment.failed",
    "PAYMENT_PROCESSING": "payment.processing",
    "PAYMENT_CANCELLED": "payment.cancelled",
    "PAYMENT_REFUNDED": "payment.refunded",
    // Add more mappings as needed
  };
  
  return mappings[eventType] || eventType.toLowerCase();
}

/**
 * Map payment status to event type
 */
function mapStatusToEventType(status: string): string {
  const mappings: Record<string, string> = {
    "succeeded": "payment.succeeded",
    "failed": "payment.failed",
    "processing": "payment.processing",
    "cancelled": "payment.cancelled",
    "refunded": "payment.refunded",
  };
  
  return mappings[status.toLowerCase()] || `payment.${status.toLowerCase()}`;
}

/**
 * Create webhook endpoint handler for Express
 */
export function createWebhookEndpoint(context: Context) {
  return async (req: any, res: any) => {
    try {
      // Get signature from headers
      const signature = req.headers['x-easycard-signature'] || 
                       req.headers['x-webhook-signature'];
      
      // Process webhook
      const result = await handlePaymentWebhook(
        context,
        req.body,
        signature
      );
      
      if (result.success) {
        res.status(200).json({
          success: true,
          message: result.message || "Webhook processed successfully",
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error || "Failed to process webhook",
        });
      }
    } catch (error) {
      logger.error("Webhook endpoint error", error as Error);
      res.status(500).json({
        success: false,
        error: "Internal server error",
      });
    }
  };
}

export default {
  handlePaymentWebhook,
  createWebhookEndpoint,
};