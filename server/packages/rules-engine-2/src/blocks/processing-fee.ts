import { Rule ,Event} from "json-rules-engine";
import { ActionType } from "src/generated/types";

export type ProcessingFeeEvent = Event & {
  type: "apply-fee";
  params: {
    ruleId: string;
    actions: {
      type: ActionType.SetProcessingRate;
      value: number;
    };
  };
};
export const israeliCardRule = new Rule({
  name: "Processing fee for israeli credit cards",
  priority: 30,
  conditions: {
    all: [
        {
            fact: 'paymentMethod',
            value: 'ISRAELI_CARD',
            operator: 'equal'
        }
    ],
  },
  event: {
    type: "apply-fee",
    params: {
      ruleId: "763d1a34-de86-4c13-84ab-d43f3c805708",
      actions: {
        type: ActionType.SetProcessingRate,
        value: 1.4,
      },
    },
  } satisfies ProcessingFeeEvent,
});

export const internationalCardRule = new Rule({
  name: "Processing fee for international credit cards",
  priority: 30,
  conditions: {
    all: [
        {
            fact: 'paymentMethod',
            value: 'INTERNATIONAL_CARD',
            operator: 'equal'
        }
    ],
  },
  event: {
    type: "apply-fee",
    params: {
      ruleId: "international-card-fee",
      actions: {
        type: ActionType.SetProcessingRate,
        value: 2.9,
      },
    },
  } satisfies ProcessingFeeEvent,
});