import type { RuleCondition } from "../generated/types";
import { getDeepValue } from "@esim-go/utils";
import { BaseConditionEvaluator } from "./base";
import { PricingEngineState } from "src/rules-engine-types";

export class GenericConditionEvaluator extends BaseConditionEvaluator {
  evaluate(condition: RuleCondition, context: PricingEngineState): boolean {
    // Handle special cases for common shortcuts

    // Get the value using deep path access
    const fieldValue = this.getFieldValue(condition.field, context);

    return this.evaluateOperator(
      condition.operator,
      fieldValue,
      condition.value
    );
  }
}
