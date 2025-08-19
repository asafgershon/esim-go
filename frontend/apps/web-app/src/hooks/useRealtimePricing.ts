import { useSubscription } from '@apollo/client';
import { useState, useEffect } from 'react';
import { gql } from '@apollo/client';

// Define the subscription for customer-friendly pricing updates
const PRICING_UPDATES_SUBSCRIPTION = gql`
  subscription PricingCalculationSteps($input: CalculatePriceInput!) {
    pricingCalculationSteps(input: $input) {
      correlationId
      isComplete
      totalSteps
      completedSteps
      step {
        order
        name
        priceBefore
        priceAfter
        impact
        ruleId
        metadata
        timestamp
      }
      finalBreakdown {
        finalPrice
        currency
        discountValue
        savingsAmount
        savingsPercentage
        customerDiscounts {
          name
          amount
          percentage
          reason
        }
      }
    }
  }
`;

interface CustomerDiscount {
  name: string;
  amount: number;
  percentage?: number | null;
  reason: string;
}

interface PricingStep {
  order: number;
  name: string;
  priceBefore: number;
  priceAfter: number;
  impact: number;
  ruleId?: string | null;
  metadata?: Record<string, unknown>;
  timestamp: number;
}

interface RealtimePricingResult {
  isCalculating: boolean;
  progress: number;
  finalPrice?: number;
  savingsAmount?: number;
  savingsPercentage?: number;
  customerDiscounts?: CustomerDiscount[];
  calculationSteps?: PricingStep[];
  totalSteps?: number;
  completedSteps?: number;
  error?: string;
}

export function useRealtimePricing(
  countryId: string | null,
  numOfDays: number,
  enabled: boolean = true
): RealtimePricingResult {
  const [result, setResult] = useState<RealtimePricingResult>({
    isCalculating: false,
    progress: 0,
  });
  const [steps, setSteps] = useState<PricingStep[]>([]);

  const { loading } = useSubscription(
    PRICING_UPDATES_SUBSCRIPTION,
    {
      variables: countryId && numOfDays ? {
        input: {
          countryId,
          numOfDays,
          paymentMethod: 'ISRAELI_CARD', // Default for customers
        }
      } : undefined,
      skip: !enabled || !countryId || !numOfDays,
      onData: ({ data }) => {
        if (data?.data?.pricingCalculationSteps) {
          const update = data.data.pricingCalculationSteps;
          
          // Add new step to the list if it exists
          if (update.step) {
            setSteps(prev => [...prev, update.step]);
          }
          
          setResult({
            isCalculating: !update.isComplete,
            progress: update.totalSteps > 0 
              ? (update.completedSteps / update.totalSteps) * 100 
              : 0,
            finalPrice: update.finalBreakdown?.finalPrice,
            savingsAmount: update.finalBreakdown?.savingsAmount,
            savingsPercentage: update.finalBreakdown?.savingsPercentage,
            customerDiscounts: update.finalBreakdown?.customerDiscounts,
            calculationSteps: steps,
            totalSteps: update.totalSteps,
            completedSteps: update.completedSteps,
            error: undefined,
          });
          
          // Clear steps when calculation is complete
          if (update.isComplete) {
            setTimeout(() => setSteps([]), 1000);
          }
        }
      },
      onError: (err) => {
        setResult(prev => ({
          ...prev,
          isCalculating: false,
          error: err.message,
        }));
      },
    }
  );

  useEffect(() => {
    if (loading) {
      setResult(prev => ({ ...prev, isCalculating: true }));
    }
  }, [loading]);
  
  // Reset steps when starting a new calculation
  useEffect(() => {
    if (!enabled || !countryId || !numOfDays) {
      setSteps([]);
    }
  }, [enabled, countryId, numOfDays]);

  return { ...result, calculationSteps: steps };
}