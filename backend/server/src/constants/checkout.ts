/**
 * Checkout session configuration constants
 */

// Time constants (in seconds)
export const CHECKOUT_SESSION_EXPIRY = 30 * 60; // 30 minutes
export const PAYMENT_INTENT_EXPIRY = 15 * 60; // 15 minutes
export const TOKEN_EXPIRY = 30 * 60; // 30 minutes

// Payment status mapping
export const PAYMENT_STATUS = {
  PENDING: "PENDING",
  PROCESSING: "PROCESSING",
  SUCCEEDED: "SUCCEEDED",
  FAILED: "FAILED",
  CANCELLED: "CANCELLED",
} as const;

// Step types
export const CHECKOUT_STEP_TYPE = {
  AUTHENTICATION: "AUTHENTICATION",
  DELIVERY: "DELIVERY",
  PAYMENT: "PAYMENT",
  VALIDATION: "VALIDATION",
} as const;

// Update types for subscriptions
export const CHECKOUT_UPDATE_TYPE = {
  INITIAL: "INITIAL",
  STEP_COMPLETED: "STEP_COMPLETED",
  PAYMENT_PROCESSING: "PAYMENT_PROCESSING",
  PAYMENT_COMPLETED: "PAYMENT_COMPLETED",
  PAYMENT_FAILED: "PAYMENT_FAILED",
  SESSION_EXPIRED: "SESSION_EXPIRED",
  ORDER_CREATED: "ORDER_CREATED",
  VALIDATION_COMPLETED: "VALIDATION_COMPLETED",
} as const;

// Error messages
export const ERROR_MESSAGES = {
  SESSION_NOT_FOUND: "Session not found or expired",
  SESSION_EXPIRED: "Session has expired",
  INVALID_TOKEN: "Invalid or expired checkout token",
  VALIDATION_ERROR: "Validation error occurred",
  PAYMENT_FAILED: "Payment processing failed",
  UNAUTHORIZED: "Unauthorized access",
  SERVICE_INIT_FAILED: "Failed to initialize checkout service",
  INVALID_STEP_TYPE: "Invalid step type",
  USER_ID_REQUIRED: "User ID is required for authentication",
} as const;

// Delivery methods
export const DELIVERY_METHOD = {
  EMAIL: "EMAIL",
  SMS: "SMS",
  BOTH: "BOTH",
  QR: "QR",
} as const;

export type PaymentStatus = typeof PAYMENT_STATUS[keyof typeof PAYMENT_STATUS];
export type CheckoutStepType = typeof CHECKOUT_STEP_TYPE[keyof typeof CHECKOUT_STEP_TYPE];
export type CheckoutUpdateType = typeof CHECKOUT_UPDATE_TYPE[keyof typeof CHECKOUT_UPDATE_TYPE];
export type DeliveryMethod = typeof DELIVERY_METHOD[keyof typeof DELIVERY_METHOD];