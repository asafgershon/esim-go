import { createClient } from '@supabase/supabase-js';
import { PricingRulesRepository } from '../src/repositories/pricing-rules/pricing-rules.repository';
import { PricingEngineService } from '../src/services/pricing-engine.service';
import type { PricingContext } from '../src/rules-engine/types';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function debugPricingRules() {
  console.log('🔍 Debugging Pricing Rules Engine\n');
  
  // Initialize Supabase client
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  // Initialize repository and service
  const repository = new PricingRulesRepository(supabase);
  const engineService = new PricingEngineService(supabase);
  
  // Initialize the engine
  await engineService.initialize();
  
  // 1. Check what rules exist in the database
  console.log('📋 Fetching all active rules from database...\n');
  const activeRules = await repository.findActiveRules();
  
  console.log(`Found ${activeRules.length} active rules:\n`);
  
  // Group rules by type
  const rulesByType = activeRules.reduce((acc, rule) => {
    if (!acc[rule.type]) acc[rule.type] = [];
    acc[rule.type].push(rule);
    return acc;
  }, {} as Record<string, typeof activeRules>);
  
  Object.entries(rulesByType).forEach(([type, rules]) => {
    console.log(`\n${type} (${rules.length} rules):`);
    rules.forEach(rule => {
      console.log(`  - ${rule.name} (Priority: ${rule.priority})`);
      console.log(`    Conditions: ${JSON.stringify(rule.conditions)}`);
      console.log(`    Actions: ${JSON.stringify(rule.actions)}`);
    });
  });
  
  // 2. Check if there are any SYSTEM_MARKUP rules
  console.log('\n\n🎯 Checking for SYSTEM_MARKUP rules...');
  const markupRules = activeRules.filter(r => r.type === 'SYSTEM_MARKUP');
  if (markupRules.length === 0) {
    console.log('❌ NO SYSTEM_MARKUP rules found! This is why markup is 0.');
  } else {
    console.log(`✅ Found ${markupRules.length} SYSTEM_MARKUP rules`);
  }
  
  // 3. Test a pricing calculation
  console.log('\n\n💰 Testing pricing calculation...\n');
  
  const testContext: PricingContext = {
    bundle: {
      id: 'test-bundle-1',
      name: 'Test Bundle - USA 7 Days',
      cost: 5.00,
      duration: 7,
      countryId: 'US',
      bundleGroup: 'Standard Fixed'
    },
    customer: {
      paymentMethod: 'foreign_card'
    },
    requestedDuration: 7
  };
  
  console.log('Test Context:', JSON.stringify(testContext, null, 2));
  console.log('\nCalculating price...\n');
  
  // Stream the pricing steps to see what's happening
  const steps: any[] = [];
  for await (const step of engineService.streamPricingSteps(testContext)) {
    if ('type' in step) {
      steps.push(step);
      console.log(`[${step.type}] ${step.message}`);
      if (step.data) {
        console.log('  Data:', JSON.stringify(step.data, null, 2));
      }
    }
  }
  
  // Get the final calculation
  const result = await engineService.calculatePrice(testContext);
  
  console.log('\n\n📊 Final Pricing Result:');
  console.log('  Base Cost:', result.baseCost);
  console.log('  Markup:', result.markup, '(This should NOT be 0 if global rules exist!)');
  console.log('  Subtotal:', result.subtotal);
  console.log('  Processing Rate:', result.processingRate);
  console.log('  Processing Fee:', result.processingFee);
  console.log('  Final Price:', result.finalPrice);
  console.log('  Profit:', result.profit);
  
  console.log('\n\n🔎 Applied Rules:');
  result.appliedRules.forEach(rule => {
    console.log(`  - ${rule.name} (${rule.type}): Impact $${rule.impact}`);
  });
  
  // 4. Check for any global rules (rules without specific conditions)
  console.log('\n\n🌍 Checking for global rules (minimal conditions)...');
  const globalRules = activeRules.filter(rule => {
    // Rules with only one condition that applies to all bundles
    return rule.conditions.length === 1 && 
           rule.conditions[0].field === 'bundle.id' && 
           rule.conditions[0].operator === 'NOT_EQUALS' &&
           rule.conditions[0].value === '';
  });
  
  if (globalRules.length > 0) {
    console.log(`Found ${globalRules.length} global rules:`);
    globalRules.forEach(rule => {
      console.log(`  - ${rule.name} (${rule.type})`);
    });
  } else {
    console.log('No global rules found');
  }
  
  process.exit(0);
}

// Run the debug script
debugPricingRules().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});