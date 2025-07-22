import React from 'react';
import { useLazyQuery } from '@apollo/client';
import { 
  CALCULATE_PRICE_WITH_RULES, 
  CALCULATE_BATCH_PRICING_WITH_RULES, 
  SIMULATE_PRICING_RULE 
} from '../lib/graphql/queries';

// Types for rule-based pricing calculations
export interface AppliedRule {
  id: string;
  name: string;
  type: string;
  impact: number;
}

export interface DiscountApplication {
  ruleName: string;
  amount: number;
  type: string; // 'percentage' or 'fixed'
}

export interface PricingRuleCalculation {
  baseCost: number;
  markup: number;
  subtotal: number;
  discounts: DiscountApplication[];
  totalDiscount: number;
  priceAfterDiscount: number;
  processingFee: number;
  processingRate: number;
  finalPrice: number;
  finalRevenue: number;
  revenueAfterProcessing: number;
  profit: number;
  maxRecommendedPrice: number;
  maxDiscountPercentage: number;
  appliedRules: AppliedRule[];
}

export interface PricingRecommendation {
  type: 'payment_method' | 'duration' | 'bundle_group' | 'discount_optimization';
  title: string;
  description: string;
  potentialSaving: number;
  confidence: 'high' | 'medium' | 'low';
  action?: string;
}

export interface PricingWithRules {
  pricing: PricingRuleCalculation | null;
  appliedRules: AppliedRule[];
  recommendations: PricingRecommendation[];
  loading: boolean;
  error: string | null;
  ruleBreakdown: {
    systemRules: AppliedRule[];
    businessRules: AppliedRule[];
    totalImpact: number;
  };
}

export interface CalculatePriceInput {
  numOfDays: number;
  regionId: string;
  countryId: string;
  paymentMethod?: string;
}

/**
 * Enhanced pricing hook that provides rule-based pricing calculations
 * with detailed breakdown of applied rules and recommendations
 */
