import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Separator,
} from '@workspace/ui';
import {
  Package,
  Settings,
  TrendingDown,
  Shield,
  CreditCard,
  CheckCircle,
  ArrowRight,
  Zap,
} from 'lucide-react';
import { PricingBreakdown, PricingRule } from '@/__generated__/graphql';

interface PipelineStepVisualizationProps {
  pricingResult: PricingBreakdown;
  appliedRules: PricingRule[];
  selectedRule?: PricingRule | null;
  className?: string;
}

interface PipelineStep {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
  description: string;
  category: string;
  color: string;
}

const pipelineSteps: PipelineStep[] = [
  {
    id: 'bundle_selection',
    name: 'Bundle Selection',
    icon: Package,
    description: 'Find optimal bundle for requested duration',
    category: 'BUNDLE_ADJUSTMENT',
    color: 'purple',
  },
  {
    id: 'bundle_adjustment',
    name: 'Bundle Adjustments',
    icon: Settings,
    description: 'Apply bundle-specific adjustments and proration',
    category: 'BUNDLE_ADJUSTMENT',
    color: 'purple',
  },
  {
    id: 'discounts',
    name: 'Apply Discounts',
    icon: TrendingDown,
    description: 'Apply percentage and fixed discounts',
    category: 'DISCOUNT',
    color: 'green',
  },
  {
    id: 'constraints',
    name: 'Apply Constraints',
    icon: Shield,
    description: 'Enforce minimum profit and price limits',
    category: 'CONSTRAINT',
    color: 'orange',
  },
  {
    id: 'fees',
    name: 'Apply Fees',
    icon: CreditCard,
    description: 'Add processing fees and payment charges',
    category: 'FEE',
    color: 'blue',
  },
  {
    id: 'finalization',
    name: 'Finalization',
    icon: CheckCircle,
    description: 'Final calculations and validation',
    category: 'SYSTEM',
    color: 'gray',
  },
];

