import React from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@workspace/ui/components/card";
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@workspace/ui/components/collapsible";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip";
import {
  ChevronDown,
  DollarSign,
  Calculator,
  Layers,
  Percent,
  CreditCard,
  Calendar,
  Globe,
  MapPin,
  Package,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  TrendingDown,
} from "lucide-react";

interface PricingBreakdownProps {
  countryId: string;
  duration: number;
  bundleName: string;
  esimGoCost: number;
  fixedMarkup: number;
  totalCostBeforeDiscount: number;
  unusedDays: number;
  discountPerDay: number;
  unusedDaysDiscount: number;
  totalCostAfterDiscount: number;
  processingRate: number;
  processingCost: number;
  finalRevenue: number;
  netProfit: number;
  configurationLevel: 'GLOBAL' | 'COUNTRY' | 'BUNDLE';
  bundleGroup: string;
}

export function PricingHierarchyExplanation({ 
  breakdown 
}: { 
  breakdown?: PricingBreakdownProps 
}) {
  const [isOpen, setIsOpen] = React.useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatPercentage = (rate: number) => {
    return (rate * 100).toFixed(1) + "%";
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-blue-600" />
            <CardTitle>Pricing Configuration Hierarchy</CardTitle>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <HelpCircle className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="max-w-sm">
                <p>
                  Our pricing system uses a hierarchical configuration approach. 
                  More specific configurations override general ones, allowing 
                  fine-tuned pricing for specific markets while maintaining 
                  global defaults.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <CardDescription>
          Understanding how pricing is calculated from multiple configuration sources
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Configuration Hierarchy */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Layers className="h-5 w-5" />
            Configuration Hierarchy
          </h3>
          
          <div className="space-y-3">
            {/* Bundle-Specific Level */}
            <div className="flex items-start gap-3 p-3 rounded-lg border bg-gradient-to-r from-purple-50 to-purple-100/50 border-purple-200">
              <div className="mt-1">
                <Package className="h-5 w-5 text-purple-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium">Bundle-Specific Configuration</h4>
                  <Badge variant="secondary" className="bg-purple-200 text-purple-800">
                    Highest Priority
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Applies to: Specific country + duration + bundle group
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Example: Austria, 10 days, Unlimited Essential
                </p>
              </div>
            </div>

            {/* Country Level */}
            <div className="flex items-start gap-3 p-3 rounded-lg border bg-gradient-to-r from-blue-50 to-blue-100/50 border-blue-200">
              <div className="mt-1">
                <MapPin className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium">Country-Level Configuration</h4>
                  <Badge variant="secondary" className="bg-blue-200 text-blue-800">
                    Medium Priority
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Applies to: All bundles in a specific country
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Example: All Austria bundles (any duration/group)
                </p>
              </div>
            </div>

            {/* Global Level */}
            <div className="flex items-start gap-3 p-3 rounded-lg border bg-gradient-to-r from-gray-50 to-gray-100/50 border-gray-200">
              <div className="mt-1">
                <Globe className="h-5 w-5 text-gray-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium">Global Default Configuration</h4>
                  <Badge variant="outline">
                    Fallback
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Applies to: All countries and bundles without specific overrides
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Example: Default 10% discount per unused day
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Live Example */}
        {breakdown && (
          <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <CollapsibleTrigger asChild>
              <Button 
                variant="outline" 
                className="w-full justify-between"
                type="button"
              >
                <span className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  View Live Pricing Breakdown
                </span>
                <ChevronDown 
                  className={`h-4 w-4 transition-transform ${
                    isOpen ? "rotate-180" : ""
                  }`} 
                />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-4">
              <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium flex items-center gap-2">
                  <Calculator className="h-4 w-4" />
                  {breakdown.bundleName} - {breakdown.duration} days
                </h4>
                
                {/* Step-by-step calculation */}
                <div className="space-y-3">
                  {/* Step 1: Base Cost */}
                  <div className="flex items-center justify-between p-3  rounded-md">
                    <div>
                      <div className="font-medium">1. eSIM Go Base Cost</div>
                      <div className="text-sm text-gray-500">
                        Wholesale price from provider
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-medium">
                        {formatCurrency(breakdown.esimGoCost)}
                      </div>
                    </div>
                  </div>

                  {/* Step 2: Fixed Markup */}
                  <div className="flex items-center justify-between p-3 bg-white rounded-md">
                    <div>
                      <div className="font-medium">2. Fixed Markup</div>
                      <div className="text-sm text-gray-500">
                        From {breakdown.bundleGroup} table
                      </div>
                      <Badge 
                        variant="outline" 
                        className="mt-1 text-xs"
                      >
                        {breakdown.configurationLevel} CONFIG
                      </Badge>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-gray-600">
                        + {formatCurrency(breakdown.fixedMarkup)}
                      </div>
                      <div className="font-mono font-medium border-t pt-1">
                        = {formatCurrency(breakdown.totalCostBeforeDiscount)}
                      </div>
                    </div>
                  </div>

                  {/* Step 3: Unused Days Discount */}
                  {breakdown.unusedDays > 0 && (
                    <div className="flex items-center justify-between p-3 bg-white rounded-md">
                      <div>
                        <div className="font-medium">
                          3. Unused Days Discount
                        </div>
                        <div className="text-sm text-gray-500">
                          {breakdown.unusedDays} unused days × {formatPercentage(breakdown.discountPerDay)} per day
                        </div>
                        <div className="text-sm text-orange-600 mt-1">
                          Total discount: {formatPercentage(breakdown.unusedDaysDiscount)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono text-orange-600">
                          - {formatCurrency(breakdown.totalCostBeforeDiscount * breakdown.unusedDaysDiscount)}
                        </div>
                        <div className="font-mono font-medium border-t pt-1">
                          = {formatCurrency(breakdown.totalCostAfterDiscount)}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 4: Processing Fees */}
                  <div className="flex items-center justify-between p-3 bg-white rounded-md">
                    <div>
                      <div className="font-medium">4. Processing Fees</div>
                      <div className="text-sm text-gray-500">
                        Payment processing at {formatPercentage(breakdown.processingRate)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-red-600">
                        - {formatCurrency(breakdown.processingCost)}
                      </div>
                      <div className="font-mono font-medium border-t pt-1">
                        = {formatCurrency(breakdown.finalRevenue)}
                      </div>
                    </div>
                  </div>

                  {/* Final Profit */}
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-md border border-blue-200">
                    <div>
                      <div className="font-medium text-blue-900">
                        Net Profit
                      </div>
                      <div className="text-sm text-blue-700">
                        Revenue after all costs
                      </div>
                    </div>
                    <div className="text-right">
                      <div 
                        className={`font-mono text-lg font-bold ${
                          breakdown.netProfit > 0 
                            ? "text-green-600" 
                            : "text-red-600"
                        }`}
                      >
                        {formatCurrency(breakdown.netProfit)}
                      </div>
                      <div className="text-sm text-gray-600">
                        {formatPercentage(breakdown.netProfit / breakdown.totalCostAfterDiscount)} margin
                      </div>
                    </div>
                  </div>
                </div>

                {/* Validation Warning */}
                {breakdown.netProfit < 1.50 && (
                  <div className="flex items-start gap-2 p-3 bg-red-50 rounded-md border border-red-200">
                    <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                    <div>
                      <div className="font-medium text-red-900">
                        Minimum Profit Margin Warning
                      </div>
                      <div className="text-sm text-red-700">
                        This configuration would result in less than $1.50 profit. 
                        The system will reject this pricing to ensure profitability.
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Key Configuration Sources */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Key Configuration Sources</h3>
          
          <div className="grid gap-3">
            <div className="flex items-start gap-3">
              <DollarSign className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-medium">Fixed Markup Table</h4>
                <p className="text-sm text-gray-600">
                  Defines fixed dollar amounts added to base cost per bundle group and duration
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <TrendingDown className="h-5 w-5 text-orange-600 mt-0.5" />
              <div>
                <h4 className="font-medium">Discount Per Day</h4>
                <p className="text-sm text-gray-600">
                  Percentage discount applied for each unused day when using longer bundles
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CreditCard className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium">Processing Fees</h4>
                <p className="text-sm text-gray-600">
                  Payment method-specific rates (configured via pricing rules)
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}