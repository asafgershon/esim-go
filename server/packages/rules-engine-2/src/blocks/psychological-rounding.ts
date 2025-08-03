import { Event, Rule } from "json-rules-engine";

export type PsychologicalRoundingEvent = Event & {
  type: "apply-psychological-rounding";
  params: {
    ruleId: string;
    action: {
      strategy: "nearest-0.99";
    };
  };
};

export const psychologicalRounding: Rule = new Rule({
  name: "Premium Bundle Psychological Pricing",
  priority: 50,
  conditions: {
    all: [],
  },
  event: {
    type: "apply-psychological-rounding",
    params: {
      ruleId: "premium-0.99-pricing",
      action: {
        strategy: "nearest-0.99",
      },
    },
  } satisfies PsychologicalRoundingEvent,
});

export const applyPsychologicalRounding = (
  priceWithMarkup: number,
  roundingEvents: PsychologicalRoundingEvent[] = []
) => {
  const price = priceWithMarkup;
  const [roundingEvent] = roundingEvents;
  if (!roundingEvent) return price;

  const strategy = roundingEvent.params.action.strategy;

  if (strategy === "nearest-0.99") {
    return Math.floor(price) + 0.99;
  }

  return Math.round(price);
};
