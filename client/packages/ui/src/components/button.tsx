import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@workspace/ui/lib/utils"
import { Loader2 } from "lucide-react";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline:
          "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export interface SocialSignInButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  rtl?: boolean;
}

export const GoogleSignInButton = React.forwardRef<HTMLButtonElement, SocialSignInButtonProps>(
  ({ loading, disabled, children, className, rtl, ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      className={cn(
        "w-full h-11 border rounded-md flex items-center justify-between px-4 font-medium text-base transition-colors hover:bg-muted/50 disabled:opacity-60 disabled:pointer-events-none",
        rtl ? "flex-row-reverse text-right" : "",
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      <span className={cn("flex-1", rtl ? "text-right" : "text-left")}>{children || "Continue with Google"}</span>
      {loading ? (
        <Loader2 className={cn("h-5 w-5 animate-spin", rtl ? "ml-2" : "mr-2")} />
      ) : (
        <svg className={cn("h-5 w-5", rtl ? "ml-2" : "mr-2")} viewBox="0 0 24 24">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
        </svg>
      )}
    </button>
  )
);
GoogleSignInButton.displayName = "GoogleSignInButton";

export const AppleSignInButton = React.forwardRef<HTMLButtonElement, SocialSignInButtonProps>(
  ({ loading, disabled, children, className, rtl, ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      className={cn(
        "w-full h-11 border rounded-md flex items-center justify-between px-4 font-medium text-base transition-colors hover:bg-muted/50 disabled:opacity-60 disabled:pointer-events-none",
        rtl ? "flex-row-reverse text-right" : "",
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      <span className={cn("flex-1", rtl ? "text-right" : "text-left")}>{children || "Continue with Apple"}</span>
      {loading ? (
        <Loader2 className={cn("h-5 w-5 animate-spin", rtl ? "ml-2" : "mr-2")} />
      ) : (
        <svg className={cn("h-5 w-5", rtl ? "ml-2" : "mr-2")} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701" />
        </svg>
      )}
    </button>
  )
);
AppleSignInButton.displayName = "AppleSignInButton";

export { Button, buttonVariants } 