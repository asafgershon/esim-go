import { Tables } from "@hiilo/supabase";

type PricingBlock = Tables<"pricing_blocks">;

export type PricingBlockConditions = PricingBlock["conditions"];
export type PricingBlockParams = PricingBlock["params"];
