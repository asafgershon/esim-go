import { Rule, Event, Almanac } from "json-rules-engine";
import { ActionType } from "../generated/types";
import { z } from "zod";
import { CouponValidation, EmailDomainDiscount } from "../facts/discount-facts";

// ============ EVENT SCHEMAS ============

export const DiscountEventSchema = z.object({
  type: z.literal("apply-discount"),
  params: z.object({
    ruleId: z.string(),
    ruleName: z.string(),
    discountType: z.enum(['percentage', 'fixed', 'bundle-specific']),
    discountValue: z.number(),
    maxDiscount: z.number().optional(),
    minSpend: z.number().optional(),
    reason: z.string().optional(),
    metadata: z.record(z.string(), z.any()).optional(),
    actions: z.object({
      type: z.nativeEnum(ActionType),
      value: z.number(),
    }),
  }),
});

export type DiscountEvent = z.infer<typeof DiscountEventSchema>;

// ============ COUPON CODE DISCOUNTS ============

/**
 * Apply coupon code discounts with validation
 */
export const couponDiscountRule = new Rule({
  name: "Coupon Code Discount",
  priority: 900, // High priority - coupon codes override most other discounts
  conditions: {
    all: [
      {
        fact: 'couponValidation',
        operator: 'notEqual',
        value: null
      },
      {
        fact: 'couponValidation',
        path: '$.isValid',
        operator: 'equal',
        value: true
      }
    ]
  },
  event: {
    type: "apply-discount",
    params: {
      ruleId: "coupon-discount-001",
      ruleName: "Coupon Code Discount",
      discountType: "percentage", // Will be overridden by coupon details
      discountValue: 0, // Will be overridden by coupon details
      reason: "Coupon code applied",
      actions: {
        type: ActionType.ApplyDiscountPercentage,
        value: 0, // Will be dynamically set
      },
    },
  } satisfies DiscountEvent,
  onSuccess: async (event: Event, almanac: Almanac) => {
    // Dynamically set discount values from coupon validation
    const couponValidation = await almanac.factValue<CouponValidation>('couponValidation');
    if (couponValidation && couponValidation.isValid && event.params) {
      (event.params as any).discountType = couponValidation.discountType;
      (event.params as any).discountValue = couponValidation.discountValue;
      (event.params as any).reason = `Coupon code '${couponValidation.code}' applied`;
      
      if (couponValidation.discountType === 'percentage') {
        (event.params as any).actions.type = ActionType.ApplyDiscountPercentage;
        (event.params as any).actions.value = couponValidation.discountValue;
      } else if (couponValidation.discountType === 'fixed_amount') {
        (event.params as any).actions.type = ActionType.ApplyFixedDiscount;
        (event.params as any).actions.value = couponValidation.discountValue;
      }
    }
  },
});

// ============ EMAIL DOMAIN DISCOUNTS ============

/**
 * Apply email domain-based corporate discounts
 */
export const emailDomainDiscountRule = new Rule({
  name: "Email Domain Corporate Discount",
  priority: 850, // High priority but lower than coupon codes
  conditions: {
    all: [
      {
        fact: 'emailDomainDiscount',
        operator: 'notEqual',
        value: null
      },
      {
        fact: 'emailDomainDiscount',
        path: '$.isEligible',
        operator: 'equal',
        value: true
      },
      {
        fact: 'couponValidation', // Don't stack with coupon discounts
        operator: 'equal',
        value: null
      }
    ]
  },
  event: {
    type: "apply-discount",
    params: {
      ruleId: "email-domain-discount-001",
      ruleName: "Email Domain Corporate Discount",
      discountType: "percentage",
      discountValue: 0, // Will be dynamically set from fact
      reason: "Corporate email domain discount",
      actions: {
        type: ActionType.ApplyDiscountPercentage,
        value: 0, // Will be dynamically set
      },
    },
  } satisfies DiscountEvent,
  onSuccess: async (event: Event, almanac: Almanac) => {
    // Dynamically set discount values from email domain validation
    const emailDomainDiscount = await almanac.factValue<EmailDomainDiscount>('emailDomainDiscount');
    if (emailDomainDiscount && emailDomainDiscount.isEligible && event.params) {
      (event.params as any).discountType = emailDomainDiscount.discountType;
      (event.params as any).discountValue = emailDomainDiscount.discountValue;
      (event.params as any).reason = `Corporate discount for ${emailDomainDiscount.companyName || emailDomainDiscount.domain}`;
      
      if (emailDomainDiscount.discountType === 'percentage') {
        (event.params as any).actions.type = ActionType.ApplyDiscountPercentage;
        (event.params as any).actions.value = emailDomainDiscount.discountValue;
      } else if (emailDomainDiscount.discountType === 'fixed') {
        (event.params as any).actions.type = ActionType.ApplyFixedDiscount;
        (event.params as any).actions.value = emailDomainDiscount.discountValue;
      }
    }
  },
});

