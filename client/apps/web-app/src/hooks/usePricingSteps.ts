import { useEffect, useState, useRef } from "react";

interface PricingStep {
  order: number;
  name: string;
  priceBefore: number;
  priceAfter: number;
  impact: number;
  ruleId?: string | null;
  metadata?: Record<string, unknown> | null;
  timestamp?: number | null;
}

// Default steps to show when forcing animation
const DEFAULT_PRICING_STEPS: PricingStep[] = [
  {
    order: 0,
    name: "Bundle Selection",
    priceBefore: 0,
    priceAfter: 0,
    impact: 0,
    ruleId: null,
    metadata: null,
    timestamp: null,
  },
  {
    order: 1,
    name: "Regional Price Check",
    priceBefore: 0,
    priceAfter: 0,
    impact: 0,
    ruleId: null,
    metadata: null,
    timestamp: null,
  },
  {
    order: 2,
    name: "Discount Calculation",
    priceBefore: 0,
    priceAfter: 0,
    impact: 0,
    ruleId: null,
    metadata: null,
    timestamp: null,
  },
  {
    order: 3,
    name: "Final Price",
    priceBefore: 0,
    priceAfter: 0,
    impact: 0,
    ruleId: null,
    metadata: null,
    timestamp: null,
  },
];

interface UsePricingStepsProps {
  pricingSteps?: PricingStep[] | null;
  enabled: boolean;
  animationSpeed?: number; // milliseconds per step
  forceAnimation?: boolean; // Force animation even without real steps
  key?: number; // Key to force re-animation
}

export function usePricingSteps({
  pricingSteps,
  enabled,
  animationSpeed = 800, // Default 800ms per step for good visibility
  forceAnimation = false,
  key = 0,
}: UsePricingStepsProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [displayedSteps, setDisplayedSteps] = useState<PricingStep[]>([]);
  const [progress, setProgress] = useState(0);
  const animationRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const previousStepsRef = useRef<PricingStep[] | null | undefined>(undefined);

  useEffect(() => {
    // Exit if not enabled
    if (!enabled) {
      setIsAnimating(false);
      setDisplayedSteps([]);
      setCurrentStepIndex(0);
      setProgress(0);
      previousStepsRef.current = undefined;
      return;
    }

    // Use default steps if forcing animation without real steps
    const stepsToAnimate = (forceAnimation && (!pricingSteps || pricingSteps.length === 0))
      ? DEFAULT_PRICING_STEPS
      : pricingSteps;

    // Exit if no steps to animate
    if (!stepsToAnimate || stepsToAnimate.length === 0) {
      setIsAnimating(false);
      setDisplayedSteps([]);
      setCurrentStepIndex(0);
      setProgress(0);
      previousStepsRef.current = undefined;
      return;
    }

    // Always animate when we get new steps (destination change) or forcing
    previousStepsRef.current = stepsToAnimate;

    // Start animation for new steps
    setIsAnimating(true);
    setCurrentStepIndex(0);
    setDisplayedSteps([]);
    setProgress(0);

    let stepIndex = 0;
    const sortedSteps = [...stepsToAnimate].sort((a, b) => a.order - b.order);

    const animateSteps = () => {
      if (stepIndex < sortedSteps.length) {
        // Show steps progressively
        setCurrentStepIndex(stepIndex);
        setDisplayedSteps(sortedSteps.slice(0, stepIndex + 1));
        setProgress(((stepIndex + 1) / sortedSteps.length) * 100);
        stepIndex++;
        animationRef.current = setTimeout(animateSteps, animationSpeed);
      } else {
        // Animation complete
        setProgress(100);
        setTimeout(() => {
          setIsAnimating(false);
        }, 1000); // Keep showing for 1 second after completion
      }
    };

    // Start animation after a small delay
    animationRef.current = setTimeout(animateSteps, 100);

    return () => {
      if (animationRef.current) {
        clearTimeout(animationRef.current);
      }
    };
  }, [pricingSteps, enabled, animationSpeed, forceAnimation, key]);

  // Use the appropriate total steps count
  const actualSteps = (forceAnimation && (!pricingSteps || pricingSteps.length === 0))
    ? DEFAULT_PRICING_STEPS
    : pricingSteps;

  return {
    isAnimating,
    progress,
    steps: displayedSteps,
    totalSteps: actualSteps?.length || 0,
    completedSteps: currentStepIndex + 1,
    currentStep: displayedSteps[currentStepIndex],
  };
}