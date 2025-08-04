import { Rule, Event } from "json-rules-engine";

export type CostEvent = Event & {
  type: "initialize-base-price";
  params: {
    source: "bundle-cost";
    price: number;
  };
};

/**
 * This rule is used to initialize the base price from the selected bundle.
 */
export const costBlockRule = new Rule({
  name: "Initialize Base Price from Cost",
  priority: 100, // Highest priority - must run first
  conditions: {
    all: [
      // This rule only fires if we have a selected bundle with a cost
      {
        fact: "selectedBundle",
        operator: "notEqual",
        value: null,
      },
      {
        fact: "selectedBundle",
        path: "$.price",
        operator: "greaterThan",
        value: 0,
      },
    ],
  },

  event: {
    type: "initialize-base-price",
    params: {
      fact: "selectedBundle",
      source: "bundle-cost",
      price: "$.price",
    },
  },
});