// ============ USER SEGMENT DISCOUNTS ============

/**
 * New user welcome discount
 */
export const newUserDiscountRule = new Rule({
  name: "New User Welcome Discount",
  priority: 800,
  conditions: {
    all: [
      {
        fact: 'userSegment',
        operator: 'equal',
        value: 'new'
      },
      {
        fact: 'couponValidation', // Don't stack with coupon discounts
        operator: 'equal',
        value: null
      }
    ]
  },
  event: {
    type: "apply-discount",
    params: {
      ruleId: "new-user-discount-001",
      ruleName: "New User Welcome Discount",
      discountType: "percentage",
      discountValue: 15,
      maxDiscount: 25,
      reason: "Welcome offer for new users",
      actions: {
        type: ActionType.ApplyDiscountPercentage,
        value: 15,
      },
    },
  } satisfies DiscountEvent,
});

/**
 * VIP customer discount
 */
export const vipDiscountRule = new Rule({
  name: "VIP Customer Discount",
  priority: 750,
  conditions: {
    all: [
      {
        fact: 'userSegment',
        operator: 'equal',
        value: 'vip'
      },
      {
        fact: 'couponValidation',
        operator: 'equal',
        value: null
      }
    ]
  },
  event: {
    type: "apply-discount",
    params: {
      ruleId: "vip-discount-001",
      ruleName: "VIP Customer Discount",
      discountType: "percentage",
      discountValue: 20,
      reason: "Exclusive VIP customer discount",
      actions: {
        type: ActionType.ApplyDiscountPercentage,
        value: 20,
      },
    },
  } satisfies DiscountEvent,
});

/**
 * Win-back discount for inactive users
 */
export const winBackDiscountRule = new Rule({
  name: "Win-Back Discount",
  priority: 700,
  conditions: {
    all: [
      {
        fact: 'userSegment',
        operator: 'equal',
        value: 'inactive'
      },
      {
        fact: 'couponValidation',
        operator: 'equal',
        value: null
      }
    ]
  },
  event: {
    type: "apply-discount",
    params: {
      ruleId: "winback-discount-001",
      ruleName: "Win-Back Discount",
      discountType: "percentage",
      discountValue: 25,
      maxDiscount: 50,
      reason: "Special offer to win back inactive customers",
      actions: {
        type: ActionType.ApplyDiscountPercentage,
        value: 25,
      },
    },
  } satisfies DiscountEvent,
});

// ============ TIME-BASED DISCOUNTS ============

/**
 * Early bird discount (6AM - 10AM)
 */
export const earlyBirdDiscountRule = new Rule({
  name: "Early Bird Discount",
  priority: 600,
  conditions: {
    all: [
      {
        fact: 'timeContext',
        path: '$.isEarlyBird',
        operator: 'equal',
        value: true
      },
      {
        fact: 'userSegment',
        operator: 'notEqual',
        value: 'vip' // VIP gets better discount
      },
      {
        fact: 'couponValidation',
        operator: 'equal',
        value: null
      }
    ]
  },
  event: {
    type: "apply-discount",
    params: {
      ruleId: "early-bird-discount-001",
      ruleName: "Early Bird Discount",
      discountType: "percentage",
      discountValue: 10,
      reason: "Early bird special (6AM-10AM)",
      actions: {
        type: ActionType.ApplyDiscountPercentage,
        value: 10,
      },
    },
  } satisfies DiscountEvent,
});

/**
 * Weekend discount
 */
