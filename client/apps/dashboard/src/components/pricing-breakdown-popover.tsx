import React from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover";
import { Button } from "@workspace/ui/components/button";
import { Badge } from "@workspace/ui/components/badge";
import { Separator } from "@workspace/ui/components/separator";
import {
  Info,
  DollarSign,
  TrendingDown,
  CreditCard,
  AlertCircle,
} from "lucide-react";
import { ConfigurationLevelIndicator } from "./configuration-level-indicator";

interface PricingBreakdownPopoverProps {
  // Bundle info
  bundleName: string;
  countryName: string;
  duration: number;
  
  // Cost breakdown
  esimGoCost: number;
  fixedMarkup: number;
  totalCost: number;
  
  // Discount info
  unusedDays?: number;
  discountPerDay?: number;
  discountValue?: number;
  
  // Processing & final
  processingRate: number;
  processingCost: number;
  finalRevenue: number;
  netProfit: number;
  
  // Configuration metadata
  configLevel?: 'GLOBAL' | 'COUNTRY' | 'BUNDLE';
  bundleGroup?: string;
}

export function PricingBreakdownPopover({
  bundleName,
  countryName,
  duration,
  esimGoCost,
  fixedMarkup,
  totalCost,
  unusedDays = 0,
  discountPerDay = 0.1,
  discountValue = 0,
  processingRate,
  processingCost,
  finalRevenue,
  netProfit,
  configLevel = 'GLOBAL',
  bundleGroup,
}: PricingBreakdownPopoverProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatPercentage = (rate: number) => {
    return (rate * 100).toFixed(1) + "%";
  };

  const profitMargin = totalCost > 0 ? (netProfit / totalCost) * 100 : 0;
  const isUnprofitable = netProfit < 1.50;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 hover:bg-blue-50"
        >
          <Info className="h-4 w-4 text-blue-600" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="start">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100/50 border-b">
          <h3 className="font-semibold text-sm">{bundleName}</h3>
          <p className="text-xs text-gray-600">
            {countryName} • {duration} days
          </p>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">

          {/* Cost Breakdown */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Cost Breakdown
            </h4>
            
            <div className="space-y-2 text-sm">
              {/* Base Cost */}
              <div className="flex justify-between">
                <span className="text-gray-600">eSIM Go Cost</span>
                <span className="font-mono">{formatCurrency(esimGoCost)}</span>
              </div>
              
              {/* Fixed Markup */}
              <div className="flex justify-between">
                <span className="text-gray-600">
                  Fixed Markup
                  {bundleGroup && (
                    <span className="text-xs text-gray-400 ml-1">
                      ({bundleGroup})
                    </span>
                  )}
                </span>
                <div className="flex items-center gap-1">
                  <span className="font-mono text-gray-600">
                    + {formatCurrency(fixedMarkup)}
                  </span>
                  <ConfigurationLevelIndicator 
                    level={configLevel} 
                    size="xs" 
                    showTooltip 
                  />
                </div>
              </div>
              
              {/* Subtotal before discount */}
              <div className="flex justify-between font-medium pt-1 border-t">
                <span>Subtotal</span>
                <span className="font-mono">
                  {formatCurrency(esimGoCost + fixedMarkup)}
                </span>
              </div>
            </div>
          </div>

          {/* Unused Days Discount */}
          {unusedDays > 0 && (
            <>
              <Separator />
              <div className="space-y-3">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-orange-600" />
                  Unused Days Discount
                </h4>
                
                <div className="bg-orange-50 p-2 rounded-md space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Unused Days</span>
                    <span>{unusedDays} days</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Discount Rate</span>
                    <span>{formatPercentage(discountPerDay)} per day</span>
                  </div>
                  <div className="flex justify-between font-medium text-orange-700 pt-1 border-t border-orange-200">
                    <span>Total Discount</span>
                    <span>- {formatCurrency(discountValue)}</span>
                  </div>
                </div>
                
                <div className="flex justify-between font-medium">
                  <span>Price After Discount</span>
                  <span className="font-mono">{formatCurrency(totalCost)}</span>
                </div>
              </div>
            </>
          )}

          {/* Processing Fees */}
          <Separator />
          <div className="space-y-3">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-blue-600" />
              Processing & Final
            </h4>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">
                  Processing Fee ({formatPercentage(processingRate)})
                </span>
                <span className="font-mono text-red-600">
                  - {formatCurrency(processingCost)}
                </span>
              </div>
              
              <div className="flex justify-between font-medium pt-1 border-t">
                <span>Final Revenue</span>
                <span className="font-mono text-green-600">
                  {formatCurrency(finalRevenue)}
                </span>
              </div>
            </div>
          </div>

          {/* Net Profit */}
          <div 
            className={`p-3 rounded-md ${
              isUnprofitable 
                ? 'bg-red-50 border border-red-200' 
                : 'bg-green-50 border border-green-200'
            }`}
          >
            <div className="flex justify-between items-start">
              <div>
                <div className="font-medium text-sm">Net Profit</div>
                <div className={`text-xs ${
                  isUnprofitable ? 'text-red-600' : 'text-green-600'
                }`}>
                  {formatPercentage(profitMargin / 100)} margin
                </div>
              </div>
              <div className="text-right">
                <div className={`font-mono text-lg font-bold ${
                  isUnprofitable ? 'text-red-600' : 'text-green-600'
                }`}>
                  {formatCurrency(netProfit)}
                </div>
                {isUnprofitable && (
                  <div className="flex items-center gap-1 text-xs text-red-600 mt-1">
                    <AlertCircle className="h-3 w-3" />
                    Below $1.50 min
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}