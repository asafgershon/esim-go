import {
  type CreateTransactionRequest,
  type CurrencyEnum,
  InvoiceTypeEnum,
  StatusEnum,
  type TransactionResponse,
  TransactionTypeEnum,
  env as easycardEnv
} from "@hiilo/easycard-client";
import { logger } from "../../lib/logger";
import { executeWithTokenRefresh, getClient } from "./index";
import type {
  CreatePaymentIntentRequest,
  PaymentIntent,
  PaymentResult,
} from "./types";

/**
 * Map internal payment request to EasyCard transaction request
 */
function mapToTransactionRequest(
  request: CreatePaymentIntentRequest
): CreateTransactionRequest {
  return {
    terminalID: process.env.EASYCARD_TERMINAL_ID || "",
    transactionAmount: request.amount,
    currency: request.currency as CurrencyEnum,
    transactionType: TransactionTypeEnum.REGULAR_DEAL,
    paymentTypeEnum: 'card',
    issueInvoice: false,
    saveCreditCard: false,
    // Additional fields would be mapped based on the payment method and metadata
  } as CreateTransactionRequest;
}

/**
 * Map EasyCard transaction response to internal PaymentIntent
 */
function mapToPaymentIntent(transaction: TransactionResponse): PaymentIntent {
  return transaction; // Since we've aliased PaymentIntent to TransactionResponse
}

/**
 * Create a payment intent for processing
 */
export async function createPaymentIntent({
  currency = "USD",
  costumer: { id, email, firstName, lastName },
  item,
  description,
  redirectUrl,
  order,
  ...request
}: CreatePaymentIntentRequest): Promise<PaymentResult> {

  logger.info("Creating EasyCard payment intent", {
    amount: request.amount,
    currency,
    customerId: id,
    operationType: "payment-intent-create",
  });

  try {
    logger.info("Starting payment intent creation", {
      amount: request.amount,
      currency,
      customerId: id,
      operationType: "payment-intent-create-start",
    });

    // Execute the API call with automatic token refresh on 401
    const result = await executeWithTokenRefresh(async () => {
      const client = getClient();
      logger.info("Got EasyCard client", { operationType: "payment-intent-client-ready" });
      
      // An expiration time for the payment link, 5 minutes
      const dueDate = new Date(Date.now() + 1000 * 60 * 5);

      logger.info("Calling EasyCard API", {
        terminalID: easycardEnv.EASYCARD_TERMINAL_ID,
        amount: request.amount,
        dueDate: dueDate.toISOString(),
        operationType: "payment-intent-api-call",
      });

      const paymentIntent = await client.paymentIntent.apiPaymentIntentPost({
      paymentRequestCreate: {
        terminalID: easycardEnv.EASYCARD_TERMINAL_ID,
        dealDetails: {
          externalUserID: id,
          consumerEmail: email,
          consumerName:
            firstName && lastName ? `${firstName} ${lastName}` : undefined,
          dealReference: order.reference,
          items: [
            {
              itemName: item.name,
              amount: item.price,
              quantity: 1,
              netAmount: item.price,
              discount: item.discount,
            },
          ],
          dealDescription: description,
        },
        paymentRequestAmount: request.amount,
        dueDate: dueDate.toISOString(),
        transactionType: TransactionTypeEnum.REGULAR_DEAL,
        invoiceDetails: {
          invoiceType: InvoiceTypeEnum.INVOICE_WITH_PAYMENT_INFO,
          invoiceSubject: description,
        },
        issueInvoice: true,
        redirectUrl,
      },
      });

      logger.info("EasyCard API response received", {
        status: paymentIntent.status,
        hasAdditionalData: !!paymentIntent.additionalData,
        entityUID: paymentIntent.entityUID,
        operationType: "payment-intent-api-response",
      });

      if (paymentIntent.status !== StatusEnum.SUCCESS) {
        logger.error("Payment intent creation failed", {
          status: paymentIntent.status,
          message: paymentIntent.message || "Unknown error",
          operationType: "payment-intent-api-error",
        });
        throw new Error(
          `Failed to create payment intent: ${paymentIntent.status} - ${paymentIntent.message || "Unknown error"}`
        );
      }

      // Return the successful payment intent
      // The paymentIntent IS the OperationResponse, not nested under .data
      logger.info("Payment intent created successfully", {
        entityUID: paymentIntent.entityUID,
        hasUrl: !!paymentIntent.additionalData?.url,
        hasApplePayUrl: !!paymentIntent.additionalData?.applePayJavaScriptUrl,
        operationType: "payment-intent-success",
      });

      return {
        success: true,
        payment_intent: paymentIntent as PaymentIntent,
      };
    });

    return result;
  } catch (error) {
    logger.error("Failed to create payment intent", error as Error, {
      operationType: "payment-intent-error",
      errorType: error?.constructor?.name,
      errorMessage: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined,
      errorResponse: (error as any)?.response,
      errorData: (error as any)?.data,
    });

    // For test environment, if API call fails, fall back to simple mock
    if (process.env.EASYCARD_ENVIRONMENT === 'test') {
      logger.warn("EasyCard API call failed in test environment, falling back to simple mock response", {
        operationType: "payment-intent-fallback-mock",
      });

      const mockPaymentIntentId = `mock_pi_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const mockPaymentUrl = `https://mock-payment.esim-go.com/pay/${mockPaymentIntentId}`;

      return {
        success: true,
        payment_intent: {
          entityUID: mockPaymentIntentId,
          entityReference: mockPaymentIntentId,
          status: 'SUCCESS' as any,
          additionalData: {
            url: mockPaymentUrl,
            applePayJavaScriptUrl: `${mockPaymentUrl}/apple-pay.js`,
          },
          message: 'Mock payment intent created successfully (fallback)',
        } as any,
      };
    }

    return {
      success: false,
      error: {
        code: "payment_intent_creation_failed",
        message:
          error instanceof Error
            ? error.message
            : "Failed to create payment intent",
        type: "api_error",
      },
    };
  }
}