export const weekendDiscountRule = new Rule({
  name: "Weekend Discount",
  priority: 550,
  conditions: {
    all: [
      {
        fact: 'timeContext',
        path: '$.isWeekend',
        operator: 'equal',
        value: true
      },
      {
        fact: 'userSegment',
        operator: 'in',
        value: ['new', 'returning']
      },
      {
        fact: 'couponValidation',
        operator: 'equal',
        value: null
      }
    ]
  },
  event: {
    type: "apply-discount",
    params: {
      ruleId: "weekend-discount-001",
      ruleName: "Weekend Special",
      discountType: "percentage",
      discountValue: 12,
      reason: "Weekend special offer",
      actions: {
        type: ActionType.ApplyDiscountPercentage,
        value: 12,
      },
    },
  } satisfies DiscountEvent,
});

/**
 * End of month discount
 */
export const endOfMonthDiscountRule = new Rule({
  name: "End of Month Discount",
  priority: 500,
  conditions: {
    all: [
      {
        fact: 'timeContext',
        path: '$.isEndOfMonth',
        operator: 'equal',
        value: true
      },
      {
        fact: 'couponValidation',
        operator: 'equal',
        value: null
      }
    ]
  },
  event: {
    type: "apply-discount",
    params: {
      ruleId: "end-of-month-discount-001",
      ruleName: "End of Month Special",
      discountType: "percentage",
      discountValue: 15,
      maxDiscount: 30,
      reason: "End of month clearance",
      actions: {
        type: ActionType.ApplyDiscountPercentage,
        value: 15,
      },
    },
  } satisfies DiscountEvent,
});

// ============ BUNDLE-SPECIFIC DISCOUNTS ============

/**
 * Unlimited data discount
 */
export const unlimitedDataDiscountRule = new Rule({
  name: "Unlimited Data Discount",
  priority: 450,
  conditions: {
    all: [
      {
        fact: 'bundleDiscountEligibility',
        path: '$.isUnlimitedDiscount',
        operator: 'equal',
        value: true
      },
      {
        fact: 'userSegment',
        operator: 'notIn',
        value: ['vip', 'inactive'] // They get better discounts
      },
      {
        fact: 'couponValidation',
        operator: 'equal',
        value: null
      }
    ]
  },
  event: {
    type: "apply-discount",
    params: {
      ruleId: "unlimited-data-discount-001",
      ruleName: "Unlimited Data Special",
      discountType: "percentage",
      discountValue: 8,
      reason: "Discount for unlimited data bundles",
      actions: {
        type: ActionType.ApplyDiscountPercentage,
        value: 8,
      },
    },
  } satisfies DiscountEvent,
});

/**
 * Long stay discount (15+ days)
 */
export const longStayDiscountRule = new Rule({
  name: "Long Stay Discount",
  priority: 400,
  conditions: {
    all: [
      {
        fact: 'bundleDiscountEligibility',
        path: '$.isLongStayDiscount',
        operator: 'equal',
        value: true
      },
      {
        fact: 'requestedValidityDays',
        operator: 'greaterThanInclusive',
        value: 15
      },
      {
        fact: 'couponValidation',
        operator: 'equal',
        value: null
      }
    ]
  },
  event: {
    type: "apply-discount",
    params: {
      ruleId: "long-stay-discount-001",
      ruleName: "Long Stay Discount",
      discountType: "percentage",
      discountValue: 18,
      reason: "Extended stay discount (15+ days)",
      actions: {
        type: ActionType.ApplyDiscountPercentage,
        value: 18,
      },
    },
  } satisfies DiscountEvent,
});

/**
 * Premium bundle discount
 */
export const premiumBundleDiscountRule = new Rule({
  name: "Premium Bundle Discount",
  priority: 350,
  conditions: {
    all: [
      {
        fact: 'bundleDiscountEligibility',
        path: '$.isPremiumBundleDiscount',
        operator: 'equal',
        value: true
      },
      {
        fact: 'userSegment',
        operator: 'notEqual',
        value: 'new' // New users get different discount
      },
      {
        fact: 'couponValidation',
        operator: 'equal',
        value: null
      }
    ]
  },
  event: {
    type: "apply-discount",
    params: {
      ruleId: "premium-bundle-discount-001",
      ruleName: "Premium Bundle Discount",
      discountType: "percentage",
      discountValue: 12,
      reason: "Special pricing for premium bundles",
      actions: {
        type: ActionType.ApplyDiscountPercentage,
        value: 12,
      },
    },
  } satisfies DiscountEvent,
});

// ============ REGIONAL DISCOUNTS ============

/**
 * Emerging market discount
 */
