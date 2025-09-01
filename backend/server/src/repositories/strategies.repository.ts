import { createLogger } from "../lib/logger";
import type { Database } from "@hiilo/supabase";
import { BaseSupabaseRepository } from "./base-supabase.repository";

// Database row types
type PricingStrategyRow = Database["public"]["Tables"]["pricing_strategies"]["Row"];
type PricingStrategyInsert = Database["public"]["Tables"]["pricing_strategies"]["Insert"];
type PricingStrategyUpdate = Database["public"]["Tables"]["pricing_strategies"]["Update"];
type StrategyBlockRow = Database["public"]["Tables"]["strategy_blocks"]["Row"];
type PricingBlockRow = Database["public"]["Tables"]["pricing_blocks"]["Row"];

// Application domain types
export interface PricingStrategy {
  id: string;
  code: string;
  name: string;
  description: string | null;
  version: number;
  isDefault: boolean;
  activationCount: number | null;
  parentStrategyId: string | null;
  validatedAt: string | null;
  validationErrors: any | null;
  lastActivatedAt: string | null;
  archivedAt: string | null;
  createdBy: string;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface StrategyBlock {
  id: string;
  strategyId: string;
  blockId: string;
  priority: number;
  isEnabled: boolean;
  configOverrides: any | null;
}

export interface PricingStrategyWithBlocks extends PricingStrategy {
  blocks: StrategyBlockWithDetails[];
}

export interface StrategyBlockWithDetails extends StrategyBlock {
  block: {
    id: string;
    name: string;
    description: string | null;
    eventType: string;
    category: string;
    conditions: any;
    params: any;
    isActive: boolean;
    isEditable: boolean;
    priority: number; // This is from pricing_blocks table
    createdAt: string;
    updatedAt: string | null;
  };
}

export interface CreateStrategyInput {
  code: string;
  name: string;
  description?: string | null;
  parentStrategyId?: string | null;
  isDefault?: boolean;
  createdBy: string;
}

export interface UpdateStrategyInput {
  code?: string;
  name?: string;
  description?: string | null;
  parentStrategyId?: string | null;
  isDefault?: boolean;
  updatedBy?: string;
}

export interface AddBlockToStrategyInput {
  strategyId: string;
  blockId: string;
  priority: number;
  isEnabled?: boolean;
  configOverrides?: any | null;
  addedBy?: string;
}

export interface UpdateStrategyBlockInput {
  priority?: number;
  isEnabled?: boolean;
  configOverrides?: any | null;
}

export interface StrategyFilter {
  isDefault?: boolean;
  isArchived?: boolean;
  createdBy?: string;
  searchTerm?: string;
}

export class StrategiesRepository extends BaseSupabaseRepository<
  PricingStrategyRow,
  PricingStrategyInsert,
  PricingStrategyUpdate
> {
  private logger = createLogger({
    component: "StrategiesRepository",
    operationType: "database-operation",
  });

  constructor() {
    super("pricing_strategies");
  }

  /**
   * Fetch all available strategies with basic metadata
   */
  async getAllStrategies(filter?: StrategyFilter): Promise<PricingStrategy[]> {
    this.logger.info("Finding all pricing strategies", { filter });

    let query = this.supabase
      .from("pricing_strategies")
      .select("*")
      .order("is_default", { ascending: false })
      .order("last_activated_at", { ascending: false })
      .order("created_at", { ascending: false });

    // Apply filters
    if (filter) {
      if (filter.isDefault !== undefined) {
        query = query.eq("is_default", filter.isDefault);
      }
      
      if (filter.isArchived !== undefined) {
        if (filter.isArchived) {
          query = query.not("archived_at", "is", null);
        } else {
          query = query.is("archived_at", null);
        }
      }

      if (filter.createdBy) {
        query = query.eq("created_by", filter.createdBy);
      }

      if (filter.searchTerm) {
        query = query.or(`name.ilike.%${filter.searchTerm}%,code.ilike.%${filter.searchTerm}%,description.ilike.%${filter.searchTerm}%`);
      }
    }

    const { data, error } = await query;

    if (error) {
      this.logger.error("Failed to find pricing strategies", error, { filter });
      this.handleError(error, "finding pricing strategies");
    }

    return (data || []).map(row => this.mapRowToStrategy(row));
  }

  /**
   * Get single strategy with basic details
   */
  async getStrategyById(id: string): Promise<PricingStrategy | null> {
    this.logger.info("Finding pricing strategy by ID", { id });

    const { data, error } = await this.supabase
      .from("pricing_strategies")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        this.logger.info("Pricing strategy not found", { id });
        return null;
      }
      this.logger.error("Failed to find pricing strategy", error, { id });
      this.handleError(error, `finding pricing strategy with id ${id}`);
    }

