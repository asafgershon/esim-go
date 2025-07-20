import { GraphQLError } from 'graphql';
import { createLogger } from '../lib/logger';
import type { CatalogueDataSource } from '../datasources/esim-go';

export interface PricingConfig {
  cost: number;
  costPlus: number;
  totalCost: number;
  discountRate: number; // as decimal (0 for 0%)
  processingRate: number; // as decimal (0.045 for 4.5%)
  bundleInfo?: {
    originalDuration: number;
    requestedDuration: number;
    unusedDays: number;
    unusedDaysDiscount: number; // as percentage
    esimGoPrice: number;
  };
}

export interface PricingBreakdown {
  bundleName: string;
  countryName: string;
  duration: number;
  cost: number;
  costPlus: number;
  totalCost: number;
  discountRate: number;
  discountValue: number;
  priceAfterDiscount: number;
  processingRate: number;
  processingCost: number;
  finalRevenue: number;        // Revenue after processing fees (what we actually receive)
  netProfit: number;           // Final profit after all costs and fees
  currency: string;
}

export class PricingService {
  private static readonly DEFAULT_DISCOUNT_RATE = 0.0; // 0%
  private static readonly DEFAULT_PROCESSING_RATE = 0.045; // 4.5%
  private static readonly DEFAULT_CURRENCY = 'USD';
  private static readonly logger = createLogger({ 
    component: 'PricingService',
    operationType: 'pricing-calculations'
  });

  /**
   * Calculate detailed pricing breakdown for a bundle
   */
  static calculatePricing(
    bundleName: string,
    countryName: string,
    duration: number,
    config: PricingConfig
  ): PricingBreakdown {
    // Validate inputs
    if (!bundleName || !countryName || duration <= 0) {
      throw new GraphQLError('Invalid bundle parameters', {
        extensions: { code: 'INVALID_BUNDLE_PARAMS' }
      });
    }

    if (config.cost < 0 || config.costPlus < 0 || config.totalCost < 0) {
      throw new GraphQLError('Invalid cost parameters', {
        extensions: { code: 'INVALID_COST_PARAMS' }
      });
    }

    // Calculate computed values
    const discountValue = this.calculateDiscountValue(config.totalCost, config.discountRate);
    const priceAfterDiscount = this.calculatePriceAfterDiscount(config.totalCost, discountValue);
    const processingCost = this.calculateProcessingCost(priceAfterDiscount, config.processingRate);
    const finalRevenue = this.calculateFinalRevenue(priceAfterDiscount, processingCost);
    const netProfit = this.calculateNetProfit(finalRevenue, config.totalCost);

    return {
      bundleName,
      countryName,
      duration,
      cost: config.cost,
      costPlus: config.costPlus,
      totalCost: config.totalCost,
      discountRate: config.discountRate,
      discountValue,
      priceAfterDiscount,
      processingRate: config.processingRate,
      processingCost,
      finalRevenue,
      netProfit,
      currency: this.DEFAULT_CURRENCY
    };
  }

