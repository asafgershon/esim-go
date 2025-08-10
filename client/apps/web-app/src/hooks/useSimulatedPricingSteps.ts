import { useEffect, useState, useRef } from 'react';

interface SimulatedStep {
  order: number;
  name: string;
  priceBefore: number;
  priceAfter: number;
  impact: number;
  timestamp: number;
}

interface UseSimulatedPricingStepsProps {
  finalPrice: number;
  hasDiscount: boolean;
  discountAmount: number;
  enabled: boolean;
}

// Simulated pricing steps based on typical calculation flow
const generateSteps = (finalPrice: number, hasDiscount: boolean, discountAmount: number): SimulatedStep[] => {
  const steps: SimulatedStep[] = [];
  let currentPrice = 0;
  
  // Base price selection
  const basePrice = hasDiscount ? finalPrice + discountAmount : finalPrice * 0.85;
  steps.push({
    order: 0,
    name: 'Bundle Selection',
    priceBefore: 0,
    priceAfter: basePrice,
    impact: basePrice,
    timestamp: Date.now(),
  });
  currentPrice = basePrice;

  // Markup
  const markupAmount = basePrice * 0.15;
  const priceAfterMarkup = currentPrice + markupAmount;
  steps.push({
    order: 1,
    name: 'Service Fee',
    priceBefore: currentPrice,
    priceAfter: priceAfterMarkup,
    impact: markupAmount,
    timestamp: Date.now() + 100,
  });
  currentPrice = priceAfterMarkup;

  // Discount if applicable
  if (hasDiscount && discountAmount > 0) {
    steps.push({
      order: 2,
      name: 'Multi-Day Discount',
      priceBefore: currentPrice,
      priceAfter: currentPrice - discountAmount,
      impact: -discountAmount,
      timestamp: Date.now() + 200,
    });
    currentPrice = currentPrice - discountAmount;
  }

  // Regional optimization check
  steps.push({
    order: steps.length,
    name: 'Regional Price Check',
    priceBefore: currentPrice,
    priceAfter: currentPrice,
    impact: 0,
    timestamp: Date.now() + 300,
  });

  // Final pricing
  if (Math.abs(currentPrice - finalPrice) > 0.01) {
    steps.push({
      order: steps.length,
      name: 'Final Adjustment',
      priceBefore: currentPrice,
      priceAfter: finalPrice,
      impact: finalPrice - currentPrice,
      timestamp: Date.now() + 400,
    });
  }

  return steps;
};

export function useSimulatedPricingSteps({
  finalPrice,
  hasDiscount,
  discountAmount,
  enabled
}: UseSimulatedPricingStepsProps) {
  const [isCalculating, setIsCalculating] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [steps, setSteps] = useState<SimulatedStep[]>([]);
  const [progress, setProgress] = useState(0);
  const animationRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const hasStartedRef = useRef(false);

  useEffect(() => {
    // Only start animation once per price change
    if (!enabled || finalPrice <= 0 || hasStartedRef.current) {
      return;
    }

    hasStartedRef.current = true;
    setIsCalculating(true);
    setCurrentStepIndex(0);
    setProgress(0);
    
    const generatedSteps = generateSteps(finalPrice, hasDiscount, discountAmount);
    setSteps(generatedSteps);

    let stepIndex = 0;
    const animateSteps = () => {
      if (stepIndex < generatedSteps.length) {
        setCurrentStepIndex(stepIndex);
        setProgress(((stepIndex + 1) / generatedSteps.length) * 100);
        stepIndex++;
        // Slower animation for better visibility (800ms per step)
        animationRef.current = setTimeout(animateSteps, 800);
      } else {
        // Complete - keep showing for a moment
        setProgress(100);
        setTimeout(() => {
          setIsCalculating(false);
          // Reset after completion
          setTimeout(() => {
            hasStartedRef.current = false;
          }, 500);
        }, 1000);
      }
    };

    // Start animation after a small delay
    animationRef.current = setTimeout(animateSteps, 100);

    return () => {
      if (animationRef.current) {
        clearTimeout(animationRef.current);
      }
    };
  }, [finalPrice, hasDiscount, discountAmount, enabled]);

  // Reset when parameters change
  useEffect(() => {
    hasStartedRef.current = false;
  }, [finalPrice, hasDiscount, discountAmount]);

  return {
    isCalculating,
    progress,
    steps: steps.slice(0, currentStepIndex + 1),
    totalSteps: steps.length,
    completedSteps: currentStepIndex + 1,
  };
}