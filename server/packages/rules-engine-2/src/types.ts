import { z } from "zod";
import { Tables } from "./generated/database.types";
import { TopLevelCondition } from "json-rules-engine";

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
      }
    })
  ),
});

export type Strategy = z.infer<typeof StrategySchema>;

export const TopLevelConditionSchema = z.custom<TopLevelCondition>();

export type Action = z.infer<typeof ActionSchema>;
