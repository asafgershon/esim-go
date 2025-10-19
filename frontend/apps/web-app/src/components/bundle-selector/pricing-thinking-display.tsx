"use client";
import { useEffect, useState } from "react";

interface PricingThinkingDisplayProps {
  countryName: string;
  numOfDays: number;
  onAnimationDone?: () => void;
  isCalculating?: boolean;
  progress?: number;
}

const steps = [
  "בודקים את היעד שלך ✈️",
  "משווים בין ספקים 📶",
  "מחשבים את המחיר המשתלם 💰",
  "מוסיפים הנחה מיוחדת 🎁",
  "כמעט סיימנו... ⏳",
];

export function PricingThinkingDisplay({
  countryName,
  numOfDays,
  onAnimationDone,
}: PricingThinkingDisplayProps) {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    // מציג כל שלב למשך 1.2 שניות
    if (currentStep < steps.length) {
      const timer = setTimeout(() => {
        setCurrentStep((prev) => prev + 1);
      }, 1200);
      return () => clearTimeout(timer);
    } else {
      // אחרי שכל השלבים הסתיימו
      const doneTimer = setTimeout(() => {
        onAnimationDone?.();
      }, 600);
      return () => clearTimeout(doneTimer);
    }
  }, [currentStep, onAnimationDone]);

  if (currentStep >= steps.length) return null;

  return (
    <div className="flex flex-col items-center justify-center text-center py-8">
      <div className="text-xl md:text-2xl font-medium text-brand-dark animate-pulse">
        {steps[currentStep]}
      </div>
      <div className="mt-2 text-sm md:text-base text-brand-dark/60">
        {countryName} • {numOfDays} ימים
      </div>
    </div>
  );
}
