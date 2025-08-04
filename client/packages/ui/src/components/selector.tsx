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
    className={cn(
      "w-full max-w-[853px] mx-auto font-birzia",
      className
    )}
    {...props}
  />
));
Selector.displayName = "Selector";

// Selector Card
const SelectorCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "bg-white rounded-[30px] shadow-[0px_4px_28px_-6px_rgba(0,0,0,0.08)] py-6 px-5 relative",
      className
    )}
    {...props}
  />
));
SelectorCard.displayName = "SelectorCard";

// Selector Header (replaceable)
const SelectorHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-center mb-10", className)}
    {...props}
  />
));
SelectorHeader.displayName = "SelectorHeader";

// Selector Content (replaceable)
const SelectorContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col gap-6", className)}
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
    className={cn("mt-10", className)}
    {...props}
  />
));
SelectorAction.displayName = "SelectorAction";

// Selector Section (for grouping related content)
const SelectorSection = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col gap-4", className)}
    {...props}
  />
));
SelectorSection.displayName = "SelectorSection";

// Selector Label
const SelectorLabel = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-[14px] text-[#0A232E] text-right", className)}
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
    className={cn(
      "w-full h-[66px] bg-brand-purple rounded-[10px]",
      "border-[0.5px] border-brand-dark",
      "shadow-[0px_3px_0px_0px_#2e2e31]",
      "text-brand-white text-[22px] font-medium",
      "hover:bg-opacity-90 hover:translate-y-[1px] hover:shadow-[0px_2px_0px_0px_#2e2e31]",
      "transition-all duration-200",
      "flex items-center justify-center",
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