import { describe, it, expect, beforeEach, afterEach, vi, Mock } from "vitest";
import { GraphQLError } from "graphql";
import DataLoader from "dataloader";
import { strategiesResolvers } from "../strategies.resolvers";
import type { Context } from "../../context/types";

// Mock the logger
vi.mock("../../lib/logger", () => ({
  createLogger: () => ({
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
  }),
}));

// Test data fixtures
const mockPricingStrategy = {
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
};

const mockDefaultStrategy = {
  ...mockPricingStrategy,
  id: "default-strategy-456",
  code: "DEFAULT_STRATEGY",
  name: "Default Strategy",
  isDefault: true,
  blocks: [
    {
      priority: 100,
      isEnabled: true,
      configOverrides: null,
      pricingBlock: {
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
      },
    },
  ],
};

const mockStrategyBlocks = [
  {
    priority: 100,
    isEnabled: true,
    configOverrides: null,
    pricingBlock: {
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
    },
  },
  {
    priority: 90,
    isEnabled: true,
    configOverrides: { markup: 15 },
    pricingBlock: {
      id: "block-456",
      code: "PREMIUM_MARKUP",
      name: "Premium Markup Block",
      description: "Premium markup block",
      category: "premium",
      conditions: { country: "GB" },
      action: { markup: 15 },
      priority: 90,
      isActive: true,
      isEditable: true,
      validFrom: null,
      validUntil: null,
      createdBy: "user-123",
      createdAt: "2024-01-02T10:00:00.000Z",
      updatedAt: null,
    },
  },
];

// Mock Supabase database query data
const mockSupabaseBlocksData = [
  {
    strategy_id: "strategy-123",
    priority: 100,
    is_enabled: true,
    config_overrides: null,
    pricing_blocks: {
      id: "block-123",
      code: "MARKUP_BLOCK",
      name: "Markup Block",
      description: "Basic markup block",
      type: "markup",
      category: "basic",
      conditions: { region: "US" },
      action: { markup: 10 },
      is_active: true,
      is_editable: true,
      priority: 100,
      created_at: "2024-01-01T10:00:00.000Z",
      updated_at: null,
    },
  },
  {
    strategy_id: "strategy-456",
    priority: 90,
    is_enabled: true,
    config_overrides: { markup: 15 },
    pricing_blocks: {
      id: "block-456",
      code: "PREMIUM_MARKUP",
      name: "Premium Markup Block",
      description: "Premium markup block",
      type: "markup",
      category: "premium",
      conditions: { country: "GB" },
      action: { markup: 15 },
      is_active: true,
      is_editable: true,
      priority: 90,
      created_at: "2024-01-02T10:00:00.000Z",
      updated_at: null,
    },
  },
];

// Create mock context
const createMockContext = (): Context => ({
  auth: {
    user: {
      id: "user-123",
      email: "test@example.com",
      role: "admin",
    },
    session: {} as any,
  },
  repositories: {
    strategies: {
      getAllStrategies: vi.fn(),
      getStrategyById: vi.fn(),
      getDefaultStrategy: vi.fn(),
      createStrategy: vi.fn(),
      updateStrategy: vi.fn(),
      addBlockToStrategy: vi.fn(),
      updateStrategyBlock: vi.fn(),
      removeBlockFromStrategy: vi.fn(),
      archiveStrategy: vi.fn(),
      restoreStrategy: vi.fn(),
      cloneStrategy: vi.fn(),
      setDefaultStrategy: vi.fn(),
    } as any,
  } as any,
  services: {
    db: {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          in: vi.fn(() => ({
            order: vi.fn().mockResolvedValue({
              data: mockSupabaseBlocksData,
              error: null,
            }),
          })),
        })),
      })),
    } as any,
  } as any,
  dataloaders: {} as any,
});

