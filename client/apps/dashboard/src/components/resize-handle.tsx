import React from "react";
import { PanelResizeHandle } from "react-resizable-panels";
import { cn } from "@workspace/ui/lib/utils";

interface ResizeHandleProps {
  className?: string;
  orientation?: "horizontal" | "vertical";
}

export function ResizeHandle({ 
  className, 
  orientation = "horizontal" 
}: ResizeHandleProps) {
  return (
    <PanelResizeHandle
      className={cn(
        "group relative flex items-center justify-center",
        orientation === "horizontal" ? "w-5 cursor-col-resize" : "h-5 cursor-row-resize",
        className
      )}
    >
      {/* Invisible hit area for better grabbing */}
      <div 
        className={cn(
          "absolute",
          orientation === "horizontal" 
            ? "inset-y-0 -inset-x-2" 
            : "inset-x-0 -inset-y-2"
        )}
      />
      
      {/* Visual line - 75% height/width for more subtle appearance */}
      <div 
        className={cn(
          "relative bg-gray-200/50 transition-all duration-200",
          "group-hover:bg-gray-300 group-active:bg-gray-400",
          orientation === "horizontal" 
            ? "h-3/4 w-px" 
            : "w-3/4 h-px"
        )}
      />
      
      {/* Center pill/grabber indicator */}
      <div 
        className={cn(
          "absolute bg-gray-300/60 rounded-full transition-all duration-200",
          "group-hover:bg-gray-400/80 group-active:bg-gray-500",
          orientation === "horizontal" 
            ? "w-1 h-8" 
            : "w-8 h-1"
        )}
      />
    </PanelResizeHandle>
  );
}