import { Rule } from "json-rules-engine";
import { z } from "zod";

export const CostEventSchema = z.object({
  type: z.literal("set-base-price"),
  params: z.object({
    source: z.literal("bundle-cost"),
    price: z.union([z.number(), z.string()]).transform((val) => Number(val)),
    name: z.string(),
  }),
});
export type CostEvent = z.infer<typeof CostEventSchema>;

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
      {
        fact: "selectedBundle",
        path: "$.esim_go_name",
        operator: "notEqual",
        value: null,
      },
    ],
  },

  event: {
    type: "set-base-price",
    params: {
      source: "bundle-cost"  // This static field will be added
    },
  },
});
