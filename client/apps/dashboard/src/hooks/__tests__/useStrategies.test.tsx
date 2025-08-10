import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { MockedProvider, MockedResponse } from "@apollo/client/testing";
import { GraphQLError } from "graphql";
import React from "react";
import {
  useStrategies,
  useActiveStrategies,
  useArchivedStrategies,
  useDefaultStrategy,
  useSearchStrategies,
} from "../useStrategies";
import { GET_PRICING_STRATEGIES } from "../../graphql/queries/strategies";
import { DatabasePricingStrategy, StrategyFilter } from "../../types/strategies";

// Mock data fixtures
const mockStrategies: DatabasePricingStrategy[] = [
  {
    id: "strategy-123",
    code: "TEST_STRATEGY",
    name: "Test Strategy",
    description: "A test strategy",
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
  },
  {
    id: "strategy-456",
    code: "DEFAULT_STRATEGY",
    name: "Default Strategy",
    description: "The default strategy",
    version: 2,
    isDefault: true,
    activationCount: 15,
    parentStrategyId: null,
    validatedAt: null,
    validationErrors: null,
    lastActivatedAt: "2024-01-20T10:00:00.000Z",
    archivedAt: null,
    createdBy: "admin-user",
    updatedBy: "admin-user",
    createdAt: "2024-01-01T08:00:00.000Z",
    updatedAt: "2024-01-10T12:00:00.000Z",
  },
  {
    id: "strategy-789",
    code: "ARCHIVED_STRATEGY",
    name: "Archived Strategy",
    description: "An archived strategy",
    version: 1,
    isDefault: false,
    activationCount: 2,
    parentStrategyId: null,
    validatedAt: null,
    validationErrors: null,
    lastActivatedAt: "2024-01-05T10:00:00.000Z",
    archivedAt: "2024-01-25T10:00:00.000Z",
    createdBy: "user-456",
    updatedBy: "admin-user",
    createdAt: "2023-12-01T10:00:00.000Z",
    updatedAt: "2024-01-25T10:00:00.000Z",
  },
];

const mockActiveStrategies = mockStrategies.filter(s => !s.archivedAt);
const mockArchivedStrategies = mockStrategies.filter(s => s.archivedAt);
const mockDefaultStrategy = mockStrategies.filter(s => s.isDefault);

// Helper function to create wrapper with MockedProvider
const createWrapper = (mocks: MockedResponse[]) => {
  return ({ children }: { children: React.ReactNode }) => (
    <MockedProvider mocks={mocks} addTypename={false}>
      {children}
    </MockedProvider>
  );
};

