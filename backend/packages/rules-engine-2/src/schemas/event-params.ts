import { z } from 'zod';
import { ActionType, Provider } from '../generated/types';

export const SelectProviderParams = z.object({
  preferredProvider: z.nativeEnum(Provider),
  fallbackProvider: z.nativeEnum(Provider),
});

// Base price params
export const SetBasePriceParams = z.object({
  source: z.enum(['bundle-cost', 'previous-bundle']).optional(),
});

// Markup params
export const ApplyMarkupParams = z.object({
  type: z.literal('ADD_MARKUP').optional(),
  value: z.number().optional(),
  markupMatrix: z.record(
    z.string(), // Bundle name
    z.record(z.string(), z.number()) // Days -> markup amount
  ).optional(),
});

// Discount params
export const ApplyDiscountParams = z.object({
  ruleId: z.string().optional(),
  ruleName: z.string().optional(),
  discountType: z.enum(['percentage', 'fixed', 'bundle-specific']).optional(),
  discountValue: z.number().optional(),
  maxDiscount: z.number().optional(),
  minSpend: z.number().optional(),
  reason: z.string().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
  actions: z.object({
    type: z.enum([ActionType.ApplyDiscountPercentage, ActionType.ApplyFixedDiscount]),
    value: z.number(),
  }),
}).partial();

// Unused days discount params
export const ApplyUnusedDaysDiscountParams = z.object({
  type: z.literal('APPLY_UNUSED_DAYS_DISCOUNT').optional(),
  unusedDays: z.union([z.number(), z.string()]).optional(), // Can be number or "$unusedDays" reference
});

// Processing fee params
export const ApplyProcessingFeeParams = z.object({
  type: z.literal('SET_PROCESSING_RATE').optional(),
  value: z.number(),
  method: z.string(),
});

// Profit constraint params
export const ApplyProfitConstraintParams = z.object({
  value: z.number(), // Minimum profit amount
});

// Psychological rounding params
export const ApplyPsychologicalRoundingParams = z.object({
  strategy: z.enum(['nearest-whole', 'charm-pricing', 'premium']).optional(),
});

// Region rounding params
export const ApplyRegionRoundingParams = z.object({
  ruleId: z.string().optional(),
  actions: z.object({
    type: z.literal('set-region-rounding').optional(),
    value: z.number(), // e.g., 0.99
  }).optional(),
});

// Fixed price params
export const ApplyFixedPriceParams = z.object({
  actions: z.object({
    value: z.number(),
  }),
});

// Map event types to their param schemas
export const EventParamsSchemas = {
  'set-base-price': SetBasePriceParams,
  'apply-markup': ApplyMarkupParams,
  'apply-discount': ApplyDiscountParams,
  'apply-unused-days-discount': ApplyUnusedDaysDiscountParams,
  'apply-processing-fee': ApplyProcessingFeeParams,
  'apply-profit-constraint': ApplyProfitConstraintParams,
  'apply-psychological-rounding': ApplyPsychologicalRoundingParams,
  'apply-region-rounding': ApplyRegionRoundingParams,
  'apply-fixed-price': ApplyFixedPriceParams,
} as const;

// Export individual param types
export type SetBasePriceParams = z.infer<typeof SetBasePriceParams>;
export type ApplyMarkupParams = z.infer<typeof ApplyMarkupParams>;
export type ApplyDiscountParams = z.infer<typeof ApplyDiscountParams>;
export type ApplyUnusedDaysDiscountParams = z.infer<typeof ApplyUnusedDaysDiscountParams>;
export type ApplyProcessingFeeParams = z.infer<typeof ApplyProcessingFeeParams>;
export type ApplyProfitConstraintParams = z.infer<typeof ApplyProfitConstraintParams>;
export type ApplyPsychologicalRoundingParams = z.infer<typeof ApplyPsychologicalRoundingParams>;
export type ApplyRegionRoundingParams = z.infer<typeof ApplyRegionRoundingParams>;
export type ApplyFixedPriceParams = z.infer<typeof ApplyFixedPriceParams>;