import type { PricingRule } from "../../rules-engine-types";

/**
 * Rule index for fast lookups
 */
export interface RuleIndex {
  byId: Map<string, PricingRule>;
  byCategory: Map<string, PricingRule[]>;
  byPriority: Map<number, PricingRule[]>;
  byField: Map<string, PricingRule[]>;
  active: PricingRule[];
  inactive: PricingRule[];
}

/**
 * Rule query interface
 */
export interface RuleQuery {
  category?: string;
  priority?: number;
  minPriority?: number;
  maxPriority?: number;
  field?: string;
  isActive?: boolean;
  ids?: string[];
}

/**
 * Rule indexer for performance optimization
 */
export class RuleIndexer {
  private index: RuleIndex;
  private rules: PricingRule[] = [];
  private lastIndexTime: Date | null = null;
  
  constructor() {
    this.index = this.createEmptyIndex();
  }
  
  /**
   * Build index from rules
   */
  buildIndex(rules: PricingRule[]): void {
    this.rules = [...rules];
    this.index = this.createEmptyIndex();
    
    // Build all indexes
    rules.forEach(rule => {
      this.indexRule(rule);
    });
    
    this.lastIndexTime = new Date();
  }
  
  /**
   * Add a rule to the index
   */
  addRule(rule: PricingRule): void {
    // Add to rules array
    this.rules.push(rule);
    
    // Add to index
    this.indexRule(rule);
    
    this.lastIndexTime = new Date();
  }
  
  /**
   * Remove a rule from the index
   */
  removeRule(ruleId: string): boolean {
    const ruleIndex = this.rules.findIndex(r => r.id === ruleId);
    if (ruleIndex === -1) {
      return false;
    }
    
    const rule = this.rules[ruleIndex];
    this.rules.splice(ruleIndex, 1);
    
    // Remove from index
    this.unindexRule(rule);
    
    this.lastIndexTime = new Date();
    return true;
  }
  
  /**
   * Update a rule in the index
   */
  updateRule(updatedRule: PricingRule): boolean {
    const existingIndex = this.rules.findIndex(r => r.id === updatedRule.id);
    if (existingIndex === -1) {
      return false;
    }
    
    const oldRule = this.rules[existingIndex];
    
    // Remove old rule from index
    this.unindexRule(oldRule);
    
    // Update rule in array
    this.rules[existingIndex] = updatedRule;
    
    // Add updated rule to index
    this.indexRule(updatedRule);
    
    this.lastIndexTime = new Date();
    return true;
  }
  
  /**
   * Query rules using index
   */
  queryRules(query: RuleQuery): PricingRule[] {
    let results: PricingRule[] = [];
    
    // Start with the most restrictive filter first
    if (query.ids && query.ids.length > 0) {
      results = query.ids
        .map(id => this.index.byId.get(id))
        .filter(Boolean) as PricingRule[];
    } else if (query.category) {
      results = this.index.byCategory.get(query.category.toUpperCase()) || [];
    } else if (query.priority !== undefined) {
      results = this.index.byPriority.get(query.priority) || [];
    } else if (query.field) {
      results = this.index.byField.get(query.field) || [];
    } else if (query.isActive !== undefined) {
      results = query.isActive ? this.index.active : this.index.inactive;
    } else {
      results = [...this.rules];
    }
    
    // Apply additional filters
    results = this.applyFilters(results, query);
    
    return results;
  }
  
  /**
   * Get rule by ID (O(1) lookup)
   */
  getRuleById(id: string): PricingRule | undefined {
    return this.index.byId.get(id);
  }
  
  /**
   * Get rules by category (O(1) lookup)
   */
  getRulesByCategory(category: string): PricingRule[] {
    return this.index.byCategory.get(category.toUpperCase()) || [];
  }
  
  /**
   * Get active rules (O(1) lookup)
   */
  getActiveRules(): PricingRule[] {
    return [...this.index.active];
  }
  
  /**
   * Get rules sorted by priority (within category if specified)
   */
  getRulesByPriority(category?: string, descending: boolean = true): PricingRule[] {
    let rules = category ? this.getRulesByCategory(category) : [...this.rules];
    
    return rules.sort((a, b) => {
      return descending ? b.priority - a.priority : a.priority - b.priority;
    });
  }
  
