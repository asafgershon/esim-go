"use client";

import * as React from "react";
import { cn } from "@workspace/ui/lib/utils";

// Main Selector Container
const Selector = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-name="Selector"
    className={cn(
      "w-full mx-auto",
      className
    )}
    {...props}
  />
));
Selector.displayName = "Selector";

// Selector Card with responsive padding and border radius
const SelectorCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, style, ...props }, ref) => (
  <div
    ref={ref}
    data-name="SelectorCard"
    className={cn(
      "bg-white rounded-[20px] md:rounded-[30px] shadow-[0px_4px_28px_-6px_rgba(0,0,0,0.08)] relative",
      "px-5 py-6 md:px-11 md:py-11",
      className
    )}
    style={style}
    {...props}
  />
));
SelectorCard.displayName = "SelectorCard";

// Selector Header with responsive margin
const SelectorHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-name="SelectorHeader"
    className={cn("text-right mb-6 md:mb-10", className)}
    {...props}
  />
));
SelectorHeader.displayName = "SelectorHeader";

// Selector Content with responsive gap
const SelectorContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-name="SelectorContent"
    className={cn("flex flex-col gap-4 md:gap-6", className)}
    {...props}
  />
));
SelectorContent.displayName = "SelectorContent";

// Selector Action (CTA button area)
const SelectorAction = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-name="SelectorAction"
    className={cn("", className)}
    {...props}
  />
));
SelectorAction.displayName = "SelectorAction";

// Selector Section with responsive gap
const SelectorSection = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-name="SelectorSection"
    className={cn("flex flex-col gap-2 md:gap-4", className)}
    {...props}
  />
));
SelectorSection.displayName = "SelectorSection";

// Selector Label with responsive text size
const SelectorLabel = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    data-name="SelectorLabel"
    className={cn("text-[12px] md:text-[20px] text-[#0A232E] text-right", className)}
    {...props}
  />
));
SelectorLabel.displayName = "SelectorLabel";

// Selector Button (Primary CTA)
const SelectorButton = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, ...props }, ref) => (
  <button
    ref={ref}
    data-name="SelectorButton"
    className={cn(
      "w-full h-9 md:h-[66px] bg-[#535FC8] rounded-lg md:rounded-[10px]",
      "border-[0.5px] border-[#0A232E]",
      "shadow-[0px_3px_0px_0px_#2E2E31]",
      "text-[#FEFEFE] text-[12px] md:text-[22px] font-medium",
      "hover:translate-y-[1px] hover:shadow-[0px_2px_0px_0px_#2E2E31]",
      "active:translate-y-[2px] active:shadow-[0px_1px_0px_0px_#2E2E31]",
      "transition-all duration-100",
      "flex items-center justify-center gap-3",
      "cursor-pointer",
      className
    )}
    {...props}
  />
));
SelectorButton.displayName = "SelectorButton";

export {
  Selector,
  SelectorCard,
  SelectorHeader,
  SelectorContent,
  SelectorAction,
  SelectorSection,
  SelectorLabel,
  SelectorButton,
};