import { createClient } from '@supabase/supabase-js';
import { PricingEngineService } from '../src/services/pricing-engine.service';
import { CatalogueDataSource } from '../src/datasources/esim-go/catalogue-datasource';
import { createLogger } from '../src/lib/logger';

const logger = createLogger({ 
  component: 'PricingDebug',
  operationType: 'debug-investigation'
});

async function debugPricingIssue() {
  // Initialize Supabase client
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  logger.info('🔍 Starting pricing debug investigation');

  try {
    // 1. Check if we have bundles in the database
    const { data: bundles, error: bundleError } = await supabase
      .from('catalog_bundles')
      .select('esim_go_name, price_cents, duration, countries')
      .limit(5);

    if (bundleError) {
      logger.error('Failed to fetch bundles', bundleError);
      return;
    }

    logger.info('📦 Sample bundles from database:', {
      count: bundles?.length || 0,
      bundles: bundles?.map(b => ({
        name: b.esim_go_name,
        priceCents: b.price_cents,
        priceUSD: b.price_cents ? (b.price_cents / 100) : 0,
        duration: b.duration,
        countries: Array.isArray(b.countries) ? b.countries.slice(0, 2) : b.countries
      }))
    });

    // 2. Check if we have pricing rules in the database
    const { data: rules, error: rulesError } = await supabase
      .from('pricing_rules')
      .select('type, name, is_active, conditions, actions')
      .eq('is_active', true);

    if (rulesError) {
      logger.error('Failed to fetch pricing rules', rulesError);
      return;
    }

    logger.info('📋 Active pricing rules:', {
      count: rules?.length || 0,
      rules: rules?.map(r => ({
        type: r.type,
        name: r.name,
        conditionCount: Array.isArray(r.conditions) ? r.conditions.length : 0,
        actionCount: Array.isArray(r.actions) ? r.actions.length : 0
      }))
    });

    // 3. Test pricing engine initialization
    const pricingEngine = new PricingEngineService(supabase);
    
    logger.info('🔧 Initializing pricing engine...');
    await pricingEngine.initialize();
    
    const loadedRules = pricingEngine.getLoadedRules();
    logger.info('⚙️ Pricing engine rules loaded:', {
      systemRules: loadedRules.system.length,
      businessRules: loadedRules.business.length,
      totalRules: loadedRules.all.length
    });

    // 4. Test with a simple bundle if we have any
    if (bundles && bundles.length > 0) {
      const testBundle = bundles[0];
      
      if (testBundle.price_cents && testBundle.price_cents > 0) {
        logger.info('🧪 Testing pricing calculation with sample bundle');
        
        const pricingContext = PricingEngineService.createContext({
          availableBundles: [{
            id: testBundle.esim_go_name,
            name: testBundle.esim_go_name,
            cost: testBundle.price_cents / 100, // Convert cents to dollars
            duration: testBundle.duration || 7,
            countryId: Array.isArray(testBundle.countries) ? testBundle.countries[0] : 'US',
            countryName: Array.isArray(testBundle.countries) ? testBundle.countries[0] : 'United States',
            regionId: 'AMERICA',
            regionName: 'America',
            group: 'Standard Fixed',
            isUnlimited: false,
            dataAmount: '1024'
          }],
          requestedDuration: testBundle.duration || 7,
          paymentMethod: 'israeli_card'
        });

        // Validate context
        const validationErrors = pricingEngine.validateContext(pricingContext);
        if (validationErrors.length > 0) {
          logger.error('❌ Context validation failed:', { validationErrors });
          return;
        }

        logger.info('✅ Context validation passed');

        // Test pricing calculation
        const result = await pricingEngine.calculatePrice(pricingContext);
        
        logger.info('💰 Pricing calculation result:', {
          baseCost: result.baseCost,
          markup: result.markup,
          subtotal: result.subtotal,
          totalDiscount: result.totalDiscount,
          processingFee: result.processingFee,
          finalPrice: result.finalPrice,
          profit: result.profit,
          appliedRulesCount: result.appliedRules?.length || 0
        });

        if (result.finalPrice === 0) {
          logger.error('🚨 ISSUE FOUND: Final price is zero!');
          logger.info('Applied rules:', result.appliedRules);
          logger.info('Discounts:', result.discounts);
        } else {
          logger.info('✅ Pricing calculation appears to work correctly');
        }
      } else {
        logger.warn('⚠️ Test bundle has no valid price_cents', {
          testBundle: {
            name: testBundle.esim_go_name,
            priceCents: testBundle.price_cents
          }
        });
      }
    }

  } catch (error) {
    logger.error('🔥 Debug investigation failed:', error);
  }
}

// Run if this file is executed directly
if (require.main === module) {
  debugPricingIssue().catch(console.error);
}

export { debugPricingIssue };