import { createClient } from '@supabase/supabase-js';
import { PricingRulesRepository } from '../src/repositories/pricing-rules/pricing-rules.repository';
import type { CreatePricingRuleInput } from '../src/types';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Standard durations for eSIM bundles
const STANDARD_DURATIONS = [1, 3, 5, 7, 10, 15, 30];

// Markup values for Standard Fixed bundle group
const STANDARD_FIXED_MARKUPS: Record<number, number> = {
  1: 5.00,
  3: 6.00,
  5: 8.00,
  7: 10.00,
  10: 12.00,
  15: 15.00,
  30: 18.00
};

// Regional bundle markups (if needed)
const REGIONAL_BUNDLE_MARKUPS: Record<number, number> = {
  1: 7.00,
  3: 9.00,
  5: 12.00,
  7: 15.00,
  10: 18.00,
  15: 22.00,
  30: 25.00
};

async function addMissingMarkupRules() {
  console.log('🔧 Adding Missing Markup Rules\n');
  
  // Initialize Supabase client
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const repository = new PricingRulesRepository(supabase);
  
  // Get existing rules to check what's missing
  console.log('📋 Checking existing rules...\n');
  const existingRules = await repository.findActiveRules();
  
  // Check which Standard Fixed rules are missing
  const existingStandardFixed = existingRules.filter(
    r => r.type === 'SYSTEM_MARKUP' && 
    r.conditions.some(c => c.field === 'bundleGroup' && c.value === 'Standard Fixed')
  );
  
  const existingStandardFixedDurations = existingStandardFixed.map(r => {
    const durationCondition = r.conditions.find(c => c.field === 'duration');
    return durationCondition ? durationCondition.value : null;
  }).filter(d => d !== null);
  
  console.log('Existing Standard Fixed durations:', existingStandardFixedDurations);
  
  // Find missing durations
  const missingDurations = STANDARD_DURATIONS.filter(d => !existingStandardFixedDurations.includes(d));
  
  if (missingDurations.length === 0) {
    console.log('✅ All Standard Fixed markup rules already exist!');
  } else {
    console.log(`❌ Missing Standard Fixed rules for durations: ${missingDurations.join(', ')}\n`);
    
    // Create missing rules
    for (const duration of missingDurations) {
      const markup = STANDARD_FIXED_MARKUPS[duration];
      const rule: CreatePricingRuleInput = {
        type: 'SYSTEM_MARKUP',
        name: `Standard Fixed - ${duration} days`,
        description: `Fixed markup of $${markup.toFixed(2)} for Standard Fixed ${duration}-day bundles`,
        conditions: [
          {
            field: 'bundleGroup',
            value: 'Standard Fixed',
            operator: 'EQUALS'
          },
          {
            field: 'duration',
            value: duration,
            operator: 'EQUALS'
          }
        ],
        actions: [
          {
            type: 'ADD_MARKUP',
            value: markup,
            metadata: {}
          }
        ],
        priority: 100,
        isActive: true
      };
      
      try {
        const created = await repository.create(rule);
        console.log(`✅ Created rule: ${rule.name} (ID: ${created.id})`);
      } catch (error) {
        console.error(`❌ Failed to create rule: ${rule.name}`, error);
      }
    }
  }
  
  // Also add a global fallback markup rule (lower priority)
  console.log('\n🌍 Checking for global fallback markup rule...');
  
  const hasGlobalMarkup = existingRules.some(
    r => r.type === 'SYSTEM_MARKUP' && 
    r.name === 'Global Default Markup'
  );
  
  if (!hasGlobalMarkup) {
    console.log('Creating global fallback markup rule...');
    
    const globalRule: CreatePricingRuleInput = {
      type: 'SYSTEM_MARKUP',
      name: 'Global Default Markup',
      description: 'Default $10 markup for all bundles without specific markup rules',
      conditions: [
        {
          field: 'bundle.cost',
          value: 0,
          operator: 'GREATER_THAN'
        }
      ],
      actions: [
        {
          type: 'ADD_MARKUP',
          value: 10, // $10 fixed markup as fallback
          metadata: { fallback: true }
        }
      ],
      priority: 10, // Lower priority so specific rules override
      isActive: true
    };
    
    try {
      const created = await repository.create(globalRule);
      console.log(`✅ Created global fallback rule: ${globalRule.name} (ID: ${created.id})`);
    } catch (error) {
      console.error(`❌ Failed to create global rule: ${globalRule.name}`, error);
    }
  } else {
    console.log('✅ Global fallback markup rule already exists');
  }
  
  // Check for Regional Bundles
  console.log('\n🌍 Checking Regional Bundle markup rules...');
  
  const existingRegional = existingRules.filter(
    r => r.type === 'SYSTEM_MARKUP' && 
    r.conditions.some(c => c.field === 'bundleGroup' && c.value === 'Regional Bundles')
  );
  
  if (existingRegional.length === 0) {
    console.log('No Regional Bundle markup rules found. Creating them...');
    
    for (const duration of STANDARD_DURATIONS) {
      const markup = REGIONAL_BUNDLE_MARKUPS[duration];
      const rule: CreatePricingRuleInput = {
        type: 'SYSTEM_MARKUP',
        name: `Regional Bundles - ${duration} days`,
        description: `Fixed markup of $${markup.toFixed(2)} for Regional ${duration}-day bundles`,
        conditions: [
          {
            field: 'bundleGroup',
            value: 'Regional Bundles',
            operator: 'EQUALS'
          },
          {
            field: 'duration',
            value: duration,
            operator: 'EQUALS'
          }
        ],
        actions: [
          {
            type: 'ADD_MARKUP',
            value: markup,
            metadata: {}
          }
        ],
        priority: 100,
        isActive: true
      };
      
      try {
        const created = await repository.create(rule);
        console.log(`✅ Created rule: ${rule.name} (ID: ${created.id})`);
      } catch (error) {
        console.error(`❌ Failed to create rule: ${rule.name}`, error);
      }
    }
  }
  
  console.log('\n✅ Done! Markup rules have been updated.');
  process.exit(0);
}

// Run the script
addMissingMarkupRules().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});