export const emergingMarketDiscountRule = new Rule({
  name: "Emerging Market Discount",
  priority: 300,
  conditions: {
    all: [
      {
        fact: 'marketTier',
        operator: 'equal',
        value: 'emerging'
      },
      {
        fact: 'couponValidation',
        operator: 'equal',
        value: null
      }
    ]
  },
  event: {
    type: "apply-discount",
    params: {
      ruleId: "emerging-market-discount-001",
      ruleName: "Emerging Market Discount",
      discountType: "percentage",
      discountValue: 20,
      maxDiscount: 40,
      reason: "Special pricing for emerging markets",
      actions: {
        type: ActionType.ApplyDiscountPercentage,
        value: 20,
      },
    },
  } satisfies DiscountEvent,
});

/**
 * Regional bundle discount
 */
export const regionalBundleDiscountRule = new Rule({
  name: "Regional Bundle Discount",
  priority: 250,
  conditions: {
    all: [
      {
        fact: 'bundleDiscountEligibility',
        path: '$.isRegionalDiscount',
        operator: 'equal',
        value: true
      },
      {
        fact: 'marketTier',
        operator: 'equal',
        value: 'standard'
      },
      {
        fact: 'couponValidation',
        operator: 'equal',
        value: null
      }
    ]
  },
  event: {
    type: "apply-discount",
    params: {
      ruleId: "regional-bundle-discount-001",
      ruleName: "Regional Bundle Discount",
      discountType: "percentage",
      discountValue: 10,
      reason: "Multi-country regional bundle discount",
      actions: {
        type: ActionType.ApplyDiscountPercentage,
        value: 10,
      },
    },
  } satisfies DiscountEvent,
});

// ============ QUANTITY-BASED DISCOUNTS ============

/**
 * Volume discount for multiple eSIMs
 */
export const volumeDiscountRule = new Rule({
  name: "Volume Discount",
  priority: 200,
  conditions: {
    all: [
      {
        fact: 'quantity',
        operator: 'greaterThanInclusive',
        value: 2
      },
      {
        fact: 'couponValidation',
        operator: 'equal',
        value: null
      }
    ]
  },
  event: {
    type: "apply-discount",
    params: {
      ruleId: "volume-discount-001",
      ruleName: "Volume Discount",
      discountType: "percentage",
      discountValue: 5, // Base rate, will be calculated based on quantity
      reason: "Bulk purchase discount",
      actions: {
        type: ActionType.ApplyDiscountPercentage,
        value: 5,
      },
    },
  } satisfies DiscountEvent,
});

// ============ FALLBACK DISCOUNT ============

/**
 * Base value discount (similar to unused days but more general)
 */
export const baseValueDiscountRule = new Rule({
  name: "Base Value Discount",
  priority: 100, // Lowest priority - only applies if no other discounts
  conditions: {
    all: [
      {
        fact: 'couponValidation',
        operator: 'equal',
        value: null
      },
      {
        fact: 'userSegment',
        operator: 'equal',
        value: 'returning'
      },
      // Only apply if no unused days discount is available
      {
        fact: 'isExactMatch',
        operator: 'equal',
        value: true
      }
    ]
  },
  event: {
    type: "apply-discount",
    params: {
      ruleId: "base-value-discount-001",
      ruleName: "Base Value Discount",
      discountType: "percentage",
      discountValue: 5,
      reason: "Base customer loyalty discount",
      actions: {
        type: ActionType.ApplyDiscountPercentage,
        value: 5,
      },
    },
  } satisfies DiscountEvent,
});

// ============ EXPORTED RULES ARRAY ============

export const discountRules: Rule[] = [
  // Coupon codes (highest priority)
  couponDiscountRule,
  
  // Email domain discounts
  emailDomainDiscountRule,
  
  // User segment discounts
  newUserDiscountRule,
  vipDiscountRule,
  winBackDiscountRule,
  
  // Time-based discounts
  earlyBirdDiscountRule,
  weekendDiscountRule,
  endOfMonthDiscountRule,
  
  // Bundle-specific discounts
  unlimitedDataDiscountRule,
  longStayDiscountRule,
  premiumBundleDiscountRule,
  
  // Regional discounts
  emergingMarketDiscountRule,
  regionalBundleDiscountRule,
  
  // Quantity discounts
  volumeDiscountRule,
  
  // Fallback discount
  baseValueDiscountRule,
];

// Individual rules are already exported above