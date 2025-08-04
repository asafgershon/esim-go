import { Rule, Event } from "json-rules-engine";
import { ActionType, PaymentMethod } from "src/generated/types";
import { z } from "zod";

export const ProcessingFeeEventSchema = z.object({
  type: z.literal("apply-processing-fee"),
  params: z.object({
    type: z.literal("SET_PROCESSING_RATE"),
    value: z.number(),
    method: z.nativeEnum(PaymentMethod),
  }),
});

export type ProcessingFeeEvent = z.infer<typeof ProcessingFeeEventSchema>;

export const israeliCardRule = new Rule({
  name: "Processing fee for israeli credit cards",
  priority: 30,
  conditions: {
    all: [
      {
        fact: "paymentMethod",
        value: PaymentMethod.IsraeliCard,
        operator: "equal",
      },
    ],
  },
  event: {
    type: "apply-processing-fee",
    params: {
      type: "SET_PROCESSING_RATE",
      value: 1.4,
      method: PaymentMethod.IsraeliCard,
    },
  } satisfies ProcessingFeeEvent,
});

export const internationalCardRule = new Rule({
  name: "Processing fee for international credit cards",
  priority: 30,
  conditions: {
    all: [
      {
        fact: "paymentMethod",
        value: PaymentMethod.Diners,
        operator: "equal",
      },
    ],
  },

  event: {
    type: "apply-processing-fee",
    params: {
      type: "SET_PROCESSING_RATE",
      value: 3.9,
      method: PaymentMethod.Diners,
    },
  } satisfies ProcessingFeeEvent,
});

export const rules: Rule[] = [israeliCardRule, internationalCardRule];