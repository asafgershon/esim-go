import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-dark-brand focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90 focus-visible:border-ring aria-invalid:border-destructive rounded-md text-sm",
        destructive:
          "bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20 focus-visible:border-ring dark:focus-visible:ring-destructive/40 dark:bg-destructive/60 aria-invalid:border-destructive rounded-md text-sm",
        outline:
          "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 focus-visible:border-ring aria-invalid:border-destructive rounded-md text-sm",
        secondary:
          "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80 rounded-md text-sm",
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50 rounded-md text-sm",
        link: "text-primary underline-offset-4 hover:underline text-sm",
        "brand-secondary":
          "bg-white-brand text-dark-brand border border-dark-brand rounded-[10px] text-[22px] px-5 py-5 hover:bg-light-blue-brand",
        "brand-primary":
          "bg-purple-brand text-white-brand border border-dark-brand rounded-[10px] text-[22px] px-5 py-5 hover:bg-purple-brand/90",
        "brand-success":
          "bg-green-brand text-dark-brand border border-dark-brand rounded-[10px] text-[22px] px-5 py-5 hover:bg-green-brand/90",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5 text-sm",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-8",
        brand: "px-5 py-4", // Special size for brand variants
      },
      emphasized: {
        true: "",
        false: "",
      },
    },
    compoundVariants: [
      // Brand variants with emphasized state get shadow
      {
        variant: "brand-secondary",
        emphasized: true,
        class: "shadow-[1px_2px_0px_0px_#0a232e] hover:shadow-[2px_2px_0px_0px_#0a232e] active:shadow-[1px_1px_0px_0px_#0a232e]",
      },
      {
        variant: "brand-primary",
        emphasized: true,
        class: "shadow-[1px_2px_0px_0px_#0a232e] hover:shadow-[2px_2px_0px_0px_#0a232e] active:shadow-[1px_1px_0px_0px_#0a232e]",
      },
      {
        variant: "brand-success",
        emphasized: true,
        class: "shadow-[1px_2px_0px_0px_#0a232e] hover:shadow-[2px_2px_0px_0px_#0a232e] active:shadow-[1px_1px_0px_0px_#0a232e]",
      },
    ],
    defaultVariants: {
      variant: "default",
      size: "default",
      emphasized: false,
    },
  }
);

function Button({
  className,
  variant,
  size,
  emphasized = false,
  asChild = false,
  style,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    emphasized?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, emphasized, className }))}
      style={style}
      {...props}
    />
  );
}

export { Button, buttonVariants };
