import { createLogger } from "@hiilo/utils";
import { Engine } from "json-rules-engine";
import { SelectedBundleFact } from "./facts/bundle-facts";
import {
  AppliedRule,
  PaymentMethod,
  PricingBreakdown,
} from "./generated/types";
import { clearRulesCache } from "./loaders/database-loader";

// Export cache clear function for manual cache invalidation
export { clearRulesCache };

let engine: Engine;

const logger = createLogger({
  name: "pricing-engine-v2",
  level: "info",
});

export type RequestFacts = {
  group: string;
  days: number;
  paymentMethod?: PaymentMethod;
  strategyId?: string;
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

export type PricingEngineV2Result = {
  selectedBundle: SelectedBundleFact | undefined;
  unusedDays: number;
  requestedDays: number;
  pricing: Omit<PricingBreakdown, "bundle" | "country" | "duration">;
  appliedRules: AppliedRule[];
};
export { calculatePricing } from "./index-with-db";
// Export enhanced version with step tracking
export {
  calculatePricingEnhanced,
  EnhancedPricingEngineResult,
} from "./calculate-pricing-enhanced";
export {
  availableBundles,
  availableBundlesByProvider,
} from "./facts/available-bundles";
export {
  isExactMatch,
  previousBundle as previousBundleFact,
  previousBundleMarkup,
  selectBundle,
  selectedBundleMarkup,
  unusedDays as unusedDaysFact,
  type PreviousBundleFact,
  type SelectedBundleFact,
} from "./facts/bundle-facts";
export { durations } from "./facts/durations";
export {
  availableProviders,
  isProviderAvailable,
  preferredProvider,
  selectedProvider,
} from "./facts/provider-facts";
export {
  AppliedRule,
  PaymentMethod,
  PricingBreakdown,
  Provider,
  RuleCategory,
} from "./generated/types";
export {
  getCachedPricingRules,
  loadStrategyBlocks,
} from "./loaders/database-loader";
export { processEventType } from "./processors/process-event";