export const usePricingWithRules = () => {
  const [calculatePriceWithRules, { 
    data: singlePriceData, 
    loading: singleLoading, 
    error: singleError 
  }] = useLazyQuery(CALCULATE_PRICE_WITH_RULES);

  const [calculateBatchPricingWithRules, { 
    data: batchPriceData, 
    loading: batchLoading, 
    error: batchError 
  }] = useLazyQuery(CALCULATE_BATCH_PRICING_WITH_RULES);

  const [simulatePricingRule, { 
    data: simulationData, 
    loading: simulationLoading, 
    error: simulationError 
  }] = useLazyQuery(SIMULATE_PRICING_RULE);

  /**
   * Calculate pricing for a single bundle with rule breakdown
   */
  const calculateSinglePrice = async (input: CalculatePriceInput): Promise<PricingWithRules> => {
    try {
      const result = await calculatePriceWithRules({
        variables: { input }
      });

      if (result.data?.calculatePriceWithRules) {
        const pricing = result.data.calculatePriceWithRules;
        return processPricingResult(pricing);
      }

      return createEmptyResult('No pricing data available');
    } catch (error: any) {
      console.error('Error calculating single price with rules:', error);
      return createEmptyResult(error.message || 'Failed to calculate pricing');
    }
  };

  /**
   * Calculate pricing for multiple bundles with rule breakdown
   */
  const calculateBatchPrices = async (requests: CalculatePriceInput[]): Promise<PricingWithRules[]> => {
    try {
      const result = await calculateBatchPricingWithRules({
        variables: { requests }
      });

      if (result.data?.calculateBatchPricing) {
        return result.data.calculateBatchPricing.map(processPricingResult);
      }

      return requests.map(() => createEmptyResult('No pricing data available'));
    } catch (error: any) {
      console.error('Error calculating batch prices with rules:', error);
      return requests.map(() => createEmptyResult(error.message || 'Failed to calculate pricing'));
    }
  };

  /**
   * Simulate a pricing rule before applying it
   */
  const simulateRule = async (
    rule: any, 
    testContext: any
  ): Promise<PricingWithRules> => {
    try {
      const result = await simulatePricingRule({
        variables: { rule, testContext }
      });

      if (result.data?.simulatePricingRule) {
        return processPricingResult(result.data.simulatePricingRule);
      }

      return createEmptyResult('No simulation data available');
    } catch (error: any) {
      console.error('Error simulating pricing rule:', error);
      return createEmptyResult(error.message || 'Failed to simulate rule');
    }
  };

  /**
   * Process pricing calculation result and add recommendations
   */
  const processPricingResult = (pricing: PricingRuleCalculation): PricingWithRules => {
    const appliedRules = pricing.appliedRules || [];
    
    // Separate system and business rules
    const systemRules = appliedRules.filter(rule => 
      rule.type === 'SYSTEM_MARKUP' || rule.type === 'SYSTEM_PROCESSING'
    );
    const businessRules = appliedRules.filter(rule => 
      rule.type !== 'SYSTEM_MARKUP' && rule.type !== 'SYSTEM_PROCESSING'
    );

    const totalImpact = appliedRules.reduce((sum, rule) => sum + rule.impact, 0);

    // Generate recommendations based on pricing data
    const recommendations = generateRecommendations(pricing);

    return {
      pricing,
      appliedRules,
      recommendations,
      loading: false,
      error: null,
      ruleBreakdown: {
        systemRules,
        businessRules,
        totalImpact
      }
    };
  };

  /**
   * Generate smart recommendations based on pricing calculation
   */
  const generateRecommendations = (pricing: PricingRuleCalculation): PricingRecommendation[] => {
    const recommendations: PricingRecommendation[] = [];

    // Low profit margin warning
    if (pricing.profit < 1.0) {
      recommendations.push({
        type: 'discount_optimization',
        title: 'Low Profit Margin',
        description: `Current profit is only $${pricing.profit.toFixed(2)}. Consider reducing discounts.`,
        potentialSaving: Math.abs(pricing.profit),
        confidence: 'high',
        action: 'Reduce discount rates or increase markup'
      });
    }

    // High discount percentage warning
    if (pricing.maxDiscountPercentage > 0 && pricing.totalDiscount > pricing.maxDiscountPercentage) {
      recommendations.push({
        type: 'discount_optimization',
        title: 'Excessive Discount',
        description: `Current discount exceeds recommended maximum of ${(pricing.maxDiscountPercentage * 100).toFixed(1)}%`,
        potentialSaving: pricing.totalDiscount - pricing.maxDiscountPercentage,
        confidence: 'medium',
        action: 'Review discount rules and priorities'
      });
    }

    // Processing fee optimization
    if (pricing.processingRate > 0.025) { // 2.5% threshold
      recommendations.push({
        type: 'payment_method',
        title: 'High Processing Fees',
        description: `Processing fee of ${(pricing.processingRate * 100).toFixed(1)}% is above average. Consider Israeli cards.`,
        potentialSaving: pricing.processingFee * 0.3, // Estimate 30% savings
        confidence: 'medium',
        action: 'Recommend Israeli card payment method'
      });
    }

    // Pricing optimization opportunity
    if (pricing.finalPrice < pricing.maxRecommendedPrice * 0.8) {
      const potentialIncrease = pricing.maxRecommendedPrice * 0.9 - pricing.finalPrice;
      recommendations.push({
        type: 'discount_optimization',
        title: 'Price Optimization Opportunity',
        description: `Current price is significantly below market potential.`,
        potentialSaving: potentialIncrease,
        confidence: 'low',
        action: 'Consider reducing discounts or increasing base markup'
      });
    }

    return recommendations;
  };

  /**
   * Create empty result object for error cases
   */
  const createEmptyResult = (errorMessage: string): PricingWithRules => ({
    pricing: null,
    appliedRules: [],
    recommendations: [],
    loading: false,
    error: errorMessage,
    ruleBreakdown: {
      systemRules: [],
      businessRules: [],
      totalImpact: 0
    }
  });

  return {
    // Main calculation functions
    calculateSinglePrice,
    calculateBatchPrices,
    simulateRule,
    
    // Loading states
    loading: singleLoading || batchLoading || simulationLoading,
    
    // Error states
    error: singleError || batchError || simulationError,
    
    // Direct data access (for backward compatibility)
    singlePriceData,
    batchPriceData,
    simulationData,
    
    // Helper functions
    processPricingResult,
    generateRecommendations
  };
};

/**
 * Simplified hook for single price calculations
 * Maintains compatibility with existing components
 */
export const useSinglePriceWithRules = (input: CalculatePriceInput | null) => {
  const { calculateSinglePrice, loading, error } = usePricingWithRules();
  const [result, setResult] = React.useState<PricingWithRules | null>(null);

  React.useEffect(() => {
    if (input) {
      calculateSinglePrice(input).then(setResult);
    }
  }, [input, calculateSinglePrice]);

  return {
    result,
    loading,
    error,
    refetch: () => input && calculateSinglePrice(input).then(setResult)
  };
};