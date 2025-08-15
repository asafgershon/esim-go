// blocks/unused-days-discount.ts
import { Rule } from 'json-rules-engine';
import { z } from 'zod';

export  const UnusedDaysDiscountEvent = z.object({
  type: z.literal("apply-unused-days-discount"),
  params: z.object({
    type: z.literal("APPLY_UNUSED_DAYS_DISCOUNT"),
    unusedDays: z.number(),
  }),
});

export const unusedDaysDiscountRule = new Rule({
  name: "Unused Days Discount",
  priority: 85,  // Should run after markup but before rounding
    conditions: {
      all: [
        // Only apply if we couldn't match the exact duration
        {
          fact: 'isExactMatch',
          path: '$.isExactMatch',
          operator: 'equal',
          value: false
        },
        // And we have unused days
        {
          fact: 'unusedDays',
          operator: 'greaterThan',
          value: 0
        }
      ]
    },
    event: {
      type: 'apply-unused-days-discount',
      params: {
        type: 'APPLY_UNUSED_DAYS_DISCOUNT',
        unusedDays: "$unusedDays",
      }
    }
  }
);