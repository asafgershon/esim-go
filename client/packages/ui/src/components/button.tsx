import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90 focus-visible:border-ring aria-invalid:border-destructive",
        destructive:
          "bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20 focus-visible:border-ring dark:focus-visible:ring-destructive/40 dark:bg-destructive/60 aria-invalid:border-destructive",
        outline:
          "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 focus-visible:border-ring aria-invalid:border-destructive",
        secondary:
          "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80",
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline",
        "primary-brand": 
          "bg-brand-light-blue text-brand-dark font-semibold rounded-[5px] relative " +
          "ring-1 ring-inset ring-brand-dark " +
          "shadow-[1px_2px_0px_rgba(10,35,46,0.15)] " +
          "hover:shadow-[1px_3px_2px_rgba(10,35,46,0.2)] hover:translate-y-[-1px] " +
          "active:shadow-[0px_1px_0px_rgba(10,35,46,0.15)] active:translate-y-[1px] " +
          "focus-visible:ring-2 focus-visible:ring-brand-dark/30 focus-visible:outline-none " +
          "disabled:bg-gray-200 disabled:text-gray-400 disabled:ring-gray-300 disabled:shadow-none disabled:translate-y-0 " +
          "transition-all duration-150",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
