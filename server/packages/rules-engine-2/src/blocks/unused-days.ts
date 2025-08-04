// blocks/unused-days-discount.ts
import { Rule } from 'json-rules-engine';

export type UnusedDaysDiscountEvent = Event & {
  type: "apply-unused-days-discount";
  params: {
    calculation: "per-day";
    discountPerDay: number;
    maxDiscountPercent?: number;
  };
};

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
        calculation: 'per-day',
      }
    }
  }
);