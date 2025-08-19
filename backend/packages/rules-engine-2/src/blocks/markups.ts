import { Rule } from "json-rules-engine";
import { ActionType } from "src/generated/types";
import { z } from "zod";

export const MarkUpEventSchema = z.object({
  type: z.literal("apply-markup"),
  params: z.object({
    type: z.literal("ADD_MARKUP"),
    markupMatrix: z.record(z.string(), z.record(z.string(), z.number())),
  }),
});

export type MarkupRule = Rule & {
  event: z.infer<typeof MarkUpEventSchema>;
};

export type MarkupEvent = z.infer<typeof MarkUpEventSchema>;

export const markupRule = new Rule({
  name: "markup-rule",
  priority: 50,
  conditions: {
    any: [
      {
        all: [
          {
            fact: "selectedBundle",
            value: null,
            operator: "notEqual",
          },
          {
            fact: "selectedBundle",
            path: "$.is_unlimited",
            value: true,
            operator: "equal",
          },
        ],
      },
      {
        all: [
          {
            fact: "previousBundle",
            value: null,
            operator: "notEqual",
          },
          {
            fact: "previousBundle",
            path: "$.is_unlimited",
            value: true,
            operator: "equal",
          },
        ],
      },
    ],
  },
  event: {
    type: "apply-markup",
    params: {
      type: "ADD_MARKUP",
      markupMatrix: {
        "Standard Unlimited Lite": {
          "1": 3,
          "3": 5,
          "5": 9,
          "7": 12,
          "10": 15,
          "15": 17,
          "30": 20,
        },
        "Standard Unlimited Plus": {
          "1": 4,
          "3": 6,
          "5": 10,
          "7": 13,
          "10": 16,
          "15": 18,
          "30": 21,
        },
        "Standard Unlimited Essential": {
          "1": 3,
          "3": 5,
          "5": 9,
          "7": 12,
          "10": 15,
          "15": 17,
          "30": 20,
        },
      },
    },
  } as MarkupEvent,
});

export const rules: Rule[] = [];

// // ========== BUNDLE ADJUSTMENT RULES ==========

// // Standard Unlimited Lite - All durations
// rules.push(
//   createBundleMarkupRule(
//     "e985283b-1aa2-4101-9aa2-4d78fbfb849d",
//     "Standard Unlimited Lite - 1 day Markup",
//     "Standard Unlimited Lite",
//     1,
//     3
//   )
// );
// rules.push(
//   createBundleMarkupRule(
//     "2dd766c3-147c-438d-bdbc-09c9916ff0e5",
//     "Standard Unlimited Lite - 3 days Markup",
//     "Standard Unlimited Lite",
//     3,
//     5
//   )
// );
// rules.push(
//   createBundleMarkupRule(
//     "6f2ee959-7d2a-413f-ae4a-fcb450a5e1bd",
//     "Standard Unlimited Lite - 5 days Markup",
//     "Standard Unlimited Lite",
//     5,
//     9
//   )
// );
// rules.push(
//   createBundleMarkupRule(
//     "63ecb95f-8596-4ec4-ad43-64a5e3630067",
//     "Standard Unlimited Lite - 7 days Markup",
//     "Standard Unlimited Lite",
//     7,
//     12
//   )
// );
// rules.push(
//   createBundleMarkupRule(
//     "82206fc2-543c-4f9c-864a-5c78bd8d74c1",
//     "Standard Unlimited Lite - 10 days Markup",
//     "Standard Unlimited Lite",
//     10,
//     15
//   )
// );
// rules.push(
//   createBundleMarkupRule(
//     "cbf44bb8-25a3-44f1-9e06-05fbca095d13",
//     "Standard Unlimited Lite - 15 days Markup",
//     "Standard Unlimited Lite",
//     15,
//     17
//   )
// );
// rules.push(
//   createBundleMarkupRule(
//     "62ae3edc-7bb1-4c2e-a25e-101f34cb79a4",
//     "Standard Unlimited Lite - 30 days Markup",
//     "Standard Unlimited Lite",
//     30,
//     20
//   )
// );

