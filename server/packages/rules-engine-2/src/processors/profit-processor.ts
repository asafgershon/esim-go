import { KeepProfitEvent } from "../blocks/keep-profit";
import { AppliedRule } from "../generated/types";

export interface ProfitResult {
  finalPrice: number;
  appliedRules: AppliedRule[];
}

export function applyProfitProtection(
  baseCost: number,
  priceAfterDiscount: number,
  keepProfitEvents: KeepProfitEvent[]
): ProfitResult {
  let finalPrice = priceAfterDiscount;
  const appliedRules: AppliedRule[] = [];

  keepProfitEvents.forEach((event) => {
    const minRequired = baseCost + event.params.value;
    if (priceAfterDiscount < minRequired) {
      const adjustment = minRequired - priceAfterDiscount;
      finalPrice = minRequired;
      
      appliedRules.push({
        id: event.params.ruleId,
        name: "Minimum Profit Protection",
        category: "CONSTRAINT",
        impact: adjustment,
      } as AppliedRule);
    }
  });

  return { finalPrice, appliedRules };
}