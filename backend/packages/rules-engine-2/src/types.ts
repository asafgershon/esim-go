import { Tables } from "@hiilo/supabase";
import { z } from "zod";

type BlockSchema = Tables<"pricing_blocks">;

const ActionSchema = z.object({
  type: z.string(),
});

export const StrategySchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  strategy_blocks: z.array(
    z.object({
      id: z.string(),
      priority: z.number(),
      is_enabled: z.boolean(),
      config_overrides: z.record(z.string(), z.any()),
      block: {
        ...z.custom<Omit<BlockSchema, "action">>(),
        action: ActionSchema,
      },
    })
  ),
});

export type Strategy = z.infer<typeof StrategySchema>;

export type Action = z.infer<typeof ActionSchema>;

export const EventTypeSchema = z.string();
//  z.enum(Constants.public.Enums.event_type);
export type EventType = z.infer<typeof EventTypeSchema>;
