import { Event, Rule } from "json-rules-engine";

export type RegionRoundingEvent = Event & {
  type: "apply-region-rounding";
  params: {
    ruleId: string;
    actions: {
      type: "set-region-rounding";
      value: number;
    };
  };
};

export const regionRoundingRule = new Rule({
  name: "Region Rounding",
  priority: 100,
  conditions: {
    all: [],
  },
  event: {
    type: "apply-region-rounding",
    params: {
      ruleId: "region-rounding",
      actions: {
        type: "set-region-rounding",
        value: 0.99,
      },
    },
  } satisfies RegionRoundingEvent,
});
