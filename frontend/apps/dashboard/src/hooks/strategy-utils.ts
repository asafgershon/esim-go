import React from "react";
import {
  Calculator,
  CreditCard,
  DollarSign,
  Globe,
  Percent,
  Tag,
  Target,
  TrendingUp,
  PlayCircle,
  Clock,
} from "lucide-react";
import { StrategyStep } from "../pages/pricing/types";
import type { 
  PricingStrategy,
  StrategyBlock,
  PricingBlock 
} from "../__generated__/graphql";

// Extended types with blocks
export interface PricingStrategyWithBlocks extends PricingStrategy {
  blocks: StrategyBlock[];
}

// Hook return types
export interface UseStrategiesResult {
  strategies: PricingStrategy[];
  loading: boolean;
  error: any;
  refetch: () => void;
}

export interface UseLoadStrategyResult {
  strategy: PricingStrategyWithBlocks | null;
  loading: boolean;
  error: any;
  refetch: () => void;
  loadStrategyIntoBuilder: () => StrategyStep[];
}

// Icon mapping based on category
const getCategoryIcon = (category: string): React.ComponentType<{ className?: string }> => {
  const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    "INITIALIZATION": PlayCircle,
    "markup": TrendingUp,
    "DISCOUNT": Percent,
    "discount": Percent,
    "FEE": CreditCard,
    "processing-fee": CreditCard,
    "fixed-price": DollarSign,
    "keep-profit": Target,
    "profit-constraint": Target,
    "ROUNDING": Calculator,
    "psychological-rounding": Calculator,
    "region-rounding": Globe,
    "coupon": Tag,
    "unused-days-discount": Clock,
  };

  return iconMap[category] || Calculator;
};

// Color mapping based on category
const getCategoryColor = (category: string): string => {
  const colorMap: Record<string, string> = {
    "INITIALIZATION": "bg-gray-100 border-gray-300 text-gray-800",
    "markup": "bg-blue-100 border-blue-300 text-blue-800",
    "DISCOUNT": "bg-green-100 border-green-300 text-green-800",
    "discount": "bg-green-100 border-green-300 text-green-800",
    "FEE": "bg-orange-100 border-orange-300 text-orange-800",
    "processing-fee": "bg-orange-100 border-orange-300 text-orange-800",
    "fixed-price": "bg-purple-100 border-purple-300 text-purple-800",
    "keep-profit": "bg-red-100 border-red-300 text-red-800",
    "profit-constraint": "bg-red-100 border-red-300 text-red-800",
    "ROUNDING": "bg-indigo-100 border-indigo-300 text-indigo-800",
    "psychological-rounding": "bg-indigo-100 border-indigo-300 text-indigo-800",
    "region-rounding": "bg-teal-100 border-teal-300 text-teal-800",
    "coupon": "bg-amber-100 border-amber-300 text-amber-800",
    "unused-days-discount": "bg-cyan-100 border-cyan-300 text-cyan-800",
  };

  return colorMap[category] || "bg-gray-100 border-gray-300 text-gray-800";
};

// Map database block category to UI type
const mapBlockType = (category: string): string => {
  const typeMap: Record<string, string> = {
    "INITIALIZATION": "base-price",
    "markup": "markup", 
    "DISCOUNT": "discount",
    "discount": "discount",
    "FEE": "processing-fee",
    "processing-fee": "processing-fee",
    "fixed-price": "fixed-price",
    "keep-profit": "profit-constraint",
    "profit-constraint": "profit-constraint", 
    "ROUNDING": "psychological-rounding",
    "psychological-rounding": "psychological-rounding",
    "region-rounding": "region-rounding",
    "coupon": "coupon",
    "unused-days-discount": "unused-days-discount",
  };

  return typeMap[category] || category;
};

