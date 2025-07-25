import { BaseSupabaseRepository } from './base-supabase.repository';
import type { Database } from '../database.types';
import type { 
  PricingRule, 
  CreatePricingRuleInput, 
  UpdatePricingRuleInput,
  PricingRuleFilter,
  RuleCategory,
  RuleCondition,
  RuleAction
} from '../types';
import { createLogger } from '../lib/logger';
import { supabaseAdmin } from '../context/supabase-auth';

type PricingRuleRow = Database['public']['Tables']['pricing_rules']['Row'];
type PricingRuleInsert = Database['public']['Tables']['pricing_rules']['Insert'];
type PricingRuleUpdate = Database['public']['Tables']['pricing_rules']['Update'];

export class PricingRulesRepository extends BaseSupabaseRepository<PricingRuleRow, PricingRuleInsert, PricingRuleUpdate> {
  private logger = createLogger({ 
    component: 'PricingRulesRepository',
    operationType: 'database-operation'
  });

  constructor() {
    super('pricing_rules');
  }

  async findAll(filter?: PricingRuleFilter): Promise<PricingRule[]> {
    this.logger.info('Finding pricing rules', { filter });
    
    let query = this.supabase
      .from('pricing_rules')
      .select('*')
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false });

    // Apply filters
    if (filter) {
      if (filter.isActive !== undefined) {
        query = query.eq('is_active', Boolean(filter.isActive));
      }
      if (filter.category) {
        query = query.eq('category', filter.category);
      }
      if (filter.isEditable !== undefined) {
        query = query.eq('is_editable', Boolean(filter.isEditable));
      }
      if (filter.validFrom || filter.validUntil) {
        const validDate = filter.validFrom || filter.validUntil;
        query = query.or(`valid_from.is.null,valid_from.lte.${validDate}`)
                    .or(`valid_until.is.null,valid_until.gte.${validDate}`);
      }
    }

    const { data, error } = await query;

    if (error) {
      this.logger.error('Failed to find pricing rules', error, { filter });
      throw error;
    }

    return (data || []).map(row => this.mapRowToRule(row));
  }

  async findById(id: string): Promise<PricingRule | null> {
    this.logger.info('Finding pricing rule by ID', { id });
    
    const { data, error } = await this.supabase
      .from('pricing_rules')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      this.logger.error('Failed to find pricing rule', error, { id });
      throw error;
    }

    return data ? this.mapRowToRule(data) : null;
  }

  async createRule(input: CreatePricingRuleInput): Promise<PricingRule> {
    this.logger.info('Creating pricing rule', { 
      name: input.name,
      type: input.type 
    });
    
    const row: PricingRuleInsert = {
      category: input.category,
      name: input.name,
      description: input.description || null,
      conditions: JSON.stringify(input.conditions),
      actions: JSON.stringify(input.actions),
      priority: input.priority,
      is_active: input.isActive ?? true,
      is_editable: true, // New rules are always editable
      valid_from: input.validFrom || null,
      valid_until: input.validUntil || null,
      created_by: '00000000-0000-0000-0000-000000000000' // System user UUID
    };

    const { data, error } = await this.supabase
      .from('pricing_rules')
      .insert(row)
      .select()
      .single();

    if (error) {
      this.logger.error('Failed to create pricing rule', error, { input });
      throw error;
    }

    const rule = this.mapRowToRule(data);
    
    this.logger.info('Pricing rule created', { 
      id: rule.id,
      name: rule.name 
    });
    
    return rule;
  }

  async updateRule(id: string, input: UpdatePricingRuleInput): Promise<PricingRule> {
    this.logger.info('Updating pricing rule', { id, input });
    
    // Check if rule exists
    const existing = await this.findById(id);
    if (!existing) {
      throw new Error(`Pricing rule ${id} not found`);
    }
    // Allow admins to edit system rules - UI will show warnings

    const update: PricingRuleUpdate = {};
    
    if (input.name !== undefined) update.name = input.name || '';
    if (input.description !== undefined) update.description = input.description;
    if (input.conditions !== undefined) update.conditions = input.conditions as any;
    if (input.actions !== undefined) update.actions = input.actions as any;
    if (input.priority !== undefined) update.priority = input.priority || 0;
    if (input.isActive !== undefined) update.is_active = input.isActive || false;
    if (input.validFrom !== undefined) update.valid_from = input.validFrom;
    if (input.validUntil !== undefined) update.valid_until = input.validUntil;

    const { data, error } = await this.supabase
      .from('pricing_rules')
      .update(update)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      this.logger.error('Failed to update pricing rule', error, { id, input });
      throw error;
    }

    const rule = this.mapRowToRule(data);
    
    this.logger.info('Pricing rule updated', { 
      id: rule.id,
      name: rule.name 
    });
    
    return rule;
  }

  async delete(id: string): Promise<{ success: boolean; count: number | null }> {
    this.logger.info('Deleting pricing rule', { id });
    
    // Check if rule exists
    const existing = await this.findById(id);
    if (!existing) {
      return { success: false, count: null };
    }
    // Allow admins to delete system rules - UI will show warnings

    const { error } = await this.supabase
      .from('pricing_rules')
      .delete()
      .eq('id', id);

    if (error) {
      this.logger.error('Failed to delete pricing rule', error, { id });
      throw error;
    }

    this.logger.info('Pricing rule deleted', { id });
    return { success: true, count: 1 };
  }

  async toggleActive(id: string): Promise<PricingRule> {
    this.logger.info('Toggling pricing rule active status', { id });
    
    const existing = await this.findById(id);
    if (!existing) {
      throw new Error(`Pricing rule ${id} not found`);
    }

    const updatedRow = await this.update(id, { is_active: !existing.isActive });
    return this.mapRowToRule(updatedRow);
  }

  async findByType(type: RuleType): Promise<PricingRule[]> {
    return this.findAll({ type });
  }

  async findActiveRules(): Promise<PricingRule[]> {
    return this.findAll({ 
      isActive: true, 
      validFrom: new Date().toISOString(),
      validUntil: new Date().toISOString()
    });
  }

  async findSystemRules(): Promise<PricingRule[]> {
    return this.findAll({ isEditable: false });
  }

  async findBusinessRules(): Promise<PricingRule[]> {
    return this.findAll({ isEditable: true });
  }

  async cloneRule(id: string, newName: string): Promise<PricingRule> {
    this.logger.info('Cloning pricing rule', { id, newName });
    
    const existing = await this.findById(id);
    if (!existing) {
      throw new Error(`Pricing rule ${id} not found`);
    }

    const input: CreatePricingRuleInput = {
      type: existing.type,
      name: newName,
      description: existing.description ? `Clone of: ${existing.description}` : `Clone of ${existing.name}`,
      conditions: existing.conditions,
      actions: existing.actions,
      priority: existing.priority,
      isActive: false, // Clone starts as inactive
      validFrom: existing.validFrom,
      validUntil: existing.validUntil
    };

    const createdRow = await this.create(input as any);
    return this.mapRowToRule(createdRow);
  }

  async bulkUpdatePriorities(updates: Array<{ id: string; priority: number }>): Promise<PricingRule[]> {
    this.logger.info('Bulk updating rule priorities', { 
      count: updates.length 
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
      __typename: 'PricingRule' as const,
      id: row.id,
      type: row.type as RuleType,
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
      updatedAt: row.updated_at
    };
  }

  // Analytics methods
  async getRuleUsageStats(startDate: Date, endDate: Date): Promise<Array<{
    ruleId: string;
    ruleName: string;
    usageCount: number;
    totalImpact: number;
  }>> {
    // This would query from a pricing_rule_applications table
    // that logs each time a rule is applied
    this.logger.info('Getting rule usage stats', { 
      startDate, 
      endDate 
    });
    
    // TODO: Implement when we have the applications tracking table
    return [];
  }

  async getConflictingRules(ruleId: string): Promise<PricingRule[]> {
    this.logger.info('Finding conflicting rules', { ruleId });
    
    const rule = await this.findById(ruleId);
    if (!rule) {
      return [];
    }

    // Find rules with overlapping conditions
    const allRules = await this.findActiveRules();
    
    return allRules.filter(r => {
      if (r.id === ruleId) return false;
      
      // Check for condition overlap
      // This is a simplified check - you might want more sophisticated logic
      return r.conditions.some(c1 => 
        rule.conditions.some(c2 => 
          c1.field === c2.field && 
          c1.operator === c2.operator && 
          JSON.stringify(c1.value) === JSON.stringify(c2.value)
        )
      );
    });
  }
}