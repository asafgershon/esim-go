import { Event, Rule } from "json-rules-engine";
import { z } from "zod";

export const PsychologicalRoundingEventSchema = z.object({
  type: z.literal("apply-psychological-rounding"),
  params: z.object({
    strategy: z.literal("nearest-whole"),
  }),
});

export type PsychologicalRoundingEvent = z.infer<
  typeof PsychologicalRoundingEventSchema
>;

export const psychologicalRounding: Rule = new Rule({
  name: "Premium Bundle Psychological Pricing",
  priority: 1, // Run last
  conditions: {
    all: [],
  },
  event: {
    type: "apply-psychological-rounding",
    params: {
      strategy: "nearest-whole",
    },
  } satisfies PsychologicalRoundingEvent,
});
