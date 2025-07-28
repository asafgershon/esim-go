import { PricingEngineState } from "src/rules-engine-types";
import type { ConditionOperator, RuleCondition } from "../generated/types";

export abstract class BaseConditionEvaluator {
  abstract evaluate(
    condition: RuleCondition,
    context: PricingEngineState
  ): boolean;

  protected getFieldValue(fieldPath: string, context: PricingEngineState): any {
    const parts = fieldPath.split(".");
    let value: any = context;

    for (const part of parts) {
      if (value && typeof value === "object" && part in value) {
        value = value[part];
      } else {
        return undefined;
      }
    }

    return value;
  }

  protected evaluateOperator(
    operator: ConditionOperator,
    fieldValue: any,
    conditionValue: any
  ): boolean {
    switch (operator) {
      case "EQUALS":
        return fieldValue === conditionValue;

      case "NOT_EQUALS":
        return fieldValue !== conditionValue;

      case "IN":
        return (
          Array.isArray(conditionValue) && conditionValue.includes(fieldValue)
        );

      case "NOT_IN":
        return (
          Array.isArray(conditionValue) && !conditionValue.includes(fieldValue)
        );

      case "GREATER_THAN":
        return (
          typeof fieldValue === "number" &&
          typeof conditionValue === "number" &&
          fieldValue > conditionValue
        );

      case "LESS_THAN":
        return (
          typeof fieldValue === "number" &&
          typeof conditionValue === "number" &&
          fieldValue < conditionValue
        );

      case "BETWEEN":
        if (Array.isArray(conditionValue) && conditionValue.length === 2) {
          const [min, max] = conditionValue;
          if (typeof fieldValue === "number") {
            return fieldValue >= min && fieldValue <= max;
          }
          if (
            typeof fieldValue === "string" &&
            (fieldValue.match(/^\d{4}-\d{2}-\d{2}/) ||
              fieldValue.match(/^\d{4}-\d{2}-\d{2}T/))
          ) {
            const fieldDate = new Date(fieldValue);
            const minDate = new Date(min);
            const maxDate = new Date(max);
            return fieldDate >= minDate && fieldDate <= maxDate;
          }
        }
        return false;

      case "EXISTS":
        return fieldValue !== undefined && fieldValue !== null;

      case "NOT_EXISTS":
        return fieldValue === undefined || fieldValue === null;

      default:
        return false;
    }
  }
}