  /**
   * Get fixed markup amount from database table based on bundle group and duration
   */
  static async getFixedMarkup(bundleGroup: string, duration: number): Promise<number> {
    try {
      // Import Supabase client (assuming it's available in your services)
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.SUPABASE_URL!, 
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      // Try exact duration match first
      const { data: exactMatch } = await supabase
        .from('pricing_markup_config')
        .select('markup_amount')
        .eq('bundle_group', bundleGroup)
        .eq('duration_days', duration)
        .single();

      if (exactMatch) {
        this.logger.info('Found exact markup match', {
          bundleGroup,
          duration,
          markupAmount: exactMatch.markup_amount,
          operationType: 'markup-exact-match'
        });
        return exactMatch.markup_amount;
      }

      // No exact match, get all markups for this bundle group for interpolation
      const { data: allMarkups } = await supabase
        .from('pricing_markup_config')
        .select('duration_days, markup_amount')
        .eq('bundle_group', bundleGroup)
        .order('duration_days');

      if (!allMarkups || allMarkups.length === 0) {
        this.logger.warn('No markup configuration found for bundle group, using default', {
          bundleGroup,
          duration,
          defaultMarkup: 10.00,
          operationType: 'markup-fallback'
        });
        return 10.00; // Default fallback
      }

      // Interpolate between closest durations
      const sortedMarkups = allMarkups.sort((a, b) => a.duration_days - b.duration_days);
      
      // If requested duration is shorter than shortest, use shortest
      if (duration <= sortedMarkups[0].duration_days) {
        const result = sortedMarkups[0].markup_amount;
        this.logger.info('Using shortest duration markup', {
          bundleGroup,
          requestedDuration: duration,
          usedDuration: sortedMarkups[0].duration_days,
          markupAmount: result,
          operationType: 'markup-shortest'
        });
        return result;
      }

      // If requested duration is longer than longest, use longest
      if (duration >= sortedMarkups[sortedMarkups.length - 1].duration_days) {
        const result = sortedMarkups[sortedMarkups.length - 1].markup_amount;
        this.logger.info('Using longest duration markup', {
          bundleGroup,
          requestedDuration: duration,
          usedDuration: sortedMarkups[sortedMarkups.length - 1].duration_days,
          markupAmount: result,
          operationType: 'markup-longest'
        });
        return result;
      }

      // Linear interpolation between two closest durations
      for (let i = 0; i < sortedMarkups.length - 1; i++) {
        const lower = sortedMarkups[i];
        const upper = sortedMarkups[i + 1];
        
        if (duration >= lower.duration_days && duration <= upper.duration_days) {
          const ratio = (duration - lower.duration_days) / (upper.duration_days - lower.duration_days);
          const interpolatedMarkup = lower.markup_amount + ratio * (upper.markup_amount - lower.markup_amount);
          
          this.logger.info('Interpolated markup calculated', {
            bundleGroup,
            requestedDuration: duration,
            lowerDuration: lower.duration_days,
            upperDuration: upper.duration_days,
            lowerMarkup: lower.markup_amount,
            upperMarkup: upper.markup_amount,
            interpolatedMarkup: Number(interpolatedMarkup.toFixed(2)),
            operationType: 'markup-interpolation'
          });
          
          return Number(interpolatedMarkup.toFixed(2));
        }
      }

      // Fallback (shouldn't reach here)
      this.logger.warn('Fallback to default markup', {
        bundleGroup,
        duration,
        defaultMarkup: 10.00,
        operationType: 'markup-fallback-unexpected'
      });
      return 10.00;

    } catch (error) {
      this.logger.error('Failed to fetch markup configuration', error as Error, {
        bundleGroup,
        duration,
        operationType: 'markup-fetch-error'
      });
      return 10.00; // Default fallback
    }
  }

