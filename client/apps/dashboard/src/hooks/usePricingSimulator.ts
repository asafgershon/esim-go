import { useLazyQuery, useSubscription } from '@apollo/client';
import { SIMULATE_PRICING, PRICING_PIPELINE_PROGRESS } from '@/lib/graphql/queries';
import { SimulatePricingQuery, PricingPipelineProgressSubscription, PaymentMethod } from '@/__generated__/graphql';
import { useCallback, useMemo, useState } from 'react';

interface PricingSimulatorParams {
  numOfDays: number;
  countryId: string;
  paymentMethod?: PaymentMethod;
  groups?: string[];
}

interface PricingSimulatorData {
  // Basic pricing info
  dailyPrice: number;
  totalPrice: number;
  originalPrice: number;
  discountAmount: number;
  hasDiscount: boolean;
  days: number;
  currency: string;
  
  // Business metrics
  cost: number;
  markup: number;
  discountRate: number;
  processingRate: number;
  processingCost: number;
  finalRevenue: number;
  netProfit: number;
  discountPerDay: number;
  totalCostBeforeProcessing: number;
  
  // Profit analysis
  profitMargin: number; // (netProfit / totalPrice) * 100
  revenueMargin: number; // (finalRevenue / totalPrice) * 100
  markupPercentage: number; // ((markup - cost) / cost) * 100
  
  // Pipeline metadata
  unusedDays?: number | null;
  selectedReason?: string | null;
  
  // Rules and discounts
  appliedRules: Array<{
    name: string;
    type: string;
    impact: number;
  }>;
  discounts: Array<{
    type: string;
    amount: number;
  }>;
  
  // Bundle and country info
  bundle: {
    id: string;
    name: string;
    duration: number;
    isUnlimited: boolean;
    data?: number | null;
    group?: string | null;
  };
  
  country: {
    iso: string;
    name: string;
    region?: string | null;
  };
}

interface PipelineStep {
  correlationId: string;
  name: string;
  timestamp: string;
  state?: any;
  appliedRules?: string[] | null;
  debug?: any;
}

interface UsePricingSimulatorReturn {
  // Simulation controls
  simulate: (params: PricingSimulatorParams) => Promise<void>;
  clear: () => void;
  
  // Simulation data
  data: PricingSimulatorData | null;
  loading: boolean;
  error: any;
  
  // Pipeline streaming
  pipelineSteps: PipelineStep[];
  isStreaming: boolean;
  wsConnected: boolean;
  
  // Analysis helpers
  comparePaymentMethods: (params: Omit<PricingSimulatorParams, 'paymentMethod'>) => Promise<{
    [key in PaymentMethod]?: PricingSimulatorData;
  }>;
  analyzeProfitability: () => {
    isprofitable: boolean;
    profitMarginCategory: 'high' | 'medium' | 'low' | 'negative';
    recommendations: string[];
  } | null;
}

/**
 * Advanced pricing simulator hook with real-time calculation, pipeline streaming,
 * and comprehensive profit analysis for admin dashboard
 */
