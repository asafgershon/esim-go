import { Engine, Rule } from "json-rules-engine";
import { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseClient } from "src/supabase";
import { rules } from "src/blocks/markups";
import { psychologicalRounding } from "src/blocks/psychological-rounding";
import { fixedPriceRule } from "src/blocks/fixed-price";
import { regionRoundingRule } from "src/blocks/region-rounding";
import { keepProfit } from "src/blocks/keep-profit";

export interface DefaultPricingStrategy {
  id: string;
  name: string;
  description: string;
  blocks: Rule[];
}


const blocks = [
  ...rules,
  fixedPriceRule,
  keepProfit,
  regionRoundingRule,
  psychologicalRounding,
];

export const defaultPricingStrategy: DefaultPricingStrategy = {
  id: "default-pricing",
  name: "Default Pricing Strategy",
  description:
    "Standard pricing with markup, psychological rounding, and profit protection",
  blocks,
};
