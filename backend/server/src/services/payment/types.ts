// Import all types from the Easycard client
import type {
  // Transaction types
  CreateTransactionRequest,
  TransactionResponse,
  TransactionSummary,

  // Payment request types
  PaymentRequestCreate,
  PaymentRequestResponse,
  PaymentRequestSummary,
  PaymentDetails,

  // Billing types
  BillingDealRequest,
  BillingDealResponse,
  BillingDealSummary,
  BillingDetails,
  BillingRequestCreate,

  // Invoice types
  InvoiceRequest,
  InvoiceDetails,
  InvoiceResponse,

  // Credit card types
  CreditCardSecureDetails,
  CreditCardTokenSummary,
  CheckCreditCardRequest,
  BlockCreditCardRequest,

  // Refund and chargeback types
  RefundRequest,
  ChargebackRequest,

  // Common types
  Address,
  OperationResponse,
} from "@hiilo/easycard";

// Import enum types
import {
  TransactionStatusEnum,
  TransactionTypeEnum,
  TransactionFinalizationStatusEnum,
  PaymentTypeEnum,
  CurrencyEnum,
  CardPresenceEnum,
} from "@hiilo/easycard";
import type { Order, User } from "../../types";
import type { CheckoutSessionPlanSnapshot } from "../../repositories";

// Re-export enums
export {
  TransactionStatusEnum,
  TransactionTypeEnum,
  TransactionFinalizationStatusEnum,
  PaymentTypeEnum,
  CurrencyEnum,
  CardPresenceEnum,
};

// Re-export types
export type {
  CreateTransactionRequest,
  TransactionResponse,
  TransactionSummary,
  PaymentRequestCreate,
  PaymentRequestResponse,
  PaymentRequestSummary,
  PaymentDetails,
  BillingDealRequest,
  BillingDealResponse,
  BillingDealSummary,
  BillingDetails,
  BillingRequestCreate,
  InvoiceRequest,
  InvoiceDetails,
  InvoiceResponse,
  CreditCardSecureDetails,
  CreditCardTokenSummary,
  CheckCreditCardRequest,
  BlockCreditCardRequest,
  RefundRequest,
  ChargebackRequest,
  Address,
};

// Create type aliases for backward compatibility with existing code
export type PaymentIntent = TransactionResponse;


export interface PaymentWebhookEvent {
  id: string;
  type: string;
  data: {
    object: TransactionResponse;
  };
  created: number;
}

export interface PaymentServiceConfig {
  apiKey: string;
  webhookSecret?: string;
  environment?: "sandbox" | "production";
  terminalId?: string;
  identityUrl?: string;
  apiUrl?: string;
  merchantUrl?: string;
}

export interface PaymentError {
  code: string;
  message: string;
  type:
    | "card_error"
    | "validation_error"
    | "api_error"
    | "authentication_error";
}

export interface PaymentResult {
  success: boolean;
  payment_intent?: OperationResponse;
  error?: PaymentError;
}
