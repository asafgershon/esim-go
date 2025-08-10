import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@workspace/ui';
import { Progress, Badge } from '@workspace/ui';
import { ArrowRight, CheckCircle2, AlertCircle, Clock, DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import type { PricingStep, CustomerDiscount } from '@/__generated__/graphql';

interface PricingStepsVisualizationProps {
  steps?: PricingStep[] | null;
  customerDiscounts?: CustomerDiscount[] | null;
  savingsAmount?: number | null;
  savingsPercentage?: number | null;
  calculationTimeMs?: number | null;
  rulesEvaluated?: number | null;
  currency?: string;
  isStreaming?: boolean;
  currentStep?: number;
}

export const PricingStepsVisualization: React.FC<PricingStepsVisualizationProps> = ({
  steps,
  customerDiscounts,
  savingsAmount,
  savingsPercentage,
  calculationTimeMs,
  rulesEvaluated,
  currency = 'USD',
  isStreaming = false,
  currentStep = 0,
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const getImpactColor = (impact: number) => {
    if (impact > 0) return 'text-red-600'; // Price increase
    if (impact < 0) return 'text-green-600'; // Price decrease (discount)
    return 'text-gray-600'; // No change
  };

  const getImpactIcon = (impact: number) => {
    if (impact > 0) return <TrendingUp className="h-4 w-4 text-red-600" />;
    if (impact < 0) return <TrendingDown className="h-4 w-4 text-green-600" />;
    return null;
  };

  if (!steps || steps.length === 0) {
    return null;
  }

  const totalSteps = steps.length;
  const completedSteps = isStreaming ? currentStep : totalSteps;
  const progressPercentage = (completedSteps / totalSteps) * 100;

  return (
    <div className="space-y-4">
      {/* Performance Metrics */}
      {!isStreaming && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Calculation Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Time</p>
                <p className="font-medium flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {calculationTimeMs ? formatTime(calculationTimeMs) : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Rules Evaluated</p>
                <p className="font-medium">{rulesEvaluated || 0}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Total Steps</p>
                <p className="font-medium">{totalSteps}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Progress Indicator */}
      {isStreaming && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Processing Steps</span>
            <span className="font-medium">{completedSteps} / {totalSteps}</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>
      )}

      {/* Pricing Steps */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Pricing Calculation Steps</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-h-96 overflow-y-auto pr-2 space-y-3">
            {steps.map((step, index) => {
              const isCompleted = !isStreaming || index < currentStep;
              const isActive = isStreaming && index === currentStep;
              const isPending = isStreaming && index > currentStep;

              return (
                <div
                  key={step.order}
                  className={`relative flex items-start gap-3 p-3 rounded-lg transition-all ${
                    isActive ? 'bg-blue-50 border border-blue-200' : 
                    isCompleted ? 'bg-gray-50' : 
                    'opacity-50'
                  }`}
                >
                  {/* Step Number */}
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    isCompleted ? 'bg-green-100 text-green-700' :
                    isActive ? 'bg-blue-100 text-blue-700 animate-pulse' :
                    'bg-gray-100 text-gray-500'
                  }`}>
                    {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : step.order + 1}
                  </div>

                  {/* Step Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-medium">{step.name}</h4>
                      {isActive && <Badge variant="secondary" className="text-xs">Processing</Badge>}
                    </div>

                    <div className="flex items-center gap-3 text-sm">
                      <span className="text-muted-foreground">
                        {formatCurrency(step.priceBefore)}
                      </span>
                      <ArrowRight className="h-3 w-3 text-muted-foreground" />
                      <span className="font-medium">
                        {formatCurrency(step.priceAfter)}
                      </span>
                      {step.impact !== 0 && (
                        <span className={`flex items-center gap-1 font-medium ${getImpactColor(step.impact)}`}>
                          {getImpactIcon(step.impact)}
                          {step.impact > 0 ? '+' : ''}{formatCurrency(Math.abs(step.impact))}
                        </span>
                      )}
                    </div>

                    {/* Metadata */}
                    {step.metadata && Object.keys(step.metadata).length > 0 && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        {Object.entries(step.metadata).map(([key, value]) => (
                          <span key={key} className="inline-block mr-3">
                            {key}: <span className="font-medium">{JSON.stringify(value)}</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Customer Discounts Summary */}
      {customerDiscounts && customerDiscounts.length > 0 && (
        <Card className="flex-shrink-0">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Applied Discounts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-48 overflow-y-auto pr-2 space-y-2">
              {customerDiscounts.map((discount, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-green-50 rounded">
                  <div>
                    <p className="text-sm font-medium">{discount.name}</p>
                    <p className="text-xs text-muted-foreground">{discount.reason}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-green-700">
                      -{formatCurrency(discount.amount)}
                    </p>
                    {discount.percentage && (
                      <p className="text-xs text-green-600">
                        {discount.percentage.toFixed(1)}% off
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Total Savings */}
            {savingsAmount && savingsAmount > 0 && (
              <div className="mt-3 pt-3 border-t flex items-center justify-between">
                <span className="text-sm font-medium">Total Savings</span>
                <div className="text-right">
                  <p className="text-lg font-bold text-green-700">
                    {formatCurrency(savingsAmount)}
                  </p>
                  {savingsPercentage && (
                    <p className="text-xs text-green-600">
                      {savingsPercentage.toFixed(1)}% saved
                    </p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};