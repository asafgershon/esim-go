import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../lib/utils";

const iconButtonVariants = cva(
  "inline-flex items-center justify-center transition-all disabled:pointer-events-none disabled:opacity-50 outline-none focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90 focus-visible:border-ring aria-invalid:border-destructive",
        destructive:
          "bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20 focus-visible:border-ring dark:focus-visible:ring-destructive/40 dark:bg-destructive/60 aria-invalid:border-destructive",
        outline:
          "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 focus-visible:border-ring aria-invalid:border-destructive",
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        "brand-primary":
          "bg-[#00E095] text-[#0A232E] font-medium rounded-[5px] " +
          "outline outline-1 outline-[#0A232E] " +
          "flex items-center justify-center " +
          "cursor-pointer transition-all duration-150 " +
          "hover:translate-y-[-1px] " +
          "active:translate-y-[1px]",
      },
      size: {
        default: "h-9 w-9", // 36px - matches Button default
        sm: "h-6 w-6 rounded-md", // 24px - matches Button sm with border radius
        lg: "h-10 w-10 rounded-md", // 40px - matches Button lg
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

function IconButton({
  className,
  variant,
  size,
  asChild = false,
  style,
  children,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof iconButtonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";
  const [isPressed, setIsPressed] = React.useState(false);
  const [isHovered, setIsHovered] = React.useState(false);

  // Add inline shadow and background for brand-primary variant
  const getBoxShadow = () => {
    if (variant !== "brand-primary") return undefined;
    if (isPressed) return "0 1px 0 #0A232E";
    if (isHovered) return "2px 4px 0 #0A232E";
    return "2px 3px 0 #0A232E";
  };

  const inlineStyle =
    variant === "brand-primary"
      ? {
          ...style,
          boxShadow: getBoxShadow(),
          backgroundColor: "#00E095",
          cursor: "pointer",
          transition: "all 150ms",
        }
      : style;

  const handleMouseDown = () => {
    if (variant === "brand-primary") {
      setIsPressed(true);
    }
  };

  const handleMouseUp = () => {
    if (variant === "brand-primary") {
      setIsPressed(false);
    }
  };

  const handleMouseLeave = () => {
    if (variant === "brand-primary") {
      setIsPressed(false);
      setIsHovered(false);
    }
  };

  const handleMouseEnter = () => {
    if (variant === "brand-primary") {
      setIsHovered(true);
    }
  };

  return (
    <Comp
      data-slot="icon-button"
      className={cn(iconButtonVariants({ variant, size, className }))}
      style={inlineStyle}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={handleMouseEnter}
      {...props}
    >
      {children}
    </Comp>
  );
}

export { IconButton, iconButtonVariants };
