import { ProcessingFeeEvent } from "../blocks/processing-fee";
import { AppliedRule } from "../generated/types";

export interface FeeResult {
  processingCost: number;
  appliedRules: AppliedRule[];
}

export function calculateProcessingFees(
  finalPrice: number,
  feeEvents: ProcessingFeeEvent[]
): FeeResult {
  let processingCost = 0;
  const appliedRules: AppliedRule[] = [];

  feeEvents.forEach((event) => {
    const feeAmount = (finalPrice * event.params.actions.value) / 100;
    processingCost += feeAmount;

    appliedRules.push({
      id: event.params.ruleId,
      name: "Processing Fee",
      category: "FEE",
      impact: feeAmount,
    } as AppliedRule);
  });

  return { processingCost, appliedRules };
}