/**
 * Retrieve a payment intent by ID
 */
export async function getPaymentIntent(
  paymentIntentId: string
): Promise<PaymentIntent | null> {
  logger.info("Retrieving EasyCard payment intent", {
    paymentIntentId,
    operationType: "payment-intent-get",
  });

  try {
    const result = await executeWithTokenRefresh(async () => {
      const client = getClient();
      
      // Retrieve the payment intent from EasyCard
      // For now, return a mock response for testing
      // TODO: Implement actual API call when endpoint is available
      logger.warn("Payment intent retrieval not yet implemented, returning null", {
        paymentIntentId,
        operationType: "payment-intent-get-mock",
      });
      
      return null;
    });

    return result;
  } catch (error) {
    logger.error("Failed to retrieve payment intent", error as Error, {
      paymentIntentId,
      operationType: "payment-intent-get-error",
    });
    return null;
  }
}

/**
 * Cancel a payment intent
 */
export async function cancelPaymentIntent(
  paymentIntentId: string
): Promise<PaymentResult> {
  logger.info("Canceling EasyCard payment intent", {
    paymentIntentId,
    operationType: "payment-intent-cancel",
  });

  try {
    const result = await executeWithTokenRefresh(async () => {
      const client = getClient();
      
      // Cancel the transaction with EasyCard
      // For now, return a mock success response for testing
      // TODO: Implement actual API call when endpoint is available
      logger.warn("Payment intent cancellation not yet implemented, returning mock success", {
        paymentIntentId,
        operationType: "payment-intent-cancel-mock",
      });
      
      return {
        success: true,
        payment_intent: undefined,
      };
    });

    return result;
  } catch (error) {
    logger.error("Failed to cancel payment intent", error as Error, {
      paymentIntentId,
      operationType: "payment-intent-cancel-error",
    });

    return {
      success: false,
      error: {
        code: "payment_intent_cancel_failed",
        message:
          error instanceof Error
            ? error.message
            : "Failed to cancel payment intent",
        type: "api_error",
      },
    };
  }
}

/**
 * Refund a payment intent
 */
export async function refundPaymentIntent(
  paymentIntentId: string,
  amount?: number
): Promise<PaymentResult> {
  logger.info("Refunding EasyCard payment intent", {
    paymentIntentId,
    amount,
    operationType: "payment-intent-refund",
  });

  try {
    const result = await executeWithTokenRefresh(async () => {
      const client = getClient();
      
      // Create a refund request with EasyCard
      // For now, return a mock success response for testing
      // TODO: Implement actual API call when endpoint is available
      logger.warn("Payment intent refund not yet implemented, returning mock success", {
        paymentIntentId,
        amount,
        operationType: "payment-intent-refund-mock",
      });
      
      return {
        success: true,
        payment_intent: undefined,
      };
    });

    return result;
  } catch (error) {
    logger.error("Failed to refund payment intent", error as Error, {
      paymentIntentId,
      amount,
      operationType: "payment-intent-refund-error",
    });

    return {
      success: false,
      error: {
        code: "payment_intent_refund_failed",
        message:
          error instanceof Error
            ? error.message
            : "Failed to refund payment intent",
        type: "api_error",
      },
    };
  }
}