  /**
   * Get pricing configuration for a specific bundle
   * This combines eSIM Go API data with our business logic and configuration rules
   */
  static async getPricingConfig(countryId: string, duration: number, catalogueAPI: CatalogueDataSource, configRepository?: any, paymentMethod: 'israeli_card' | 'foreign_card' | 'bit' | 'amex' | 'diners' = 'israeli_card', pricingAPI?: any): Promise<PricingConfig> {
    try {
      // Get bundles directly for this country using optimized eSIM Go API endpoint
      // Prioritize unlimited bundles by trying unlimited groups first
      let availableBundles;
      
      // Try to get unlimited essential bundles first (preferred for pricing)
      try {
        availableBundles = await catalogueAPI.searchPlans({
          country: countryId,
          bundleGroup: 'Standard - Unlimited Essential',
          limit: 200
        });
        
        this.logger.info('Unlimited Essential bundles search', {
          countryId,
          bundlesFound: availableBundles.bundles.length,
          operationType: 'unlimited-essential-search'
        });
        
        // If no unlimited essential, try unlimited lite
        if (availableBundles.bundles.length === 0) {
          availableBundles = await catalogueAPI.searchPlans({
            country: countryId,
            bundleGroup: 'Standard - Unlimited Lite',
            limit: 200
          });
          
          this.logger.info('Unlimited Lite bundles search', {
            countryId,
            bundlesFound: availableBundles.bundles.length,
            operationType: 'unlimited-lite-search'
          });
        }
        
        // If no unlimited bundles, fall back to all bundles for this country
        if (availableBundles.bundles.length === 0) {
          availableBundles = await catalogueAPI.searchPlans({
            country: countryId,
            limit: 200
          });
          
          this.logger.warn('No unlimited bundles found, using all available bundles', {
            countryId,
            bundlesFound: availableBundles.bundles.length,
            operationType: 'fallback-all-bundles'
          });
        }
      } catch (error) {
        this.logger.error('Error searching for unlimited bundles, falling back to all bundles', error as Error, {
          countryId,
          operationType: 'unlimited-search-error'
        });
        
        // Fallback to all bundles for this country
        availableBundles = await catalogueAPI.searchPlans({
          country: countryId,
          limit: 200
        });
      }

      this.logger.info('Country-specific bundle search completed', {
        countryId,
        requestedDuration: duration,
        bundlesFound: availableBundles.bundles.length,
        totalCount: availableBundles.totalCount,
        operationType: 'optimized-bundle-search'
      });

      // Extract the bundles array from the search result
      const bundles = availableBundles.bundles;
      
      if (bundles.length <= 10) {
        this.logger.debug('Available bundles for country', {
          countryId,
          bundles: bundles.map(b => ({
            name: b.name,
            duration: b.duration,
            price: b.price,
            bundleGroup: b.bundleGroup
          })),
          operationType: 'bundle-listing'
        });
      } else {
        this.logger.debug('Sample available bundles', {
          countryId,
          totalBundles: bundles.length,
          sampleBundles: bundles.slice(0, 5).map(b => ({
            name: b.name,
            duration: b.duration,
            price: b.price,
            bundleGroup: b.bundleGroup
          })),
          operationType: 'bundle-listing'
        });
      }

      if (bundles.length === 0) {
        // Log warning and throw exception - we should use real data only
        this.logger.warn('No bundles found for country, cannot provide real pricing', {
          countryId,
          requestedDuration: duration,
          operationType: 'pricing-no-data'
        });
        throw new GraphQLError(`No eSIM bundles available for country ${countryId}`, {
          extensions: {
            code: 'NO_BUNDLES_AVAILABLE',
            countryId,
            duration
          }
        });
      }

      // Find best matching bundle for the requested duration
      // Prioritize unlimited bundles (dataAmount: -1) over limited ones
      const unlimitedBundles = bundles.filter((bundle: any) => bundle.dataAmount === -1);
      const limitedBundles = bundles.filter((bundle: any) => bundle.dataAmount !== -1);
      
      this.logger.info('Bundle type analysis', {
        countryId,
        totalBundles: bundles.length,
        unlimitedBundles: unlimitedBundles.length,
        limitedBundles: limitedBundles.length,
        unlimitedSample: unlimitedBundles.slice(0, 2).map(b => ({ name: b.name, duration: b.duration, price: b.price })),
        operationType: 'bundle-type-analysis'
      });
      
      // Try to find unlimited bundle first
      let matchingBundle = unlimitedBundles.find((bundle: any) => bundle.duration === duration);
      
      if (!matchingBundle && unlimitedBundles.length > 0) {
        // No exact unlimited match, find smallest unlimited bundle that covers duration
        const suitableUnlimited = unlimitedBundles
          .filter((bundle: any) => bundle.duration >= duration)
          .sort((a: any, b: any) => a.duration - b.duration);
        
        if (suitableUnlimited.length > 0) {
          matchingBundle = suitableUnlimited[0];
          this.logger.info('Using smallest suitable unlimited bundle', {
            countryId,
            requestedDuration: duration,
            selectedBundle: {
              name: matchingBundle.name,
              duration: matchingBundle.duration,
              price: matchingBundle.price,
              isUnlimited: true
            },
            operationType: 'unlimited-bundle-selection'
          });
        } else {
          // Use largest unlimited bundle if none cover the duration
          matchingBundle = unlimitedBundles
            .sort((a: any, b: any) => b.duration - a.duration)[0];
          this.logger.info('Using largest unlimited bundle available', {
            countryId,
            requestedDuration: duration,
            selectedBundle: {
              name: matchingBundle.name,
              duration: matchingBundle.duration,
              price: matchingBundle.price,
              isUnlimited: true
            },
            operationType: 'unlimited-bundle-selection'
          });
        }
      }
      
      // If no unlimited bundles found, fall back to limited bundles
      if (!matchingBundle) {
        this.logger.debug('No unlimited bundles available, trying limited bundles', {
          countryId,
          requestedDuration: duration,
          operationType: 'limited-bundle-fallback'
        });
        
        matchingBundle = limitedBundles.find((bundle: any) => bundle.duration === duration);
        
        if (!matchingBundle) {
          // Find smallest limited bundle that covers duration
          const suitableLimited = limitedBundles
            .filter((bundle: any) => bundle.duration >= duration)
            .sort((a: any, b: any) => a.duration - b.duration);
          
          if (suitableLimited.length > 0) {
            matchingBundle = suitableLimited[0];
            this.logger.info('Using smallest suitable limited bundle', {
              countryId,
              requestedDuration: duration,
              selectedBundle: {
                name: matchingBundle.name,
                duration: matchingBundle.duration,
                price: matchingBundle.price,
                isUnlimited: false,
                dataAmount: matchingBundle.dataAmount
              },
              operationType: 'limited-bundle-selection'
            });
          } else if (limitedBundles.length > 0) {
            // Use largest limited bundle
            matchingBundle = limitedBundles
              .sort((a: any, b: any) => b.duration - a.duration)[0];
            this.logger.info('Using largest limited bundle available', {
              countryId,
              requestedDuration: duration,
              selectedBundle: {
                name: matchingBundle.name,
                duration: matchingBundle.duration,
                price: matchingBundle.price,
                isUnlimited: false,
                dataAmount: matchingBundle.dataAmount
              },
              operationType: 'limited-bundle-selection'
            });
          }
        }
      } else {
        this.logger.info('Found exact duration match', {
          countryId,
          requestedDuration: duration,
          selectedBundle: {
            name: matchingBundle.name,
            duration: matchingBundle.duration,
            price: matchingBundle.price
          },
          operationType: 'bundle-selection'
        });
      }

      // Get configuration rules from repository
      let configRule = null;
      if (configRepository) {
        try {
          configRule = await configRepository.findMatchingConfiguration(
            countryId,
            matchingBundle.baseCountry?.region || 'unknown',
            duration,
            matchingBundle.bundleGroup
          );
        } catch (error) {
          this.logger.error('Failed to fetch pricing configuration', error as Error, {
            countryId,
            region: matchingBundle.baseCountry?.region || 'unknown',
            duration,
            bundleGroup: matchingBundle.bundleGroup,
            operationType: 'config-fetch'
          });
        }
      }

      // Get fixed markup amount from database table based on bundle group and duration
      // This replaces the old percentage-based markup with fixed dollar amounts
      const fixedMarkupAmount = await this.getFixedMarkup(matchingBundle.bundleGroup, duration);
      const discountRate = configRule?.discountRate || this.DEFAULT_DISCOUNT_RATE;
      
      this.logger.info('Fixed markup retrieved', {
        bundleGroup: matchingBundle.bundleGroup,
        duration,
        fixedMarkupAmount,
        operationType: 'markup-lookup'
      });
      
      // Get dynamic processing rate from processing fee configuration
      let processingRate = configRule?.processingRate || this.DEFAULT_PROCESSING_RATE;
      try {
        const { ProcessingFeeRepository } = await import('../repositories/processing-fees/processing-fee.repository');
        const processingFeeRepository = new ProcessingFeeRepository();
        processingRate = await processingFeeRepository.getProcessingRate(paymentMethod);
      } catch (error) {
        this.logger.warn('Failed to fetch processing rate, using default', {
          error: error instanceof Error ? error.message : String(error),
          defaultRate: configRule?.processingRate || this.DEFAULT_PROCESSING_RATE,
          operationType: 'processing-rate-fallback'
        });
        // Fallback to configuration rule or default
        processingRate = configRule?.processingRate || this.DEFAULT_PROCESSING_RATE;
      }

      // Calculate discount for unused days if using a longer bundle
      const unusedDays = Math.max(0, matchingBundle.duration - duration);
      const unusedDaysDiscount = unusedDays > 0 ? (unusedDays / matchingBundle.duration) * 0.1 : 0; // 10% discount per unused day ratio

      // IMPORTANT: Log the selected bundle to debug Austria pricing issue
      this.logger.info('Bundle selected for pricing calculation', {
        countryId,
        requestedDuration: duration,
        selectedBundle: {
          name: matchingBundle.name,
          duration: matchingBundle.duration,
          catalogPrice: matchingBundle.price,
          bundleGroup: matchingBundle.bundleGroup,
          countries: matchingBundle.countries?.map(c => c.iso).join(',')
        },
        unusedDays: Math.max(0, matchingBundle.duration - duration),
        operationType: 'bundle-selected-debug'
      });

      // Get real-time pricing from eSIM Go API if available
      let esimGoCost = matchingBundle.price; // Fallback to catalog price
      let realTimePricing = null;
      
      if (pricingAPI) {
        try {
          realTimePricing = await pricingAPI.getBundlePricing(matchingBundle.name, countryId, 1);
          
          if (realTimePricing.basePrice === 0) {
            this.logger.warn('Real-time pricing returned zero - no real data available', {
              bundleName: matchingBundle.name,
              countryId,
              catalogPrice: matchingBundle.price,
              operationType: 'pricing-zero-returned'
            });
            // Use catalog price as fallback when pricing API returns 0
            esimGoCost = matchingBundle.price;
          } else {
            esimGoCost = realTimePricing.basePrice;
            this.logger.info('Real-time pricing retrieved successfully', {
              bundleName: matchingBundle.name,
              realTimePrice: esimGoCost,
              catalogPrice: matchingBundle.price,
              priceDifference: Math.abs(esimGoCost - matchingBundle.price),
              operationType: 'real-time-pricing'
            });
          }
        } catch (error) {
          this.logger.warn('Failed to get real-time pricing, using catalog price', {
            bundleName: matchingBundle.name,
            catalogPrice: matchingBundle.price,
            error: error instanceof Error ? error.message : String(error),
            operationType: 'pricing-fallback'
          });
          // Continue with catalog price as fallback
        }
      }

      // Calculate pricing based on eSIM Go data + fixed markup configuration
      const markup = fixedMarkupAmount; // Fixed dollar amount from database table
      const totalCostBeforeUnusedDiscount = esimGoCost + markup;
      const totalCost = totalCostBeforeUnusedDiscount * (1 - unusedDaysDiscount);

      const result = {
        cost: Number(esimGoCost.toFixed(2)), // eSIM Go cost (our base cost)
        costPlus: Number(markup.toFixed(2)), // Our markup
        totalCost: Number(totalCost.toFixed(2)), // Total with unused days discount applied
        discountRate,
        processingRate,
        // Additional info for transparency
        bundleInfo: {
          originalDuration: matchingBundle.duration,
          requestedDuration: duration,
          unusedDays,
          unusedDaysDiscount: Number((unusedDaysDiscount * 100).toFixed(1)), // As percentage
          esimGoPrice: realTimePricing ? realTimePricing.basePrice : matchingBundle.price
        }
      };

      // Log final pricing calculation for debugging
      this.logger.info('Pricing calculation completed', {
        countryId,
        requestedDuration: duration,
        selectedBundle: matchingBundle.name,
        bundleGroup: matchingBundle.bundleGroup,
        bundleDuration: matchingBundle.duration,
        catalogPrice: matchingBundle.price,
        realTimePrice: realTimePricing?.basePrice,
        finalCost: result.cost,
        fixedMarkupAmount: fixedMarkupAmount,
        markup: result.costPlus,
        totalCost: result.totalCost,
        unusedDays,
        unusedDaysDiscount,
        operationType: 'pricing-final-calculation'
      });

      return result;
    } catch (error) {
      this.logger.error('Failed to fetch pricing from eSIM Go API', error as Error, {
        countryId,
        duration,
        operationType: 'pricing-api-error'
      });
      // Re-throw the error - we should not estimate base costs
      throw error;
    }
  }



