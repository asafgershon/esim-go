#!/usr/bin/env bun

/**
 * Load Default Rules CLI Script
 * 
 * Usage:
 *   bun run scripts/load-default-rules.ts [options]
 * 
 * Options:
 *   --dry-run          Preview changes without applying them
 *   --overwrite        Overwrite existing rules
 *   --include-immutable Allow updating immutable rules
 *   --validate-only    Only validate rules, don't load them
 *   --help             Show this help message
 */

import { loadDefaultRules, validateDefaultRules } from '../src/loaders/database-loader';
import { DEFAULT_RULES, RULE_METADATA } from '../src/defaults';

function showHelp() {
  console.log(`
📋 eSIM Go Default Rules Loader

Load default pricing rules into the database using the declarative RuleBuilder API.

Usage:
  bun run scripts/load-default-rules.ts [options]

Options:
  --dry-run              Preview changes without applying them
  --overwrite           Overwrite existing rules (default: false)
  --include-immutable   Allow updating immutable system rules (default: false)
  --validate-only       Only validate rules structure, don't load them
  --help                Show this help message

Examples:
  # Preview what would be loaded
  bun run scripts/load-default-rules.ts --dry-run

  # Load only new rules, skip existing ones
  bun run scripts/load-default-rules.ts

  # Overwrite existing rules but skip immutable ones
  bun run scripts/load-default-rules.ts --overwrite

  # Validate rule structure only
  bun run scripts/load-default-rules.ts --validate-only

Default Rules:
  Total Rules: ${RULE_METADATA.totalRules}
  - Discount Rules: ${RULE_METADATA.categories.discount}
  - Fee Rules: ${RULE_METADATA.categories.fee}
  - Constraint Rules: ${RULE_METADATA.categories.constraint}
`);
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    showHelp();
    return;
  }

  console.log('🎯 eSIM Go Default Rules Loader\n');
  
  // Show metadata
  console.log('📊 Rule Summary:');
  console.log(`   Version: ${RULE_METADATA.version}`);
  console.log(`   Total Rules: ${RULE_METADATA.totalRules}`);
  console.log(`   Categories:`, RULE_METADATA.categories);
  console.log('');

  // Validate rules first
  console.log('🔍 Validating rules...');
  const isValid = validateDefaultRules();
  
  if (!isValid) {
    console.error('\n❌ Rule validation failed. Please fix the errors above.');
    process.exit(1);
  }

  if (args.includes('--validate-only')) {
    console.log('\n✅ Validation complete. Use without --validate-only to load rules.');
    return;
  }

  // Parse options
  const options = {
    dryRun: args.includes('--dry-run'),
    overwriteExisting: args.includes('--overwrite'),
    skipImmutable: !args.includes('--include-immutable'),
  };

  if (options.dryRun) {
    console.log('📋 DRY RUN MODE - No database changes will be made\n');
  }

  // Show some example rules
  console.log('📝 Sample Rules Being Loaded:');
  const sampleRules = DEFAULT_RULES.slice(0, 3);
  sampleRules.forEach((rule, index) => {
    console.log(`   ${index + 1}. ${rule.name}`);
    console.log(`      Category: ${rule.category}`);
    console.log(`      Priority: ${rule.priority}`);
    console.log(`      Conditions: ${rule.conditions.length}, Actions: ${rule.actions.length}`);
  });
  if (DEFAULT_RULES.length > 3) {
    console.log(`   ... and ${DEFAULT_RULES.length - 3} more rules`);
  }
  console.log('');

  try {
    const result = await loadDefaultRules(options);
    
    if (result.success) {
      console.log('\n🎉 Default rules loaded successfully!');
      
      if (!options.dryRun) {
        console.log('\n📈 Next Steps:');
        console.log('   1. Test the pricing engine with your business scenarios');
        console.log('   2. Use the admin dashboard to create additional rules');
        console.log('   3. Monitor rule performance and adjust priorities as needed');
      }
    } else {
      console.error('\n⚠️  Some rules failed to load. Check the errors above.');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run the script
main().catch(console.error);