import { z } from "zod";
import { CHECKOUT_STEP_TYPE, DELIVERY_METHOD } from "../../constants/checkout";

/**
 * Input validation schemas for checkout resolvers
 */

// Create checkout session input
export const CreateCheckoutSessionInputSchema = z.object({
  numOfDays: z.number().int().positive().max(365),
  regionId: z.string().optional(),
  countryId: z.string().optional(),
  group: z.string().optional(),
});

// Update checkout step input
export const UpdateCheckoutStepInputSchema = z.object({
  token: z.string().min(1),
  stepType: z.enum([
    CHECKOUT_STEP_TYPE.AUTHENTICATION,
    CHECKOUT_STEP_TYPE.DELIVERY,
    CHECKOUT_STEP_TYPE.PAYMENT,
  ]),
  data: z.record(z.any()).optional(),
});

// Authentication step data
export const AuthenticationStepDataSchema = z.object({
  userId: z.string().uuid().optional(),
});

// Delivery step data
export const DeliveryStepDataSchema = z.object({
  method: z.enum([
    DELIVERY_METHOD.EMAIL,
    DELIVERY_METHOD.SMS,
    DELIVERY_METHOD.BOTH,
    DELIVERY_METHOD.QR,
  ]),
  email: z.string().email().optional(),
  phoneNumber: z.string().optional(),
});

// Process payment input
export const ProcessCheckoutPaymentInputSchema = z.object({
  token: z.string().min(1),
  paymentMethodId: z.string().optional(),
});

// Validate order input
export const ValidateOrderInputSchema = z.object({
  bundleName: z.string().min(1),
  quantity: z.number().int().positive().default(1),
  customerReference: z.string().optional(),
});

// Get checkout session input
export const GetCheckoutSessionInputSchema = z.object({
  token: z.string().min(1),
});

/**
 * Validation helper functions
 */

export function validateCreateSessionInput(input: unknown) {
  return CreateCheckoutSessionInputSchema.parse(input);
}

export function validateUpdateStepInput(input: unknown) {
  return UpdateCheckoutStepInputSchema.parse(input);
}

export function validateProcessPaymentInput(input: unknown) {
  return ProcessCheckoutPaymentInputSchema.parse(input);
}

export function validateGetSessionInput(input: unknown) {
  return GetCheckoutSessionInputSchema.parse(input);
}

export function validateOrderInput(input: unknown) {
  return ValidateOrderInputSchema.parse(input);
}

/**
 * Type exports for validated inputs
 */
export type CreateCheckoutSessionInput = z.infer<typeof CreateCheckoutSessionInputSchema>;
export type UpdateCheckoutStepInput = z.infer<typeof UpdateCheckoutStepInputSchema>;
export type ProcessCheckoutPaymentInput = z.infer<typeof ProcessCheckoutPaymentInputSchema>;
export type ValidateOrderInput = z.infer<typeof ValidateOrderInputSchema>;
export type GetCheckoutSessionInput = z.infer<typeof GetCheckoutSessionInputSchema>;