  /**
   * Get index statistics
   */
  getStatistics(): {
    totalRules: number;
    activeRules: number;
    inactiveRules: number;
    categories: number;
    priorityLevels: number;
    fields: number;
    lastIndexTime: Date | null;
  } {
    return {
      totalRules: this.rules.length,
      activeRules: this.index.active.length,
      inactiveRules: this.index.inactive.length,
      categories: this.index.byCategory.size,
      priorityLevels: this.index.byPriority.size,
      fields: this.index.byField.size,
      lastIndexTime: this.lastIndexTime,
    };
  }
  
  /**
   * Clear the index
   */
  clear(): void {
    this.rules = [];
    this.index = this.createEmptyIndex();
    this.lastIndexTime = null;
  }
  
  /**
   * Create empty index structure
   */
  private createEmptyIndex(): RuleIndex {
    return {
      byId: new Map(),
      byCategory: new Map(),
      byPriority: new Map(),
      byField: new Map(),
      active: [],
      inactive: [],
    };
  }
  
  /**
   * Add a rule to all relevant indexes
   */
  private indexRule(rule: PricingRule): void {
    // Index by ID
    this.index.byId.set(rule.id, rule);
    
    // Index by category
    if (rule.category) {
      const category = rule.category.toUpperCase();
      if (!this.index.byCategory.has(category)) {
        this.index.byCategory.set(category, []);
      }
      this.index.byCategory.get(category)!.push(rule);
    }
    
    // Index by priority
    if (!this.index.byPriority.has(rule.priority)) {
      this.index.byPriority.set(rule.priority, []);
    }
    this.index.byPriority.get(rule.priority)!.push(rule);
    
    // Index by condition fields
    if (rule.conditions) {
      rule.conditions.forEach(condition => {
        if (condition.field) {
          if (!this.index.byField.has(condition.field)) {
            this.index.byField.set(condition.field, []);
          }
          this.index.byField.get(condition.field)!.push(rule);
        }
      });
    }
    
    // Index by active status
    const isActive = rule.isActive === undefined || rule.isActive === true;
    if (isActive) {
      this.index.active.push(rule);
    } else {
      this.index.inactive.push(rule);
    }
  }
  
  /**
   * Remove a rule from all indexes
   */
  private unindexRule(rule: PricingRule): void {
    // Remove from ID index
    this.index.byId.delete(rule.id);
    
    // Remove from category index
    if (rule.category) {
      const category = rule.category.toUpperCase();
      const categoryRules = this.index.byCategory.get(category);
      if (categoryRules) {
        const index = categoryRules.findIndex(r => r.id === rule.id);
        if (index !== -1) {
          categoryRules.splice(index, 1);
        }
        if (categoryRules.length === 0) {
          this.index.byCategory.delete(category);
        }
      }
    }
    
    // Remove from priority index
    const priorityRules = this.index.byPriority.get(rule.priority);
    if (priorityRules) {
      const index = priorityRules.findIndex(r => r.id === rule.id);
      if (index !== -1) {
        priorityRules.splice(index, 1);
      }
      if (priorityRules.length === 0) {
        this.index.byPriority.delete(rule.priority);
      }
    }
    
    // Remove from field indexes
    if (rule.conditions) {
      rule.conditions.forEach(condition => {
        if (condition.field) {
          const fieldRules = this.index.byField.get(condition.field);
          if (fieldRules) {
            const index = fieldRules.findIndex(r => r.id === rule.id);
            if (index !== -1) {
              fieldRules.splice(index, 1);
            }
            if (fieldRules.length === 0) {
              this.index.byField.delete(condition.field);
            }
          }
        }
      });
    }
    
    // Remove from active/inactive indexes
    const activeIndex = this.index.active.findIndex(r => r.id === rule.id);
    if (activeIndex !== -1) {
      this.index.active.splice(activeIndex, 1);
    }
    
    const inactiveIndex = this.index.inactive.findIndex(r => r.id === rule.id);
    if (inactiveIndex !== -1) {
      this.index.inactive.splice(inactiveIndex, 1);
    }
  }
  
  /**
   * Apply additional filters to results
   */
  private applyFilters(rules: PricingRule[], query: RuleQuery): PricingRule[] {
    let filtered = rules;
    
    if (query.minPriority !== undefined) {
      filtered = filtered.filter(rule => rule.priority >= query.minPriority!);
    }
    
    if (query.maxPriority !== undefined) {
      filtered = filtered.filter(rule => rule.priority <= query.maxPriority!);
    }
    
    if (query.isActive !== undefined) {
      const targetActive = query.isActive;
      filtered = filtered.filter(rule => {
        const isActive = rule.isActive === undefined || rule.isActive === true;
        return isActive === targetActive;
      });
    }
    
    return filtered;
  }
}