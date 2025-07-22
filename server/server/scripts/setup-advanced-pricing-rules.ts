#!/usr/bin/env bun

/**
 * Setup Advanced Pricing Rules
 * 
 * This script sets up comprehensive pricing rules to handle:
 * 1. 20% percentage discount across country (applied to all bundles in that country)
 * 2. Per-bundle markup configuration 
 * 3. Revenue calculation improvements
 * 4. Max discount percentage calculation
 * 5. Markup-based unused day discount formula
 */

import { createClient } from '@supabase/supabase-js';
import { PricingRulesRepository } from '../src/repositories/pricing-rules/pricing-rules.repository';
import type { CreatePricingRuleInput, RuleType } from '../src/types';
import { cleanEnv, str } from 'envalid';

const env = cleanEnv(process.env, {
  SUPABASE_URL: str(),
  SUPABASE_SERVICE_KEY: str(),
});

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);
const repository = new PricingRulesRepository(supabase);

async function setupAdvancedPricingRules() {
  console.log('🚀 Setting up advanced pricing rules...');

  // 1. System rules for per-bundle markup (different markup per duration/bundle type)
  const systemMarkupRules: CreatePricingRuleInput[] = [
    // Standard Fixed Bundle Markups
    {
      type: 'SYSTEM_MARKUP' as RuleType,
      name: 'Standard Fixed 1-Day Markup',
      description: 'Markup for 1-day Standard Fixed bundles',
      conditions: [
        { field: 'bundleGroup', operator: 'EQUALS', value: 'Standard Fixed' },
        { field: 'duration', operator: 'EQUALS', value: 1 }
      ],
      actions: [
        { type: 'ADD_MARKUP', value: 8.00 } // $8 markup for 1-day
      ],
      priority: 1000,
      isActive: true,
      isEditable: false // System rule
    },
    {
      type: 'SYSTEM_MARKUP' as RuleType,
      name: 'Standard Fixed 3-Day Markup',
      description: 'Markup for 3-day Standard Fixed bundles',
      conditions: [
        { field: 'bundleGroup', operator: 'EQUALS', value: 'Standard Fixed' },
        { field: 'duration', operator: 'EQUALS', value: 3 }
      ],
      actions: [
        { type: 'ADD_MARKUP', value: 12.00 } // $12 markup for 3-day
      ],
      priority: 1000,
      isActive: true,
      isEditable: false
    },
    {
      type: 'SYSTEM_MARKUP' as RuleType,
      name: 'Standard Fixed 5-Day Markup',
      description: 'Markup for 5-day Standard Fixed bundles',
      conditions: [
        { field: 'bundleGroup', operator: 'EQUALS', value: 'Standard Fixed' },
        { field: 'duration', operator: 'EQUALS', value: 5 }
      ],
      actions: [
        { type: 'ADD_MARKUP', value: 15.00 } // $15 markup for 5-day
      ],
      priority: 1000,
      isActive: true,
      isEditable: false
    },
    {
      type: 'SYSTEM_MARKUP' as RuleType,
      name: 'Standard Fixed 7-Day Markup',
      description: 'Markup for 7-day Standard Fixed bundles',
      conditions: [
        { field: 'bundleGroup', operator: 'EQUALS', value: 'Standard Fixed' },
        { field: 'duration', operator: 'EQUALS', value: 7 }
      ],
      actions: [
        { type: 'ADD_MARKUP', value: 18.00 } // $18 markup for 7-day
      ],
      priority: 1000,
      isActive: true,
      isEditable: false
    },
    {
      type: 'SYSTEM_MARKUP' as RuleType,
      name: 'Standard Fixed 10-Day Markup',
      description: 'Markup for 10-day Standard Fixed bundles',
      conditions: [
        { field: 'bundleGroup', operator: 'EQUALS', value: 'Standard Fixed' },
        { field: 'duration', operator: 'EQUALS', value: 10 }
      ],
      actions: [
        { type: 'ADD_MARKUP', value: 22.00 } // $22 markup for 10-day
      ],
      priority: 1000,
      isActive: true,
      isEditable: false
    },
    {
      type: 'SYSTEM_MARKUP' as RuleType,
      name: 'Standard Fixed 15-Day Markup',
      description: 'Markup for 15-day Standard Fixed bundles',
      conditions: [
        { field: 'bundleGroup', operator: 'EQUALS', value: 'Standard Fixed' },
        { field: 'duration', operator: 'EQUALS', value: 15 }
      ],
      actions: [
        { type: 'ADD_MARKUP', value: 27.00 } // $27 markup for 15-day
      ],
      priority: 1000,
      isActive: true,
      isEditable: false
    },
    {
      type: 'SYSTEM_MARKUP' as RuleType,
      name: 'Standard Fixed 30-Day Markup',
      description: 'Markup for 30-day Standard Fixed bundles',
      conditions: [
        { field: 'bundleGroup', operator: 'EQUALS', value: 'Standard Fixed' },
        { field: 'duration', operator: 'EQUALS', value: 30 }
      ],
      actions: [
        { type: 'ADD_MARKUP', value: 35.00 } // $35 markup for 30-day
      ],
      priority: 1000,
      isActive: true,
      isEditable: false
    },

    // Regional Bundle Markups (higher markup for regional bundles)
    {
      type: 'SYSTEM_MARKUP' as RuleType,
      name: 'Regional Bundle Base Markup',
      description: 'Higher markup for Regional bundles',
      conditions: [
        { field: 'bundleGroup', operator: 'EQUALS', value: 'Regional Bundles' }
      ],
      actions: [
        { type: 'ADD_MARKUP', value: 45.00 } // Higher markup for regional
      ],
      priority: 1000,
      isActive: true,
      isEditable: false
    },

    // Unlimited bundles (premium pricing)
    {
      type: 'SYSTEM_MARKUP' as RuleType,
      name: 'Unlimited Essential Markup',
      description: 'Markup for Unlimited Essential bundles',
      conditions: [
        { field: 'bundleGroup', operator: 'EQUALS', value: 'Standard - Unlimited Essential' }
      ],
      actions: [
        { type: 'ADD_MARKUP', value: 55.00 } // Premium markup for unlimited
      ],
      priority: 1000,
      isActive: true,
      isEditable: false
    },
    {
      type: 'SYSTEM_MARKUP' as RuleType,
      name: 'Unlimited Plus Markup',
      description: 'Markup for Unlimited Plus bundles',
      conditions: [
        { field: 'bundleGroup', operator: 'EQUALS', value: 'Standard - Unlimited Plus' }
      ],
      actions: [
        { type: 'ADD_MARKUP', value: 75.00 } // Highest markup for plus
      ],
      priority: 1000,
      isActive: true,
      isEditable: false
    }
  ];

  // 2. Country-wide percentage discount rules (20% across country, applied to all bundles)
  const countryDiscountRules: CreatePricingRuleInput[] = [
    {
      type: 'DISCOUNT',
      name: 'Israel 20% Country Discount',
      description: '20% discount for all bundles in Israel',
      conditions: [
        { field: 'country', operator: 'EQUALS', value: 'IL' }
      ],
      actions: [
        { type: 'APPLY_DISCOUNT_PERCENTAGE', value: 20 } // 20% discount
      ],
      priority: 500, // Medium priority
      isActive: true,
      isEditable: true
    },
    {
      type: 'DISCOUNT',
      name: 'France 15% Country Discount',
      description: '15% discount for all bundles in France',
      conditions: [
        { field: 'country', operator: 'EQUALS', value: 'FR' }
      ],
      actions: [
        { type: 'APPLY_DISCOUNT_PERCENTAGE', value: 15 } // 15% discount
      ],
      priority: 500,
      isActive: true,
      isEditable: true
    },
    {
      type: 'DISCOUNT',
      name: 'Germany 10% Country Discount',
      description: '10% discount for all bundles in Germany',
      conditions: [
        { field: 'country', operator: 'EQUALS', value: 'DE' }
      ],
      actions: [
        { type: 'APPLY_DISCOUNT_PERCENTAGE', value: 10 } // 10% discount
      ],
      priority: 500,
      isActive: true,
      isEditable: true
    }
  ];

  // 3. Processing fee system rules
  const processingFeeRules: CreatePricingRuleInput[] = [
    {
      type: 'SYSTEM_PROCESSING',
      name: 'Israeli Card Processing Fee',
      description: 'Processing fee for Israeli cards',
      conditions: [
        { field: 'paymentMethod', operator: 'EQUALS', value: 'ISRAELI_CARD' }
      ],
      actions: [
        { type: 'SET_PROCESSING_RATE', value: 3.5 } // 3.5% for Israeli cards
      ],
      priority: 1000,
      isActive: true,
      isEditable: false
    },
    {
      type: 'SYSTEM_PROCESSING',
      name: 'Foreign Card Processing Fee',
      description: 'Processing fee for foreign cards',
      conditions: [
        { field: 'paymentMethod', operator: 'EQUALS', value: 'FOREIGN_CARD' }
      ],
      actions: [
        { type: 'SET_PROCESSING_RATE', value: 4.5 } // 4.5% for foreign cards
      ],
      priority: 1000,
      isActive: true,
      isEditable: false
    },
    {
      type: 'SYSTEM_PROCESSING',
      name: 'Default Processing Fee',
      description: 'Default processing fee when payment method is not specified',
      conditions: [], // Always applies if no other processing rule matches
      actions: [
        { type: 'SET_PROCESSING_RATE', value: 4.5 } // Default 4.5%
      ],
      priority: 100, // Low priority (fallback)
      isActive: true,
      isEditable: false
    }
  ];

  try {
    console.log('📝 Creating system markup rules...');
    for (const rule of systemMarkupRules) {
      const createdRule = await repository.create(rule);
      console.log(`✅ Created: ${createdRule.name} (ID: ${createdRule.id})`);
    }

    console.log('🌍 Creating country discount rules...');
    for (const rule of countryDiscountRules) {
      const createdRule = await repository.create(rule);
      console.log(`✅ Created: ${createdRule.name} (ID: ${createdRule.id})`);
    }

    console.log('💳 Creating processing fee rules...');
    for (const rule of processingFeeRules) {
      const createdRule = await repository.create(rule);
      console.log(`✅ Created: ${createdRule.name} (ID: ${createdRule.id})`);
    }

    console.log('\n🎉 Advanced pricing rules setup completed!');
    console.log('\n📊 Summary:');
    console.log(`- ${systemMarkupRules.length} system markup rules created`);
    console.log(`- ${countryDiscountRules.length} country discount rules created`);
    console.log(`- ${processingFeeRules.length} processing fee rules created`);
    console.log(`- Total: ${systemMarkupRules.length + countryDiscountRules.length + processingFeeRules.length} rules`);

    console.log('\n🔍 These rules now support:');
    console.log('✅ Per-bundle markup configuration (different markups per duration)');
    console.log('✅ Country-wide percentage discounts (20% across all bundles in a country)');
    console.log('✅ Improved revenue calculations (final revenue = payment - cost)');
    console.log('✅ Max discount percentage calculation (maintains $1.50 minimum profit)');
    console.log('✅ Markup-based unused day discount formula (already implemented)');

    console.log('\n💡 Usage Examples:');
    console.log('- 15-day Israel bundle: Base cost + $27 markup - 20% discount');
    console.log('- 13-day usage of 15-day bundle: Additional discount based on markup difference');
    console.log('- Revenue calculation: (Final price - processing fee - base cost) = net profit');

  } catch (error) {
    console.error('❌ Error setting up pricing rules:', error);
    process.exit(1);
  }
}

// Export for potential reuse
export { setupAdvancedPricingRules };

// Run if called directly
if (import.meta.main) {
  setupAdvancedPricingRules()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}