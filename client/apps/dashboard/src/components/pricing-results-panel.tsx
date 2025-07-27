import React from 'react';
import { ScrollArea, Badge, Alert, AlertDescription } from '@workspace/ui';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Clock,
  Zap,
  CheckCircle2,
  XCircle,
  Activity,
} from 'lucide-react';
import { PricingPipelineStream } from './pricing-pipeline-stream';
import { PricingRulesSummary } from './pricing-rules-summary';

interface PricingData {
  // Basic pricing info
  dailyPrice: number;
  totalPrice: number;
  originalPrice: number;
  discountAmount: number;
  hasDiscount: boolean;
  days: number;
  currency: string;
  
  // Business metrics
  cost: number;
  markup: number;
  discountRate: number;
  processingRate: number;
  processingCost: number;
  finalRevenue: number;
  netProfit: number;
  discountPerDay: number;
  
  // Profit analysis
  profitMargin: number;
  
  // Pipeline metadata
  unusedDays?: number | null;
  selectedReason?: string | null;
  
  // Bundle info
  bundle: {
    id: string;
    name: string;
    duration: number;
    isUnlimited: boolean;
    data?: number | null;
  };
  
  // Applied rules
  appliedRules: Array<{
    name: string;
    type: string;
    impact: number;
  }>;
}

interface PipelineStep {
  correlationId: string;
  name: string;
  timestamp: string;
  state?: any;
  appliedRules?: string[] | null;
  debug?: any;
}

interface PricingResultsPanelProps {
  data: PricingData | null;
  loading: boolean;
  error: any;
  pipelineSteps: PipelineStep[];
  isStreaming: boolean;
  wsConnected: boolean;
}

