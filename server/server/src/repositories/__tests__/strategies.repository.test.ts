import { describe, it, expect, beforeEach, afterEach, vi, beforeAll, afterAll } from "vitest";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { 
  StrategiesRepository,
  CreateStrategyInput,
  UpdateStrategyInput,
  AddBlockToStrategyInput,
  UpdateStrategyBlockInput,
  StrategyFilter,
  PricingStrategy,
  PricingStrategyWithBlocks,
  StrategyBlock 
} from "../strategies.repository";

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
const mockPricingStrategyRow = {
  id: "strategy-123",
  code: "TEST_STRATEGY",
  name: "Test Strategy",
  description: "A test strategy",
  version: 1,
  is_default: false,
  activation_count: 5,
  parent_strategy_id: null,
  validated_at: null,
  validation_errors: null,
  last_activated_at: "2024-01-15T10:00:00.000Z",
  archived_at: null,
  created_by: "user-123",
  updated_by: null,
  created_at: "2024-01-01T10:00:00.000Z",
  updated_at: null,
};

const mockPricingBlockRow = {
  id: "block-123",
  code: "TEST_BLOCK",
  name: "Test Block",
  description: "A test pricing block",
  type: "markup",
  category: "basic",
  conditions: { region: "US" },
  action: { markup: 10 },
  is_active: true,
  is_editable: true,
  priority: 100,
  created_at: "2024-01-01T10:00:00.000Z",
  updated_at: null,
};

const mockStrategyBlockRow = {
  id: "strategy-block-123",
  strategy_id: "strategy-123",
  block_id: "block-123",
  priority: 90,
  is_enabled: true,
  config_overrides: null,
  added_by: "user-123",
  added_at: "2024-01-01T10:00:00.000Z",
};

const mockSupabaseClient = {
  from: vi.fn(),
} as unknown as SupabaseClient;

