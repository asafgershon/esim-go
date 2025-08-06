"use client";

import * as React from "react";
import { cn } from "../lib/utils";
import { useIsMobile } from "../hooks/useIsMobile";
import { Button } from "./button";

// Main Selector Container
const Selector = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-name="Selector"
    className={cn("w-full mx-auto", className)}
    {...props}
  />
));
Selector.displayName = "Selector";

// Selector Card with consistent padding and responsive border radius
const SelectorCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, style, ...props }, ref) => {
  const isMobile = useIsMobile();

  return (
    <div
      ref={ref}
      data-name="SelectorCard"
      className={cn(
        "bg-white shadow-[0px_4px_28px_-6px_rgba(0,0,0,0.08)] relative",
        isMobile ? "rounded-[20px]" : "rounded-[30px]",
        className
      )}
      style={{
        paddingTop: isMobile ? "20px" : "24px",
        paddingBottom: isMobile ? "20px" : "24px",
        paddingLeft: isMobile ? "16px" : "20px",
        paddingRight: isMobile ? "16px" : "20px",
        ...style,
      }}
      {...props}
    />
  );
});
SelectorCard.displayName = "SelectorCard";

// Selector Header with responsive margin
const SelectorHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const isMobile = useIsMobile();

  return (
    <div
      ref={ref}
      data-name="SelectorHeader"
      className={cn("text-right", isMobile ? "mb-6" : "mb-10", className)}
      {...props}
    />
  );
});
SelectorHeader.displayName = "SelectorHeader";

// Selector Content with responsive gap
const SelectorContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const isMobile = useIsMobile();

  return (
    <div
      ref={ref}
      data-name="SelectorContent"
      className={cn("flex flex-col", isMobile ? "gap-4" : "gap-6", className)}
      {...props}
    />
  );
});
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
>(({ className, ...props }, ref) => {
  const isMobile = useIsMobile();

  return (
    <div
      ref={ref}
      data-name="SelectorSection"
      className={cn("flex flex-col", isMobile ? "gap-2" : "gap-4", className)}
      {...props}
    />
  );
});
SelectorSection.displayName = "SelectorSection";

// Selector Label with responsive text size
const SelectorLabel = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
  const isMobile = useIsMobile();

  return (
    <p
      ref={ref}
      data-name="SelectorLabel"
      className={cn(
        isMobile ? "text-[12px]" : "text-[20px]",
        "text-[#0A232E] text-right",
        className
      )}
      {...props}
    />
  );
});
SelectorLabel.displayName = "SelectorLabel";

// Selector Button (Primary CTA) - extends base Button with selector-specific styling
const SelectorButton = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<typeof Button> & {
    style?: React.CSSProperties;
  }
>(({ className, style, variant, size, onMouseEnter, onMouseLeave, onMouseDown, onMouseUp, ...props }, ref) => {
  const isMobile = useIsMobile();

  return (
    <Button
      ref={ref}
      data-name="SelectorButton"
      variant={variant} // Allow variant to be overridden
      size={size} // Allow size to be overridden
      className={cn(
        "w-full rounded-lg",
        isMobile ? "h-9" : "h-[66px]",
        "bg-[#535FC8] hover:bg-[#535FC8]/90",
        "border border-[#0A232E]",
        isMobile ? "text-[12px]" : "text-[22px]",
        "text-white font-medium",
        "hover:translate-y-[1px]",
        "active:translate-y-[2px]",
        "transition-all duration-100",
        "flex items-center justify-center gap-3",
        "cursor-pointer",
        className
      )}
      style={{
        boxShadow: "2px 3px 0px 0px #0A232E",
        ...style,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = "2px 2px 0px 0px #0A232E";
        onMouseEnter?.(e);
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "2px 3px 0px 0px #0A232E";
        onMouseLeave?.(e);
      }}
      onMouseDown={(e) => {
        e.currentTarget.style.boxShadow = "1px 1px 0px 0px #0A232E";
        onMouseDown?.(e);
      }}
      onMouseUp={(e) => {
        e.currentTarget.style.boxShadow = "2px 2px 0px 0px #0A232E";
        onMouseUp?.(e);
      }}
      {...props}
    />
  );
});
SelectorButton.displayName = "SelectorButton";

// Country/Region Selector with flags and search
interface Country {
  id: string;
  name: string;
  iso: string;
  flag: string;
  keywords?: string[];
}

interface CountrySelectorProps {
  countries: Country[];
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

// Export types for external usage
export type { Country, CountrySelectorProps };

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
