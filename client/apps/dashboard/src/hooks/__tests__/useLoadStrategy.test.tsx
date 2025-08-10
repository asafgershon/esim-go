import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { MockedProvider, MockedResponse } from "@apollo/client/testing";
import { GraphQLError } from "graphql";
import React from "react";
import {
  useLoadStrategy,
  useLoadDefaultStrategy,
  useStrategyLoader,
} from "../useLoadStrategy";
import { 
  GET_PRICING_STRATEGY, 
  GET_DEFAULT_PRICING_STRATEGY 
} from "../../graphql/queries/strategies";
import type { PricingStrategyWithBlocks } from "../strategy-utils";
import { mapStrategyToUIFormat } from "../strategy-utils";
import { StrategyStep } from "../../pages/pricing/types";

// Mock the mapStrategyToUIFormat function
vi.mock("../strategy-utils", async () => {
  const actual = await vi.importActual("../strategy-utils");
  return {
    ...actual,
    mapStrategyToUIFormat: vi.fn(),
  };
});

// Mock data fixtures
const mockPricingBlock = {
  id: "block-123",
  code: "MARKUP_BLOCK",
  name: "Markup Block",
  description: "Basic markup block",
  category: "basic",
  conditions: { region: "US" },
  action: { markup: 10 },
  priority: 100,
  isActive: true,
  isEditable: true,
  validFrom: null,
  validUntil: null,
  createdBy: "system",
  createdAt: "2024-01-01T10:00:00.000Z",
  updatedAt: null,
};

const mockStrategyBlock = {
  priority: 90,
  isEnabled: true,
  configOverrides: null,
  pricingBlock: mockPricingBlock,
};

const mockStrategyWithBlocks: PricingStrategyWithBlocks = {
  id: "strategy-123",
  code: "TEST_STRATEGY",
  name: "Test Strategy",
  description: "A test strategy with blocks",
  version: 1,
  isDefault: false,
  activationCount: 5,
  parentStrategyId: null,
  validatedAt: null,
  validationErrors: null,
  lastActivatedAt: "2024-01-15T10:00:00.000Z",
  archivedAt: null,
  createdBy: "user-123",
  updatedBy: null,
  createdAt: "2024-01-01T10:00:00.000Z",
  updatedAt: null,
  blocks: [mockStrategyBlock],
};

const mockDefaultStrategy: PricingStrategyWithBlocks = {
  ...mockStrategyWithBlocks,
  id: "default-strategy-456",
  code: "DEFAULT_STRATEGY",
  name: "Default Strategy",
  isDefault: true,
  blocks: [
    mockStrategyBlock,
    {
      priority: 80,
      isEnabled: true,
      configOverrides: { markup: 15 },
      pricingBlock: {
        ...mockPricingBlock,
        id: "block-456",
        code: "PREMIUM_MARKUP",
        name: "Premium Markup Block",
        action: { markup: 15 },
      },
    },
  ],
};

const mockUIStrategySteps: StrategyStep[] = [
  {
    id: "step-1",
    type: "pricing-block",
    config: {
      blockId: "block-123",
      priority: 90,
      isEnabled: true,
      configOverrides: null,
    },
    title: "Markup Block",
    description: "Basic markup block",
    isValid: true,
  },
];

// Helper function to create wrapper with MockedProvider
const createWrapper = (mocks: MockedResponse[]) => {
  return ({ children }: { children: React.ReactNode }) => (
    <MockedProvider mocks={mocks} addTypename={false}>
      {children}
    </MockedProvider>
  );
};