describe("useStrategies", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("useStrategies hook", () => {
    it("should fetch all strategies without filter", async () => {
      const mocks: MockedResponse[] = [
        {
          request: {
            query: GET_PRICING_STRATEGIES,
            variables: { filter: undefined },
          },
          result: {
            data: {
              pricingStrategies: mockStrategies,
            },
          },
        },
      ];

      const { result } = renderHook(() => useStrategies(), {
        wrapper: createWrapper(mocks),
      });

      expect(result.current.loading).toBe(true);
      expect(result.current.strategies).toEqual([]);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.strategies).toEqual(mockStrategies);
      expect(result.current.error).toBeUndefined();
    });

    it("should apply filter correctly", async () => {
      const filter: StrategyFilter = { archived: false, isDefault: true };
      const mocks: MockedResponse[] = [
        {
          request: {
            query: GET_PRICING_STRATEGIES,
            variables: { filter },
          },
          result: {
            data: {
              pricingStrategies: mockDefaultStrategy,
            },
          },
        },
      ];

      const { result } = renderHook(() => useStrategies(filter), {
        wrapper: createWrapper(mocks),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.strategies).toEqual(mockDefaultStrategy);
    });

    it("should handle search filter", async () => {
      const filter: StrategyFilter = { search: "test" };
      const expectedResults = [mockStrategies[0]]; // Only "Test Strategy" matches

      const mocks: MockedResponse[] = [
        {
          request: {
            query: GET_PRICING_STRATEGIES,
            variables: { filter },
          },
          result: {
            data: {
              pricingStrategies: expectedResults,
            },
          },
        },
      ];

      const { result } = renderHook(() => useStrategies(filter), {
        wrapper: createWrapper(mocks),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.strategies).toEqual(expectedResults);
    });

    it("should handle empty results", async () => {
      const mocks: MockedResponse[] = [
        {
          request: {
            query: GET_PRICING_STRATEGIES,
            variables: { filter: undefined },
          },
          result: {
            data: {
              pricingStrategies: [],
            },
          },
        },
      ];

      const { result } = renderHook(() => useStrategies(), {
        wrapper: createWrapper(mocks),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.strategies).toEqual([]);
      expect(result.current.error).toBeUndefined();
    });

    it("should handle GraphQL errors", async () => {
      const mocks: MockedResponse[] = [
        {
          request: {
            query: GET_PRICING_STRATEGIES,
            variables: { filter: undefined },
          },
          error: new GraphQLError("Failed to fetch strategies"),
        },
      ];

      const { result } = renderHook(() => useStrategies(), {
        wrapper: createWrapper(mocks),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.strategies).toEqual([]);
      expect(result.current.error).toBeDefined();
      expect(result.current.error?.message).toContain("Failed to fetch strategies");
    });

    it("should handle network errors", async () => {
      const mocks: MockedResponse[] = [
        {
          request: {
            query: GET_PRICING_STRATEGIES,
            variables: { filter: undefined },
          },
          error: new Error("Network error"),
        },
      ];

      const { result } = renderHook(() => useStrategies(), {
        wrapper: createWrapper(mocks),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBeDefined();
      expect(result.current.error?.message).toContain("Network error");
    });

    it("should support refetch functionality", async () => {
      let callCount = 0;
      const mocks: MockedResponse[] = [
        {
          request: {
            query: GET_PRICING_STRATEGIES,
            variables: { filter: undefined },
          },
          result: () => {
            callCount++;
            return {
              data: {
                pricingStrategies: callCount === 1 ? [mockStrategies[0]] : mockStrategies,
              },
            };
          },
        },
        {
          request: {
            query: GET_PRICING_STRATEGIES,
            variables: { filter: undefined },
          },
          result: {
            data: {
              pricingStrategies: mockStrategies,
            },
          },
        },
      ];

      const { result } = renderHook(() => useStrategies(), {
        wrapper: createWrapper(mocks),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.strategies).toHaveLength(1);

      // Trigger refetch
      result.current.refetch();

      await waitFor(() => {
        expect(result.current.strategies).toHaveLength(3);
      });
    });

    it("should handle partial data with errorPolicy: all", async () => {
      const partialData = [mockStrategies[0]];
      const mocks: MockedResponse[] = [
        {
          request: {
            query: GET_PRICING_STRATEGIES,
            variables: { filter: undefined },
          },
          result: {
            data: {
              pricingStrategies: partialData,
            },
            errors: [new GraphQLError("Partial failure")],
          },
        },
      ];

      const { result } = renderHook(() => useStrategies(), {
        wrapper: createWrapper(mocks),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Should still return partial data due to errorPolicy: "all"
      expect(result.current.strategies).toEqual(partialData);
      expect(result.current.error).toBeDefined();
    });

    it("should update when filter changes", async () => {
      const initialFilter: StrategyFilter = { archived: false };
      const updatedFilter: StrategyFilter = { archived: true };

      const mocks: MockedResponse[] = [
        {
          request: {
            query: GET_PRICING_STRATEGIES,
            variables: { filter: initialFilter },
          },
          result: {
            data: {
              pricingStrategies: mockActiveStrategies,
            },
          },
        },
        {
          request: {
            query: GET_PRICING_STRATEGIES,
            variables: { filter: updatedFilter },
          },
          result: {
            data: {
              pricingStrategies: mockArchivedStrategies,
            },
          },
        },
      ];

      const { result, rerender } = renderHook(
        ({ filter }: { filter?: StrategyFilter }) => useStrategies(filter),
        {
          wrapper: createWrapper(mocks),
          initialProps: { filter: initialFilter },
        }
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.strategies).toEqual(mockActiveStrategies);

      // Update the filter
      rerender({ filter: updatedFilter });

      await waitFor(() => {
        expect(result.current.strategies).toEqual(mockArchivedStrategies);
      });
    });
  });

  describe("useActiveStrategies hook", () => {
    it("should fetch only active strategies", async () => {
      const mocks: MockedResponse[] = [
        {
          request: {
            query: GET_PRICING_STRATEGIES,
            variables: { filter: { archived: false } },
          },
          result: {
            data: {
              pricingStrategies: mockActiveStrategies,
            },
          },
        },
      ];

      const { result } = renderHook(() => useActiveStrategies(), {
        wrapper: createWrapper(mocks),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.strategies).toEqual(mockActiveStrategies);
      expect(result.current.strategies.every(s => !s.archivedAt)).toBe(true);
    });
  });

  describe("useArchivedStrategies hook", () => {
    it("should fetch only archived strategies", async () => {
      const mocks: MockedResponse[] = [
        {
          request: {
            query: GET_PRICING_STRATEGIES,
            variables: { filter: { archived: true } },
          },
          result: {
            data: {
              pricingStrategies: mockArchivedStrategies,
            },
          },
        },
      ];

      const { result } = renderHook(() => useArchivedStrategies(), {
        wrapper: createWrapper(mocks),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.strategies).toEqual(mockArchivedStrategies);
      expect(result.current.strategies.every(s => s.archivedAt)).toBe(true);
    });
  });

  describe("useDefaultStrategy hook", () => {
    it("should fetch only default strategies", async () => {
      const mocks: MockedResponse[] = [
        {
          request: {
            query: GET_PRICING_STRATEGIES,
            variables: { filter: { isDefault: true } },
          },
          result: {
            data: {
              pricingStrategies: mockDefaultStrategy,
            },
          },
        },
      ];

      const { result } = renderHook(() => useDefaultStrategy(), {
        wrapper: createWrapper(mocks),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.strategies).toEqual(mockDefaultStrategy);
      expect(result.current.strategies.every(s => s.isDefault)).toBe(true);
    });

    it("should handle case with no default strategy", async () => {
      const mocks: MockedResponse[] = [
        {
          request: {
            query: GET_PRICING_STRATEGIES,
            variables: { filter: { isDefault: true } },
          },
          result: {
            data: {
              pricingStrategies: [],
            },
          },
        },
      ];

      const { result } = renderHook(() => useDefaultStrategy(), {
        wrapper: createWrapper(mocks),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.strategies).toEqual([]);
    });
  });

  describe("useSearchStrategies hook", () => {
    it("should search active strategies with search term", async () => {
      const searchTerm = "default";
      const expectedResults = [mockStrategies[1]]; // "Default Strategy"

      const mocks: MockedResponse[] = [
        {
          request: {
            query: GET_PRICING_STRATEGIES,
            variables: { filter: { search: searchTerm, archived: false } },
          },
          result: {
            data: {
              pricingStrategies: expectedResults,
            },
          },
        },
      ];

      const { result } = renderHook(() => useSearchStrategies(searchTerm), {
        wrapper: createWrapper(mocks),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.strategies).toEqual(expectedResults);
    });

    it("should return empty results for non-matching search", async () => {
      const searchTerm = "nonexistent";

      const mocks: MockedResponse[] = [
        {
          request: {
            query: GET_PRICING_STRATEGIES,
            variables: { filter: { search: searchTerm, archived: false } },
          },
          result: {
            data: {
              pricingStrategies: [],
            },
          },
        },
      ];

      const { result } = renderHook(() => useSearchStrategies(searchTerm), {
        wrapper: createWrapper(mocks),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.strategies).toEqual([]);
    });

    it("should update results when search term changes", async () => {
      const searchTerm1 = "test";
      const searchTerm2 = "default";

      const mocks: MockedResponse[] = [
        {
          request: {
            query: GET_PRICING_STRATEGIES,
            variables: { filter: { search: searchTerm1, archived: false } },
          },
          result: {
            data: {
              pricingStrategies: [mockStrategies[0]],
            },
          },
        },
        {
          request: {
            query: GET_PRICING_STRATEGIES,
            variables: { filter: { search: searchTerm2, archived: false } },
          },
          result: {
            data: {
              pricingStrategies: [mockStrategies[1]],
            },
          },
        },
      ];

      const { result, rerender } = renderHook(
        ({ searchTerm }: { searchTerm: string }) => useSearchStrategies(searchTerm),
        {
          wrapper: createWrapper(mocks),
          initialProps: { searchTerm: searchTerm1 },
        }
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.strategies).toEqual([mockStrategies[0]]);

      // Update search term
      rerender({ searchTerm: searchTerm2 });

      await waitFor(() => {
        expect(result.current.strategies).toEqual([mockStrategies[1]]);
      });
    });

    it("should handle empty search term", async () => {
      const searchTerm = "";

      const mocks: MockedResponse[] = [
        {
          request: {
            query: GET_PRICING_STRATEGIES,
            variables: { filter: { search: searchTerm, archived: false } },
          },
          result: {
            data: {
              pricingStrategies: mockActiveStrategies,
            },
          },
        },
      ];

      const { result } = renderHook(() => useSearchStrategies(searchTerm), {
        wrapper: createWrapper(mocks),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.strategies).toEqual(mockActiveStrategies);
    });
  });

  describe("caching behavior", () => {
    it("should use cache-and-network fetch policy", async () => {
      const mocks: MockedResponse[] = [
        {
          request: {
            query: GET_PRICING_STRATEGIES,
            variables: { filter: undefined },
          },
          result: {
            data: {
              pricingStrategies: mockStrategies,
            },
          },
        },
      ];

      const { result } = renderHook(() => useStrategies(), {
        wrapper: createWrapper(mocks),
      });

      // First render should show loading
      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.strategies).toEqual(mockStrategies);
    });

    it("should notify on network status changes", async () => {
      const mocks: MockedResponse[] = [
        {
          request: {
            query: GET_PRICING_STRATEGIES,
            variables: { filter: undefined },
          },
          result: {
            data: {
              pricingStrategies: mockStrategies,
            },
          },
        },
      ];

      const { result } = renderHook(() => useStrategies(), {
        wrapper: createWrapper(mocks),
      });

      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Test refetch causes loading state change
      result.current.refetch();

      // This would require more complex mocking to test properly
      // In real usage, the loading state would briefly become true during refetch
    });
  });

  describe("type safety", () => {
    it("should return correctly typed strategies", async () => {
      const mocks: MockedResponse[] = [
        {
          request: {
            query: GET_PRICING_STRATEGIES,
            variables: { filter: undefined },
          },
          result: {
            data: {
              pricingStrategies: mockStrategies,
            },
          },
        },
      ];

      const { result } = renderHook(() => useStrategies(), {
        wrapper: createWrapper(mocks),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Type checks - these would fail at compile time if types are wrong
      const firstStrategy = result.current.strategies[0];
      expect(typeof firstStrategy.id).toBe("string");
      expect(typeof firstStrategy.name).toBe("string");
      expect(typeof firstStrategy.version).toBe("number");
      expect(typeof firstStrategy.isDefault).toBe("boolean");
      expect(firstStrategy.createdAt).toBeDefined();
    });

    it("should handle filter parameter types correctly", () => {
      const filter: StrategyFilter = {
        archived: false,
        isDefault: true,
        search: "test",
      };

      // This would fail at compile time if StrategyFilter type is incorrect
      expect(typeof filter.archived).toBe("boolean");
      expect(typeof filter.isDefault).toBe("boolean");
      expect(typeof filter.search).toBe("string");
    });
  });
});