// Transform database action structure to UI config structure based on block type
const transformActionToConfig = (category: string, action: any, configOverrides: any = {}) => {
  const blockType = mapBlockType(category);
  
  switch (blockType) {
    case "provider-selection":
      return {
        preferredProvider: action?.preferredProvider || "MAYA",
        fallbackProvider: action?.fallbackProvider || "ESIM_GO",
        ...configOverrides,
      };
      
    case "markup":
      // Handle markup matrix from database
      if (action?.markupMatrix) {
        const groupDurationConfigs: any = {};
        Object.entries(action.markupMatrix).forEach(([group, durations]: [string, any]) => {
          groupDurationConfigs[group] = {};
          Object.entries(durations).forEach(([duration, markup]) => {
            groupDurationConfigs[group][duration] = {
              markupValue: markup,
            };
          });
        });
        return {
          markupType: "fixed",
          markupValue: 5, // Default value
          groupDurationConfigs,
          ...configOverrides,
        };
      }
      return {
        markupType: "fixed",
        markupValue: 5,
        groupDurationConfigs: {},
        ...configOverrides,
      };
      
    case "fixed-price":
      // Extract value from nested structure
      const fixedValue = action?.actions?.value || action?.value || 0;
      return {
        basePrice: fixedValue,
        currency: "USD",
        ...configOverrides,
      };
      
    case "profit-constraint":
    case "keep-profit":
      return {
        value: action?.value || 1.5,
        ...configOverrides,
      };
      
    case "psychological-rounding":
      return {
        strategy: action?.strategy || "charm",
        roundTo: action?.roundTo || 0.99,
        ...configOverrides,
      };
      
    case "region-rounding":
      const roundingValue = action?.actions?.value || action?.value || 0.99;
      return {
        region: "us",
        roundingRule: "nearest-dollar",
        value: roundingValue,
        ...configOverrides,
      };
      
    case "discount":
    case "unused-days-discount":
      return {
        type: "percentage",
        value: action?.value || 10,
        condition: "always",
        ...configOverrides,
      };
      
    case "base-price":
    case "INITIALIZATION":
      return {
        ...configOverrides,
      };
      
    default:
      return {
        ...action,
        ...configOverrides,
      };
  }
};

// Utility functions for mapping database types to UI types
export const mapDatabaseBlockToUIBlock = (
  strategyBlock: StrategyBlock
): StrategyStep => {
  const { pricingBlock, priority: strategyPriority, configOverrides } = strategyBlock;
  
  // Generate a unique ID for the UI component
  const uniqueId = `${pricingBlock.id}-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  
  const IconComponent = getCategoryIcon(pricingBlock.category);
  
  // Transform the action to proper config structure
  const config = transformActionToConfig(pricingBlock.category, pricingBlock.action, configOverrides);
  
  return {
    id: pricingBlock.id,
    uniqueId,
    type: mapBlockType(pricingBlock.category),
    name: pricingBlock.name,
    description: pricingBlock.description || `${pricingBlock.category} block`,
    icon: React.createElement(IconComponent, { className: "h-4 w-4" }),
    color: getCategoryColor(pricingBlock.category),
    params: pricingBlock.conditions,
    config: {
      ...config,
      priority: strategyPriority,
      isEnabled: strategyBlock.isEnabled,
    },
    disabled: !strategyBlock.isEnabled,
  };
};

export const mapStrategyToUIFormat = (
  strategy: PricingStrategyWithBlocks
): StrategyStep[] => {
  return [...strategy.blocks]
    .sort((a, b) => b.priority - a.priority)
    .map((block) => mapDatabaseBlockToUIBlock(block));
};

// Strategy summary types for display
export interface StrategyListItem {
  id: string;
  name: string;
  code: string;
  description?: string;
  isDefault: boolean;
  isArchived: boolean;
  version: number;
  activationCount?: number;
  lastActivatedAt?: string;
  createdAt: string;
  updatedAt?: string;
  blocksCount: number;
}

export const mapStrategyToListItem = (
  strategy: PricingStrategy,
  blocksCount: number = 0
): StrategyListItem => ({
  id: strategy.id,
  name: strategy.name,
  code: strategy.code,
  description: strategy.description || undefined,
  isDefault: strategy.isDefault,
  isArchived: !!strategy.archivedAt,
  version: strategy.version,
  activationCount: strategy.activationCount || undefined,
  lastActivatedAt: strategy.lastActivatedAt || undefined,
  createdAt: strategy.createdAt,
  updatedAt: strategy.updatedAt || undefined,
  blocksCount,
});