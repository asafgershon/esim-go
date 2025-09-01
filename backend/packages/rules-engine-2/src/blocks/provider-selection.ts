import { Event, Rule } from "json-rules-engine";
import { z } from "zod";
import { Provider } from "../generated/types";

export const ProviderSelectionEventSchema = z.object({
  type: z.literal("select_provider"),
  params: z.object({
    ruleId: z.string(),
    preferredProvider: z.nativeEnum(Provider),
    fallbackProvider: z.nativeEnum(Provider),
  }),
});

export type ProviderSelectionEvent = z.infer<typeof ProviderSelectionEventSchema>;

/**
 * Example provider selection rule that prioritizes Maya Mobile over eSIM Go
 * This rule would typically be created in the database with the appropriate conditions
 */
export const providerSelectionRule = new Rule({
  name: "Select Provider - Maya Priority",
  priority: 1000, // High priority to execute early
  conditions: {
    all: [
      {
        fact: "availableProviders",
        operator: "greaterThan",
        value: 0,
        path: "$.length"
      }
    ]
  },
  event: {
    type: "select_provider",
    params: {
      ruleId: "provider-selection-maya-priority",
      preferredProvider: Provider.Maya,
      fallbackProvider: Provider.EsimGo,
    },
  } as ProviderSelectionEvent,
});

/**
 * Provider selection rule for specific countries where Maya is preferred
 */
export const mayaPreferredCountriesRule = new Rule({
  name: "Select Provider - Maya for Specific Countries",
  priority: 1001,
  conditions: {
    all: [
      {
        fact: "country",
        operator: "in",
        value: ["US", "CA", "GB", "FR", "DE"] // Countries where Maya is preferred
      },
      {
        fact: "availableProviders",
        operator: "in",
        value: [Provider.Maya],
        path: "$"
      }
    ]
  },
  event: {
    type: "select_provider",
    params: {
      ruleId: "maya-preferred-countries",
      preferredProvider: Provider.Maya,
      fallbackProvider: Provider.EsimGo,
    },
  } as ProviderSelectionEvent,
});

/**
 * Fallback provider selection rule for when Maya is not available
 */
export const fallbackProviderRule = new Rule({
  name: "Select Provider - eSIM Go Fallback",
  priority: 999,
  conditions: {
    all: [
      {
        fact: "availableProviders",
        operator: "notIn",
        value: [Provider.Maya],
        path: "$"
      },
      {
        fact: "availableProviders", 
        operator: "in",
        value: [Provider.EsimGo],
        path: "$"
      }
    ]
  },
  event: {
    type: "select_provider",
    params: {
      ruleId: "esim-go-fallback",
      preferredProvider: Provider.EsimGo,
      fallbackProvider: Provider.EsimGo,
    },
  } as ProviderSelectionEvent,
});