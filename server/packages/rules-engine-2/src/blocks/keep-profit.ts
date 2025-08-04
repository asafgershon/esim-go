import { Event, Rule } from "json-rules-engine";

export type KeepProfitEvent = Event & {
  type: "keep-profit";
  params: {
    ruleId: string;
    value: number;
  };
}

export const keepProfit = new Rule({
  name: "Minimum 1.5$ profit",
  priority: 100,
  conditions: {
    all: [],
  },
  event: {
    type: "keep-profit",
    params: {
      ruleId: "02187861-2fee-4485-bfba-c5ab6e1c6943",
      value: 1.5,
    },
  } satisfies KeepProfitEvent,
});
