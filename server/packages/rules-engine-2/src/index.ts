import { SupabaseClient } from "@supabase/supabase-js";
import { stringify } from "csv";
import { writeFileSync } from "fs";
import { Engine } from "json-rules-engine";
import { addMarkup } from "./add-markup";
import { fixedPriceRule } from "./blocks/fixed-price";
import { keepProfit, KeepProfitEvent } from "./blocks/keep-profit";
import { MarkupEvent, rules } from "./blocks/markups";
import {
  applyPsychologicalRounding,
  psychologicalRounding,
  PsychologicalRoundingEvent,
} from "./blocks/psychological-rounding";
import { regionRoundingRule } from "./blocks/region-rounding";
import { availableBundles } from "./facts/available-bundles";
import {
  previousBundle,
  selectBundle,
  SelectedBundleFact,
  unusedDays,
} from "./facts/bundle-facts";
import { durations } from "./facts/durations";
import { getSupabaseClient } from "./supabase";
import { defaultPricingStrategy } from "./strategies/default-pricing";

let engine: Engine;
let supabase: SupabaseClient = getSupabaseClient();

export type RequestFacts = {
  group: string;
  days: number;
} & (
  | {
      country: string;
      region?: never;
    }
  | {
      region: string;
      country?: never;
    }
);

type DerivedFacts = {
  selectedBundle: string;
};

async function run({ days, group, country, region }: RequestFacts) {
  // Get markups

  engine = new Engine();

  // Add static facts
  engine.addFact("durations", durations);
  engine.addFact("availableBundles", availableBundles);

  // Add calculated dynamic facts to be used in rules
  engine.addFact("selectedBundle", selectBundle);
  engine.addFact("previousBundle", previousBundle);
  engine.addFact("unusedDays", unusedDays);

  //   const pricingBlocks = await supabase
  //     .from("pricing_blocks")
  //     .select("*")
  //     .eq("category", RuleCategory.BundleAdjustment)
  //     .eq("is_active", true);

  // Add rules
  //   pricingBlocks.data?.forEach((rule) => {
  //     const validityInDays = rule.conditions.any[0].all.find(
  //       (c: ConditionProperties) => c.path === "$.validity_in_days"
  //     )?.value;
  //     engine.addRule({
  //       name: rule.name,
  //       priority: rule.priority,
  //       conditions: rule.conditions, // JSON from your conditions column
  //       event: {
  //         type: "apply-markup",
  //         params: {
  //           ruleId: rule.id,
  //           validityInDays: validityInDays,
  //           action: rule.action, // JSON from your actions column
  //         },
  //       } as MarkupEvent,
  //     });
  //   });

  // Load rules (should be dynamic by strategy?)
  defaultPricingStrategy.blocks.forEach((r) => engine.addRule(r)); // Load all markups

  const result = await engine.run({
    requestedGroup: group,
    requestedValidityDays: days,
    country,
    region,
  });

  const markups = result.events.filter(
    (e) => e.type === "apply-markup"
  ) as MarkupEvent[];
  const selectedBundle = await result.almanac.factValue<SelectedBundleFact>(
    "selectedBundle"
  );

  const markup = await addMarkup(markups, result.almanac);

  const roundingEvents = result.events.filter(
    (e) => e.type === "apply-psychological-rounding"
  ) as PsychologicalRoundingEvent[];

  const keepProfitEvents = result.events.filter(
    (e) => e.type === "keep-profit"
  ) as KeepProfitEvent[];

  const priceWithMarkup = markup + (selectedBundle?.price || 0);
  // Apply psychological rounding to the price with markup
  const finalPrice = applyPsychologicalRounding(
    priceWithMarkup,
    roundingEvents
  );

  const eventsEmitted = result.events.map((e) => e.type);
  console.log(eventsEmitted);
  return {
    selectedBundle: selectedBundle?.esim_go_name,
    cost: selectedBundle?.price,
    markup,
    priceWithMarkup,
    finalPrice,
    unusedDays: await result.almanac.factValue<number>("unusedDays"),
    requestedDays: days,
  };
}

// By Country
(async () => {
  const results = await Promise.all(
    new Array(30).fill(0).map((_, i) => {
      return run({
        group: "Standard Unlimited Essential",
        days: i + 1,
        country: "UA",
      });
    })
  );
  //   console.log(results);
  return;
})();
