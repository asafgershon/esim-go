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

interface UsePricingStepsProps {
  pricingSteps?: PricingStep[] | null;
  enabled: boolean;
  animationSpeed?: number; // milliseconds per step
}

export function usePricingSteps({
  pricingSteps,
  enabled,
  animationSpeed = 800, // Default 800ms per step for good visibility
}: UsePricingStepsProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [displayedSteps, setDisplayedSteps] = useState<PricingStep[]>([]);
  const [progress, setProgress] = useState(0);
  const animationRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const previousStepsRef = useRef<PricingStep[] | null | undefined>(undefined);

  useEffect(() => {
    // Only animate if enabled, we have steps, and they're different from before
    if (!enabled || !pricingSteps || pricingSteps.length === 0) {
      setIsAnimating(false);
      setDisplayedSteps([]);
      setCurrentStepIndex(0);
      setProgress(0);
      previousStepsRef.current = undefined;
      return;
    }

    // Always animate when we get new steps (destination change)
    previousStepsRef.current = pricingSteps;

    // Start animation for new steps
    setIsAnimating(true);
    setCurrentStepIndex(0);
    setDisplayedSteps([]);
    setProgress(0);

    let stepIndex = 0;
    const sortedSteps = [...pricingSteps].sort((a, b) => a.order - b.order);

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
  }, [pricingSteps, enabled, animationSpeed]);

  return {
    isAnimating,
    progress,
    steps: displayedSteps,
    totalSteps: pricingSteps?.length || 0,
    completedSteps: currentStepIndex + 1,
    currentStep: displayedSteps[currentStepIndex],
  };
}