export const PricingResultsPanel: React.FC<PricingResultsPanelProps> = ({
  data,
  loading,
  error,
  pipelineSteps,
  isStreaming,
  wsConnected,
}) => {
  const formatCurrency = (amount: number, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const getProfitMarginColor = (margin: number) => {
    if (margin < 0) return 'text-red-600';
    if (margin < 10) return 'text-yellow-600';
    if (margin < 25) return 'text-blue-600';
    return 'text-green-600';
  };

  if (!data && !loading && !error && pipelineSteps.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center space-y-3">
          <Calculator className="h-12 w-12 text-muted-foreground mx-auto" />
          <div>
            <h3 className="text-lg font-medium">No simulation yet</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Configure parameters and click simulate to see results
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <h3 className="text-lg font-semibold">Simulation Results</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Real-time pricing calculation and analysis
        </p>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Failed to calculate pricing: {error.message}
              </AlertDescription>
            </Alert>
          )}

          {/* Loading State */}
          {loading && !data && (
            <div className="flex items-center justify-center py-8">
              <div className="text-center space-y-3">
                <Activity className="h-8 w-8 text-primary animate-spin mx-auto" />
                <p className="text-sm text-muted-foreground">Calculating pricing...</p>
              </div>
            </div>
          )}

          {/* Results */}
          {data && (
            <div className="space-y-4">
              {/* Summary Card */}
              <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium">{data.bundle.name}</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      {data.days} days • {data.bundle.isUnlimited ? 'Unlimited' : `${data.bundle.data} MB`}
                    </p>
                  </div>
                  <Badge variant={data.netProfit > 0 ? 'default' : 'destructive'}>
                    {data.netProfit > 0 ? 'Profitable' : 'Loss'}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Customer Price</p>
                    <p className="text-2xl font-bold">{formatCurrency(data.totalPrice, data.currency)}</p>
                    <p className="text-xs text-muted-foreground">{formatCurrency(data.dailyPrice, data.currency)}/day</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Net Profit</p>
                    <p className={`text-2xl font-bold ${data.netProfit > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(data.netProfit, data.currency)}
                    </p>
                    <p className={`text-xs ${getProfitMarginColor(data.profitMargin)}`}>
                      {formatPercentage(data.profitMargin)} margin
                    </p>
                  </div>
                </div>
              </div>

              {/* Unused Days Discount Notice */}
              {data.unusedDays && data.unusedDays > 0 && (
                <Alert className="border-blue-200 bg-blue-50">
                  <TrendingDown className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    <div className="font-medium mb-1">Unused Days Discount Applied</div>
                    <div className="text-sm">
                      Requested {data.days} days, selected {data.bundle.duration}-day bundle. 
                      Discount: {data.unusedDays} unused days × ${data.discountPerDay?.toFixed(2) || '0.00'}/day = 
                      ${((data.unusedDays || 0) * (data.discountPerDay || 0)).toFixed(2)} total discount.
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {/* Pricing Breakdown */}
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Pricing Breakdown</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between items-center py-1">
                    <span className="text-muted-foreground">Base Cost</span>
                    <span className="font-mono">{formatCurrency(data.cost, data.currency)}</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-muted-foreground">
                      + Markup
                      {data.cost && data.markup ? (
                        <span className="text-xs ml-1">
                          ({((data.markup / data.cost) * 100).toFixed(1)}%)
                        </span>
                      ) : null}
                    </span>
                    <span className="font-mono">{formatCurrency(data.markup, data.currency)}</span>
                  </div>
                  {data.hasDiscount && (
                    <div className="flex justify-between items-center py-1">
                      <span className="text-muted-foreground">- Discount ({formatPercentage(data.discountRate)})</span>
                      <span className="font-mono text-green-600">-{formatCurrency(data.discountAmount, data.currency)}</span>
                    </div>
                  )}
                  {data.unusedDays && data.unusedDays > 0 && (
                    <div className="flex justify-between items-center py-1 text-xs text-blue-600 italic">
                      <span>  ↳ Includes unused days:</span>
                      <span className="font-mono">
                        -{formatCurrency((data.unusedDays || 0) * (data.discountPerDay || 0), data.currency)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center py-1 pt-2 border-t">
                    <span className="font-medium">Customer Price</span>
                    <span className="font-mono font-medium">{formatCurrency(data.totalPrice, data.currency)}</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-muted-foreground">- Processing ({formatPercentage(data.processingRate * 100)})</span>
                    <span className="font-mono text-orange-600">-{formatCurrency(data.processingCost, data.currency)}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 pt-2 border-t">
                    <span className="font-medium">Final Revenue</span>
                    <span className="font-mono font-medium">{formatCurrency(data.finalRevenue, data.currency)}</span>
                  </div>
                </div>
              </div>

              {/* Applied Rules */}
              {data.appliedRules.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Applied Rules
                  </h4>
                  <div className="space-y-1">
                    {data.appliedRules.map((rule, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded-md text-sm">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {rule.type}
                          </Badge>
                          <span>{rule.name}</span>
                        </div>
                        <span className={`font-mono font-medium ${
                          rule.impact > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {rule.impact > 0 ? '+' : ''}{formatCurrency(rule.impact, data.currency)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Warnings */}
              {data.netProfit < 1.5 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Net profit of {formatCurrency(data.netProfit, data.currency)} is below the minimum requirement of $1.50
                  </AlertDescription>
                </Alert>
              )}

              {/* Rules Impact Summary */}
              {pipelineSteps.length > 0 && (
                <div className="mt-4">
                  <PricingRulesSummary
                    pipelineSteps={pipelineSteps}
                    isStreaming={isStreaming}
                    finalPrice={data.totalPrice}
                    originalPrice={data.originalPrice}
                    currency={data.currency}
                  />
                </div>
              )}
            </div>
          )}

          {/* Pipeline Stream (shown at the end - reasoning/thinking process) */}
          {(isStreaming || pipelineSteps.length > 0) && (
            <div className="mt-6 pt-6 border-t">
              <h4 className="font-medium text-sm mb-4">Pricing Engine Reasoning</h4>
              <PricingPipelineStream
                steps={pipelineSteps}
                isStreaming={isStreaming}
                wsConnected={wsConnected}
              />
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

// Add missing import
import { Calculator } from 'lucide-react';