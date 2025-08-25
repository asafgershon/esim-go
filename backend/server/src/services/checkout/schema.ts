import { z } from "zod";

const BundleSelectionSchema = z.object({
  completed: z.boolean().default(false),
  externalId: z.string().optional(),
  numOfDays: z.number(),
  countryId: z.string(),
  dataAmount: z.string().optional().default(""),
  price: z.number().optional(),
  pricePerDay: z.number().optional(),
  speed: z.array(z.string()).default([]),
  validated: z.boolean().default(false),
  discounts: z.array(z.string()).default([]),
});

const AuthSchema = z.object({
  completed: z.boolean().default(false),
  email: z.string().email().nullable().optional(),
  phone: z.string().optional(),
  userId: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  method: z.enum(["email", "phone", "apple", "google"]).optional(),
  otpSent: z.boolean().optional(),
  otpVerified: z.boolean().optional(),
});

const DeliverySchema = z.object({
  completed: z.boolean().default(false),
  email: z.string().email().nullable().optional(),
  phone: z.string().nullable().optional(),
});

const PaymentIntentSchema = z.object({
  id: z.string(),
  url: z.string(),
  applePayJavaScriptUrl: z.string().optional(),
});

const PaymentSchema = z.object({
  completed: z.boolean().default(false),
  intent: PaymentIntentSchema.optional(),
  phone: z.e164().optional(),
  email: z.email().optional(),
  nameForBilling: z.string().optional(),
  // For webhook integration
  // capture: z
  //   .object({
  //     completed: z.boolean().default(false),
  //     captureAmount: z.number().optional(),
  //     capturedAt: z.date().optional(),
  //   })
  //   .optional(),
});

export const CheckoutSessionSchema = z.object({
  // Metadata
  id: z.string(),
  version: z.number().default(1),

  // Steps
  bundle: BundleSelectionSchema,
  auth: AuthSchema,
  delivery: DeliverySchema,
  payment: PaymentSchema,

  // Overall tracking
  status: z.enum([
    "select-bundle",
    "validate-bundle",
    "auth",
    "delivery",
    "payment",
    "confirmation",
  ]),

  // Timestamps
  createdAt: z.union([z.date(), z.string()]).transform((val) => new Date(val)),
  updatedAt: z.union([z.date(), z.string()]).transform((val) => new Date(val)),
  expiresAt: z.union([z.date(), z.string()]).transform((val) => new Date(val)),
  completedAt: z
    .union([z.date(), z.string()])
    .transform((val) => new Date(val))
    .optional(),
});

export const PartialCheckoutSessionSchema = CheckoutSessionSchema.partial();

export type CheckoutSession = z.infer<typeof CheckoutSessionSchema>;
export type PartialCheckoutSession = z.infer<
  typeof PartialCheckoutSessionSchema
>;
