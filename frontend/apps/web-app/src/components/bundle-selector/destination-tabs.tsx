"use client";

import { useState, useEffect, useRef } from "react";
import { cn } from "@workspace/ui";

interface DestinationTabsProps {
  activeTab: "countries" | "trips";
  onTabChange: (tab: "countries" | "trips") => void;
  className?: string;
}

export function DestinationTabs({ activeTab, onTabChange, className }: DestinationTabsProps) {
  const [sliderPosition, setSliderPosition] = useState<"left" | "right">(
    activeTab === "countries" ? "right" : "left"  // Reversed for RTL
  );
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSliderPosition(activeTab === "countries" ? "right" : "left");  // Reversed for RTL
  }, [activeTab]);

  return (
    <div 
      ref={containerRef}
      className={cn("relative bg-[#F1F5FA] rounded-[10px] md:rounded-2xl p-[2px] md:p-1", className)}
      dir="rtl"
    >
      {/* Sliding background indicator */}
      <div
        className={cn(
          "absolute inset-[2px] md:inset-1 w-[calc(50%-2px)] md:w-[calc(50%-4px)]",
          "h-[34px] md:h-[60px] bg-brand-dark rounded-lg md:rounded-xl",
          "transition-transform duration-300 ease-in-out",
          "will-change-transform"
        )}
        style={{
          transform: sliderPosition === "right" 
            ? "translateX(0)" 
            : "translateX(calc(-100% - 0px))",  // Negative for RTL
        }}
        aria-hidden="true"
      />

      {/* Tab buttons */}
      <div className="relative flex" role="tablist" aria-label="בחירת סוג יעד">
        <button
          onClick={() => onTabChange("countries")}
          role="tab"
          aria-selected={activeTab === "countries"}
          aria-controls="countries-panel"
          id="countries-tab"
          className={cn(
            "relative flex-1 h-[34px] md:h-[60px] text-[12px] md:text-[18px]",
            "leading-[26px] md:leading-normal font-medium",
            "rounded-lg md:rounded-xl transition-colors duration-300",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-purple focus-visible:ring-offset-2",
            "z-10", // Ensure buttons are above the sliding background
            activeTab === "countries"
              ? "text-brand-white"
              : "text-brand-dark hover:text-brand-dark/80"
          )}
        >
          מדינות
        </button>
        <button
          onClick={() => onTabChange("trips")}
          role="tab"
          aria-selected={activeTab === "trips"}
          aria-controls="trips-panel"
          id="trips-tab"
          className={cn(
            "relative flex-1 h-[34px] md:h-[60px] text-[12px] md:text-[18px]",
            "leading-[26px] md:leading-normal font-medium",
            "rounded-lg md:rounded-xl transition-colors duration-300",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-purple focus-visible:ring-offset-2",
            "z-10", // Ensure buttons are above the sliding background
            activeTab === "trips"
              ? "text-brand-white"
              : "text-brand-dark hover:text-brand-dark/80"
          )}
        >
          טיולים
        </button>
      </div>
    </div>
  );
}