export const PipelineStepVisualization: React.FC<PipelineStepVisualizationProps> = ({
  appliedRules,
  selectedRule,
  className = '',
}) => {
  // Group applied rules by category
  const rulesByCategory = appliedRules.reduce((acc, rule) => {
    if (!acc[rule.category]) {
      acc[rule.category] = [];
    }
    acc[rule.category].push(rule);
    return acc;
  }, {} as Record<string, any[]>);

  const getStepRules = (category: string) => {
    return rulesByCategory[category] || [];
  };

  const isSelectedRuleInStep = (category: string) => {
    if (!selectedRule) return false;
    const stepRules = getStepRules(category);
    return stepRules.some(rule => rule.name === selectedRule.name);
  };

  const getStepStatus = (step: PipelineStep) => {
    const stepRules = getStepRules(step.category);
    const hasRules = stepRules.length > 0;
    const hasSelectedRule = isSelectedRuleInStep(step.category);

    if (hasSelectedRule) return 'selected';
    if (hasRules) return 'active';
    return 'inactive';
  };

  const getStepBorderColor = (status: string, color: string) => {
    switch (status) {
      case 'selected':
        return 'border-yellow-400 bg-yellow-50';
      case 'active':
        switch (color) {
          case 'green':
            return 'border-green-400 bg-green-50';
          case 'orange':
            return 'border-orange-400 bg-orange-50';
          case 'blue':
            return 'border-blue-400 bg-blue-50';
          case 'purple':
            return 'border-purple-400 bg-purple-50';
          default:
            return 'border-gray-400 bg-gray-50';
        }
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const getStepTextColor = (status: string, color: string) => {
    switch (status) {
      case 'selected':
        return 'text-yellow-800';
      case 'active':
        switch (color) {
          case 'green':
            return 'text-green-800';
          case 'orange':
            return 'text-orange-800';
          case 'blue':
            return 'text-blue-800';
          case 'purple':
            return 'text-purple-800';
          default:
            return 'text-gray-800';
        }
      default:
        return 'text-gray-600';
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Zap className="h-4 w-4" />
          Pricing Pipeline Execution
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          {pipelineSteps.map((step, index) => {
            const Icon = step.icon;
            const stepRules = getStepRules(step.category);
            const status = getStepStatus(step);
            const isLast = index === pipelineSteps.length - 1;

            return (
              <div key={step.id} className="relative">
                {/* Step Card */}
                <div
                  className={`border-2 rounded-lg p-3 transition-all duration-200 ${getStepBorderColor(
                    status,
                    step.color
                  )}`}
                >
                  {/* Step Header */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-full  border ${
                          status === 'selected'
                            ? 'border-yellow-400'
                            : status === 'active'
                            ? step.color === 'green' ? 'border-green-400' :
                              step.color === 'orange' ? 'border-orange-400' :
                              step.color === 'blue' ? 'border-blue-400' :
                              step.color === 'purple' ? 'border-purple-400' : 'border-gray-400'
                            : 'border-gray-300'
                        }`}
                      >
                        <Icon
                          className={`h-4 w-4 ${getStepTextColor(
                            status,
                            step.color
                          )}`}
                        />
                      </div>
                      <div>
                        <h4
                          className={`font-medium ${getStepTextColor(
                            status,
                            step.color
                          )}`}
                        >
                          {step.name}
                        </h4>
                        <p className="text-sm text-gray-500">
                          {step.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {status === 'selected' && (
                        <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
                          Testing Rule Active
                        </Badge>
                      )}
                      {stepRules.length > 0 && (
                        <Badge variant="outline" className="text-xs">
                          {stepRules.length} rule{stepRules.length !== 1 ? 's' : ''}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Applied Rules */}
                  {stepRules.length > 0 && (
                    <div className="space-y-2">
                      <Separator />
                      <div className="grid gap-2">
                        {stepRules.map((rule, ruleIndex) => {
                          const isSelectedRuleMatch = selectedRule && rule.name === selectedRule.name;
                          
                          return (
                            <div
                              key={ruleIndex}
                              className={`flex items-center justify-between p-2 rounded text-sm ${
                                isSelectedRuleMatch
                                  ? 'bg-yellow-100 border border-yellow-300'
                                  : 'bg-white border border-gray-200'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <div
                                  className={`h-2 w-2 rounded-full ${
                                    isSelectedRuleMatch
                                      ? 'bg-yellow-500'
                                      : step.color === 'green' ? 'bg-green-500' :
                                        step.color === 'orange' ? 'bg-orange-500' :
                                        step.color === 'blue' ? 'bg-blue-500' :
                                        step.color === 'purple' ? 'bg-purple-500' : 'bg-gray-500'
                                  }`}
                                />
                                <span
                                  className={`font-medium ${
                                    isSelectedRuleMatch
                                      ? 'text-yellow-800'
                                      : 'text-gray-700'
                                  }`}
                                >
                                  {rule.name}
                                </span>
                                {isSelectedRuleMatch && (
                                  <Badge
                                    variant="outline"
                                    className="bg-yellow-50 text-yellow-700 border-yellow-300 text-xs"
                                  >
                                    Testing
                                  </Badge>
                                )}
                              </div>
                              <span className="text-xs text-green-600 font-medium">
                                ✓ Applied
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* No Rules Applied */}
                  {stepRules.length === 0 && (
                    <div className="flex items-center gap-2 text-sm text-gray-500 mt-2">
                      <div className="h-2 w-2 rounded-full bg-gray-300" />
                      <span>No rules applied in this step</span>
                    </div>
                  )}
                </div>

                {/* Arrow to Next Step */}
                {!isLast && (
                  <div className="flex justify-center my-2">
                    <ArrowRight className="h-5 w-5 text-gray-400" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Summary */}
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <span className="text-gray-600">
                Total Rules Applied: <strong>{appliedRules.length}</strong>
              </span>
              {selectedRule && (
                <span className="text-yellow-700">
                  Testing Rule:{' '}
                  <strong>
                    {appliedRules.some(rule => rule.name === selectedRule.name)
                      ? 'Applied ✓'
                      : 'Not Applied ✗'}
                  </strong>
                </span>
              )}
            </div>
            <div className="text-gray-600">
              Pipeline execution completed successfully
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};