  /**
   * Get bundle name for display
   */
  static getBundleName(duration: number): string {
    return `UL essential ${duration} days`;
  }

  /**
   * Calculate admin-only cost breakdown for detailed analysis
   */
  static calculateAdminBreakdown(pricingBreakdown: PricingBreakdown, config: PricingConfig): any {
    const {
      cost,
      costPlus,
      totalCost,
      discountRate,
      processingRate,
      finalRevenue,
      netProfit,
      duration
    } = pricingBreakdown;

    // Calculate margins and analysis
    const grossProfit = pricingBreakdown.priceAfterDiscount - cost - costPlus;
    const profitMarginPercent = totalCost > 0 ? (netProfit / totalCost) * 100 : 0;
    
    // Cost margins
    const costMargin = cost > 0 ? ((cost - (cost * 0.6)) / cost) * 100 : 0; // Assuming 60% of cost is actual cost
    const costPlusMargin = costPlus > 0 ? ((costPlus - (costPlus * 0.4)) / costPlus) * 100 : 0; // Assuming 40% of costPlus is actual cost
    const totalMargin = ((totalCost - (cost + costPlus)) / totalCost) * 100;
    
    // eSIM Go integration estimates
    const estimatedEsimGoCost = cost;
    const ourFixedMarkup = costPlus; // Fixed dollar amount from database
    
    // Bundle analysis
    const dailyRate = totalCost / duration;
    
    // Competitive analysis based on daily rate
    let competitiveAnalysis = "Standard pricing";
    if (dailyRate < 2) {
      competitiveAnalysis = "Very competitive - low daily rate";
    } else if (dailyRate > 5) {
      competitiveAnalysis = "Premium pricing - high daily rate";
    } else if (dailyRate > 3) {
      competitiveAnalysis = "Above market - moderate daily rate";
    }

    return {
      // Raw Configuration Values  
      baseDiscountRate: discountRate,
      baseProcessingRate: processingRate,
      
      // Cost Analysis
      costMargin: Number(costMargin.toFixed(2)),
      costPlusMargin: Number(costPlusMargin.toFixed(2)),
      totalMargin: Number(totalMargin.toFixed(2)),
      
      // Financial Breakdown
      grossProfit: Number(grossProfit.toFixed(2)),
      netProfit: Number(netProfit.toFixed(2)),
      profitMarginPercent: Number(profitMarginPercent.toFixed(2)),
      
      // eSIM Go Integration
      estimatedEsimGoCost: Number(estimatedEsimGoCost.toFixed(2)),
      ourFixedMarkup: Number(ourFixedMarkup.toFixed(2)),
      
      // Bundle Analysis
      dailyRate: Number(dailyRate.toFixed(2)),
      competitiveAnalysis
    };
  }