// // Standard Unlimited Essential - All durations
// rules.push(
//   createBundleMarkupRule(
//     "43b684f4-da77-4992-aa39-e6c7808a78d5",
//     "Standard Unlimited Essential - 1 day Markup",
//     "Standard Unlimited Essential",
//     1,
//     3
//   )
// );
// rules.push(
//   createBundleMarkupRule(
//     "58647143-d7e1-4261-9747-8743aa186653",
//     "Standard Unlimited Essential - 3 days Markup",
//     "Standard Unlimited Essential",
//     3,
//     5
//   )
// );
// rules.push(
//   createBundleMarkupRule(
//     "ffd2c4ac-d03f-4626-95dd-7902e2141f0d",
//     "Standard Unlimited Essential - 5 days Markup",
//     "Standard Unlimited Essential",
//     5,
//     9
//   )
// );
// rules.push(
//   createBundleMarkupRule(
//     "0923c0b1-c6df-404b-9bc2-90b3d790e788",
//     "Standard Unlimited Essential - 7 days Markup",
//     "Standard Unlimited Essential",
//     7,
//     12
//   )
// );
// rules.push(
//   createBundleMarkupRule(
//     "e7898ce7-34ab-4926-b168-16548445443d",
//     "Standard Unlimited Essential - 10 days Markup",
//     "Standard Unlimited Essential",
//     10,
//     15
//   )
// );
// rules.push(
//   createBundleMarkupRule(
//     "e31f3985-54c6-4a6d-92bc-cc8867731cc9",
//     "Standard Unlimited Essential - 15 days Markup",
//     "Standard Unlimited Essential",
//     15,
//     17
//   )
// );
// rules.push(
//   createBundleMarkupRule(
//     "9c2de98d-a9ba-4b76-be99-187fd0a95375",
//     "Standard Unlimited Essential - 30 days Markup",
//     "Standard Unlimited Essential",
//     30,
//     20
//   )
// );

// // Standard Unlimited Plus - All durations
// rules.push(
//   createBundleMarkupRule(
//     "f45abb2b-2380-476f-88fb-a5a1f62d5a0d",
//     "Standard Unlimited Plus - 1 day Markup",
//     "Standard Unlimited Plus",
//     1,
//     4
//   )
// );
// rules.push(
//   createBundleMarkupRule(
//     "084b9c0f-c721-4965-8cdd-42d6375c13a9",
//     "Standard Unlimited Plus - 3 days Markup",
//     "Standard Unlimited Plus",
//     3,
//     6
//   )
// );
// rules.push(
//   createBundleMarkupRule(
//     "d09e2ecd-2b00-482d-8075-71c601916fb8",
//     "Standard Unlimited Plus - 5 days Markup",
//     "Standard Unlimited Plus",
//     5,
//     10
//   )
// );
// rules.push(
//   createBundleMarkupRule(
//     "31ad23ae-5a0b-4717-84cb-852e2c2a2222",
//     "Standard Unlimited Plus - 7 days Markup",
//     "Standard Unlimited Plus",
//     7,
//     13
//   )
// );
// rules.push(
//   createBundleMarkupRule(
//     "40060637-0cf6-4dca-bb05-db0bf0fb19f9",
//     "Standard Unlimited Plus - 10 days Markup",
//     "Standard Unlimited Plus",
//     10,
//     16
//   )
// );
// rules.push(
//   createBundleMarkupRule(
//     "92139614-01a0-41c6-8000-ea143431060d",
//     "Standard Unlimited Plus - 15 days Markup",
//     "Standard Unlimited Plus",
//     15,
//     18
//   )
// );
// rules.push(
//   createBundleMarkupRule(
//     "8669170d-e1f0-4b6e-b135-1f9204b307b6",
//     "Standard Unlimited Plus - 30 days Markup",
//     "Standard Unlimited Plus",
//     30,
//     21
//   )
// );
