import { 
  PsychologicalRoundingEvent,
  applyPsychologicalRounding 
} from "../blocks/psychological-rounding";
import { RegionRoundingEvent } from "../blocks/region-rounding";
import { AppliedRule } from "../generated/types";

export interface RoundingResult {
  roundedPrice: number;
  appliedRules: AppliedRule[];
}

export function applyRounding(
  price: number,
  psychologicalEvents: PsychologicalRoundingEvent[],
  regionEvents: RegionRoundingEvent[]
): RoundingResult {
  const appliedRules: AppliedRule[] = [];
  let roundedPrice = price;

  // Apply psychological rounding
  if (psychologicalEvents.length > 0) {
    const newPrice = applyPsychologicalRounding(price, psychologicalEvents);
    
    appliedRules.push({
      id: psychologicalEvents[0].params.ruleId,
      name: "Psychological Rounding",
      category: "BUNDLE_ADJUSTMENT",
      impact: newPrice - price,
    } as AppliedRule);
    
    roundedPrice = newPrice;
  }

  // Apply region-specific rounding
  if (regionEvents.length > 0) {
    // Region-specific rounding logic could be added here
    // For now, just track that it was applied
    appliedRules.push({
      id: regionEvents[0].params.ruleId,
      name: "Region Rounding",
      category: "BUNDLE_ADJUSTMENT",
      impact: 0,
    } as AppliedRule);
  }

  return { roundedPrice, appliedRules };
}