    return data ? this.mapRowToStrategy(data) : null;
  }

  /**
   * Get strategy with all its blocks and configurations loaded, respecting priority order
   */
  async getStrategyWithBlocks(id: string): Promise<PricingStrategyWithBlocks | null> {
    this.logger.info("Finding pricing strategy with blocks", { id });

    // First get the strategy
    const strategy = await this.getStrategyById(id);
    if (!strategy) {
      return null;
    }

    // Then get all strategy blocks with their pricing block details
    // Join strategy_blocks with pricing_blocks to get complete information
    const { data: blocksData, error: blocksError } = await this.supabase
      .from("strategy_blocks")
      .select(`
        *,
        pricing_blocks (*)
      `)
      .eq("strategy_id", id)
      .order("priority", { ascending: false }); // Respect priority order from strategy_blocks table

    if (blocksError) {
      this.logger.error("Failed to find strategy blocks", blocksError, { strategyId: id });
      this.handleError(blocksError, `finding blocks for strategy ${id}`);
    }

    // Map the joined data to our domain types
    const blocks: StrategyBlockWithDetails[] = (blocksData || []).map(blockRow => ({
      id: blockRow.block_id,
      strategyId: blockRow.strategy_id,
      blockId: blockRow.block_id,
      priority: blockRow.priority,
      isEnabled: blockRow.is_enabled ?? true,
      configOverrides: blockRow.config_overrides,
      block: {
        id: blockRow.pricing_blocks.id,
        name: blockRow.pricing_blocks.name,
        description: blockRow.pricing_blocks.description,
        eventType: blockRow.pricing_blocks.event_type,
        category: blockRow.pricing_blocks.category,
        conditions: blockRow.pricing_blocks.conditions,
        params: blockRow.pricing_blocks.params,
        isActive: blockRow.pricing_blocks.is_active ?? false,
        isEditable: blockRow.pricing_blocks.is_editable ?? false,
        priority: blockRow.pricing_blocks.priority ?? 0,
        createdAt: blockRow.pricing_blocks.created_at || '',
        updatedAt: blockRow.pricing_blocks.updated_at || '',
      }
    }));

    this.logger.info("Found strategy with blocks", { 
      strategyId: id, 
      blockCount: blocks.length,
      blockPriorities: blocks.map(b => b.priority)
    });

    return {
      ...strategy,
      blocks
    };
  }

  /**
   * Create a new strategy
   */
  async createStrategy(input: CreateStrategyInput): Promise<PricingStrategy> {
    this.logger.info("Creating pricing strategy", { 
      code: input.code, 
      name: input.name,
      createdBy: input.createdBy 
    });

    const insertData: PricingStrategyInsert = {
      code: input.code,
      name: input.name,
      description: input.description || null,
      parent_strategy_id: input.parentStrategyId || null,
      is_default: input.isDefault ?? false,
      version: 1,
      created_by: input.createdBy,
      activation_count: 0,
    };

    const { data, error } = await this.supabase
      .from("pricing_strategies")
      .insert(insertData)
      .select()
      .single();

    if (error) {
      this.logger.error("Failed to create pricing strategy", error, { input });
      this.handleError(error, "creating pricing strategy");
    }

    const strategy = this.mapRowToStrategy(data);
    this.logger.info("Pricing strategy created", { 
      id: strategy.id, 
      code: strategy.code 
    });

    return strategy;
  }

  /**
   * Update an existing strategy
   */
  async updateStrategy(id: string, input: UpdateStrategyInput): Promise<PricingStrategy> {
    this.logger.info("Updating pricing strategy", { id, input });

    // Check if strategy exists
    const existing = await this.getStrategyById(id);
    if (!existing) {
      throw new Error(`Pricing strategy ${id} not found`);
    }

    const updateData: PricingStrategyUpdate = {
      updated_at: new Date().toISOString(),
    };

    if (input.code !== undefined) updateData.code = input.code;
    if (input.name !== undefined) updateData.name = input.name;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.parentStrategyId !== undefined) updateData.parent_strategy_id = input.parentStrategyId;
    if (input.isDefault !== undefined) updateData.is_default = input.isDefault;
    if (input.updatedBy !== undefined) updateData.updated_by = input.updatedBy;

    const { data, error } = await this.supabase
      .from("pricing_strategies")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      this.logger.error("Failed to update pricing strategy", error, { id, input });
      this.handleError(error, `updating pricing strategy ${id}`);
    }

    const strategy = this.mapRowToStrategy(data);
    this.logger.info("Pricing strategy updated", { 
      id: strategy.id, 
      code: strategy.code 
    });

    return strategy;
  }

  /**
   * Add a block to a strategy
   */
  async addBlockToStrategy(input: AddBlockToStrategyInput): Promise<StrategyBlock> {
    this.logger.info("Adding block to strategy", { 
      strategyId: input.strategyId, 
      blockId: input.blockId,
      priority: input.priority 
    });

    // Verify strategy exists
    const strategy = await this.getStrategyById(input.strategyId);
    if (!strategy) {
      throw new Error(`Strategy ${input.strategyId} not found`);
    }

    // Verify block exists
    const { data: blockData, error: blockError } = await this.supabase
      .from("pricing_blocks")
      .select("id")
      .eq("id", input.blockId)
      .single();

    if (blockError || !blockData) {
      throw new Error(`Pricing block ${input.blockId} not found`);
    }

    const insertData = {
      strategy_id: input.strategyId,
      block_id: input.blockId,
      priority: input.priority,
      is_enabled: input.isEnabled ?? true,
      config_overrides: input.configOverrides || null,
      added_by: input.addedBy || null,
      added_at: new Date().toISOString(),
    };

    const { data, error } = await this.supabase
      .from("strategy_blocks")
      .insert(insertData)
      .select()
      .single();

    if (error) {
      this.logger.error("Failed to add block to strategy", error, { input });
      this.handleError(error, "adding block to strategy");
    }

    const strategyBlock = this.mapRowToStrategyBlock(data);
    this.logger.info("Block added to strategy", { 
      strategyId: input.strategyId,
      blockId: input.blockId,
      strategyBlockId: strategyBlock.id
    });

    return strategyBlock;
  }

  /**
   * Update a strategy block configuration
   */
  async updateStrategyBlock(strategyBlockId: string, input: UpdateStrategyBlockInput): Promise<StrategyBlock> {
    this.logger.info("Updating strategy block", { strategyBlockId, input });

    const updateData: any = {};

    if (input.priority !== undefined) updateData.priority = input.priority;
    if (input.isEnabled !== undefined) updateData.is_enabled = input.isEnabled;
    if (input.configOverrides !== undefined) updateData.config_overrides = input.configOverrides;

    const { data, error } = await this.supabase
      .from("strategy_blocks")
      .update(updateData)
      .eq("id", strategyBlockId)
      .select()
      .single();

    if (error) {
      this.logger.error("Failed to update strategy block", error, { strategyBlockId, input });
      this.handleError(error, `updating strategy block ${strategyBlockId}`);
    }

    const strategyBlock = this.mapRowToStrategyBlock(data);
    this.logger.info("Strategy block updated", { 
      strategyBlockId: strategyBlock.id,
      strategyId: strategyBlock.strategyId 
    });

    return strategyBlock;
  }

  /**
   * Remove a block from a strategy
   */
  async removeBlockFromStrategy(strategyBlockId: string): Promise<boolean> {
    this.logger.info("Removing block from strategy", { strategyBlockId });

    const { error } = await this.supabase
      .from("strategy_blocks")
      .delete()
      .eq("id", strategyBlockId);

    if (error) {
      this.logger.error("Failed to remove block from strategy", error, { strategyBlockId });
      this.handleError(error, `removing strategy block ${strategyBlockId}`);
    }

    this.logger.info("Block removed from strategy", { strategyBlockId });
    return true;
  }

  /**
   * Archive a strategy (soft delete)
   */
  async archiveStrategy(id: string, archivedBy?: string): Promise<PricingStrategy> {
    this.logger.info("Archiving pricing strategy", { id, archivedBy });

    const updateData: PricingStrategyUpdate = {
      archived_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (archivedBy) {
      updateData.updated_by = archivedBy;
    }

    const { data, error } = await this.supabase
      .from("pricing_strategies")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      this.logger.error("Failed to archive pricing strategy", error, { id });
      this.handleError(error, `archiving pricing strategy ${id}`);
    }

    const strategy = this.mapRowToStrategy(data);
    this.logger.info("Pricing strategy archived", { 
      id: strategy.id, 
      code: strategy.code 
    });

    return strategy;
  }

  /**
   * Restore an archived strategy
   */
  async restoreStrategy(id: string, restoredBy?: string): Promise<PricingStrategy> {
    this.logger.info("Restoring pricing strategy", { id, restoredBy });

    const updateData: PricingStrategyUpdate = {
      archived_at: null,
      updated_at: new Date().toISOString(),
    };

    if (restoredBy) {
      updateData.updated_by = restoredBy;
    }

    const { data, error } = await this.supabase
      .from("pricing_strategies")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      this.logger.error("Failed to restore pricing strategy", error, { id });
      this.handleError(error, `restoring pricing strategy ${id}`);
    }

    const strategy = this.mapRowToStrategy(data);
    this.logger.info("Pricing strategy restored", { 
      id: strategy.id, 
      code: strategy.code 
    });

    return strategy;
  }

  /**
   * Clone an existing strategy with all its blocks
   */
  async cloneStrategy(id: string, newCode: string, newName: string, clonedBy: string): Promise<PricingStrategyWithBlocks> {
    this.logger.info("Cloning pricing strategy", { id, newCode, newName, clonedBy });

    // Get the original strategy with blocks
    const originalStrategy = await this.getStrategyWithBlocks(id);
    if (!originalStrategy) {
      throw new Error(`Strategy ${id} not found`);
    }

    // Create new strategy
    const newStrategy = await this.createStrategy({
      code: newCode,
      name: newName,
      description: originalStrategy.description ? `Clone of: ${originalStrategy.description}` : `Clone of ${originalStrategy.name}`,
      parentStrategyId: originalStrategy.parentStrategyId,
      createdBy: clonedBy,
    });

    // Copy all blocks with same priorities
    const newBlocks: StrategyBlockWithDetails[] = [];
    for (const block of originalStrategy.blocks) {
      const newStrategyBlock = await this.addBlockToStrategy({
        strategyId: newStrategy.id,
        blockId: block.blockId,
        priority: block.priority,
        isEnabled: block.isEnabled,
        configOverrides: block.configOverrides,
        addedBy: clonedBy,
      });

      newBlocks.push({
        ...newStrategyBlock,
        block: block.block
      });
    }

    const clonedStrategy = {
      ...newStrategy,
      blocks: newBlocks
    };

    this.logger.info("Strategy cloned successfully", { 
      originalId: id, 
      newId: newStrategy.id,
      blockCount: newBlocks.length 
    });

    return clonedStrategy;
  }

  /**
   * Get the default strategy
   */
  async getDefaultStrategy(): Promise<PricingStrategy | null> {
    this.logger.info("Finding default pricing strategy");

    const { data, error } = await this.supabase
      .from("pricing_strategies")
      .select("*")
      .eq("is_default", true)
      .is("archived_at", null)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        this.logger.info("No default pricing strategy found");
        return null;
      }
      this.logger.error("Failed to find default pricing strategy", error);
      this.handleError(error, "finding default pricing strategy");
    }

    if (!data) {
      return null;
    }

    return this.mapRowToStrategy(data);
  }

  /**
   * Get the default strategy with blocks
   */
  async getDefaultStrategyWithBlocks(): Promise<PricingStrategyWithBlocks | null> {
    this.logger.info("Finding default pricing strategy with blocks");

    const { data, error } = await this.supabase
      .from("pricing_strategies")
      .select("*")
      .eq("is_default", true)
      .is("archived_at", null)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        this.logger.info("No default pricing strategy found");
        return null;
      }
      this.logger.error("Failed to find default pricing strategy", error);
      this.handleError(error, "finding default pricing strategy");
    }

    if (!data) {
      return null;
    }

    // Get the strategy with blocks
    return this.getStrategyWithBlocks(data.id);
  }

  /**
   * Set a strategy as default (unsets other defaults)
   */
  async setDefaultStrategy(id: string, setBy?: string): Promise<PricingStrategy> {
    this.logger.info("Setting default pricing strategy", { id, setBy });

    // First, unset any existing default
    await this.supabase
      .from("pricing_strategies")
      .update({ 
        is_default: false,
        updated_at: new Date().toISOString(),
        ...(setBy && { updated_by: setBy })
      })
      .eq("is_default", true);

    // Set the new default
    const updateData: PricingStrategyUpdate = {
      is_default: true,
      updated_at: new Date().toISOString(),
    };

    if (setBy) {
      updateData.updated_by = setBy;
    }

    const { data, error } = await this.supabase
      .from("pricing_strategies")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      this.logger.error("Failed to set default pricing strategy", error, { id });
      this.handleError(error, `setting default pricing strategy ${id}`);
    }

    const strategy = this.mapRowToStrategy(data);
    this.logger.info("Default pricing strategy set", { 
      id: strategy.id, 
      code: strategy.code 
    });

    return strategy;
  }

  /**
   * Map database row to domain model
   */
  private mapRowToStrategy(row: PricingStrategyRow): PricingStrategy {
    return {
      id: row.id,
      code: row.code,
      name: row.name,
      description: row.description,
      version: row.version || 0,
      isDefault: row.is_default ?? false,
      activationCount: row.activation_count,
      parentStrategyId: row.parent_strategy_id,
      validatedAt: row.validated_at,
      validationErrors: row.validation_errors,
      lastActivatedAt: row.last_activated_at,
      archivedAt: row.archived_at,
      createdBy: row.created_by || "",
      updatedBy: row.updated_by,
      createdAt: row.created_at || new Date().toISOString(),
      updatedAt: row.updated_at,
    };
  }

  /**
   * Map strategy block row to domain model
   */
  private mapRowToStrategyBlock(row: StrategyBlockRow): StrategyBlock {
    return {
      id: row.block_id,
      strategyId: row.strategy_id,
      blockId: row.block_id,
      priority: row.priority,
      isEnabled: row.is_enabled ?? true,
      configOverrides: row.config_overrides,
    };
  }
}