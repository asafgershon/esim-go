import * as React from "react"
import { cn } from "../lib/utils"
import { Input, type InputProps } from "./input"

export interface InputWithAdornmentProps extends InputProps {
  leftAdornment?: React.ReactNode
  rightAdornment?: React.ReactNode
  containerClassName?: string
}

const InputWithAdornment = React.forwardRef<HTMLInputElement, InputWithAdornmentProps>(
  ({ className, leftAdornment, rightAdornment, containerClassName, ...props }, ref) => {
    return (
      <div 
        className={cn(
          "relative flex items-center rounded-md border border-input focus-within:ring-1 focus-within:ring-ring",
          containerClassName
        )}
      >
        {leftAdornment && (
          <div className="flex items-center pl-3 pr-2">
            <span className="text-sm text-muted-foreground select-none">
              {leftAdornment}
            </span>
          </div>
        )}
        <Input
          className={cn(
            "border-0 focus-visible:ring-0 shadow-none h-8 text-sm",
            leftAdornment && "pl-0",
            rightAdornment && "pr-0",
            className
          )}
          ref={ref}
          {...props}
        />
        {rightAdornment && (
          <div className="flex items-center pl-2 pr-3">
            <span className="text-sm text-muted-foreground select-none">
              {rightAdornment}
            </span>
          </div>
        )}
      </div>
    )
  }
)
InputWithAdornment.displayName = "InputWithAdornment"

export { InputWithAdornment }