describe("StrategiesRepository", () => {
  let repository: StrategiesRepository;
  let mockQuery: any;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
    
    // Setup mock query chain
    mockQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      not: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      single: vi.fn(),
    };

    // Setup default successful response
    mockQuery.single.mockResolvedValue({ 
      data: mockPricingStrategyRow, 
      error: null 
    });

    mockQuery.select.mockResolvedValue({ 
      data: [mockPricingStrategyRow], 
      error: null 
    });

    (mockSupabaseClient.from as any).mockReturnValue(mockQuery);

    repository = new StrategiesRepository();
    // Inject mock client
    (repository as any).supabase = mockSupabaseClient;
  });

  describe("getAllStrategies", () => {
    it("should fetch all strategies without filter", async () => {
      const strategies = await repository.getAllStrategies();

      expect(mockSupabaseClient.from).toHaveBeenCalledWith("pricing_strategies");
      expect(mockQuery.select).toHaveBeenCalledWith("*");
      expect(mockQuery.order).toHaveBeenCalledWith("is_default", { ascending: false });
      expect(mockQuery.order).toHaveBeenCalledWith("last_activated_at", { ascending: false });
      expect(mockQuery.order).toHaveBeenCalledWith("created_at", { ascending: false });
      expect(strategies).toHaveLength(1);
      expect(strategies[0].id).toBe("strategy-123");
      expect(strategies[0].name).toBe("Test Strategy");
    });

    it("should apply isDefault filter correctly", async () => {
      const filter: StrategyFilter = { isDefault: true };
      await repository.getAllStrategies(filter);

      expect(mockQuery.eq).toHaveBeenCalledWith("is_default", true);
    });

    it("should apply archived filter for non-archived strategies", async () => {
      const filter: StrategyFilter = { isArchived: false };
      await repository.getAllStrategies(filter);

      expect(mockQuery.is).toHaveBeenCalledWith("archived_at", null);
    });

    it("should apply archived filter for archived strategies", async () => {
      const filter: StrategyFilter = { isArchived: true };
      await repository.getAllStrategies(filter);

      expect(mockQuery.not).toHaveBeenCalledWith("archived_at", "is", null);
    });

    it("should apply createdBy filter correctly", async () => {
      const filter: StrategyFilter = { createdBy: "user-456" };
      await repository.getAllStrategies(filter);

      expect(mockQuery.eq).toHaveBeenCalledWith("created_by", "user-456");
    });

    it("should apply search filter correctly", async () => {
      const filter: StrategyFilter = { searchTerm: "test search" };
      await repository.getAllStrategies(filter);

      expect(mockQuery.or).toHaveBeenCalledWith(
        "name.ilike.%test search%,code.ilike.%test search%,description.ilike.%test search%"
      );
    });

    it("should handle database errors gracefully", async () => {
      const dbError = new Error("Database connection failed");
      mockQuery.select.mockResolvedValue({ data: null, error: dbError });

      await expect(repository.getAllStrategies()).rejects.toThrow();
    });

    it("should return empty array when no strategies found", async () => {
      mockQuery.select.mockResolvedValue({ data: [], error: null });

      const strategies = await repository.getAllStrategies();
      expect(strategies).toHaveLength(0);
    });
  });

  describe("getStrategyById", () => {
    it("should fetch strategy by ID successfully", async () => {
      const strategy = await repository.getStrategyById("strategy-123");

      expect(mockSupabaseClient.from).toHaveBeenCalledWith("pricing_strategies");
      expect(mockQuery.select).toHaveBeenCalledWith("*");
      expect(mockQuery.eq).toHaveBeenCalledWith("id", "strategy-123");
      expect(mockQuery.single).toHaveBeenCalled();
      expect(strategy?.id).toBe("strategy-123");
      expect(strategy?.name).toBe("Test Strategy");
    });

    it("should return null when strategy not found", async () => {
      mockQuery.single.mockResolvedValue({ 
        data: null, 
        error: { code: "PGRST116" } 
      });

      const strategy = await repository.getStrategyById("nonexistent");
      expect(strategy).toBeNull();
    });

    it("should throw error for database failures", async () => {
      mockQuery.single.mockResolvedValue({ 
        data: null, 
        error: { code: "INTERNAL_ERROR", message: "Database error" } 
      });

      await expect(repository.getStrategyById("strategy-123")).rejects.toThrow();
    });
  });

  describe("getStrategyWithBlocks", () => {
    beforeEach(() => {
      // Mock the getStrategyById call
      vi.spyOn(repository, "getStrategyById").mockResolvedValue(mockPricingStrategyRow as any);
    });

    it("should fetch strategy with blocks successfully", async () => {
      const mockBlockData = [{
        ...mockStrategyBlockRow,
        pricing_blocks: mockPricingBlockRow,
      }];

      mockQuery.select.mockResolvedValue({ data: mockBlockData, error: null });

      const strategyWithBlocks = await repository.getStrategyWithBlocks("strategy-123");

      expect(repository.getStrategyById).toHaveBeenCalledWith("strategy-123");
      expect(mockQuery.select).toHaveBeenCalledWith(expect.stringContaining("pricing_blocks"));
      expect(mockQuery.eq).toHaveBeenCalledWith("strategy_id", "strategy-123");
      expect(mockQuery.order).toHaveBeenCalledWith("priority", { ascending: false });

      expect(strategyWithBlocks).toBeDefined();
      expect(strategyWithBlocks?.blocks).toHaveLength(1);
      expect(strategyWithBlocks?.blocks[0].priority).toBe(90);
      expect(strategyWithBlocks?.blocks[0].block.name).toBe("Test Block");
    });

    it("should return null when strategy not found", async () => {
      vi.spyOn(repository, "getStrategyById").mockResolvedValue(null);

      const result = await repository.getStrategyWithBlocks("nonexistent");
      expect(result).toBeNull();
    });

    it("should handle empty blocks array", async () => {
      mockQuery.select.mockResolvedValue({ data: [], error: null });

      const strategyWithBlocks = await repository.getStrategyWithBlocks("strategy-123");

      expect(strategyWithBlocks?.blocks).toHaveLength(0);
    });

    it("should throw error when blocks loading fails", async () => {
      mockQuery.select.mockResolvedValue({ 
        data: null, 
        error: { message: "Failed to load blocks" } 
      });

      await expect(repository.getStrategyWithBlocks("strategy-123")).rejects.toThrow();
    });
  });

  describe("createStrategy", () => {
    it("should create strategy successfully", async () => {
      const input: CreateStrategyInput = {
        code: "NEW_STRATEGY",
        name: "New Strategy",
        description: "A new test strategy",
        createdBy: "user-123",
        isDefault: false,
      };

      mockQuery.single.mockResolvedValue({ 
        data: { ...mockPricingStrategyRow, ...input }, 
        error: null 
      });

      const strategy = await repository.createStrategy(input);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith("pricing_strategies");
      expect(mockQuery.insert).toHaveBeenCalledWith(expect.objectContaining({
        code: "NEW_STRATEGY",
        name: "New Strategy",
        description: "A new test strategy",
        created_by: "user-123",
        is_default: false,
        version: 1,
        activation_count: 0,
      }));
      expect(mockQuery.select).toHaveBeenCalled();
      expect(mockQuery.single).toHaveBeenCalled();
      expect(strategy.code).toBe("NEW_STRATEGY");
    });

    it("should set default values for optional fields", async () => {
      const minimalInput: CreateStrategyInput = {
        code: "MINIMAL",
        name: "Minimal Strategy",
        createdBy: "user-123",
      };

      await repository.createStrategy(minimalInput);

      expect(mockQuery.insert).toHaveBeenCalledWith(expect.objectContaining({
        description: null,
        parent_strategy_id: null,
        is_default: false,
      }));
    });

    it("should handle creation errors", async () => {
      mockQuery.single.mockResolvedValue({ 
        data: null, 
        error: { message: "Duplicate code" } 
      });

      const input: CreateStrategyInput = {
        code: "DUPLICATE",
        name: "Duplicate Strategy",
        createdBy: "user-123",
      };

      await expect(repository.createStrategy(input)).rejects.toThrow();
    });
  });

  describe("updateStrategy", () => {
    beforeEach(() => {
      vi.spyOn(repository, "getStrategyById").mockResolvedValue(mockPricingStrategyRow as any);
    });

    it("should update strategy successfully", async () => {
      const input: UpdateStrategyInput = {
        name: "Updated Strategy",
        description: "Updated description",
        updatedBy: "user-456",
      };

      const updatedRow = { ...mockPricingStrategyRow, ...input };
      mockQuery.single.mockResolvedValue({ data: updatedRow, error: null });

      const strategy = await repository.updateStrategy("strategy-123", input);

      expect(repository.getStrategyById).toHaveBeenCalledWith("strategy-123");
      expect(mockQuery.update).toHaveBeenCalledWith(expect.objectContaining({
        name: "Updated Strategy",
        description: "Updated description",
        updated_by: "user-456",
        updated_at: expect.any(String),
      }));
      expect(mockQuery.eq).toHaveBeenCalledWith("id", "strategy-123");
      expect(strategy.name).toBe("Updated Strategy");
    });

    it("should throw error when strategy not found", async () => {
      vi.spyOn(repository, "getStrategyById").mockResolvedValue(null);

      const input: UpdateStrategyInput = { name: "Updated" };

      await expect(repository.updateStrategy("nonexistent", input)).rejects.toThrow(
        "Pricing strategy nonexistent not found"
      );
    });

    it("should handle partial updates", async () => {
      const input: UpdateStrategyInput = { name: "Only Name Updated" };

      await repository.updateStrategy("strategy-123", input);

      expect(mockQuery.update).toHaveBeenCalledWith(expect.objectContaining({
        name: "Only Name Updated",
        updated_at: expect.any(String),
      }));
      expect(mockQuery.update).not.toHaveBeenCalledWith(
        expect.objectContaining({ description: expect.anything() })
      );
    });
  });

  describe("addBlockToStrategy", () => {
    beforeEach(() => {
      vi.spyOn(repository, "getStrategyById").mockResolvedValue(mockPricingStrategyRow as any);
    });

    it("should add block to strategy successfully", async () => {
      // Mock strategy exists
      mockQuery.single
        .mockResolvedValueOnce({ data: mockPricingStrategyRow, error: null })
        // Mock block exists
        .mockResolvedValueOnce({ data: mockPricingBlockRow, error: null })
        // Mock successful insert
        .mockResolvedValueOnce({ data: mockStrategyBlockRow, error: null });

      const input: AddBlockToStrategyInput = {
        strategyId: "strategy-123",
        blockId: "block-123",
        priority: 95,
        isEnabled: true,
        addedBy: "user-123",
      };

      const strategyBlock = await repository.addBlockToStrategy(input);

      expect(mockQuery.insert).toHaveBeenCalledWith(expect.objectContaining({
        strategy_id: "strategy-123",
        block_id: "block-123",
        priority: 95,
        is_enabled: true,
        added_by: "user-123",
        added_at: expect.any(String),
      }));
      expect(strategyBlock.strategyId).toBe("strategy-123");
      expect(strategyBlock.blockId).toBe("block-123");
    });

    it("should throw error when strategy not found", async () => {
      vi.spyOn(repository, "getStrategyById").mockResolvedValue(null);

      const input: AddBlockToStrategyInput = {
        strategyId: "nonexistent",
        blockId: "block-123",
        priority: 95,
      };

      await expect(repository.addBlockToStrategy(input)).rejects.toThrow(
        "Strategy nonexistent not found"
      );
    });

    it("should throw error when block not found", async () => {
      mockQuery.single
        .mockResolvedValueOnce({ data: mockPricingStrategyRow, error: null })
        .mockResolvedValueOnce({ data: null, error: { code: "PGRST116" } });

      const input: AddBlockToStrategyInput = {
        strategyId: "strategy-123",
        blockId: "nonexistent",
        priority: 95,
      };

      await expect(repository.addBlockToStrategy(input)).rejects.toThrow(
        "Pricing block nonexistent not found"
      );
    });

    it("should set default values for optional fields", async () => {
      mockQuery.single
        .mockResolvedValueOnce({ data: mockPricingStrategyRow, error: null })
        .mockResolvedValueOnce({ data: mockPricingBlockRow, error: null })
        .mockResolvedValueOnce({ data: mockStrategyBlockRow, error: null });

      const minimalInput: AddBlockToStrategyInput = {
        strategyId: "strategy-123",
        blockId: "block-123",
        priority: 95,
      };

      await repository.addBlockToStrategy(minimalInput);

      expect(mockQuery.insert).toHaveBeenCalledWith(expect.objectContaining({
        is_enabled: true,
        config_overrides: null,
        added_by: null,
      }));
    });
  });

  describe("updateStrategyBlock", () => {
    it("should update strategy block successfully", async () => {
      const input: UpdateStrategyBlockInput = {
        priority: 85,
        isEnabled: false,
        configOverrides: { markup: 15 },
      };

      mockQuery.single.mockResolvedValue({ 
        data: { ...mockStrategyBlockRow, ...input }, 
        error: null 
      });

      const strategyBlock = await repository.updateStrategyBlock("strategy-block-123", input);

      expect(mockQuery.update).toHaveBeenCalledWith(expect.objectContaining({
        priority: 85,
        is_enabled: false,
        config_overrides: { markup: 15 },
      }));
      expect(mockQuery.eq).toHaveBeenCalledWith("id", "strategy-block-123");
    });

    it("should handle partial updates", async () => {
      const input: UpdateStrategyBlockInput = {
        priority: 80,
      };

      await repository.updateStrategyBlock("strategy-block-123", input);

      expect(mockQuery.update).toHaveBeenCalledWith(expect.objectContaining({
        priority: 80,
      }));
      expect(mockQuery.update).not.toHaveBeenCalledWith(
        expect.objectContaining({ is_enabled: expect.anything() })
      );
    });

    it("should handle update errors", async () => {
      mockQuery.single.mockResolvedValue({ 
        data: null, 
        error: { message: "Block not found" } 
      });

      const input: UpdateStrategyBlockInput = { priority: 80 };

      await expect(repository.updateStrategyBlock("nonexistent", input)).rejects.toThrow();
    });
  });

  describe("removeBlockFromStrategy", () => {
    it("should remove block from strategy successfully", async () => {
      mockQuery.delete.mockResolvedValue({ error: null });

      const result = await repository.removeBlockFromStrategy("strategy-block-123");

      expect(mockQuery.delete).toHaveBeenCalled();
      expect(mockQuery.eq).toHaveBeenCalledWith("id", "strategy-block-123");
      expect(result).toBe(true);
    });

    it("should handle removal errors", async () => {
      mockQuery.delete.mockResolvedValue({ error: { message: "Failed to delete" } });

      await expect(repository.removeBlockFromStrategy("strategy-block-123")).rejects.toThrow();
    });
  });

  describe("archiveStrategy", () => {
    it("should archive strategy successfully", async () => {
      const archivedRow = { 
        ...mockPricingStrategyRow, 
        archived_at: "2024-01-15T10:00:00.000Z" 
      };
      mockQuery.single.mockResolvedValue({ data: archivedRow, error: null });

      const strategy = await repository.archiveStrategy("strategy-123", "user-456");

      expect(mockQuery.update).toHaveBeenCalledWith(expect.objectContaining({
        archived_at: expect.any(String),
        updated_at: expect.any(String),
        updated_by: "user-456",
      }));
      expect(mockQuery.eq).toHaveBeenCalledWith("id", "strategy-123");
    });

    it("should archive without archivedBy parameter", async () => {
      const archivedRow = { 
        ...mockPricingStrategyRow, 
        archived_at: "2024-01-15T10:00:00.000Z" 
      };
      mockQuery.single.mockResolvedValue({ data: archivedRow, error: null });

      await repository.archiveStrategy("strategy-123");

      expect(mockQuery.update).toHaveBeenCalledWith(expect.objectContaining({
        archived_at: expect.any(String),
        updated_at: expect.any(String),
      }));
      expect(mockQuery.update).not.toHaveBeenCalledWith(
        expect.objectContaining({ updated_by: expect.anything() })
      );
    });
  });

  describe("restoreStrategy", () => {
    it("should restore strategy successfully", async () => {
      const restoredRow = { 
        ...mockPricingStrategyRow, 
        archived_at: null 
      };
      mockQuery.single.mockResolvedValue({ data: restoredRow, error: null });

      const strategy = await repository.restoreStrategy("strategy-123", "user-456");

      expect(mockQuery.update).toHaveBeenCalledWith(expect.objectContaining({
        archived_at: null,
        updated_at: expect.any(String),
        updated_by: "user-456",
      }));
    });
  });

  describe("getDefaultStrategy", () => {
    beforeEach(() => {
      vi.spyOn(repository, "getStrategyWithBlocks").mockResolvedValue({
        ...mockPricingStrategyRow,
        blocks: [],
      } as any);
    });

    it("should fetch default strategy successfully", async () => {
      mockQuery.single.mockResolvedValue({ 
        data: { ...mockPricingStrategyRow, is_default: true }, 
        error: null 
      });

      const defaultStrategy = await repository.getDefaultStrategy();

      expect(mockQuery.eq).toHaveBeenCalledWith("is_default", true);
      expect(mockQuery.is).toHaveBeenCalledWith("archived_at", null);
      expect(repository.getStrategyWithBlocks).toHaveBeenCalled();
      expect(defaultStrategy).toBeDefined();
    });

    it("should return null when no default strategy exists", async () => {
      mockQuery.single.mockResolvedValue({ 
        data: null, 
        error: { code: "PGRST116" } 
      });

      const defaultStrategy = await repository.getDefaultStrategy();
      expect(defaultStrategy).toBeNull();
    });
  });

  describe("setDefaultStrategy", () => {
    it("should set default strategy successfully", async () => {
      // Mock the unset operation (no specific return needed)
      const unsetMock = {
        ...mockQuery,
        update: vi.fn().mockReturnValue({
          ...mockQuery,
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      };
      
      (mockSupabaseClient.from as any)
        .mockReturnValueOnce(unsetMock) // For unsetting existing defaults
        .mockReturnValue(mockQuery); // For setting new default

      mockQuery.single.mockResolvedValue({ 
        data: { ...mockPricingStrategyRow, is_default: true }, 
        error: null 
      });

      const strategy = await repository.setDefaultStrategy("strategy-123", "user-456");

      expect(unsetMock.update).toHaveBeenCalledWith(expect.objectContaining({
        is_default: false,
        updated_at: expect.any(String),
        updated_by: "user-456",
      }));
      expect(mockQuery.update).toHaveBeenCalledWith(expect.objectContaining({
        is_default: true,
        updated_at: expect.any(String),
        updated_by: "user-456",
      }));
    });
  });

  describe("cloneStrategy", () => {
    beforeEach(() => {
      vi.spyOn(repository, "getStrategyWithBlocks").mockResolvedValue({
        ...mockPricingStrategyRow,
        blocks: [{
          ...mockStrategyBlockRow,
          block: mockPricingBlockRow,
        }],
      } as any);
      
      vi.spyOn(repository, "createStrategy").mockResolvedValue(mockPricingStrategyRow as any);
      vi.spyOn(repository, "addBlockToStrategy").mockResolvedValue(mockStrategyBlockRow as any);
    });

    it("should clone strategy with blocks successfully", async () => {
      const clonedStrategy = await repository.cloneStrategy(
        "strategy-123",
        "CLONED_STRATEGY",
        "Cloned Strategy",
        "user-456"
      );

      expect(repository.getStrategyWithBlocks).toHaveBeenCalledWith("strategy-123");
      expect(repository.createStrategy).toHaveBeenCalledWith(expect.objectContaining({
        code: "CLONED_STRATEGY",
        name: "Cloned Strategy",
        createdBy: "user-456",
      }));
      expect(repository.addBlockToStrategy).toHaveBeenCalledWith(expect.objectContaining({
        strategyId: mockPricingStrategyRow.id,
        blockId: mockStrategyBlockRow.block_id,
        priority: mockStrategyBlockRow.priority,
        addedBy: "user-456",
      }));
      expect(clonedStrategy.blocks).toHaveLength(1);
    });

    it("should throw error when original strategy not found", async () => {
      vi.spyOn(repository, "getStrategyWithBlocks").mockResolvedValue(null);

      await expect(repository.cloneStrategy(
        "nonexistent",
        "CLONED",
        "Cloned",
        "user-456"
      )).rejects.toThrow("Strategy nonexistent not found");
    });
  });

  describe("error handling", () => {
    it("should handle network errors gracefully", async () => {
      mockQuery.select.mockRejectedValue(new Error("Network error"));

      await expect(repository.getAllStrategies()).rejects.toThrow("Network error");
    });

    it("should handle timeout errors", async () => {
      mockQuery.single.mockRejectedValue(new Error("Timeout"));

      await expect(repository.getStrategyById("strategy-123")).rejects.toThrow("Timeout");
    });
  });

  describe("data mapping", () => {
    it("should correctly map database row to domain model", async () => {
      const strategy = await repository.getStrategyById("strategy-123");

      expect(strategy).toEqual(expect.objectContaining({
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
      }));
    });

    it("should handle null/undefined database values", async () => {
      const rowWithNulls = {
        ...mockPricingStrategyRow,
        description: null,
        activation_count: null,
        updated_by: undefined,
        is_default: null,
      };

      mockQuery.single.mockResolvedValue({ data: rowWithNulls, error: null });

      const strategy = await repository.getStrategyById("strategy-123");

      expect(strategy?.description).toBeNull();
      expect(strategy?.activationCount).toBeNull();
      expect(strategy?.updatedBy).toBeUndefined();
      expect(strategy?.isDefault).toBe(false); // Should default to false
    });
  });

  describe("performance considerations", () => {
    it("should batch multiple getAllStrategies calls efficiently", async () => {
      const promises = [
        repository.getAllStrategies(),
        repository.getAllStrategies({ isDefault: true }),
        repository.getAllStrategies({ searchTerm: "test" }),
      ];

      await Promise.all(promises);

      expect(mockSupabaseClient.from).toHaveBeenCalledTimes(3);
    });

    it("should handle large result sets", async () => {
      const largeDataSet = Array.from({ length: 1000 }, (_, i) => ({
        ...mockPricingStrategyRow,
        id: `strategy-${i}`,
        name: `Strategy ${i}`,
      }));

      mockQuery.select.mockResolvedValue({ data: largeDataSet, error: null });

      const strategies = await repository.getAllStrategies();

      expect(strategies).toHaveLength(1000);
      expect(strategies.every(s => s.id.startsWith("strategy-"))).toBe(true);
    });
  });
});