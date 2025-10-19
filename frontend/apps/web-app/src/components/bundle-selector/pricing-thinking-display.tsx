"use client";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

interface PricingThinkingDisplayProps {
  countryName: string;
  numOfDays: number;
  onAnimationDone?: () => void;
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
  const [progress, setProgress] = useState(0);

  // מעבר בין שלבים
  useEffect(() => {
    if (currentStep < steps.length) {
      const timer = setTimeout(() => {
        setCurrentStep((prev) => prev + 1);
      }, 1200);
      return () => clearTimeout(timer);
    } else {
      // אחרי שהסתיימו כל השלבים
      const doneTimer = setTimeout(() => {
        onAnimationDone?.();
      }, 800);
      return () => clearTimeout(doneTimer);
    }
  }, [currentStep, onAnimationDone]);

  // אנימציית progress bar
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 100 / (steps.length * 2);
      });
    }, 300);
    return () => clearInterval(interval);
  }, []);

  if (currentStep >= steps.length) return null;

  return (
    <div className="flex flex-col items-center justify-center text-center py-8">
      {/* Loader עגול */}
      <div className="flex items-center justify-center w-12 h-12 mb-3 rounded-full bg-brand-purple/10">
        <Loader2 className="h-6 w-6 text-brand-purple animate-spin" />
      </div>

      {/* טקסט של שלב */}
      <div className="text-lg md:text-2xl font-medium text-brand-dark animate-pulse mb-2">
        {steps[currentStep]}
      </div>

      {/* מידע נוסף */}
      <div className="text-sm md:text-base text-brand-dark/60 mb-4">
        {countryName} • {numOfDays} ימים
      </div>

      {/* Progress bar */}
      <div className="w-48 h-[6px] bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-brand-purple transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
