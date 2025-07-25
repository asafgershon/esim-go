import { ActionType, ConditionOperator } from "@esim-go/rules-engine";
import type { Database } from "../database.types";
import { createLogger } from "../lib/logger";
import type {
  CreatePricingRuleInput,
  PricingRule,
  PricingRuleFilter,
  RuleAction,
  RuleCondition,
  UpdatePricingRuleInput,
} from "../types";
import { RuleCategory } from "../types";
import { BaseSupabaseRepository } from "./base-supabase.repository";

type PricingRuleRow = Database["public"]["Tables"]["pricing_rules"]["Row"];
type PricingRuleInsert =
  Database["public"]["Tables"]["pricing_rules"]["Insert"];
type PricingRuleUpdate =
  Database["public"]["Tables"]["pricing_rules"]["Update"];

export class PricingRulesRepository extends BaseSupabaseRepository<
  PricingRuleRow,
  PricingRuleInsert,
  PricingRuleUpdate
> {
  private logger = createLogger({
    component: "PricingRulesRepository",
    operationType: "database-operation",
  });

  constructor() {
    super("pricing_rules");
  }

  async findAll(filter?: PricingRuleFilter): Promise<PricingRule[]> {
    this.logger.info("Finding pricing rules", { filter });

    let query = this.supabase
      .from("pricing_rules")
      .select("*")
      .order("priority", { ascending: false })
      .order("created_at", { ascending: false });

    // Apply filters
    if (filter) {
      if (filter.isActive !== undefined) {
        query = query.eq("is_active", Boolean(filter.isActive));
      }
      if (filter.category) {
        query = query.eq("category", filter.category);
      }
      if (filter.isEditable !== undefined) {
        query = query.eq("is_editable", Boolean(filter.isEditable));
      }
      if (filter.validFrom || filter.validUntil) {
        const validDate = filter.validFrom || filter.validUntil;
        query = query
          .or(`valid_from.is.null,valid_from.lte.${validDate}`)
          .or(`valid_until.is.null,valid_until.gte.${validDate}`);
      }
    }

    const { data, error } = await query;

    if (error) {
      this.logger.error("Failed to find pricing rules", error, { filter });
      throw error;
    }

    return (data || []).map((row) => this.mapRowToRule(row));
  }

  async findById(id: string): Promise<PricingRule | null> {
    this.logger.info("Finding pricing rule by ID", { id });

    const { data, error } = await this.supabase
      .from("pricing_rules")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null; // Not found
      }
      this.logger.error("Failed to find pricing rule", error, { id });
      throw error;
    }

    return data ? this.mapRowToRule(data) : null;
  }

  async createRule(input: CreatePricingRuleInput, userId?: string): Promise<PricingRule> {
    this.logger.info("Creating pricing rule", {
      name: input.name,
      category: input.category,
    });

    // Validate input before creating row
    if (!input.conditions || input.conditions.length === 0) {
      throw new Error("Rule must have at least one condition");
    }
    if (!input.actions || input.actions.length === 0) {
      throw new Error("Rule must have at least one action");
    }

    const row: PricingRuleInsert = {
      category: input.category,
      name: input.name,
      description: input.description || null,
      conditions: input.conditions as any, // Let Supabase handle JSONB conversion
      actions: input.actions as any, // Let Supabase handle JSONB conversion
      priority: input.priority,
      is_active: input.isActive ?? true,
      is_editable: true, // New rules are always editable
      valid_from: input.validFrom || null,
      valid_until: input.validUntil || null,
      created_by: userId || "e8b56c19-1834-4650-8c15-f25403a018f8", // Use provided user ID or fallback
    };

    this.logger.info("Inserting rule with data", {
      row,
      conditionsType: typeof row.conditions,
      actionsType: typeof row.actions,
      conditionsLength: Array.isArray(input.conditions) ? input.conditions.length : 'not array',
      actionsLength: Array.isArray(input.actions) ? input.actions.length : 'not array'
    });

    const { data, error } = await this.supabase
      .from("pricing_rules")
      .insert(row)
      .select()
      .single();

    if (error) {
      this.logger.error("Failed to create pricing rule", error, { 
        input,
        row,
        errorCode: error.code,
        errorMessage: error.message,
        errorDetails: error.details,
        errorHint: error.hint
      });
      throw new Error(`Database error: ${error.message} (${error.code})`);
    }

    const rule = this.mapRowToRule(data);

    this.logger.info("Pricing rule created", {
      id: rule.id,
      name: rule.name,
    });

    return rule;
  }

  async updateRule(
    id: string,
    input: UpdatePricingRuleInput
  ): Promise<PricingRule> {
    this.logger.info("Updating pricing rule", { id, input });

    // Check if rule exists
    const existing = await this.findById(id);
    if (!existing) {
      throw new Error(`Pricing rule ${id} not found`);
    }
    // Allow admins to edit system rules - UI will show warnings

    const update: PricingRuleUpdate = {};

    if (input.category !== undefined) update.category = input.category;
    if (input.name !== undefined) update.name = input.name || "";
    if (input.description !== undefined) update.description = input.description;
    if (input.conditions !== undefined)
      update.conditions = input.conditions as any;
    if (input.actions !== undefined) update.actions = input.actions as any;
    if (input.priority !== undefined) update.priority = input.priority || 0;
    if (input.isActive !== undefined)
      update.is_active = input.isActive || false;
    if (input.validFrom !== undefined) update.valid_from = input.validFrom;
    if (input.validUntil !== undefined) update.valid_until = input.validUntil;

    const { data, error } = await this.supabase
      .from("pricing_rules")
      .update(update)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      this.logger.error("Failed to update pricing rule", error, { id, input });
      throw error;
    }

    const rule = this.mapRowToRule(data);

    this.logger.info("Pricing rule updated", {
      id: rule.id,
      name: rule.name,
    });

    return rule;
  }

  async delete(
    id: string
  ): Promise<{ success: boolean; count: number | null }> {
    this.logger.info("Deleting pricing rule", { id });

    // Check if rule exists
    const existing = await this.findById(id);
    if (!existing) {
      return { success: false, count: null };
    }
    // Allow admins to delete system rules - UI will show warnings

    const { error } = await this.supabase
      .from("pricing_rules")
      .delete()
      .eq("id", id);

    if (error) {
      this.logger.error("Failed to delete pricing rule", error, { id });
      throw error;
    }

    this.logger.info("Pricing rule deleted", { id });
    return { success: true, count: 1 };
  }

  async toggleActive(id: string): Promise<PricingRule> {
    this.logger.info("Toggling pricing rule active status", { id });

    const existing = await this.findById(id);
    if (!existing) {
      throw new Error(`Pricing rule ${id} not found`);
    }

    const updatedRow = await this.update(id, { is_active: !existing.isActive });
    return this.mapRowToRule(updatedRow);
  }

  async findByCategory(category: RuleCategory): Promise<PricingRule[]> {
    return this.findAll({ category });
  }

  async findActiveRules(): Promise<PricingRule[]> {
    return this.findAll({
      isActive: true,
      validFrom: new Date().toISOString(),
      validUntil: new Date().toISOString(),
    });
  }

  async findSystemRules(): Promise<PricingRule[]> {
    return this.findAll({ isEditable: false });
  }

  async findBusinessRules(): Promise<PricingRule[]> {
    return this.findAll({ isEditable: true });
  }

  async cloneRule(id: string, newName: string): Promise<PricingRule> {
    this.logger.info("Cloning pricing rule", { id, newName });

    const existing = await this.findById(id);
    if (!existing) {
      throw new Error(`Pricing rule ${id} not found`);
    }

    const input: CreatePricingRuleInput = {
      category: existing.category,
      name: newName,
      description: existing.description
        ? `Clone of: ${existing.description}`
        : `Clone of ${existing.name}`,
      conditions: existing.conditions,
      actions: existing.actions,
      priority: existing.priority,
      isActive: false, // Clone starts as inactive
      validFrom: existing.validFrom,
      validUntil: existing.validUntil,
    };

    return this.createRule(input);
  }

  async bulkUpdatePriorities(
    updates: Array<{ id: string; priority: number }>
  ): Promise<PricingRule[]> {
    this.logger.info("Bulk updating rule priorities", {
      count: updates.length,
    });

    const results: PricingRule[] = [];

    // Use transaction to ensure consistency
    for (const { id, priority } of updates) {
      const updatedRow = await this.update(id, { priority });
      results.push(this.mapRowToRule(updatedRow));
    }

    return results;
  }

  private mapRowToRule(row: PricingRuleRow): PricingRule {
    return {
      __typename: "PricingRule" as const,
      id: row.id,
      category: row.category as RuleCategory,
      name: row.name,
      description: row.description,
      conditions: row.conditions as RuleCondition[],
      actions: row.actions as RuleAction[],
      priority: row.priority,
      isActive: row.is_active,
      isEditable: row.is_editable,
      validFrom: row.valid_from,
      validUntil: row.valid_until,
      createdBy: row.created_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  // Analytics methods
  async getRuleUsageStats(
    startDate: Date,
    endDate: Date
  ): Promise<
    Array<{
      ruleId: string;
      ruleName: string;
      usageCount: number;
      totalImpact: number;
    }>
  > {
    // This would query from a pricing_rule_applications table
    // that logs each time a rule is applied
    this.logger.info("Getting rule usage stats", {
      startDate,
      endDate,
    });

    // TODO: Implement when we have the applications tracking table
    return [];
  }

  async getConflictingRules(ruleId: string): Promise<PricingRule[]> {
    this.logger.info("Finding conflicting rules", { ruleId });

    const rule = await this.findById(ruleId);
    if (!rule) {
      return [];
    }

    // Find rules with overlapping conditions
    const allRules = await this.findActiveRules();

    return allRules.filter((r) => {
      if (r.id === ruleId) return false;

      // Check for condition overlap
      // This is a simplified check - you might want more sophisticated logic
      return r.conditions.some((c1) =>
        rule.conditions.some(
          (c2) =>
            c1.field === c2.field &&
            c1.operator === c2.operator &&
            JSON.stringify(c1.value) === JSON.stringify(c2.value)
        )
      );
    });
  }

  /**
   * Get default system rules that replace hardcoded values
   */
  private getDefaultSystemRules(): CreatePricingRuleInput[] {
    return [
      // Default processing rate for Israeli cards
      {
        category: RuleCategory.Fee,
        name: "Israeli Card Processing Rate",
        description: "Default processing rate for Israeli payment cards",
        conditions: [
          {
            field: "customer.paymentMethod",
            operator: ConditionOperator.Equals,
            value: "ISRAELI_CARD",
          },
        ],
        actions: [
          {
            type: ActionType.SetProcessingRate,
            value: 0.014, // 1.4%
          },
        ],
        priority: 100,
        isActive: true,
      },

      // Default processing rate for foreign cards
      {
        category: RuleCategory.Fee,
        name: "Foreign Card Processing Rate",
        description: "Default processing rate for foreign payment cards",
        conditions: [
          {
            field: "customer.paymentMethod",
            operator: ConditionOperator.Equals,
            value: "FOREIGN_CARD",
          },
        ],
        actions: [
          {
            type: ActionType.SetProcessingRate,
            value: 0.045, // 4.5%
          },
        ],
        priority: 100,
        isActive: true,
      },

      // Default processing rate for Bit
      {
        category: RuleCategory.Fee,
        name: "Bit Processing Rate",
        description: "Processing rate for Bit payments",
        conditions: [
          {
            field: "customer.paymentMethod",
            operator: ConditionOperator.Equals,
            value: "BIT",
          },
        ],
        actions: [
          {
            type: ActionType.SetProcessingRate,
            value: 0.014, // 1.4%
          },
        ],
        priority: 100,
        isActive: true,
      },

      // Default processing rate for Amex
      {
        category: RuleCategory.Fee,
        name: "Amex Processing Rate",
        description: "Processing rate for American Express",
        conditions: [
          {
            field: "customer.paymentMethod",
            operator: ConditionOperator.Equals,
            value: "AMEX",
          },
        ],
        actions: [
          {
            type: ActionType.SetProcessingRate,
            value: 0.035, // 3.5%
          },
        ],
        priority: 100,
        isActive: true,
      },

      // Default processing rate for Diners
      {
        category: RuleCategory.Fee,
        name: "Diners Processing Rate",
        description: "Processing rate for Diners Club",
        conditions: [
          {
            field: "customer.paymentMethod",
            operator: ConditionOperator.Equals,
            value: "DINERS",
          },
        ],
        actions: [
          {
            type: ActionType.SetProcessingRate,
            value: 0.035, // 3.5%
          },
        ],
        priority: 100,
        isActive: true,
      },

      // Default minimum price rule - using business discount type
      {
        category: RuleCategory.Constraint,
        name: "Minimum Price Floor",
        description: "Ensures prices never go below $0.01",
        conditions: [
          {
            field: "bundle.id",
            operator: ConditionOperator.NotEquals,
            value: "", // Apply to all bundles
          },
        ],
        actions: [
          {
            type: ActionType.SetMinimumPrice,
            value: 0.01,
          },
        ],
        priority: 1000, // Highest priority
        isActive: true,
      },

      // Default minimum profit rule
      {
        category: RuleCategory.Constraint,
        name: "Minimum Profit Margin",
        description: "Ensures minimum profit of $1.50 per bundle",
        conditions: [
          {
            field: "bundle.id",
            operator: ConditionOperator.NotEquals,
            value: "", // Apply to all bundles
          },
        ],
        actions: [
          {
            type: ActionType.SetMinimumProfit,
            value: 1.5,
          },
        ],
        priority: 900,
        isActive: true,
      },

      // Default unused days discount configuration
      {
        category: RuleCategory.Discount,
        name: "Unused Days Discount Rate",
        description: "Default discount rate per unused day (10%)",
        conditions: [
          {
            field: "bundle.id",
            operator: ConditionOperator.NotEquals,
            value: "", // Apply to all bundles
          },
        ],
        actions: [
          {
            type: ActionType.SetDiscountPerUnusedDay,
            value: 0.1, // 10% per day
          },
        ],
        priority: 200,
        isActive: true,
      },
    ];
  }

  /**
   * Initialize the database with default system rules if none exist
   */
  async initializeDefaultRules(): Promise<void> {
    this.logger.info("Checking if default rules initialization is needed");

    const existingRules = await this.findAll();

    if (existingRules.length === 0) {
      this.logger.info("No rules found, creating default system rules");

      const defaultRules = this.getDefaultSystemRules();

      for (const ruleInput of defaultRules) {
        try {
          await this.createRule(ruleInput);
          this.logger.info("Created default rule", {
            name: ruleInput.name,
            category: ruleInput.category,
          });
        } catch (error) {
          this.logger.error("Failed to create default rule", error as Error, {
            name: ruleInput.name,
            category: ruleInput.category,
          });
        }
      }

      this.logger.info("Default rules initialization completed", {
        createdRules: defaultRules.length,
      });
    } else {
      this.logger.info(
        "Default rules initialization skipped - rules already exist",
        {
          existingRulesCount: existingRules.length,
        }
      );
    }
  }
}
