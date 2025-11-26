import { z } from "zod";
import { Provider } from "../../types";
import { type SimplePricingDiscount } from '../../../../packages/rules-engine-2/src/simple-pricer/simple-pricer';
import { num } from "envalid";

const SimplePricingDiscountSchema = z.object({
  code: z.string(),
  amount: z.number(),
  originalPrice: z.number(),
});

const BundleSelectionSchema = z.object({
  completed: z.boolean().default(false),
  externalId: z.string().optional(),
  numOfDays: z.number(),
  countryId: z.string(),
  country: z.object({
    iso2: z.string(),
    name: z.string(),
  }).nullable().optional(), // <-- THIS IS THE NEW LINE
  dataAmount: z.string().optional().default(""),
  price: z.number().optional(),
  pricePerDay: z.number().optional(),
  speed: z.array(z.string()).default([]),
  validated: z.boolean().default(false),
  discounts: z.array(SimplePricingDiscountSchema).default([]),
  provider: z.nativeEnum(Provider).optional(), // Use nativeEnum for TS enums
  numOfEsims: z.number().optional(),
});

const AuthSchema = z.object({
  completed: z.boolean().default(false),
  email: z.union([z.string().email().nullable(), z.literal('')]).optional().default(null).transform((val) => val === '' ? null : val),
  phone: z.union([z.string().nullable(), z.null()]).optional().default(null),
  userId: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  method: z.enum(["email", "phone", "apple", "google"]).optional(),
  otpSent: z.boolean().optional().default(false),
  otpVerified: z.boolean().optional().default(false),
});

const DeliverySchema = z.object({
  completed: z.boolean().default(false),
  email: z.string().email().nullable().optional(),
  phone: z.string().nullable().optional(),
  firstName: z.string().nullable().optional(),
  lastName: z.string().nullable().optional(),
});

const PaymentIntentSchema = z.object({
  id: z.string(),
  url: z.string(),
  applePayJavaScriptUrl: z.string().optional(),
  redirectUrl: z.string().optional(),
});

const PaymentSchema = z.object({
  completed: z.boolean().default(false),
  intent: PaymentIntentSchema.optional(),
  readyForPayment: z.boolean().optional(),
  phone: z.string().optional(), // Assuming e164 is a custom extension, simplified for now
  email: z.string().email().optional(),
  nameForBilling: z.string().optional(),
  transaction: z.object({
    id: z.string(),
    amount: z.number().optional(),
    currency: z.string().optional(),
  }).optional(),
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
  pricing: z.any(),

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