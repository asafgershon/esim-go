"use client";

import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";

import { cn } from "../lib/utils";

function Slider({
  className,
  defaultValue,
  value,
  min = 0,
  max = 100,
  ...props
}: React.ComponentProps<typeof SliderPrimitive.Root>) {
  const _values = React.useMemo(
    () =>
      Array.isArray(value)
        ? value
        : Array.isArray(defaultValue)
        ? defaultValue
        : [min, max],
    [value, defaultValue, min, max]
  );

  // Determine thumb size class
  const thumbSizeClass = className?.includes("slider-thumb-lg")
    ? "h-12 w-12"
    : "size-4";

  return (
    <SliderPrimitive.Root
      data-slot="slider"
      defaultValue={defaultValue}
      value={value}
      min={min}
      max={max}
      className={cn(
        "relative flex w-full touch-none items-center select-none data-[disabled]:opacity-50 data-[orientation=vertical]:h-full data-[orientation=vertical]:min-h-44 data-[orientation=vertical]:w-auto data-[orientation=vertical]:flex-col",
        className
      )}
      {...props}
    >
      <SliderPrimitive.Track
        data-slot="slider-track"
        className={cn(
          "bg-muted relative grow overflow-hidden rounded-full data-[orientation=horizontal]:h-1.5 data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-1.5"
        )}
      >
        <SliderPrimitive.Range
          data-slot="slider-range"
          className={cn(
            "bg-primary absolute data-[orientation=horizontal]:h-full data-[orientation=vertical]:w-full"
          )}
        />
      </SliderPrimitive.Track>
      {Array.from({ length: _values.length }, (_, index) => (
        <SliderPrimitive.Thumb
          data-slot="slider-thumb"
          key={index}
          className={cn(
            "border-primary bg-background ring-ring/50 block shrink-0 rounded-full border shadow-sm transition-[color,box-shadow] hover:ring-4 focus-visible:ring-4 focus-visible:outline-hidden disabled:pointer-events-none disabled:opacity-50",
            thumbSizeClass
          )}
        />
      ))}
    </SliderPrimitive.Root>
  );
}

function SliderWithValue({
  className,
  value = [7],
  onValueChange,
  min = 7,
  max = 30,
  ...props
}: {
  className?: string;
  value?: number[];
  onValueChange?: (value: number[]) => void;
  min?: number;
  max?: number;
} & Omit<
  React.ComponentProps<typeof SliderPrimitive.Root>,
  "value" | "onValueChange" | "min" | "max"
>) {
  return (
    <SliderPrimitive.Root
      value={value}
      onValueChange={onValueChange}
      min={min}
      max={max}
      step={1}
      onTouchStart={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      onPointerMove={(e) => e.stopPropagation()}
      style={{
        touchAction: "none",
        WebkitTapHighlightColor: "transparent",
      }}
      className={cn(
        "relative flex w-full select-none items-center pointer-events-auto touch-none",
        className
      )}
      {...props}
      >
      <SliderPrimitive.Track className="relative h-4 w-full grow overflow-hidden rounded-full bg-brand-dark/10">
        <SliderPrimitive.Range className="absolute h-full bg-brand-dark" />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb
        className="h-[44px] w-[44px] flex items-center justify-center rounded-full border border-brand-dark bg-brand-white shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green touch-none select-none"
      >        
          <span className="text-[16px] font-bold text-brand-dark">
          {value[0]}
        </span>
      </SliderPrimitive.Thumb>
    </SliderPrimitive.Root>
  );
}

export { Slider, SliderWithValue };
