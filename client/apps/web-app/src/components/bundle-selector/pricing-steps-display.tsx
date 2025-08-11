"use client";

import React, { useEffect, useState } from "react";
import { CheckCircle2, Loader2, Search, Gift, Globe, DollarSign, Zap } from "lucide-react";
import { useBundleStats } from "@/hooks/useBundleStats";

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

interface PricingStepsDisplayProps {
  steps: PricingStep[];
  isCalculating: boolean;
  progress: number;
  totalSteps: number;
  completedSteps: number;
}

// Map technical step names to friendly Hebrew messages
const stepToFriendlyMessage = (step: PricingStep): { message: string; icon: React.ComponentType<{ className?: string }> } => {
  const stepName = step.name.toLowerCase();
  
  if (stepName.includes('bundle selection') || stepName.includes('base price')) {
    return {
      message: "מחפשים את החבילה הטובה ביותר עבורך...",
      icon: Search,
    };
  }
  
  if (stepName.includes('markup')) {
    return {
      message: "בודקים זמינות ומחירים עדכניים...",
      icon: Globe,
    };
  }
  
  if (stepName.includes('discount') || stepName.includes('multi-day')) {
    return {
      message: "מחפשים הנחות זמינות עבור החבילה הזו...",
      icon: Gift,
    };
  }
  
  if (stepName.includes('processing') || stepName.includes('fee')) {
    return {
      message: "מחשבים את המחיר הסופי...",
      icon: DollarSign,
    };
  }
  
  if (stepName.includes('profit') || stepName.includes('constraint')) {
    return {
      message: "בודקים אם יש חבילה אזורית זולה יותר...",
      icon: Globe,
    };
  }
  
  if (stepName.includes('rounding') || stepName.includes('psychological')) {
    return {
      message: "מעדכנים את המחיר הסופי שלך...",
      icon: Zap,
    };
  }
  
  return {
    message: "מעבדים את הבקשה...",
    icon: Loader2,
  };
};

// Predefined messages to show in sequence
const defaultMessages: Array<{ message: string; icon: React.ComponentType<{ className?: string }> }> = [
  { message: "מחפשים את החבילה הטובה ביותר עבורך...", icon: Search },
  { message: "בודקים זמינות ומחירים עדכניים...", icon: Globe },
  { message: "מחפשים הנחות זמינות...", icon: Gift },
  { message: "בודקים חבילות אזוריות...", icon: Globe },
  { message: "מחשבים את המחיר הסופי...", icon: DollarSign },
];

export function PricingStepsDisplay({
  steps,
  isCalculating,
  progress,
  completedSteps,
}: PricingStepsDisplayProps) {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [displayedSteps, setDisplayedSteps] = useState<Array<{ message: string; icon: React.ComponentType<{ className?: string }>; completed: boolean }>>([]);
  const { totalBundles } = useBundleStats();
  
  useEffect(() => {
    if (!isCalculating) {
      setCurrentMessageIndex(0);
      setDisplayedSteps([]);
      return;
    }
    
    // If we have real steps, use them
    if (steps && steps.length > 0) {
      const friendlySteps = steps.map((step, index) => {
        const { message, icon } = stepToFriendlyMessage(step);
        return {
          message,
          icon,
          completed: index < completedSteps,
        };
      });
      setDisplayedSteps(friendlySteps);
    } else {
      // Otherwise, show default messages in sequence
      const interval = setInterval(() => {
        setCurrentMessageIndex((prev) => {
          if (prev < defaultMessages.length - 1) {
            return prev + 1;
          }
          return prev;
        });
      }, 1500);
      
      return () => clearInterval(interval);
    }
  }, [steps, isCalculating, completedSteps]);
  
  // Build display list based on current state
  const messagesToShow = displayedSteps.length > 0 
    ? displayedSteps 
    : defaultMessages.slice(0, currentMessageIndex + 1).map((msg, index) => ({
        ...msg,
        completed: index < currentMessageIndex,
      }));
  
  if (!isCalculating && messagesToShow.length === 0) {
    return null;
  }
  
  return (
    <div className="bg-brand-purple/5 rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-medium text-brand-dark">מחשבים את המחיר הטוב ביותר</h4>
        {progress > 0 && (
          <span className="text-xs text-brand-purple">{Math.round(progress)}%</span>
        )}
      </div>
      
      {/* Progress bar */}
      {progress > 0 && (
        <div className="w-full bg-brand-purple/10 rounded-full h-1.5 mb-3">
          <div 
            className="bg-brand-purple h-1.5 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
      
      {/* Steps list */}
      <div className="space-y-2">
        {messagesToShow.map((step, index) => {
          const Icon = step.icon;
          const isCurrentStep = index === messagesToShow.length - 1 && isCalculating;
          const isCompleted = step.completed;
          
          return (
            <div
              key={index}
              className={`flex items-start gap-2 text-xs transition-all duration-300 ${
                isCurrentStep ? 'text-brand-purple' : isCompleted ? 'text-green-600' : 'text-gray-400'
              }`}
            >
              <div className="mt-0.5">
                {isCompleted ? (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                ) : isCurrentStep ? (
                  <Icon className={`h-3.5 w-3.5 ${Icon === Loader2 ? 'animate-spin' : 'animate-pulse'}`} />
                ) : (
                  <div className="h-3.5 w-3.5 rounded-full border border-current" />
                )}
              </div>
              <span className={`${isCurrentStep ? 'font-medium' : ''}`}>
                {step.message}
              </span>
            </div>
          );
        })}
      </div>
      
      {/* Fun fact or tip while calculating */}
      {isCalculating && (
        <div className="mt-3 pt-3 border-t border-brand-purple/10">
          <p className="text-[10px] text-brand-dark/60 italic">
            💡 טיפ: אנחנו בודקים {totalBundles > 0 ? `מעל ${totalBundles}` : 'מאות'} אפשרויות כדי למצוא את המחיר הטוב ביותר!
          </p>
        </div>
      )}
    </div>
  );
}