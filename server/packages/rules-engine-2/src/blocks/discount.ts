import { Event, Rule } from "json-rules-engine";
import { ActionType } from "src/generated/types";

export type DiscountEvent = Event & {
  type: "apply-discount";
  params: {
    ruleId: string;
    actions: {
      type: ActionType.ApplyDiscountPercentage | ActionType.ApplyFixedDiscount;
      value: number;
    };
  };
};

export const discountRule = new Rule({
  name: "Discount",
  priority: 100,
  conditions: {
    all: [
        {
            fact: 'request',
            path: '$.dataType',
            value: 'unlimited',
            operator: 'equal'
        }
    ],
  },
  event: {
    type: "apply-discount",
    params: {
      ruleId: "02187861-2fee-4485-bfba-c5ab6e1c6943",
      actions: {
        type: ActionType.ApplyDiscountPercentage,
        value: 10,
      },
    },
  } satisfies DiscountEvent,
});