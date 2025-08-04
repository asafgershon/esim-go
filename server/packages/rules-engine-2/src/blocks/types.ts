import { Tables } from "src/generated/database.types";

type PricingBlock = Tables<"pricing_blocks">;

export type PricingBlockAction = PricingBlock["action"];
export type PricingBlockConditions = PricingBlock["conditions"];