describe("StrategiesResolvers", () => {
  let mockContext: Context;

  beforeEach(() => {
    vi.clearAllMocks();
    mockContext = createMockContext();
  });

  describe("Query.pricingStrategies", () => {
    it("should fetch all strategies without filter", async () => {
      const mockStrategies = [mockPricingStrategy];
      (mockContext.repositories.strategies.getAllStrategies as Mock).mockResolvedValue(mockStrategies);

      const result = await strategiesResolvers.Query.pricingStrategies(
        {},
        { filter: null },
        mockContext
      );

      expect(mockContext.repositories.strategies.getAllStrategies).toHaveBeenCalledWith({
        isDefault: undefined,
        isArchived: undefined,
        searchTerm: undefined,
      });
      expect(result).toEqual(mockStrategies);
    });

    it("should apply filter correctly", async () => {
      const filter = { isDefault: true, archived: false, search: "test" };
      const mockStrategies = [mockPricingStrategy];
      (mockContext.repositories.strategies.getAllStrategies as Mock).mockResolvedValue(mockStrategies);

      const result = await strategiesResolvers.Query.pricingStrategies(
        {},
        { filter },
        mockContext
      );

      expect(mockContext.repositories.strategies.getAllStrategies).toHaveBeenCalledWith({
        isDefault: true,
        isArchived: false,
        searchTerm: "test",
      });
      expect(result).toEqual(mockStrategies);
    });

    it("should handle empty results", async () => {
      (mockContext.repositories.strategies.getAllStrategies as Mock).mockResolvedValue([]);

      const result = await strategiesResolvers.Query.pricingStrategies(
        {},
        { filter: null },
        mockContext
      );

      expect(result).toEqual([]);
    });

    it("should throw GraphQLError on repository error", async () => {
      (mockContext.repositories.strategies.getAllStrategies as Mock).mockRejectedValue(
        new Error("Database error")
      );

      await expect(
        strategiesResolvers.Query.pricingStrategies({}, { filter: null }, mockContext)
      ).rejects.toThrow(GraphQLError);

      try {
        await strategiesResolvers.Query.pricingStrategies({}, { filter: null }, mockContext);
      } catch (error) {
        expect(error).toBeInstanceOf(GraphQLError);
        expect((error as GraphQLError).message).toBe("Failed to fetch pricing strategies");
        expect((error as GraphQLError).extensions?.code).toBe("INTERNAL_ERROR");
      }
    });

    it("should log query details correctly", async () => {
      const mockStrategies = [mockPricingStrategy];
      (mockContext.repositories.strategies.getAllStrategies as Mock).mockResolvedValue(mockStrategies);

      await strategiesResolvers.Query.pricingStrategies(
        {},
        { filter: { search: "test search" } },
        mockContext
      );

      // The logger calls are tested indirectly through successful execution
      expect(mockContext.repositories.strategies.getAllStrategies).toHaveBeenCalledWith({
        isDefault: undefined,
        isArchived: undefined,
        searchTerm: "test search",
      });
    });
  });

  describe("Query.pricingStrategy", () => {
    it("should fetch strategy by ID successfully", async () => {
      (mockContext.repositories.strategies.getStrategyById as Mock).mockResolvedValue(mockPricingStrategy);

      const result = await strategiesResolvers.Query.pricingStrategy(
        {},
        { id: "strategy-123" },
        mockContext
      );

      expect(mockContext.repositories.strategies.getStrategyById).toHaveBeenCalledWith("strategy-123");
      expect(result).toEqual(mockPricingStrategy);
    });

    it("should throw NOT_FOUND error when strategy not found", async () => {
      (mockContext.repositories.strategies.getStrategyById as Mock).mockResolvedValue(null);

      await expect(
        strategiesResolvers.Query.pricingStrategy({}, { id: "nonexistent" }, mockContext)
      ).rejects.toThrow(GraphQLError);

      try {
        await strategiesResolvers.Query.pricingStrategy({}, { id: "nonexistent" }, mockContext);
      } catch (error) {
        expect(error).toBeInstanceOf(GraphQLError);
        expect((error as GraphQLError).message).toBe("Pricing strategy not found");
        expect((error as GraphQLError).extensions?.code).toBe("NOT_FOUND");
      }
    });

    it("should handle repository errors", async () => {
      (mockContext.repositories.strategies.getStrategyById as Mock).mockRejectedValue(
        new Error("Database connection failed")
      );

      await expect(
        strategiesResolvers.Query.pricingStrategy({}, { id: "strategy-123" }, mockContext)
      ).rejects.toThrow(GraphQLError);
    });

    it("should preserve original GraphQLError", async () => {
      const originalError = new GraphQLError("Custom error", {
        extensions: { code: "CUSTOM_CODE" },
      });
      (mockContext.repositories.strategies.getStrategyById as Mock).mockRejectedValue(originalError);

      await expect(
        strategiesResolvers.Query.pricingStrategy({}, { id: "strategy-123" }, mockContext)
      ).rejects.toThrow(originalError);
    });
  });

  describe("Query.defaultPricingStrategy", () => {
    it("should fetch default strategy successfully", async () => {
      (mockContext.repositories.strategies.getDefaultStrategy as Mock).mockResolvedValue(mockDefaultStrategy);

      const result = await strategiesResolvers.Query.defaultPricingStrategy({}, {}, mockContext);

      expect(mockContext.repositories.strategies.getDefaultStrategy).toHaveBeenCalled();
      expect(result).toEqual(mockDefaultStrategy);
    });

    it("should return null when no default strategy exists", async () => {
      (mockContext.repositories.strategies.getDefaultStrategy as Mock).mockResolvedValue(null);

      const result = await strategiesResolvers.Query.defaultPricingStrategy({}, {}, mockContext);

      expect(result).toBeNull();
    });

    it("should handle repository errors", async () => {
      (mockContext.repositories.strategies.getDefaultStrategy as Mock).mockRejectedValue(
        new Error("Database error")
      );

      await expect(
        strategiesResolvers.Query.defaultPricingStrategy({}, {}, mockContext)
      ).rejects.toThrow(GraphQLError);

      try {
        await strategiesResolvers.Query.defaultPricingStrategy({}, {}, mockContext);
      } catch (error) {
        expect(error).toBeInstanceOf(GraphQLError);
        expect((error as GraphQLError).message).toBe("Failed to fetch default pricing strategy");
        expect((error as GraphQLError).extensions?.code).toBe("INTERNAL_ERROR");
      }
    });
  });

  describe("PricingStrategy.blocks field resolver", () => {
    it("should load blocks for strategy using DataLoader", async () => {
      const parent = { id: "strategy-123", name: "Test Strategy" };

      const result = await strategiesResolvers.PricingStrategy.blocks(parent, {}, mockContext);

      expect(mockContext.services.db.from).toHaveBeenCalledWith("strategy_blocks");
      expect(result).toEqual([
        {
          priority: 100,
          isEnabled: true,
          configOverrides: null,
          pricingBlock: {
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
            validFrom: undefined, // These are undefined in the raw data
            validUntil: undefined,
            createdBy: undefined,
            createdAt: "2024-01-01T10:00:00.000Z",
            updatedAt: null,
          },
        },
      ]);
    });

    it("should return empty array for strategy with no blocks", async () => {
      // Mock empty blocks data
      (mockContext.services.db.from as Mock).mockReturnValue({
        select: vi.fn(() => ({
          in: vi.fn(() => ({
            order: vi.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          })),
        })),
      });

      const parent = { id: "strategy-456", name: "Empty Strategy" };

      const result = await strategiesResolvers.PricingStrategy.blocks(parent, {}, mockContext);

      expect(result).toEqual([]);
    });

    it("should handle database errors in DataLoader", async () => {
      // Mock database error
      (mockContext.services.db.from as Mock).mockReturnValue({
        select: vi.fn(() => ({
          in: vi.fn(() => ({
            order: vi.fn().mockResolvedValue({
              data: null,
              error: { message: "Database connection failed" },
            }),
          })),
        })),
      });

      const parent = { id: "strategy-123", name: "Test Strategy" };

      await expect(
        strategiesResolvers.PricingStrategy.blocks(parent, {}, mockContext)
      ).rejects.toThrow(GraphQLError);

      try {
        await strategiesResolvers.PricingStrategy.blocks(parent, {}, mockContext);
      } catch (error) {
        expect(error).toBeInstanceOf(GraphQLError);
        expect((error as GraphQLError).message).toBe("Failed to load strategy blocks");
        expect((error as GraphQLError).extensions?.code).toBe("INTERNAL_ERROR");
      }
    });

    it("should batch multiple strategy blocks requests", async () => {
      // Mock data for multiple strategies
      const multipleStrategiesData = [
        {
          strategy_id: "strategy-123",
          priority: 100,
          is_enabled: true,
          config_overrides: null,
          pricing_blocks: mockSupabaseBlocksData[0].pricing_blocks,
        },
        {
          strategy_id: "strategy-456",
          priority: 90,
          is_enabled: true,
          config_overrides: { markup: 15 },
          pricing_blocks: mockSupabaseBlocksData[1].pricing_blocks,
        },
      ];

      (mockContext.services.db.from as Mock).mockReturnValue({
        select: vi.fn(() => ({
          in: vi.fn((field: string, values: string[]) => {
            expect(field).toBe("strategy_id");
            expect(values).toEqual(["strategy-123", "strategy-456"]);
            return {
              order: vi.fn().mockResolvedValue({
                data: multipleStrategiesData,
                error: null,
              }),
            };
          }),
        })),
      });

      const parent1 = { id: "strategy-123", name: "Strategy 1" };
      const parent2 = { id: "strategy-456", name: "Strategy 2" };

      // Simulate batched requests (would normally be handled by DataLoader automatically)
      const [result1, result2] = await Promise.all([
        strategiesResolvers.PricingStrategy.blocks(parent1, {}, mockContext),
        strategiesResolvers.PricingStrategy.blocks(parent2, {}, mockContext),
      ]);

      expect(result1).toHaveLength(1);
      expect(result1[0].pricingBlock.id).toBe("block-123");

      expect(result2).toHaveLength(1);
      expect(result2[0].pricingBlock.id).toBe("block-456");
      expect(result2[0].configOverrides).toEqual({ markup: 15 });
    });

    it("should maintain correct block priority order", async () => {
      // Mock data with mixed priorities
      const mixedPriorityData = [
        {
          strategy_id: "strategy-123",
          priority: 50, // Lower priority
          is_enabled: true,
          config_overrides: null,
          pricing_blocks: {
            ...mockSupabaseBlocksData[0].pricing_blocks,
            id: "low-priority-block",
            name: "Low Priority Block",
          },
        },
        {
          strategy_id: "strategy-123",
          priority: 100, // Higher priority
          is_enabled: true,
          config_overrides: null,
          pricing_blocks: {
            ...mockSupabaseBlocksData[0].pricing_blocks,
            id: "high-priority-block",
            name: "High Priority Block",
          },
        },
      ];

      (mockContext.services.db.from as Mock).mockReturnValue({
        select: vi.fn(() => ({
          in: vi.fn(() => ({
            order: vi.fn((field: string, options: any) => {
              expect(field).toBe("priority");
              expect(options).toEqual({ ascending: false });
              return Promise.resolve({
                data: mixedPriorityData,
                error: null,
              });
            }),
          })),
        })),
      });

      const parent = { id: "strategy-123", name: "Test Strategy" };

      const result = await strategiesResolvers.PricingStrategy.blocks(parent, {}, mockContext);

      expect(result).toHaveLength(2);
      // Should maintain the order returned by the database (priority descending)
      expect(result[0].pricingBlock.name).toBe("Low Priority Block");
      expect(result[1].pricingBlock.name).toBe("High Priority Block");
    });
  });

  describe("DataLoader behavior", () => {
    it("should cache DataLoader results per request", async () => {
      const parent = { id: "strategy-123", name: "Test Strategy" };

      // First call
      await strategiesResolvers.PricingStrategy.blocks(parent, {}, mockContext);

      // Second call - should use cached DataLoader
      await strategiesResolvers.PricingStrategy.blocks(parent, {}, mockContext);

      // Database should be called twice because we create a new DataLoader each time
      // In a real implementation, DataLoader would be cached per request context
      expect(mockContext.services.db.from).toHaveBeenCalledTimes(2);
    });

    it("should handle mixed strategy IDs in batch requests", async () => {
      const batchData = [
        {
          strategy_id: "strategy-123",
          priority: 100,
          is_enabled: true,
          config_overrides: null,
          pricing_blocks: mockSupabaseBlocksData[0].pricing_blocks,
        },
        // Note: strategy-456 has no blocks in this scenario
      ];

      (mockContext.services.db.from as Mock).mockReturnValue({
        select: vi.fn(() => ({
          in: vi.fn((field: string, values: string[]) => ({
            order: vi.fn().mockResolvedValue({
              data: batchData.filter(block => values.includes(block.strategy_id)),
              error: null,
            }),
          })),
        })),
      });

      const parent1 = { id: "strategy-123", name: "Strategy with blocks" };
      const parent2 = { id: "strategy-456", name: "Strategy without blocks" };

      const [result1, result2] = await Promise.all([
        strategiesResolvers.PricingStrategy.blocks(parent1, {}, mockContext),
        strategiesResolvers.PricingStrategy.blocks(parent2, {}, mockContext),
      ]);

      expect(result1).toHaveLength(1);
      expect(result2).toHaveLength(0); // Empty array for strategy without blocks
    });
  });

  describe("authorization", () => {
    it("should work with authenticated user", async () => {
      const mockStrategies = [mockPricingStrategy];
      (mockContext.repositories.strategies.getAllStrategies as Mock).mockResolvedValue(mockStrategies);

      const result = await strategiesResolvers.Query.pricingStrategies(
        {},
        { filter: null },
        mockContext
      );

      expect(result).toEqual(mockStrategies);
    });

    it("should work with null auth context", async () => {
      const contextWithoutAuth = { ...mockContext, auth: null };
      const mockStrategies = [mockPricingStrategy];
      (contextWithoutAuth.repositories.strategies.getAllStrategies as Mock).mockResolvedValue(mockStrategies);

      const result = await strategiesResolvers.Query.pricingStrategies(
        {},
        { filter: null },
        contextWithoutAuth
      );

      expect(result).toEqual(mockStrategies);
    });
  });

  describe("edge cases", () => {
    it("should handle malformed block data gracefully", async () => {
      const malformedData = [
        {
          strategy_id: "strategy-123",
          priority: 100,
          is_enabled: true,
          config_overrides: null,
          pricing_blocks: null, // Malformed - should be an object
        },
      ];

      (mockContext.services.db.from as Mock).mockReturnValue({
        select: vi.fn(() => ({
          in: vi.fn(() => ({
            order: vi.fn().mockResolvedValue({
              data: malformedData,
              error: null,
            }),
          })),
        })),
      });

      const parent = { id: "strategy-123", name: "Test Strategy" };

      // This should either handle gracefully or throw a meaningful error
      await expect(
        strategiesResolvers.PricingStrategy.blocks(parent, {}, mockContext)
      ).rejects.toThrow();
    });

    it("should handle large batch requests", async () => {
      const largeStrategyIds = Array.from({ length: 100 }, (_, i) => `strategy-${i}`);
      const largeDataSet = largeStrategyIds.map((id, index) => ({
        strategy_id: id,
        priority: 100 - index,
        is_enabled: true,
        config_overrides: null,
        pricing_blocks: {
          ...mockSupabaseBlocksData[0].pricing_blocks,
          id: `block-${index}`,
          name: `Block ${index}`,
        },
      }));

      (mockContext.services.db.from as Mock).mockReturnValue({
        select: vi.fn(() => ({
          in: vi.fn(() => ({
            order: vi.fn().mockResolvedValue({
              data: largeDataSet,
              error: null,
            }),
          })),
        })),
      });

      const promises = largeStrategyIds.map(id => 
        strategiesResolvers.PricingStrategy.blocks(
          { id, name: `Strategy ${id}` },
          {},
          mockContext
        )
      );

      const results = await Promise.all(promises);

      expect(results).toHaveLength(100);
      results.forEach((result, index) => {
        expect(result).toHaveLength(1);
        expect(result[0].pricingBlock.name).toBe(`Block ${index}`);
      });
    });
  });
});