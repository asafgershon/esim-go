import {
  CurrencyEnum,
  EasyCardClient,
  env as easycardEnv,
  getEasyCardClient,
  InvoiceTypeEnum,
  StatusEnum,
  TransactionTypeEnum
} from "@hiilo/easycard";
import { cleanEnv } from "envalid";
import { logger } from "../../lib/logger";
import type {
  PaymentResult
} from "./types";

import { z } from "zod";

const env = cleanEnv(process.env, {});
let client: EasyCardClient;

import "./webhook";
/**
 * Initialize the EasyCard payment service
 * This sets up the singleton client instance
 */
export async function init() {
  client = await getEasyCardClient();
  logger.info("EasyCard payment service initialized");
  return client;
}

const PaymentIntentDefaultSchema = z.object({
  /**
   * Easycard does not support USD in test mode, so we default to ILS
   */
  currency: z
    .enum(CurrencyEnum)
    .optional()
    .default(env.isDev ? "ILS" : "USD"),
  terminalID: z.string().default(easycardEnv.EASYCARD_TERMINAL_ID),
  allowInstallments: z.boolean().default(false),
  allowCredit: z.boolean().default(false),
  userAmount: z.boolean().default(false),
  emailRequired: z.boolean().default(false),
  consumerNameReadonly: z.boolean().default(true),
  dealDetails: z
    .object({
      externalUserID: z.string().optional(),
      consumerPhone: z.string().optional(),
      consumerEmail: z.string().optional(),
      consumerName: z.string().optional(),
      dealReference: z.string().optional(),
      dealDescription: z.string().optional(),
    })
    .default({}),
  transactionType: z
    .enum(TransactionTypeEnum)
    .default(TransactionTypeEnum.REGULAR_DEAL),
  invoiceDetails: z
    .object({
      invoiceType: z
        .enum(InvoiceTypeEnum)
        .default(InvoiceTypeEnum.INVOICE_WITH_PAYMENT_INFO),
      invoiceSubject: z.string().optional(),
    })
    .default({
      invoiceType: InvoiceTypeEnum.INVOICE_WITH_PAYMENT_INFO,
    }),
  issueInvoice: z.boolean().default(true),
});

const CreatePaymentIntentRequestSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  phoneNumber: z.string().optional(),
  email: z.email().optional().nullable(),
  userId: z.string(),
  bundleId: z.string(),
  price: z.number(),
  description: z.string(),
  redirectUrl: z.string(),
  orderRef: z.string(),
});

export type CreatePaymentIntentRequest = z.infer<
  typeof CreatePaymentIntentRequestSchema
>;

/**
 * Create a payment intent for processing
 */
export async function createPaymentIntent({
  firstName,
  lastName,
  phoneNumber,
  email,
  userId,
  bundleId,
  price,
  description,
  orderRef: orderReference,
  redirectUrl,
}: CreatePaymentIntentRequest): Promise<PaymentResult> {
  logger.debug("Creating EasyCard payment intent", {
    price: price,
    userId,
    bundleId,
    operationType: "payment-intent-create",
  });

  try {
    // An expiration time for the payment link, 5 minutes
    const dueDate = new Date(Date.now() + 1000 * 60 * 5);

    logger.debug("Calling EasyCard API", {
      terminalID: easycardEnv.EASYCARD_TERMINAL_ID,
      price,
      dueDate: dueDate.toISOString(),
    });

    const request = PaymentIntentDefaultSchema.parse({});

    const paymentIntent = await client.paymentIntent.apiPaymentIntentPost(
      {
        paymentRequestCreate: {
          ...request,
          dealDetails: {
            externalUserID: userId,
            consumerPhone: phoneNumber,
            consumerEmail: email,
            consumerName:
              firstName && lastName ? `${firstName} ${lastName}` : undefined,
            dealReference: orderReference,

            dealDescription: description,
          },
          paymentRequestAmount: price,
          transactionType: TransactionTypeEnum.REGULAR_DEAL,
          invoiceDetails: {
            invoiceType: InvoiceTypeEnum.INVOICE_WITH_PAYMENT_INFO,
            invoiceSubject: description,
          },
          redirectUrl,
          // TODO: remove after
          cardOwnerNationalID: "318734472",
          saveCreditCardByDefault: true,

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

    logger.debug("EasyCard API response received", {
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

    logger.debug("Payment intent created successfully", {
      entityUID: paymentIntent.entityUID,
      hasUrl: !!paymentIntent.additionalData?.url,
      hasApplePayUrl: !!paymentIntent.additionalData?.applePayJavaScriptUrl,
      operationType: "payment-intent-success",
    });

    return {
      success: true,
      payment_intent: paymentIntent,
    };
  } catch (error) {
    logger.error(
      "Failed to create payment intent",
      new PaymentIntentCreationError(error)
    );

    throw error;
  }
}

class PaymentIntentCreationError extends Error {
  constructor(messageOrError: string | Error | any) {
    super(
      messageOrError instanceof Error ? messageOrError?.message : messageOrError
    );
    this.name = "PaymentIntentCreationError";
  }
}

export async function getTransaction(transactionId: string) {
  const response = await client.transactions.apiTransactionsTransactionIDGet(
    {transactionID: transactionId}
  );

  const transaction = response;

  if (!transaction) {
    throw new Error("Transaction not found");
  }

  return {
    success: true,
    transaction,
  };
}

export async function getPaymentIntent(paymentIntentId: string) {
  return await client.paymentIntent.apiPaymentIntentPaymentIntentIDGet({
    paymentIntentID: paymentIntentId,
  });
}

// Export singleton functions as default
export default {
  initialize: init,
  createPaymentIntent,
  getTransaction,
  getPaymentIntent,
};

// Re-export types for convenience
export type { EasyCardClient } from "@hiilo/easycard";