export function usePricingSimulator(): UsePricingSimulatorReturn {
  const [simulateQuery, { data: simulationData, loading: simulationLoading, error: simulationError }] = 
    useLazyQuery<SimulatePricingQuery>(SIMULATE_PRICING);
  
  const [correlationId, setCorrelationId] = useState<string | null>(null);
  const [pipelineSteps, setPipelineSteps] = useState<PipelineStep[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [wsConnected, setWsConnected] = useState(true);

  // Subscribe to pipeline progress when streaming
  const { data: progressData } = useSubscription<PricingPipelineProgressSubscription>(
    PRICING_PIPELINE_PROGRESS,
    {
      variables: { correlationId: correlationId || '' },
      skip: !correlationId || !isStreaming,
      onData: ({ data }) => {
        if (data.data?.pricingPipelineProgress) {
          const step = data.data.pricingPipelineProgress;
          setPipelineSteps(prev => [...prev, step]);
          setWsConnected(true); // Confirm connection is working
        }
      },
      onError: (error) => {
        console.error('Pipeline streaming error:', error);
        setIsStreaming(false);
        setWsConnected(false);
      },
      onComplete: () => {
        setIsStreaming(false);
      },
    }
  );

  // Transform simulation data
  const data: PricingSimulatorData | null = useMemo(() => {
    if (!simulationData?.calculatePrice) return null;

    const result = simulationData.calculatePrice;
    const originalPrice = result.totalCost;
    const discountAmount = result.discountValue;
    const totalPrice = result.priceAfterDiscount;
    const dailyPrice = totalPrice / result.duration;
    const hasDiscount = discountAmount > 0;

    // Calculate profit metrics
    const profitMargin = result.totalCost > 0 ? (result.netProfit / totalPrice) * 100 : 0;
    const revenueMargin = result.totalCost > 0 ? (result.finalRevenue / totalPrice) * 100 : 0;
    const markupPercentage = result.cost > 0 ? ((result.markup - result.cost) / result.cost) * 100 : 0;

    return {
      // Basic pricing info
      dailyPrice,
      totalPrice,
      originalPrice,
      discountAmount,
      hasDiscount,
      days: result.duration,
      currency: result.currency,
      
      // Business metrics
      cost: result.cost,
      markup: result.markup,
      discountRate: result.discountRate,
      processingRate: result.processingRate,
      processingCost: result.processingCost,
      finalRevenue: result.finalRevenue,
      netProfit: result.netProfit,
      discountPerDay: result.discountPerDay,
      totalCostBeforeProcessing: result.totalCostBeforeProcessing,
      
      // Profit analysis
      profitMargin,
      revenueMargin,
      markupPercentage,
      
      // Pipeline metadata
      unusedDays: result.unusedDays,
      selectedReason: result.selectedReason,
      
      // Rules and discounts
      appliedRules: result.appliedRules || [],
      discounts: result.discounts || [],
      
      // Bundle and country info
      bundle: {
        id: result.bundle.id,
        name: result.bundle.name,
        duration: result.bundle.duration,
        isUnlimited: result.bundle.isUnlimited,
        data: result.bundle.data,
        group: result.bundle.group,
      },
      
      country: {
        iso: result.country.iso,
        name: result.country.name,
        region: result.country.region,
      },
    };
  }, [simulationData]);

  // Simulate pricing for given parameters
  const simulate = useCallback(async (params: PricingSimulatorParams) => {
    // Generate correlation ID for pipeline tracking
    const newCorrelationId = `sim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setCorrelationId(newCorrelationId);
    setPipelineSteps([]);
    setIsStreaming(true);

    try {
      await simulateQuery({
        variables: {
          input: {
            numOfDays: params.numOfDays,
            countryId: params.countryId.toUpperCase(),
            paymentMethod: params.paymentMethod,
            groups: params.groups,
          }
        },
        context: {
          headers: {
            'x-correlation-id': newCorrelationId,
          },
        },
      });
    } catch (error) {
      console.error('Simulation error:', error);
      setIsStreaming(false);
    }
  }, [simulateQuery]);

  // Clear simulation data
  const clear = useCallback(() => {
    setCorrelationId(null);
    setPipelineSteps([]);
    setIsStreaming(false);
  }, []);

  // Compare different payment methods for the same bundle
  const comparePaymentMethods = useCallback(async (params: Omit<PricingSimulatorParams, 'paymentMethod'>) => {
    const results: { [key in PaymentMethod]?: PricingSimulatorData } = {};
    const paymentMethods: PaymentMethod[] = [
      PaymentMethod.IsraeliCard,
      PaymentMethod.ForeignCard,
      PaymentMethod.Bit,
      PaymentMethod.Amex,
      PaymentMethod.Diners,
    ];

    // Run simulations for each payment method
    for (const method of paymentMethods) {
      try {
        const { data } = await simulateQuery({
          variables: {
            input: {
              numOfDays: params.numOfDays,
              countryId: params.countryId.toUpperCase(),
              paymentMethod: method,
            }
          },
        });

        if (data?.calculatePrice) {
          const result = data.calculatePrice;
          const totalPrice = result.priceAfterDiscount;
          const profitMargin = result.totalCost > 0 ? (result.netProfit / totalPrice) * 100 : 0;
          const revenueMargin = result.totalCost > 0 ? (result.finalRevenue / totalPrice) * 100 : 0;
          const markupPercentage = result.cost > 0 ? ((result.markup - result.cost) / result.cost) * 100 : 0;

          results[method] = {
            dailyPrice: totalPrice / result.duration,
            totalPrice,
            originalPrice: result.totalCost,
            discountAmount: result.discountValue,
            hasDiscount: result.discountValue > 0,
            days: result.duration,
            currency: result.currency,
            cost: result.cost,
            markup: result.markup,
            discountRate: result.discountRate,
            processingRate: result.processingRate,
            processingCost: result.processingCost,
            finalRevenue: result.finalRevenue,
            netProfit: result.netProfit,
            discountPerDay: result.discountPerDay,
            totalCostBeforeProcessing: result.totalCostBeforeProcessing,
            profitMargin,
            revenueMargin,
            markupPercentage,
            unusedDays: result.unusedDays,
            selectedReason: result.selectedReason,
            appliedRules: result.appliedRules || [],
            discounts: result.discounts || [],
            bundle: {
              id: result.bundle.id,
              name: result.bundle.name,
              duration: result.bundle.duration,
              isUnlimited: result.bundle.isUnlimited,
              data: result.bundle.data,
              group: result.bundle.group,
            },
            country: {
              iso: result.country.iso,
              name: result.country.name,
              region: result.country.region,
            },
          };
        }
      } catch (error) {
        console.error(`Error simulating for payment method ${method}:`, error);
      }
    }

    return results;
  }, [simulateQuery]);

  // Analyze profitability and provide recommendations
  const analyzeProfitability = useCallback(() => {
    if (!data) return null;

    const isprofitable = data.netProfit > 0;
    let profitMarginCategory: 'high' | 'medium' | 'low' | 'negative';
    const recommendations: string[] = [];

    // Categorize profit margin
    if (data.profitMargin < 0) {
      profitMarginCategory = 'negative';
      recommendations.push('Consider increasing markup or reducing costs');
      recommendations.push('Review discount policies for this country/duration');
    } else if (data.profitMargin < 10) {
      profitMarginCategory = 'low';
      recommendations.push('Profit margin is below 10% - consider optimization');
      recommendations.push('Review processing fees and markup strategy');
    } else if (data.profitMargin < 25) {
      profitMarginCategory = 'medium';
      recommendations.push('Healthy profit margin - monitor competitive positioning');
    } else {
      profitMarginCategory = 'high';
      recommendations.push('Excellent profit margin - ensure pricing remains competitive');
    }

    // Additional recommendations based on specific metrics
    if (data.processingRate > 0.02) { // 2%
      recommendations.push('High processing fees detected - consider alternative payment methods');
    }

    if (data.unusedDays && data.unusedDays > 0) {
      recommendations.push(`${data.unusedDays} unused days - consider offering shorter duration bundles`);
    }

    if (data.appliedRules.length === 0) {
      recommendations.push('No pricing rules applied - consider creating targeted rules for this scenario');
    }

    return {
      isprofitable,
      profitMarginCategory,
      recommendations,
    };
  }, [data]);

  return {
    simulate,
    clear,
    data,
    loading: simulationLoading,
    error: simulationError,
    pipelineSteps,
    isStreaming,
    wsConnected,
    comparePaymentMethods,
    analyzeProfitability,
  };
}