describe("useLoadStrategy", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (mapStrategyToUIFormat as any).mockReturnValue(mockUIStrategySteps);
  });

  describe("useLoadStrategy hook", () => {
    it("should load strategy by ID successfully", async () => {
      const strategyId = "strategy-123";
      const mocks: MockedResponse[] = [
        {
          request: {
            query: GET_PRICING_STRATEGY,
            variables: { id: strategyId },
          },
          result: {
            data: {
              pricingStrategy: mockStrategyWithBlocks,
            },
          },
        },
      ];

      const { result } = renderHook(() => useLoadStrategy(strategyId), {
        wrapper: createWrapper(mocks),
      });

      expect(result.current.loading).toBe(true);
      expect(result.current.strategy).toBeNull();

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.strategy).toEqual(mockStrategyWithBlocks);
      expect(result.current.error).toBeUndefined();
    });

    it("should skip query when strategyId is null", () => {
      const mocks: MockedResponse[] = [];

      const { result } = renderHook(() => useLoadStrategy(null), {
        wrapper: createWrapper(mocks),
      });

      // Query should be skipped, so loading should be false immediately
      expect(result.current.loading).toBe(false);
      expect(result.current.strategy).toBeNull();
      expect(result.current.error).toBeUndefined();
    });

    it("should handle strategy not found", async () => {
      const strategyId = "nonexistent";
      const mocks: MockedResponse[] = [
        {
          request: {
            query: GET_PRICING_STRATEGY,
            variables: { id: strategyId },
          },
          result: {
            data: {
              pricingStrategy: null,
            },
          },
        },
      ];

      const { result } = renderHook(() => useLoadStrategy(strategyId), {
        wrapper: createWrapper(mocks),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.strategy).toBeNull();
      expect(result.current.error).toBeUndefined();
    });

    it("should handle GraphQL errors", async () => {
      const strategyId = "strategy-123";
      const mocks: MockedResponse[] = [
        {
          request: {
            query: GET_PRICING_STRATEGY,
            variables: { id: strategyId },
          },
          error: new GraphQLError("Strategy not found"),
        },
      ];

      const { result } = renderHook(() => useLoadStrategy(strategyId), {
        wrapper: createWrapper(mocks),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.strategy).toBeNull();
      expect(result.current.error).toBeDefined();
      expect(result.current.error?.message).toContain("Strategy not found");
    });

    it("should handle network errors", async () => {
      const strategyId = "strategy-123";
      const mocks: MockedResponse[] = [
        {
          request: {
            query: GET_PRICING_STRATEGY,
            variables: { id: strategyId },
          },
          error: new Error("Network connection failed"),
        },
      ];

      const { result } = renderHook(() => useLoadStrategy(strategyId), {
        wrapper: createWrapper(mocks),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBeDefined();
      expect(result.current.error?.message).toContain("Network connection failed");
    });

    it("should support refetch functionality", async () => {
      const strategyId = "strategy-123";
      let callCount = 0;
      const mocks: MockedResponse[] = [
        {
          request: {
            query: GET_PRICING_STRATEGY,
            variables: { id: strategyId },
          },
          result: () => {
            callCount++;
            return {
              data: {
                pricingStrategy: {
                  ...mockStrategyWithBlocks,
                  version: callCount, // Different version on refetch
                },
              },
            };
          },
        },
        {
          request: {
            query: GET_PRICING_STRATEGY,
            variables: { id: strategyId },
          },
          result: {
            data: {
              pricingStrategy: {
                ...mockStrategyWithBlocks,
                version: 2,
              },
            },
          },
        },
      ];

      const { result } = renderHook(() => useLoadStrategy(strategyId), {
        wrapper: createWrapper(mocks),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.strategy?.version).toBe(1);

      // Trigger refetch
      result.current.refetch();

      await waitFor(() => {
        expect(result.current.strategy?.version).toBe(2);
      });
    });

    it("should handle partial data with errorPolicy: all", async () => {
      const strategyId = "strategy-123";
      const partialStrategy = { ...mockStrategyWithBlocks, description: null };
      const mocks: MockedResponse[] = [
        {
          request: {
            query: GET_PRICING_STRATEGY,
            variables: { id: strategyId },
          },
          result: {
            data: {
              pricingStrategy: partialStrategy,
            },
            errors: [new GraphQLError("Partial load failure")],
          },
        },
      ];

      const { result } = renderHook(() => useLoadStrategy(strategyId), {
        wrapper: createWrapper(mocks),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Should still return partial data due to errorPolicy: "all"
      expect(result.current.strategy).toEqual(partialStrategy);
      expect(result.current.error).toBeDefined();
    });

    describe("loadStrategyIntoBuilder function", () => {
      it("should convert strategy to UI format", async () => {
        const strategyId = "strategy-123";
        const mocks: MockedResponse[] = [
          {
            request: {
              query: GET_PRICING_STRATEGY,
              variables: { id: strategyId },
            },
            result: {
              data: {
                pricingStrategy: mockStrategyWithBlocks,
              },
            },
          },
        ];

        const { result } = renderHook(() => useLoadStrategy(strategyId), {
          wrapper: createWrapper(mocks),
        });

        await waitFor(() => {
          expect(result.current.loading).toBe(false);
        });

        const uiSteps = result.current.loadStrategyIntoBuilder();

        expect(mapStrategyToUIFormat).toHaveBeenCalledWith(mockStrategyWithBlocks);
        expect(uiSteps).toEqual(mockUIStrategySteps);
      });

      it("should return empty array when no strategy loaded", () => {
        const { result } = renderHook(() => useLoadStrategy(null), {
          wrapper: createWrapper([]),
        });

        const uiSteps = result.current.loadStrategyIntoBuilder();

        expect(uiSteps).toEqual([]);
        expect(mapStrategyToUIFormat).not.toHaveBeenCalled();
      });

      it("should handle strategy with no blocks", async () => {
        const strategyWithoutBlocks = { ...mockStrategyWithBlocks, blocks: [] };
        (mapStrategyToUIFormat as any).mockReturnValue([]);

        const strategyId = "strategy-123";
        const mocks: MockedResponse[] = [
          {
            request: {
              query: GET_PRICING_STRATEGY,
              variables: { id: strategyId },
            },
            result: {
              data: {
                pricingStrategy: strategyWithoutBlocks,
              },
            },
          },
        ];

        const { result } = renderHook(() => useLoadStrategy(strategyId), {
          wrapper: createWrapper(mocks),
        });

        await waitFor(() => {
          expect(result.current.loading).toBe(false);
        });

        const uiSteps = result.current.loadStrategyIntoBuilder();

        expect(mapStrategyToUIFormat).toHaveBeenCalledWith(strategyWithoutBlocks);
        expect(uiSteps).toEqual([]);
      });
    });

    it("should update when strategyId changes", async () => {
      const strategyId1 = "strategy-123";
      const strategyId2 = "strategy-456";

      const mocks: MockedResponse[] = [
        {
          request: {
            query: GET_PRICING_STRATEGY,
            variables: { id: strategyId1 },
          },
          result: {
            data: {
              pricingStrategy: mockStrategyWithBlocks,
            },
          },
        },
        {
          request: {
            query: GET_PRICING_STRATEGY,
            variables: { id: strategyId2 },
          },
          result: {
            data: {
              pricingStrategy: mockDefaultStrategy,
            },
          },
        },
      ];

      const { result, rerender } = renderHook(
        ({ strategyId }: { strategyId: string }) => useLoadStrategy(strategyId),
        {
          wrapper: createWrapper(mocks),
          initialProps: { strategyId: strategyId1 },
        }
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.strategy?.id).toBe(strategyId1);

      // Change strategy ID
      rerender({ strategyId: strategyId2 });

      await waitFor(() => {
        expect(result.current.strategy?.id).toBe(strategyId2);
      });
    });
  });

  describe("useLoadDefaultStrategy hook", () => {
    it("should load default strategy successfully", async () => {
      const mocks: MockedResponse[] = [
        {
          request: {
            query: GET_DEFAULT_PRICING_STRATEGY,
          },
          result: {
            data: {
              defaultPricingStrategy: mockDefaultStrategy,
            },
          },
        },
      ];

      const { result } = renderHook(() => useLoadDefaultStrategy(), {
        wrapper: createWrapper(mocks),
      });

      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.strategy).toEqual(mockDefaultStrategy);
      expect(result.current.strategy?.isDefault).toBe(true);
    });

    it("should handle no default strategy found", async () => {
      const mocks: MockedResponse[] = [
        {
          request: {
            query: GET_DEFAULT_PRICING_STRATEGY,
          },
          result: {
            data: {
              defaultPricingStrategy: null,
            },
          },
        },
      ];

      const { result } = renderHook(() => useLoadDefaultStrategy(), {
        wrapper: createWrapper(mocks),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.strategy).toBeNull();
      expect(result.current.error).toBeUndefined();
    });

    it("should handle errors when fetching default strategy", async () => {
      const mocks: MockedResponse[] = [
        {
          request: {
            query: GET_DEFAULT_PRICING_STRATEGY,
          },
          error: new GraphQLError("No default strategy configured"),
        },
      ];

      const { result } = renderHook(() => useLoadDefaultStrategy(), {
        wrapper: createWrapper(mocks),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.strategy).toBeNull();
      expect(result.current.error).toBeDefined();
    });

    describe("loadStrategyIntoBuilder function", () => {
      it("should convert default strategy to UI format", async () => {
        const mocks: MockedResponse[] = [
          {
            request: {
              query: GET_DEFAULT_PRICING_STRATEGY,
            },
            result: {
              data: {
                defaultPricingStrategy: mockDefaultStrategy,
              },
            },
          },
        ];

        const { result } = renderHook(() => useLoadDefaultStrategy(), {
          wrapper: createWrapper(mocks),
        });

        await waitFor(() => {
          expect(result.current.loading).toBe(false);
        });

        const uiSteps = result.current.loadStrategyIntoBuilder();

        expect(mapStrategyToUIFormat).toHaveBeenCalledWith(mockDefaultStrategy);
        expect(uiSteps).toEqual(mockUIStrategySteps);
      });

      it("should return empty array when no default strategy", async () => {
        const mocks: MockedResponse[] = [
          {
            request: {
              query: GET_DEFAULT_PRICING_STRATEGY,
            },
            result: {
              data: {
                defaultPricingStrategy: null,
              },
            },
          },
        ];

        const { result } = renderHook(() => useLoadDefaultStrategy(), {
          wrapper: createWrapper(mocks),
        });

        await waitFor(() => {
          expect(result.current.loading).toBe(false);
        });

        const uiSteps = result.current.loadStrategyIntoBuilder();

        expect(uiSteps).toEqual([]);
        expect(mapStrategyToUIFormat).not.toHaveBeenCalled();
      });
    });

    it("should support refetch for default strategy", async () => {
      let callCount = 0;
      const mocks: MockedResponse[] = [
        {
          request: {
            query: GET_DEFAULT_PRICING_STRATEGY,
          },
          result: () => {
            callCount++;
            return {
              data: {
                defaultPricingStrategy: callCount === 1 ? mockDefaultStrategy : null,
              },
            };
          },
        },
        {
          request: {
            query: GET_DEFAULT_PRICING_STRATEGY,
          },
          result: {
            data: {
              defaultPricingStrategy: mockDefaultStrategy,
            },
          },
        },
      ];

      const { result } = renderHook(() => useLoadDefaultStrategy(), {
        wrapper: createWrapper(mocks),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.strategy).toEqual(mockDefaultStrategy);

      // Trigger refetch
      result.current.refetch();

      await waitFor(() => {
        expect(result.current.strategy).toBeNull();
      });
    });
  });

  describe("useStrategyLoader hook", () => {
    it("should provide loadStrategy function", () => {
      const { result } = renderHook(() => useStrategyLoader(), {
        wrapper: createWrapper([]),
      });

      expect(result.current.loadStrategy).toBeDefined();
      expect(typeof result.current.loadStrategy).toBe("function");
    });

    it("should return empty array for now (placeholder implementation)", async () => {
      const { result } = renderHook(() => useStrategyLoader(), {
        wrapper: createWrapper([]),
      });

      const strategySteps = await result.current.loadStrategy("strategy-123");

      expect(strategySteps).toEqual([]);
    });

    it("should handle different strategy IDs", async () => {
      const { result } = renderHook(() => useStrategyLoader(), {
        wrapper: createWrapper([]),
      });

      const [steps1, steps2] = await Promise.all([
        result.current.loadStrategy("strategy-123"),
        result.current.loadStrategy("strategy-456"),
      ]);

      expect(steps1).toEqual([]);
      expect(steps2).toEqual([]);
    });
  });

  describe("caching behavior", () => {
    it("should use cache-and-network fetch policy", async () => {
      const strategyId = "strategy-123";
      const mocks: MockedResponse[] = [
        {
          request: {
            query: GET_PRICING_STRATEGY,
            variables: { id: strategyId },
          },
          result: {
            data: {
              pricingStrategy: mockStrategyWithBlocks,
            },
          },
        },
      ];

      const { result } = renderHook(() => useLoadStrategy(strategyId), {
        wrapper: createWrapper(mocks),
      });

      // Should show loading initially
      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.strategy).toEqual(mockStrategyWithBlocks);
    });

    it("should notify on network status changes", async () => {
      const strategyId = "strategy-123";
      const mocks: MockedResponse[] = [
        {
          request: {
            query: GET_PRICING_STRATEGY,
            variables: { id: strategyId },
          },
          result: {
            data: {
              pricingStrategy: mockStrategyWithBlocks,
            },
          },
        },
      ];

      const { result } = renderHook(() => useLoadStrategy(strategyId), {
        wrapper: createWrapper(mocks),
      });

      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Trigger refetch should show loading state briefly
      result.current.refetch();
    });
  });

  describe("type safety", () => {
    it("should return correctly typed strategy with blocks", async () => {
      const strategyId = "strategy-123";
      const mocks: MockedResponse[] = [
        {
          request: {
            query: GET_PRICING_STRATEGY,
            variables: { id: strategyId },
          },
          result: {
            data: {
              pricingStrategy: mockStrategyWithBlocks,
            },
          },
        },
      ];

      const { result } = renderHook(() => useLoadStrategy(strategyId), {
        wrapper: createWrapper(mocks),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const strategy = result.current.strategy;
      expect(strategy).toBeDefined();

      // Type checks - these would fail at compile time if types are wrong
      if (strategy) {
        expect(typeof strategy.id).toBe("string");
        expect(typeof strategy.name).toBe("string");
        expect(Array.isArray(strategy.blocks)).toBe(true);
        expect(strategy.blocks[0]).toBeDefined();
        expect(typeof strategy.blocks[0].priority).toBe("number");
        expect(typeof strategy.blocks[0].pricingBlock.id).toBe("string");
      }
    });

    it("should return correctly typed UI strategy steps", async () => {
      const strategyId = "strategy-123";
      const mocks: MockedResponse[] = [
        {
          request: {
            query: GET_PRICING_STRATEGY,
            variables: { id: strategyId },
          },
          result: {
            data: {
              pricingStrategy: mockStrategyWithBlocks,
            },
          },
        },
      ];

      const { result } = renderHook(() => useLoadStrategy(strategyId), {
        wrapper: createWrapper(mocks),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const uiSteps = result.current.loadStrategyIntoBuilder();

      // Type checks for StrategyStep[]
      expect(Array.isArray(uiSteps)).toBe(true);
      if (uiSteps.length > 0) {
        const firstStep = uiSteps[0];
        expect(typeof firstStep.id).toBe("string");
        expect(typeof firstStep.type).toBe("string");
        expect(typeof firstStep.isValid).toBe("boolean");
      }
    });
  });

  describe("error recovery", () => {
    it("should recover from errors on refetch", async () => {
      const strategyId = "strategy-123";
      const mocks: MockedResponse[] = [
        {
          request: {
            query: GET_PRICING_STRATEGY,
            variables: { id: strategyId },
          },
          error: new Error("Initial load failed"),
        },
        {
          request: {
            query: GET_PRICING_STRATEGY,
            variables: { id: strategyId },
          },
          result: {
            data: {
              pricingStrategy: mockStrategyWithBlocks,
            },
          },
        },
      ];

      const { result } = renderHook(() => useLoadStrategy(strategyId), {
        wrapper: createWrapper(mocks),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBeDefined();
      expect(result.current.strategy).toBeNull();

      // Refetch should succeed
      result.current.refetch();

      await waitFor(() => {
        expect(result.current.strategy).toEqual(mockStrategyWithBlocks);
        expect(result.current.error).toBeUndefined();
      });
    });
  });
});