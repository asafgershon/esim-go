import { Event, Rule } from "json-rules-engine";

export type FixedPriceEvent = Event & {
  type: "apply-fixed-price";
  params: {
    ruleId: string;
    actions: {
      type: "set-fixed-price";
      value: number;
    };
  };
};

export const fixedPriceRule = new Rule({
  name: "Set Fixed Price",
  priority: 100,
  conditions: {
    all: [
      {
        fact: "country",
        path: "$.country",
        value: "UA",
        operator: "equal",
      },
    ],
  },
  event: {
    type: "apply-fixed-price",
    params: {
      ruleId: "fixed-price",
      actions: {
        type: "set-fixed-price",
        value: 88,
      },
    },
  } satisfies FixedPriceEvent,
});
