import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Collapsible, CollapsibleContent, CollapsibleTrigger } from '@workspace/ui';
import {
  Calculator,
  Globe,
  Zap,
  DollarSign,
  CheckCircle,
  Clock,
  Activity,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';

interface PipelineStep {
  correlationId: string;
  name: string;
  timestamp: string;
  state?: any;
  appliedRules?: string[] | null;
  debug?: any;
}

interface PricingPipelineStreamProps {
  steps: PipelineStep[];
  isStreaming: boolean;
  wsConnected: boolean;
}

export const PricingPipelineStream: React.FC<PricingPipelineStreamProps> = ({
  steps,
  isStreaming,
  wsConnected,
}) => {
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set());

  const toggleStep = (index: number) => {
    const newExpanded = new Set(expandedSteps);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedSteps(newExpanded);
  };

  const getStepIcon = (step: PipelineStep) => {
    const name = step.name;
    if (name.includes('BUNDLE_SELECTION')) return <Globe className="h-4 w-4 text-blue-500" />;
    if (name.includes('RULE_EVALUATION')) return <Calculator className="h-4 w-4 text-yellow-500" />;
    if (name.includes('RULE_APPLICATION')) return <Zap className="h-4 w-4 text-purple-500" />;
    if (name.includes('FINAL_CALCULATION')) return <DollarSign className="h-4 w-4 text-green-500" />;
    return <CheckCircle className="h-4 w-4 text-gray-500" />;
  };

  const getStepTitle = (step: PipelineStep) => {
    const name = step.name.replace(/_/g, ' ').toLowerCase();
    return name.charAt(0).toUpperCase() + name.slice(1);
  };

  const getStepDescription = (step: PipelineStep) => {
    const { name, state } = step;
    
    if (name.includes('BUNDLE_SELECTION') && state?.selectedBundle) {
      return `Selected: ${state.selectedBundle.name} (${state.selectedBundle.duration} days)`;
    }
    
    if (name.includes('RULE_EVALUATION') && state?.rule) {
      const status = state.matched ? 
        <span className="text-green-600 font-medium">✓ Matched</span> : 
        <span className="text-gray-400">Not matched</span>;
      return <span>Evaluating rule "{state.rule.name}" - {status}</span>;
    }
    
    if (name.includes('RULE_APPLICATION') && state?.rule) {
      const impact = state.impact ? (
        <span className={`font-mono font-medium ${state.impact > 0 ? 'text-green-600' : 'text-red-600'}`}>
          {state.impact > 0 ? '+' : ''}{new Intl.NumberFormat('en-US', { 
            style: 'currency', 
            currency: 'USD' 
          }).format(state.impact)}
        </span>
      ) : null;
      return <span>Applied rule "{state.rule.name}" {impact && <>- Impact: {impact}</>}</span>;
    }
    
    if (name.includes('FINAL_CALCULATION') && state) {
      const finalPrice = state.finalPrice || 0;
      const profit = state.profit || 0;
      return (
        <span>
          Final price: <span className="font-mono font-medium">${finalPrice.toFixed(2)}</span> | 
          Profit: <span className={`font-mono font-medium ${profit > 0 ? 'text-green-600' : 'text-red-600'}`}>
            ${profit.toFixed(2)}
          </span>
        </span>
      );
    }
    
    return null;
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          {isStreaming && (
            <div className="flex items-center gap-2">
              <div className={`h-2 w-2 rounded-full animate-pulse ${wsConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-xs text-muted-foreground">
                {wsConnected ? 'Live' : 'Reconnecting...'}
              </span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="max-h-[400px] overflow-y-auto">
          {steps.length === 0 && !isStreaming ? (
            <div className="p-6 text-center text-muted-foreground">
              Run a simulation to see the pricing engine's reasoning process
            </div>
          ) : (
            <div className="divide-y divide-border">
              {steps.map((step, index) => {
                const isLatest = index === steps.length - 1;
                const isExpanded = expandedSteps.has(index);
                const description = getStepDescription(step);
                const hasDetails = step.state || step.debug || step.appliedRules?.length;
                
                return (
                  <div
                    key={`${step.correlationId}-${index}`}
                    className={`group relative transition-all ${
                      isLatest && isStreaming ? 'bg-muted/50' : ''
                    }`}
                  >
                    <div
                      className={`px-6 py-3 ${hasDetails ? 'cursor-pointer hover:bg-muted/30' : ''}`}
                      onClick={() => hasDetails && toggleStep(index)}
                    >
                      <div className="flex gap-3">
                        {hasDetails && (
                          <div className="mt-0.5">
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                        )}
                        <div className="mt-0.5">{getStepIcon(step)}</div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">
                              {getStepTitle(step)}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              <Clock className="inline h-3 w-3 mr-1" />
                              {new Date(step.timestamp).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit',
                              })}
                            </span>
                          </div>
                          {description && (
                            <div className="text-sm text-muted-foreground">
                              {description}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Expandable details */}
                    {hasDetails && isExpanded && (
                      <div className="px-6 pb-3 pl-16 space-y-2">
                        {step.state && (
                          <div className="text-xs">
                            <div className="font-medium text-muted-foreground mb-1">State:</div>
                            <pre className="bg-muted/50 p-2 rounded-md overflow-x-auto">
                              {JSON.stringify(step.state, null, 2)}
                            </pre>
                          </div>
                        )}
                        {step.debug && (
                          <div className="text-xs">
                            <div className="font-medium text-muted-foreground mb-1">Debug Info:</div>
                            <pre className="bg-muted/50 p-2 rounded-md overflow-x-auto">
                              {JSON.stringify(step.debug, null, 2)}
                            </pre>
                          </div>
                        )}
                        {step.appliedRules && step.appliedRules.length > 0 && (
                          <div className="text-xs">
                            <div className="font-medium text-muted-foreground mb-1">Applied Rules:</div>
                            <div className="space-y-1">
                              {step.appliedRules.map((rule, i) => (
                                <div key={i} className="bg-muted/50 px-2 py-1 rounded">
                                  {rule}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Latest step indicator */}
                    {isLatest && isStreaming && (
                      <div className="absolute left-0 top-0 h-full w-1 bg-primary animate-pulse" />
                    )}
                  </div>
                );
              })}</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};