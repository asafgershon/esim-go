import {
  type CreateTransactionRequest,
  type CurrencyEnum,
  InvoiceTypeEnum,
  StatusEnum,
  type TransactionResponse,
  TransactionTypeEnum,
  env as easycardEnv,
  getEasyCardClient,
} from "@hiilo/easycard";
import { logger } from "../../lib/logger";
import type {
  CreatePaymentIntentRequest,
  PaymentIntent,
  PaymentResult,
} from "./types";

/**
 * Create a payment intent for processing
 */
export async function createPaymentIntent({
  currency = "USD",
  costumer: { id, email, firstName, lastName, phoneNumber },
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

    // Get the EasyCard client with built-in token management
    const client = await getEasyCardClient();
    logger.info("Got EasyCard client", {
      operationType: "payment-intent-client-ready",
    });

    // An expiration time for the payment link, 5 minutes
    const dueDate = new Date(Date.now() + 1000 * 60 * 5);

    logger.info("Calling EasyCard API", {
      terminalID: easycardEnv.EASYCARD_TERMINAL_ID,
      amount: request.amount,
      dueDate: dueDate.toISOString(),
      operationType: "payment-intent-api-call",
    });

    const paymentIntent = await client.paymentIntent.apiPaymentIntentPost(
      {
        paymentRequestCreate: {
          terminalID: easycardEnv.EASYCARD_TERMINAL_ID,
          allowInstallments: false,
          allowCredit: false,
          userAmount: false,
          emailRequired: false,
          dueDate: null,
          consumerNameReadonly: true,
          currency: "USD",
          dealDetails: {
            externalUserID: id,
            consumerPhone: phoneNumber,
            consumerEmail: email,
            consumerName:
              firstName && lastName ? `${firstName} ${lastName}` : undefined,
            dealReference: order.reference,

            dealDescription: description,
          },
          paymentRequestAmount: request.amount,
          transactionType: TransactionTypeEnum.REGULAR_DEAL,
          invoiceDetails: {
            invoiceType: InvoiceTypeEnum.INVOICE_WITH_PAYMENT_INFO,
            invoiceSubject: description,
          },
          issueInvoice: true,
          redirectUrl,
        },
      },
      {
        headers: {
          ...client.headers,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      }
    );

    logger.info("EasyCard API response received", {
      status: paymentIntent.status,
      hasAdditionalData: !!paymentIntent.additionalData,
      entityUID: paymentIntent.entityUID,
      operationType: "payment-intent-api-response",
    });

    if (paymentIntent.status !== StatusEnum.SUCCESS) {
      logger.error(
        "Payment intent creation failed",
        new Error(
          `${paymentIntent.status} - ${
            paymentIntent.message || "Unknown error"
          }`
        ),
        {
          operationType: "payment-intent-api-error",
        }
      );
      throw new Error(
        `Failed to create payment intent: ${paymentIntent.status} - ${
          paymentIntent.message || "Unknown error"
        }`
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
  } catch (error) {
    // Enhanced error logging for EasyCard API debugging
    const errorInfo: any = {
      operationType: "payment-intent-error",
      errorType: error?.constructor?.name,
      errorMessage: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined,
    };

    // Try to extract response details from ResponseError
    if (error && typeof error === "object") {
      const errorObj = error as any;
      if (errorObj.response) {
        errorInfo.httpStatus = errorObj.response.status;
        errorInfo.httpStatusText = errorObj.response.statusText;
        errorInfo.responseHeaders = errorObj.response.headers;

        // Try to get response body
        if (errorObj.response.body) {
          errorInfo.responseBody = errorObj.response.body;
        }
        if (errorObj.response.text) {
          errorInfo.responseText = errorObj.response.text;
        }
        if (errorObj.response.json) {
          errorInfo.responseJson = errorObj.response.json;
        }

        if (errorObj.response.body instanceof ReadableStream) {
          const reader = errorObj.response.body.getReader();
          const result = await reader.read();
          errorInfo.responseBody = result.value;
        }
      }

      // Additional error properties
      errorInfo.errorUrl = errorObj.url;
      errorInfo.errorMethod = errorObj.method;
      errorInfo.errorBody = errorObj.body;
      errorInfo.errorHeaders = errorObj.headers;
    }

    logger.error("Failed to create payment intent", error as Error, errorInfo);

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
    const client = await getEasyCardClient();

    // Retrieve the payment intent from EasyCard - client handles authentication internally
    const paymentIntent =
      await client.paymentIntent.apiPaymentIntentPaymentIntentIDGet({
        paymentIntentID: paymentIntentId,
      });

    logger.info("EasyCard API response received", {
      status: paymentIntent.status,
      hasAdditionalData: Boolean(paymentIntent.additionalFields),
      entityUID: paymentIntent.paymentRequestID,
      operationType: "payment-intent-api-response",
    });

    return paymentIntent as PaymentIntent;
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
    const client = await getEasyCardClient();

    // Cancel the transaction with EasyCard
    // For now, return a mock success response for testing
    // TODO: Implement actual API call when endpoint is available
    logger.warn(
      "Payment intent cancellation not yet implemented, returning mock success",
      {
        paymentIntentId,
        operationType: "payment-intent-cancel-mock",
      }
    );

    return {
      success: true,
      payment_intent: undefined,
    };
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
    const client = await getEasyCardClient();

    // Create a refund request with EasyCard
    // For now, return a mock success response for testing
    // TODO: Implement actual API call when endpoint is available
    logger.warn(
      "Payment intent refund not yet implemented, returning mock success",
      {
        paymentIntentId,
        amount,
        operationType: "payment-intent-refund-mock",
      }
    );

    return {
      success: true,
      payment_intent: undefined,
    };
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