  /**
   * Get country name from country code
   * TODO: This should come from a proper country service
   */
  static getCountryName(countryId: string): string {
    const countryNames: Record<string, string> = {
      'AT': 'Austria',
      'DE': 'Germany',
      'FR': 'France',
      'IT': 'Italy',
      'ES': 'Spain'
    };

    return countryNames[countryId] || countryId;
  }

  // Private calculation methods
  private static calculateDiscountValue(totalCost: number, discountRate: number): number {
    return Number((totalCost * discountRate).toFixed(2));
  }

  private static calculatePriceAfterDiscount(totalCost: number, discountValue: number): number {
    return Number((totalCost - discountValue).toFixed(2));
  }

  private static calculateProcessingCost(priceAfterDiscount: number, processingRate: number): number {
    return Number((priceAfterDiscount * processingRate).toFixed(3));
  }

  private static calculateFinalRevenue(priceAfterDiscount: number, processingCost: number): number {
    // Final revenue = what we actually receive after processing fees
    return Number((priceAfterDiscount - processingCost).toFixed(2));
  }

  private static calculateNetProfit(finalRevenue: number, totalCost: number): number {
    // Net profit = final revenue minus our total costs (eSIM Go cost + markup)
    return Number((finalRevenue - totalCost).toFixed(2));
  }
}