import React from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip";
import { Globe, MapPin, Package } from "lucide-react";

interface ConfigurationLevelIndicatorProps {
  level?: string;
  size?: "xs" | "sm" | "md";
  showTooltip?: boolean;
  className?: string;
}

const CONFIG_LEVELS = {
  GLOBAL: {
    icon: Globe,
    color: "text-gray-400",
    bgColor: "bg-gray-50",
    borderColor: "border-gray-200",
    label: "Global default",
    tooltip: "Using global default pricing configuration",
  },
  COUNTRY: {
    icon: MapPin,
    color: "text-blue-500",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    label: "Country-specific",
    tooltip: "Country-specific configuration applied",
  },
  BUNDLE: {
    icon: Package,
    color: "text-purple-500",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
    label: "Bundle override",
    tooltip: "Bundle-specific pricing override active",
  },
};

const SIZES = {
  xs: {
    icon: "h-3 w-3",
    container: "h-4 w-4",
  },
  sm: {
    icon: "h-3.5 w-3.5",
    container: "h-5 w-5",
  },
  md: {
    icon: "h-4 w-4",
    container: "h-6 w-6",
  },
};

export function ConfigurationLevelIndicator({
  level = "GLOBAL",
  size = "sm",
  showTooltip = true,
  className = "",
}: ConfigurationLevelIndicatorProps) {
  const config = CONFIG_LEVELS[level as keyof typeof CONFIG_LEVELS] || CONFIG_LEVELS.GLOBAL;
  const sizeConfig = SIZES[size];
  const Icon = config.icon;

  const indicator = (
    <div
      className={`inline-flex items-center justify-center rounded-full ${config.bgColor} ${config.borderColor} border ${sizeConfig.container} ${className}`}
    >
      <Icon className={`${sizeConfig.icon} ${config.color}`} />
    </div>
  );

  if (!showTooltip) {
    return indicator;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {indicator}
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          <p className="font-medium">{config.label}</p>
          <p className="text-gray-500">{config.tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}