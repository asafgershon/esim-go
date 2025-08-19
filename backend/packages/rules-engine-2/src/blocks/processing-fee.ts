import { Rule } from "json-rules-engine";
import { PaymentMethod } from "src/generated/types";
import { z } from "zod";

export const ProcessingFeeEventSchema = z.object({
  type: z.literal("apply-processing-fee"),
  params: z.object({
    type: z.literal("SET_PROCESSING_RATE"),
    // Using a fees matrix similar to markup's markupMatrix
    feesMatrix: z.record(
      z.string(),
      z.object({
        percentageFee: z.number(),
        fixedFee: z.number(),
      })
    ),
  }),
});

export type ProcessingFeeEvent = z.infer<typeof ProcessingFeeEventSchema>;

export type ProcessingFeeRule = Rule & {
  event: ProcessingFeeEvent;
};

// Single rule that handles all payment methods through the fees matrix
export const processingFeeRule = new Rule({
  name: "Processing fees for all payment methods",
  priority: 30,
  conditions: {
    all: [
      {
        fact: "paymentMethod",
        value: null,
        operator: "notEqual",
      },
    ],
  },
  event: {
    type: "apply-processing-fee",
    params: {
      type: "SET_PROCESSING_RATE",
      feesMatrix: {
        [PaymentMethod.IsraeliCard]: {
          percentageFee: 1.4,
          fixedFee: 0,
        },
        [PaymentMethod.Diners]: {
          percentageFee: 3.9,
          fixedFee: 0,
        },
        [PaymentMethod.ForeignCard]: {
          percentageFee: 2.9,
          fixedFee: 0.3,
        },
        [PaymentMethod.Amex]: {
          percentageFee: 3.5,
          fixedFee: 0,
        },
        [PaymentMethod.Bit]: {
          percentageFee: 0,
          fixedFee: 0.5,
        },
      },
    },
  } satisfies ProcessingFeeEvent,
});

export const rules: Rule[] = [processingFeeRule];