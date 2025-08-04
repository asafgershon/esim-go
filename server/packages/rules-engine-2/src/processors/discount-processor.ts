import { DiscountEvent } from "../blocks/discount";
import { AppliedRule } from "../generated/types";

export interface DiscountResult {
  discountValue: number;
  appliedRules: AppliedRule[];
}

export function calculateDiscounts(
  priceWithMarkup: number,
  discountEvents: DiscountEvent[]
): DiscountResult {
  let discountValue = 0;
  const appliedRules: AppliedRule[] = [];

  discountEvents.forEach((event) => {
    const discountAmount =
      event.params.actions.type === "APPLY_DISCOUNT_PERCENTAGE"
        ? (priceWithMarkup * event.params.actions.value) / 100
        : event.params.actions.value;

    discountValue += discountAmount;

    appliedRules.push({
      id: event.params.ruleId,
      name: "Discount",
      category: "DISCOUNT",
      impact: -discountAmount,
    } as AppliedRule);
  });

  return { discountValue, appliedRules };
}