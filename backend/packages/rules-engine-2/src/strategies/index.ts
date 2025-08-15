import { getSupabaseClient } from "src/supabase";
import { Strategy } from "src/types";

const supabase = getSupabaseClient();

export async function loadStrategy(
  strategyCode: string = "default-pricing"
): Promise<Strategy> {
  const { data, error } = await supabase
    .from("pricing_strategies")
    .select(
      `
      *,
      strategy_blocks (
        id,
        priority,
        is_enabled,
        config_overrides,
        block:pricing_blocks (
          id,
          name,
          description,
          category,
          conditions,
          action
        )
      )
    `
    )
    .eq("code", strategyCode)
    .single();

  if (error) {
    throw new Error(`Error loading strategy ${strategyCode}: ${error.message}`);
  }

  return data;
}
