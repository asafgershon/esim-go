import { GraphQLError } from 'graphql';

export interface PricingConfig {
  cost: number;
  costPlus: number;
  totalCost: number;
  discountRate: number; // as decimal (0.30 for 30%)
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
  revenueAfterProcessing: number;
  finalRevenue: number;
  currency: string;
}

export class PricingService {
  private static readonly DEFAULT_DISCOUNT_RATE = 0.30; // 30%
  private static readonly DEFAULT_PROCESSING_RATE = 0.045; // 4.5%
  private static readonly DEFAULT_CURRENCY = 'USD';

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
    const revenueAfterProcessing = this.calculateRevenueAfterProcessing(priceAfterDiscount, processingCost);
    const finalRevenue = this.calculateFinalRevenue(revenueAfterProcessing, config.cost, config.costPlus);

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
      revenueAfterProcessing,
      finalRevenue,
      currency: this.DEFAULT_CURRENCY
    };
  }

  /**
   * Get pricing configuration for a specific bundle
   * This combines eSIM Go API data with our business logic and configuration rules
   */
  static async getPricingConfig(countryId: string, duration: number, catalogueAPI: any, configRepository?: any): Promise<PricingConfig> {
    try {
      // Get bundles from eSIM Go API
      const bundles = await catalogueAPI.getAllBundels();
      
      // Find bundles available for this country
      const availableBundles = bundles.filter((bundle: any) => {
        return bundle.countries?.some((country: any) => country.iso === countryId);
      });

      if (availableBundles.length === 0) {
        // Fallback to mock data if no bundles for this country
        return this.getMockPricingConfig(countryId, duration);
      }

      // Find best matching bundle for the requested duration
      let matchingBundle = availableBundles.find((bundle: any) => bundle.duration === duration);
      
      if (!matchingBundle) {
        // If no exact match, find the smallest bundle that covers the requested duration
        const suitableBundles = availableBundles
          .filter((bundle: any) => bundle.duration >= duration)
          .sort((a: any, b: any) => a.duration - b.duration);
        
        if (suitableBundles.length > 0) {
          matchingBundle = suitableBundles[0]; // Smallest bundle that covers the duration
        } else {
          // If no bundle covers the duration, use the largest available bundle
          matchingBundle = availableBundles
            .sort((a: any, b: any) => b.duration - a.duration)[0];
        }
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
          console.error('Error fetching pricing configuration:', error);
        }
      }

      // Use configuration rule or defaults  
      const markupPercent = configRule?.markupPercent || 40; // Default 40% markup (as percentage)
      const discountRate = configRule?.discountRate || this.DEFAULT_DISCOUNT_RATE;
      const processingRate = configRule?.processingRate || this.DEFAULT_PROCESSING_RATE;

      // Calculate discount for unused days if using a longer bundle
      const unusedDays = Math.max(0, matchingBundle.duration - duration);
      const unusedDaysDiscount = unusedDays > 0 ? (unusedDays / matchingBundle.duration) * 0.1 : 0; // 10% discount per unused day ratio

      // Calculate pricing based on eSIM Go data + configuration rules
      const esimGoCost = matchingBundle.price; // This is our actual cost from eSIM Go
      const markup = esimGoCost * (markupPercent / 100); // Convert percentage to decimal for calculation
      const totalCostBeforeUnusedDiscount = esimGoCost + markup;
      const totalCost = totalCostBeforeUnusedDiscount * (1 - unusedDaysDiscount);

      return {
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
          esimGoPrice: matchingBundle.price
        }
      };
    } catch (error) {
      console.error('Error fetching pricing from eSIM Go API:', error);
      // Fallback to mock data
      return this.getMockPricingConfig(countryId, duration);
    }
  }

  /**
   * Fallback mock pricing configuration
   */
  static getMockPricingConfig(countryId: string, duration: number): PricingConfig {
    // Mock data based on your Excel example (Austria)
    const mockConfigs: Record<string, Record<number, PricingConfig>> = {
      'AT': { // Austria
        3: { cost: 4.80, costPlus: 6, totalCost: 10.00, discountRate: 0.30, processingRate: 0.045 },
        5: { cost: 7.56, costPlus: 10, totalCost: 17.00, discountRate: 0.30, processingRate: 0.045 },
        7: { cost: 10.32, costPlus: 13, totalCost: 23.00, discountRate: 0.30, processingRate: 0.045 },
        10: { cost: 14.08, costPlus: 16, totalCost: 30.00, discountRate: 0.30, processingRate: 0.045 }
      }
    };

    // Default pricing configuration for unsupported countries
    const defaultConfig: Record<number, PricingConfig> = {
      3: { cost: 5.00, costPlus: 6, totalCost: 11.00, discountRate: 0.30, processingRate: 0.045 },
      5: { cost: 8.00, costPlus: 10, totalCost: 18.00, discountRate: 0.30, processingRate: 0.045 },
      7: { cost: 11.00, costPlus: 14, totalCost: 25.00, discountRate: 0.30, processingRate: 0.045 },
      10: { cost: 15.00, costPlus: 17, totalCost: 32.00, discountRate: 0.30, processingRate: 0.045 },
      14: { cost: 20.00, costPlus: 22, totalCost: 42.00, discountRate: 0.30, processingRate: 0.045 },
      30: { cost: 40.00, costPlus: 45, totalCost: 85.00, discountRate: 0.30, processingRate: 0.045 }
    };

    // Use country-specific config if available, otherwise use default
    const countryConfig = mockConfigs[countryId] || defaultConfig;

    // Try to get exact duration match first
    let config = countryConfig[duration];
    
    // If no exact match, calculate dynamic pricing for custom durations
    if (!config) {
      config = this.calculateDynamicPricing(duration, countryConfig, countryId);
    }

    return config;
  }

  /**
   * Calculate dynamic pricing for custom durations
   * Uses interpolation between known pricing tiers
   */
  private static calculateDynamicPricing(
    duration: number, 
    countryConfig: Record<number, PricingConfig>,
    countryId: string
  ): PricingConfig {
    const sortedDurations = Object.keys(countryConfig)
      .map(Number)
      .sort((a, b) => a - b);

    // Find the two closest durations for interpolation
    let lowerDuration = sortedDurations[0];
    let upperDuration = sortedDurations[sortedDurations.length - 1];

    for (let i = 0; i < sortedDurations.length - 1; i++) {
      if (duration >= sortedDurations[i] && duration <= sortedDurations[i + 1]) {
        lowerDuration = sortedDurations[i];
        upperDuration = sortedDurations[i + 1];
        break;
      }
    }

    const lowerConfig = countryConfig[lowerDuration];
    const upperConfig = countryConfig[upperDuration];

    // For durations shorter than minimum, use minimum pricing
    if (duration <= lowerDuration) {
      return {
        ...lowerConfig,
        totalCost: Math.max(lowerConfig.totalCost, duration * (lowerConfig.totalCost / lowerDuration))
      };
    }

    // For durations longer than maximum, use daily rate from longest duration
    if (duration >= upperDuration) {
      const dailyRate = upperConfig.totalCost / upperDuration;
      const totalCost = duration * dailyRate;
      const cost = totalCost * (upperConfig.cost / upperConfig.totalCost);
      const costPlus = totalCost * (upperConfig.costPlus / upperConfig.totalCost);
      
      return {
        cost: Number(cost.toFixed(2)),
        costPlus: Number(costPlus.toFixed(2)),
        totalCost: Number(totalCost.toFixed(2)),
        discountRate: upperConfig.discountRate,
        processingRate: upperConfig.processingRate
      };
    }

    // Linear interpolation between two known points
    const ratio = (duration - lowerDuration) / (upperDuration - lowerDuration);
    const totalCost = lowerConfig.totalCost + ratio * (upperConfig.totalCost - lowerConfig.totalCost);
    const cost = lowerConfig.cost + ratio * (upperConfig.cost - lowerConfig.cost);
    const costPlus = lowerConfig.costPlus + ratio * (upperConfig.costPlus - lowerConfig.costPlus);

    return {
      cost: Number(cost.toFixed(2)),
      costPlus: Number(costPlus.toFixed(2)),
      totalCost: Number(totalCost.toFixed(2)),
      discountRate: lowerConfig.discountRate, // Use consistent discount rate
      processingRate: lowerConfig.processingRate // Use consistent processing rate
    };
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
      revenueAfterProcessing,
      duration
    } = pricingBreakdown;

    // Calculate margins and analysis
    const grossProfit = revenueAfterProcessing - cost - costPlus;
    const netProfit = finalRevenue;
    const profitMarginPercent = (netProfit / totalCost) * 100;
    
    // Cost margins
    const costMargin = cost > 0 ? ((cost - (cost * 0.6)) / cost) * 100 : 0; // Assuming 60% of cost is actual cost
    const costPlusMargin = costPlus > 0 ? ((costPlus - (costPlus * 0.4)) / costPlus) * 100 : 0; // Assuming 40% of costPlus is actual cost
    const totalMargin = ((totalCost - (cost + costPlus)) / totalCost) * 100;
    
    // eSIM Go integration estimates
    const estimatedEsimGoCost = cost * 0.7; // Estimate eSIM Go takes 70% of cost component
    const ourMarkup = totalCost - estimatedEsimGoCost;
    const markupPercent = (ourMarkup / estimatedEsimGoCost) * 100;
    
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
      baseCostSplitPercent: 60.0, // Default cost split percentage
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
      ourMarkup: Number(ourMarkup.toFixed(2)),
      markupPercent: Number(markupPercent.toFixed(2)),
      
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

  private static calculateRevenueAfterProcessing(priceAfterDiscount: number, processingCost: number): number {
    return Number((priceAfterDiscount - processingCost).toFixed(2));
  }

  private static calculateFinalRevenue(revenueAfterProcessing: number, cost: number, costPlus: number): number {
    return Number((revenueAfterProcessing - cost - costPlus).toFixed(2));
  }
}