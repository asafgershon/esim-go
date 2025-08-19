import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Progress, Badge } from '@workspace/ui';
import {
  Zap,
  CheckCircle2,
  XCircle,
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Timer,
} from 'lucide-react';

interface PipelineStep {
  correlationId: string;
  name: string;
  timestamp: string;
  state?: any;
  appliedRules?: string[] | null;
  debug?: any;
}

interface PricingRulesSummaryProps {
  pipelineSteps: PipelineStep[];
  isStreaming: boolean;
  finalPrice?: number;
  originalPrice?: number;
  currency?: string;
}

interface RuleStatistics {
  totalEvaluated: number;
  matched: number;
  notMatched: number;
  totalImpact: number;
  appliedRules: Array<{
    name: string;
    impact: number;
    category: string;
  }>;
  evaluationTime: number;
}

export const PricingRulesSummary: React.FC<PricingRulesSummaryProps> = ({
  pipelineSteps,
  isStreaming,
  finalPrice,
  originalPrice,
  currency = 'USD',
}) => {
  const ruleStats = useMemo<RuleStatistics>(() => {
    const stats: RuleStatistics = {
      totalEvaluated: 0,
      matched: 0,
      notMatched: 0,
      totalImpact: 0,
      appliedRules: [],
      evaluationTime: 0,
    };

    let firstTimestamp: Date | null = null;
    let lastTimestamp: Date | null = null;

    pipelineSteps.forEach((step) => {
      const timestamp = new Date(step.timestamp);
      if (!firstTimestamp) firstTimestamp = timestamp;
      lastTimestamp = timestamp;

      // Count rule applications from actual pipeline steps
      const isRuleStep = step.name.includes('APPLY_DISCOUNTS') || 
                        step.name.includes('APPLY_CONSTRAINTS') || 
                        step.name.includes('APPLY_FEES');
      
      if (isRuleStep && step.appliedRules && step.appliedRules.length > 0) {
        // Count each rule in the appliedRules array
        const rulesCount = step.appliedRules.length;
        stats.totalEvaluated += rulesCount;
        stats.matched += rulesCount; // If they're in appliedRules, they matched
        
        // Extract rule details from step state if available
        step.appliedRules.forEach((ruleId) => {
          // Try to get rule name from state or use rule ID
          const ruleName = step.state?.rule?.name || `Rule ${ruleId}`;
          const impact = step.state?.impact || 0;
          const ruleCategory = step.name.replace('APPLY_', ''); // DISCOUNTS, CONSTRAINTS, FEES
          
          stats.totalImpact += impact;
          stats.appliedRules.push({
            name: ruleName,
            impact: impact,
            category: ruleCategory,
          });
        });
      }
    });

    // Calculate total evaluation time
    if (firstTimestamp && lastTimestamp && fir) {
      stats.evaluationTime = lastTimestamp.getTime() - firstTimestamp.getTime();
    }

    return stats;
  }, [pipelineSteps]);

  const matchRate = ruleStats.totalEvaluated > 0 
    ? (ruleStats.matched / ruleStats.totalEvaluated) * 100 
    : 0;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  const getImpactIcon = (impact: number) => {
    if (impact > 0) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (impact < 0) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <DollarSign className="h-4 w-4 text-gray-400" />;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className={`h-5 w-5 ${isStreaming ? 'animate-pulse' : ''}`} />
          Rules Evaluation Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Rule Statistics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <AlertCircle className="h-4 w-4" />
              Total Evaluated
            </div>
            <div className="text-2xl font-bold">{ruleStats.totalEvaluated}</div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              Matched
            </div>
            <div className="text-2xl font-bold text-green-600">{ruleStats.matched}</div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <XCircle className="h-4 w-4 text-gray-400" />
              Not Matched
            </div>
            <div className="text-2xl font-bold text-gray-500">{ruleStats.notMatched}</div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Timer className="h-4 w-4" />
              Evaluation Time
            </div>
            <div className="text-2xl font-bold">{ruleStats.evaluationTime}ms</div>
          </div>
        </div>

        {/* Match Rate Progress Bar */}
        {ruleStats.totalEvaluated > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Match Rate</span>
              <span className="font-medium">{matchRate.toFixed(1)}%</span>
            </div>
            <Progress value={matchRate} className="h-2" />
          </div>
        )}

        {/* Financial Impact Summary */}
        {(ruleStats.totalImpact !== 0 || ruleStats.appliedRules.length > 0) && (
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <span className="text-sm font-medium">Total Rules Impact</span>
              <span className={`text-lg font-bold ${
                ruleStats.totalImpact > 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {ruleStats.totalImpact > 0 ? '+' : ''}{formatCurrency(Math.abs(ruleStats.totalImpact))}
              </span>
            </div>

            {/* Individual Rule Impacts */}
            {ruleStats.appliedRules.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">Applied Rules</h4>
                {ruleStats.appliedRules.map((rule, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 rounded-md bg-muted/30"
                  >
                    <div className="flex items-center gap-2">
                      {getImpactIcon(rule.impact)}
                      <div>
                        <div className="text-sm font-medium">{rule.name}</div>
                        <div className="text-xs text-muted-foreground">
                          <Badge variant="outline" className="text-xs">
                            {rule.category}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <span className={`font-mono text-sm font-medium ${
                      rule.impact > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {rule.impact > 0 ? '+' : ''}{formatCurrency(rule.impact)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Price Impact Summary */}
        {finalPrice && originalPrice && (
          <div className="pt-3 border-t space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Original Price</span>
              <span className="font-mono">{formatCurrency(originalPrice)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Rules Impact</span>
              <span className={`font-mono font-medium ${
                ruleStats.totalImpact > 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {ruleStats.totalImpact > 0 ? '+' : ''}{formatCurrency(ruleStats.totalImpact)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium">Final Price</span>
              <span className="font-mono text-lg font-bold">{formatCurrency(finalPrice)}</span>
            </div>
          </div>
        )}

        {/* Empty State */}
        {ruleStats.totalEvaluated === 0 && !isStreaming && (
          <div className="text-center py-4 text-muted-foreground">
            No rules have been evaluated yet. Run a simulation to see rule statistics.
          </div>
        )}
      </CardContent>
    </Card>
  );
};