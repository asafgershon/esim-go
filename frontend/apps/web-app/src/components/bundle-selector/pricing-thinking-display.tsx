"use client";

import React, { useState, useEffect } from "react";
import { Sparkles } from "lucide-react";
import { TypeAnimation } from "react-type-animation";
import { useBundleStats } from "@/hooks/useBundleStats";
import { useTypingSequence } from "@/hooks/useTypingSequence";
import { cn } from "@workspace/ui";

interface PricingThinkingDisplayProps {
  isCalculating: boolean;
  progress: number;
  countryName?: string;
  numOfDays?: number;
  onAnimationDone?: () => void;
}

export function PricingThinkingDisplay({
  isCalculating,
  progress,
  countryName,
  numOfDays,
  onAnimationDone,
}: PricingThinkingDisplayProps) {
  const { totalBundles } = useBundleStats();
  const [showCursor, setShowCursor] = useState(true);
  const [animationKey, setAnimationKey] = useState(0);
  const [isMounted, setIsMounted] = useState(false);

  // Only generate sequence after mount to avoid SSR issues
  const { sequence, phase, resetPhase } = useTypingSequence({
    countryName,
    numOfDays,
    totalBundles,
    isCalculating: isCalculating && isMounted, // Only activate after mount
  });

  // Track when component mounts
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Force re-animation when destination changes
  useEffect(() => {
    if (isCalculating && countryName && isMounted) {
      setAnimationKey((prev) => prev + 1);
      setShowCursor(true);
    } else if (!isCalculating) {
      resetPhase();
      setShowCursor(false);
    }
  }, [isCalculating, countryName, isMounted, resetPhase]);

  // Handle animation completion
  useEffect(() => {
    if (phase === "complete") {
      // Keep cursor for a moment then hide
      const cursorTimer = setTimeout(() => {
        setShowCursor(false);
      }, 500);

      // Call the callback after showing the final message briefly
      if (onAnimationDone) {
        const callbackTimer = setTimeout(() => {
          onAnimationDone();
        }, 1500); // Give time to read the final message

        return () => {
          clearTimeout(cursorTimer);
          clearTimeout(callbackTimer);
        };
      }

      return () => clearTimeout(cursorTimer);
    }
  }, [phase, onAnimationDone]);

  // Don't render until mounted and we have a sequence
  if (!isMounted || !isCalculating || sequence.length === 0) {
    return null;
  }

  return (
    <div className="relative">
      {/* Main thinking container */}
      <div className="bg-gradient-to-br from-brand-purple/5 to-brand-purple/10 backdrop-blur-sm rounded-2xl p-5 shadow-sm border border-brand-purple/10">
        {/* Header with pulsing indicator */}
        <div className="flex items-center gap-2 mb-3">
          {phase === "idle" ? (
            <Sparkles className="h-4 w-4 text-brand-purple opacity-75" />
          ) : (
            <span className="inline-flex gap-1 ml-1">
              <span
                className={cn(
                  "inline-block w-1 h-1 bg-brand-purple rounded-full animate-bounce",
                  phase === "typing" && "animate-bounce"
                )}
                style={{ animationDelay: "0ms" }}
              />
              <span
                className={cn(
                  "inline-block w-1 h-1 bg-brand-purple rounded-full animate-bounce",
                  phase === "typing" && "animate-bounce"
                )}
                style={{ animationDelay: "150ms" }}
              />
              <span
                className={cn(
                  "inline-block w-1 h-1 bg-brand-purple rounded-full animate-bounce",
                  phase === "typing" && "animate-bounce"
                )}
                style={{ animationDelay: "300ms" }}
              />
            </span>
          )}
          <span className="text-sm font-medium text-brand-dark">
            {/* Loading dots for ongoing calculation after typing completes */}

            <TypeAnimation
              key={animationKey}
              sequence={sequence}
              wrapper="div"
              cursor={showCursor}
              speed={50}
              style={{
                whiteSpace: "pre-line",
                display: "block",
              }}
              className="text-sm text-brand-dark font-medium leading-relaxed"
              omitDeletionAnimation={true}
            />
          </span>
        </div>

        {/* Subtle progress indicator at bottom */}
        <div className="mt-4 h-0.5 bg-brand-purple/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-brand-purple/50 to-brand-purple transition-all duration-700 ease-out"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      </div>

      {/* Custom styles for the typing cursor */}
      <style jsx global>{`
        .TypeAnimation__cursor {
          color: rgb(147, 51, 234);
          animation: blink 1s infinite;
        }

        @keyframes blink {
          0%,
          50% {
            opacity: 1;
          }
          51%,
          100% {
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
