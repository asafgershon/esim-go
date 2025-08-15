import { Tables } from "src/generated/database.types";

type PricingBlock = Tables<"pricing_blocks">;

export type PricingBlockConditions = PricingBlock["conditions"];
export type PricingBlockParams = PricingBlock["params"];
