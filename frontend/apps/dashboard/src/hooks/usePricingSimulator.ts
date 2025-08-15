import { useLazyQuery, useSubscription } from '@apollo/client';
import { SIMULATE_PRICING, PRICING_PIPELINE_PROGRESS, PRICING_CALCULATION_STEPS } from '@/lib/graphql/queries';
import { SimulatePricingQuery, PricingPipelineProgressSubscription, PricingCalculationStepsSubscription, PaymentMethod } from '@/__generated__/graphql';
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
  
  // Enhanced real-time data
  pricingSteps?: Array<{
    order: number;
    name: string;
    priceBefore: number;
    priceAfter: number;
    impact: number;
    ruleId?: string | null;
    metadata?: any;
    timestamp: string;
  }>;
  customerDiscounts?: Array<{
    name: string;
    amount: number;
    percentage?: number | null;
    reason?: string | null;
  }>;
  savingsAmount?: number;
  savingsPercentage?: number;
  calculationTimeMs?: number;
  rulesEvaluated?: number;
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
  
  // Pipeline streaming (legacy)
  pipelineSteps: PipelineStep[];
  isStreaming: boolean;
  wsConnected: boolean;
  
  // Real-time calculation steps
  calculationSteps: Array<{
    order: number;
    name: string;
    priceBefore: number;
    priceAfter: number;
    impact: number;
    ruleId?: string | null;
    metadata?: any;
    timestamp: string;
  }>;
  calculationProgress: {
    isComplete: boolean;
    totalSteps: number;
    completedSteps: number;
    error?: string | null;
  };
  
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
  
  // Real-time calculation steps state
  const [calculationSteps, setCalculationSteps] = useState<Array<{
    order: number;
    name: string;
    priceBefore: number;
    priceAfter: number;
    impact: number;
    ruleId?: string | null;
    metadata?: any;
    timestamp: string;
  }>>([]);
  const [calculationProgress, setCalculationProgress] = useState<{
    isComplete: boolean;
    totalSteps: number;
    completedSteps: number;
    error?: string | null;
  }>({ isComplete: false, totalSteps: 0, completedSteps: 0 });
  const [currentInput, setCurrentInput] = useState<PricingSimulatorParams | null>(null);

  // Subscribe to pipeline progress when streaming (legacy)
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
  
  // Subscribe to real-time calculation steps
  const { data: calculationStepsData, error: calculationStepsError } = useSubscription<PricingCalculationStepsSubscription>(
    PRICING_CALCULATION_STEPS,
    {
      variables: currentInput ? {
        input: {
          numOfDays: currentInput.numOfDays,
          countryId: currentInput.countryId.toUpperCase(),
          paymentMethod: currentInput.paymentMethod,
          groups: currentInput.groups,
        }
      } : undefined,
      skip: !currentInput,
      onData: ({ data }) => {
        if (data.data?.pricingCalculationSteps) {
          const stepData = data.data.pricingCalculationSteps;
          
          // Update calculation steps
          if (stepData.step) {
            setCalculationSteps(prev => {
              // Avoid duplicates by checking order
              const exists = prev.find(s => s.order === stepData.step!.order);
              if (exists) return prev;
              return [...prev, stepData.step!].sort((a, b) => a.order - b.order);
            });
          }
          
          // Update progress
          setCalculationProgress({
            isComplete: stepData.isComplete,
            totalSteps: stepData.totalSteps,
            completedSteps: stepData.completedSteps,
            error: stepData.error,
          });
          
          // If calculation is complete and we have final breakdown, update simulation data
          if (stepData.isComplete && stepData.finalBreakdown) {
            // This will trigger the data transformation in the useMemo below
            // by setting the simulationData to include the final breakdown
          }
        }
      },
      onError: (error) => {
        console.error('Calculation steps streaming error:', error);
        setCalculationProgress(prev => ({ ...prev, error: error.message }));
      },
      onComplete: () => {
        setCalculationProgress(prev => ({ ...prev, isComplete: true }));
        setCurrentInput(null); // Clear input to stop subscription
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
      
      // Enhanced fields
      pricingSteps: result.pricingSteps,
      customerDiscounts: result.customerDiscounts,
      savingsAmount: result.savingsAmount,
      savingsPercentage: result.savingsPercentage,
      calculationTimeMs: result.calculationTimeMs,
      rulesEvaluated: result.rulesEvaluated,
    };
  }, [simulationData]);

  // Simulate pricing for given parameters
  const simulate = useCallback(async (params: PricingSimulatorParams) => {
    // Generate correlation ID for pipeline tracking (legacy)
    const newCorrelationId = `sim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setCorrelationId(newCorrelationId);
    setPipelineSteps([]);
    setIsStreaming(true);
    
    // Reset real-time calculation state
    setCalculationSteps([]);
    setCalculationProgress({ isComplete: false, totalSteps: 0, completedSteps: 0 });
    setCurrentInput(params); // This will trigger the subscription

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
      setCurrentInput(null);
    }
  }, [simulateQuery]);

  // Clear simulation data
  const clear = useCallback(() => {
    setCorrelationId(null);
    setPipelineSteps([]);
    setIsStreaming(false);
    setCalculationSteps([]);
    setCalculationProgress({ isComplete: false, totalSteps: 0, completedSteps: 0 });
    setCurrentInput(null);
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
    error: simulationError || calculationStepsError,
    pipelineSteps,
    isStreaming,
    wsConnected,
    calculationSteps,
    calculationProgress,
    comparePaymentMethods,
    analyzeProfitability,
  };
}