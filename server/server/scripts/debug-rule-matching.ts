import { createClient } from '@supabase/supabase-js';
import { PricingEngineService } from '../src/services/pricing-engine.service';
import { PricingRuleEngine } from '../src/rules-engine/rule-engine';
import { createLogger } from '../src/lib/logger';

const logger = createLogger({ 
  component: 'RuleMatchingDebug',
  operationType: 'debug-rule-matching'
});

async function debugRuleMatching() {
  // Initialize Supabase client
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  logger.info('🔍 Starting rule matching debug investigation');

  try {
    // Get a sample bundle to work with
    const { data: bundles, error: bundleError } = await supabase
      .from('catalog_bundles')
      .select('esim_go_name, price_cents, duration, countries, bundle_group')
      .limit(1);

    if (bundleError || !bundles || bundles.length === 0) {
      logger.error('Failed to fetch sample bundle', bundleError);
      return;
    }

    const bundle = bundles[0];
    logger.info('🧪 Using sample bundle:', {
      name: bundle.esim_go_name,
      duration: bundle.duration,
      bundleGroup: bundle.bundle_group,
      countries: bundle.countries
    });

    // Create pricing context
    const testContext = PricingEngineService.createContext({
      bundle: {
        id: bundle.esim_go_name,
        name: bundle.esim_go_name,
        cost: bundle.price_cents / 100,
        duration: bundle.duration || 7,
        countryId: Array.isArray(bundle.countries) ? bundle.countries[0] : 'US',
        countryName: Array.isArray(bundle.countries) ? bundle.countries[0] : 'United States',
        regionId: 'AMERICA',
        regionName: 'America',
        group: bundle.bundle_group || 'Standard Fixed',
        isUnlimited: false,
        dataAmount: '1024'
      },
      paymentMethod: 'israeli_card'
    });

    logger.info('📋 Test context created:', {
      bundleId: testContext.bundle.id,
      duration: testContext.bundle.duration,
      bundleGroup: testContext.bundle.group,
      paymentMethod: testContext.paymentMethod,
      country: testContext.bundle.countryId
    });

    // Get all active system markup rules
    const { data: systemMarkupRules, error: rulesError } = await supabase
      .from('pricing_rules')
      .select('*')
      .eq('type', 'SYSTEM_MARKUP')
      .eq('is_active', true);

    if (rulesError) {
      logger.error('Failed to fetch system markup rules', rulesError);
      return;
    }

    logger.info('📊 Found system markup rules:', {
      count: systemMarkupRules?.length || 0
    });

    // Test each rule manually to see which ones match
    if (systemMarkupRules) {
      for (const rule of systemMarkupRules) {
        logger.info(`🔎 Testing rule: ${rule.name}`);
        logger.info('Rule conditions:', {
          conditions: rule.conditions,
          actions: rule.actions
        });

        // Check each condition manually
        const conditions = Array.isArray(rule.conditions) ? rule.conditions : [];
        let allMatch = true;
        const matchResults: any[] = [];

        for (const condition of conditions) {
          let contextValue: any;
          let matches = false;

          // Extract context value based on field
          switch (condition.field) {
            case 'bundleGroup':
              contextValue = testContext.bundle.group;
              matches = contextValue === condition.value;
              break;
            case 'duration':
              contextValue = testContext.bundle.duration;
              matches = contextValue === condition.value;
              break;
            case 'country':
              contextValue = testContext.bundle.countryId;
              matches = contextValue === condition.value;
              break;
            case 'paymentMethod':
              contextValue = testContext.paymentMethod;
              matches = contextValue === condition.value;
              break;
            default:
              contextValue = 'UNKNOWN_FIELD';
              matches = false;
          }

          matchResults.push({
            field: condition.field,
            operator: condition.operator,
            expectedValue: condition.value,
            contextValue,
            matches
          });

          if (!matches) {
            allMatch = false;
          }
        }

        logger.info(`📝 Rule "${rule.name}" evaluation:`, {
          allMatch,
          matchResults
        });

        if (allMatch) {
          logger.info(`✅ Rule "${rule.name}" MATCHES - should be applied`);
        } else {
          logger.info(`❌ Rule "${rule.name}" does NOT match`);
        }

        logger.info('---');
      }
    }

    // Now test with the actual pricing engine to see what happens
    logger.info('🔧 Testing with actual pricing engine...');
    const pricingEngine = new PricingEngineService(supabase);
    await pricingEngine.initialize();

    const result = await pricingEngine.calculatePrice(testContext);
    
    logger.info('💰 Final pricing result:', {
      baseCost: result.baseCost,
      markup: result.markup,
      subtotal: result.subtotal,
      processingFee: result.processingFee,
      finalPrice: result.finalPrice,
      appliedRules: result.appliedRules?.map(r => ({
        name: r.name,
        type: r.type,
        impact: r.impact
      }))
    });

    // Test the raw rule engine directly
    logger.info('🔧 Testing raw rule engine directly...');
    const rawEngine = new PricingRuleEngine();
    
    // Load rules manually
    const { data: allActiveRules } = await supabase
      .from('pricing_rules')
      .select('*')
      .eq('is_active', true);

    if (allActiveRules) {
      const systemRules = allActiveRules.filter(r => r.type === 'SYSTEM_MARKUP' || r.type === 'SYSTEM_PROCESSING');
      const businessRules = allActiveRules.filter(r => r.type !== 'SYSTEM_MARKUP' && r.type !== 'SYSTEM_PROCESSING');
      
      logger.info('Adding rules to raw engine:', {
        systemRules: systemRules.length,
        businessRules: businessRules.length
      });
      
      rawEngine.addSystemRules(systemRules);
      rawEngine.addRules(businessRules);
      
      const rawResult = await rawEngine.calculatePrice(testContext);
      
      logger.info('💎 Raw engine result:', {
        baseCost: rawResult.baseCost,
        markup: rawResult.markup,
        subtotal: rawResult.subtotal,
        processingFee: rawResult.processingFee,
        finalPrice: rawResult.finalPrice,
        appliedRules: rawResult.appliedRules?.map(r => ({
          name: r.name,
          type: r.type,
          impact: r.impact
        }))
      });
    }

  } catch (error) {
    logger.error('🔥 Debug investigation failed:', error);
  }
}

// Run if this file is executed directly
if (require.main === module) {
  debugRuleMatching().catch(console.error);
}

export { debugRuleMatching };