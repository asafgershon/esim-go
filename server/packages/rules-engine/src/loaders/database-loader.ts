import { DEFAULT_RULES, RULE_METADATA } from '../defaults';
import type { CreatePricingRuleInput } from '../generated/types';

/**
 * Database Rule Loader
 * 
 * This module handles loading default rules into the database and provides
 * utilities for managing rule lifecycle (creation, updates, deactivation).
 */

export interface RuleLoaderOptions {
  overwriteExisting?: boolean;
  skipImmutable?: boolean;
  dryRun?: boolean;
}

export interface LoadResult {
  success: boolean;
  created: number;
  updated: number;
  skipped: number;
  errors: Array<{ rule: string; error: string }>;
  metadata: typeof RULE_METADATA;
}

/**
 * Load default rules into the database
 * This would typically connect to your GraphQL API or database client
 */
export async function loadDefaultRules(
  options: RuleLoaderOptions = {}
): Promise<LoadResult> {
  const { overwriteExisting = false, skipImmutable = true, dryRun = false } = options;
  
  const result: LoadResult = {
    success: true,
    created: 0,
    updated: 0,
    skipped: 0,
    errors: [],
    metadata: RULE_METADATA
  };

  console.log(`🚀 Loading ${DEFAULT_RULES.length} default pricing rules...`);
  
  if (dryRun) {
    console.log("📋 DRY RUN MODE - No changes will be made to database");
  }

  for (const rule of DEFAULT_RULES) {
    try {
      const ruleName = rule.name;
      console.log(`📝 Processing rule: ${ruleName}`);

      // Check if rule already exists (you'll need to implement this based on your DB)
      const existingRule = await findExistingRule(ruleName);
      
      if (existingRule) {
        if (!overwriteExisting) {
          console.log(`⏭️  Skipping existing rule: ${ruleName}`);
          result.skipped++;
          continue;
        }
        
        if (skipImmutable && isImmutableRule(existingRule)) {
          console.log(`🔒 Skipping immutable rule: ${ruleName}`);
          result.skipped++;
          continue;
        }

        if (!dryRun) {
          await updateRule(existingRule.id, rule);
        }
        console.log(`✅ Updated rule: ${ruleName}`);
        result.updated++;
      } else {
        if (!dryRun) {
          await createRule(rule);
        }
        console.log(`🆕 Created rule: ${ruleName}`);
        result.created++;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`❌ Failed to load rule ${rule.name}: ${errorMessage}`);
      result.errors.push({ rule: rule.name, error: errorMessage });
      result.success = false;
    }
  }

  console.log(`\n📊 Rule Loading Summary:`);
  console.log(`   Created: ${result.created}`);
  console.log(`   Updated: ${result.updated}`);
  console.log(`   Skipped: ${result.skipped}`);
  console.log(`   Errors:  ${result.errors.length}`);
  
  if (result.errors.length > 0) {
    console.log(`\n❌ Errors encountered:`);
    result.errors.forEach(({ rule, error }) => {
      console.log(`   - ${rule}: ${error}`);
    });
  }

  return result;
}

/**
 * Database operations - implement these based on your database setup
 */

async function findExistingRule(name: string): Promise<{ id: string; name: string; isEditable: boolean } | null> {
  // TODO: Implement database lookup
  // Example for GraphQL:
  // const { data } = await client.query({
  //   query: GET_PRICING_RULE_BY_NAME,
  //   variables: { name }
  // });
  // return data?.pricingRuleByName || null;
  
  console.log(`🔍 Looking up existing rule: ${name}`);
  return null; // Placeholder - always treat as new rule for now
}

async function createRule(rule: CreatePricingRuleInput): Promise<void> {
  // TODO: Implement database creation
  // Example for GraphQL:
  // await client.mutate({
  //   mutation: CREATE_PRICING_RULE,
  //   variables: { input: rule }
  // });
  
  console.log(`💾 Creating rule in database: ${rule.name}`);
  // Simulate database operation
  await new Promise(resolve => setTimeout(resolve, 100));
}

async function updateRule(id: string, rule: CreatePricingRuleInput): Promise<void> {
  // TODO: Implement database update
  // Example for GraphQL:
  // await client.mutate({
  //   mutation: UPDATE_PRICING_RULE,
  //   variables: { id, input: rule }
  // });
  
  console.log(`🔄 Updating rule in database: ${rule.name}`);
  // Simulate database operation
  await new Promise(resolve => setTimeout(resolve, 100));
}

function isImmutableRule(rule: { isEditable: boolean }): boolean {
  return !rule.isEditable;
}

/**
 * CLI function for easy rule loading
 */
export async function loadRulesFromCLI(): Promise<void> {
  try {
    const result = await loadDefaultRules({
      overwriteExisting: false,
      skipImmutable: true,
      dryRun: process.argv.includes('--dry-run')
    });

    if (result.success) {
      console.log("\n🎉 All rules loaded successfully!");
    } else {
      console.log("\n⚠️  Some rules failed to load. Check the errors above.");
      process.exit(1);
    }
  } catch (error) {
    console.error("\n💥 Fatal error loading rules:", error);
    process.exit(1);
  }
}

/**
 * Utility to validate all default rules before loading
 */
export function validateDefaultRules(): boolean {
  console.log("🔍 Validating default rules...");
  
  let isValid = true;
  const ruleNames = new Set<string>();
  
  for (const rule of DEFAULT_RULES) {
    // Check for duplicate names
    if (ruleNames.has(rule.name)) {
      console.error(`❌ Duplicate rule name: ${rule.name}`);
      isValid = false;
    }
    ruleNames.add(rule.name);
    
    // Validate required fields
    if (!rule.name || !rule.category || !rule.conditions || !rule.actions) {
      console.error(`❌ Invalid rule structure: ${rule.name}`);
      isValid = false;
    }
    
    // Validate conditions
    if (rule.conditions.length === 0) {
      console.error(`❌ Rule has no conditions: ${rule.name}`);
      isValid = false;
    }
    
    // Validate actions
    if (rule.actions.length === 0) {
      console.error(`❌ Rule has no actions: ${rule.name}`);
      isValid = false;
    }
  }
  
  if (isValid) {
    console.log("✅ All default rules are valid!");
  }
  
  return isValid;
}