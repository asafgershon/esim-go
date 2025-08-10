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
import { Block } from "../types";
import { DatabasePricingBlock } from "../../../hooks/usePricingBlocks";

// Icon mapping based on category
const getCategoryIcon = (category: string): React.ReactNode => {
  const iconMap: Record<string, React.ReactNode> = {
    "INITIALIZATION": <PlayCircle className="h-4 w-4" />,
    "markup": <TrendingUp className="h-4 w-4" />,
    "DISCOUNT": <Percent className="h-4 w-4" />,
    "discount": <Percent className="h-4 w-4" />,
    "FEE": <CreditCard className="h-4 w-4" />,
    "processing-fee": <CreditCard className="h-4 w-4" />,
    "fixed-price": <DollarSign className="h-4 w-4" />,
    "keep-profit": <Target className="h-4 w-4" />,
    "profit-constraint": <Target className="h-4 w-4" />,
    "ROUNDING": <Calculator className="h-4 w-4" />,
    "psychological-rounding": <Calculator className="h-4 w-4" />,
    "region-rounding": <Globe className="h-4 w-4" />,
    "coupon": <Tag className="h-4 w-4" />,
    "unused-days-discount": <Clock className="h-4 w-4" />,
  };

  return iconMap[category] || <Calculator className="h-4 w-4" />;
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

/**
 * Maps database pricing blocks to UI blocks
 */
export const mapDatabaseBlocksToUI = (databaseBlocks: DatabasePricingBlock[]): Block[] => {
  return databaseBlocks.map((dbBlock) => ({
    id: `db-${dbBlock.id}`, // Prefix to distinguish from hardcoded blocks
    type: mapBlockType(dbBlock.category),
    name: dbBlock.name,
    description: dbBlock.description || `${dbBlock.category} block`,
    icon: getCategoryIcon(dbBlock.category),
    color: getCategoryColor(dbBlock.category),
    params: dbBlock.action,
    disabled: !dbBlock.isActive,
  }));
};