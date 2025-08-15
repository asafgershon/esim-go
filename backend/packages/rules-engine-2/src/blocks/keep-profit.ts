import { Rule } from "json-rules-engine";
import { z } from "zod";

export const KeepProfitEventSchema = z.object({
  type: z.literal("apply-profit-constraint"),
  params: z.object({
    value: z.number(),
  }),
});

export type KeepProfitEvent = z.infer<typeof KeepProfitEventSchema>;
export const keepProfit = new Rule({
  name: "Minimum 1.5$ profit",
  priority: 100,
  conditions: {
    all: [],
  },
  event: {
    type: "apply-profit-constraint",
    params: {
      value: 1.5,
    },
  } satisfies KeepProfitEvent,
});
