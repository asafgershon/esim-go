import * as React from "react"
import { OverlayScrollbarsComponent } from "overlayscrollbars-react"
import { cn } from "../lib/utils"
import "overlayscrollbars/overlayscrollbars.css"

interface ScrollAreaProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Whether to show scrollbars only on hover/scroll */
  showOnHover?: boolean
  /** Custom scrollbar styling */
  scrollbarTheme?: "light" | "dark" | "auto"
  /** Maximum height for the scroll area */
  maxHeight?: string | number
  /** Whether to enable horizontal scrolling */
  horizontal?: boolean
}

const ScrollArea = React.forwardRef<
  HTMLDivElement,
  ScrollAreaProps
>(({
  className,
  children,
  showOnHover = true,
  scrollbarTheme = "auto",
  maxHeight,
  horizontal = false,
  ...props
}, ref) => {
  const options = React.useMemo(() => ({
    scrollbars: {
      visibility: showOnHover ? "auto" as const : "visible" as const,
      autoHide: showOnHover ? "move" as const : "never" as const,
      autoHideDelay: 1000,
      theme: scrollbarTheme === "dark" ? "os-theme-dark" : scrollbarTheme === "light" ? "os-theme-light" : undefined,
    },
    overflow: {
      x: horizontal ? "scroll" as const : "hidden" as const,
      y: "scroll" as const,
    },
  }), [showOnHover, scrollbarTheme, horizontal])

  return (
    <OverlayScrollbarsComponent
      options={options}
      className={cn("h-full w-full", className)}
      style={maxHeight ? { maxHeight } : undefined}
      defer
      {...props}
    >
      <div ref={ref}>
        {children}
      </div>
    </OverlayScrollbarsComponent>
  )
})

ScrollArea.displayName = "ScrollArea"

export { ScrollArea }