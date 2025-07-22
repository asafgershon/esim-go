import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Badge,
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Progress,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@workspace/ui';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Target,
  Zap,
  Users,
} from 'lucide-react';

interface PricingRule {
  id: string;
  type: string;
  name: string;
  description: string;
  priority: number;
  isActive: boolean;
  isEditable: boolean;
  createdAt: string;
  updatedAt: string;
}

interface RuleAnalyticsProps {
  rules: PricingRule[];
}

export const RuleAnalytics: React.FC<RuleAnalyticsProps> = ({ rules }) => {
  const [selectedTimeframe, setSelectedTimeframe] = useState('30d');
  const [selectedMetric, setSelectedMetric] = useState('impact');

  // Mock analytics data - in real implementation, this would come from API
  const mockAnalytics = {
    totalApplications: 1247,
    successRate: 94.2,
    avgImpact: -2.3, // Negative means savings
    topPerformingRules: [
      { id: '1', name: 'Early Bird Discount', applications: 234, impact: -5.2 },
      { id: '2', name: 'Bulk Purchase Discount', applications: 189, impact: -3.8 },
      { id: '3', name: 'Loyalty Discount', applications: 156, impact: -4.1 },
    ],
    ruleConflicts: [
      { rule1: 'Early Bird Discount', rule2: 'Seasonal Promotion', conflicts: 12 },
      { rule1: 'Bulk Discount', rule2: 'New User Discount', conflicts: 8 },
    ],
    performanceMetrics: {
      '7d': { applications: 287, impact: -2.1, successRate: 95.8 },
      '30d': { applications: 1247, impact: -2.3, successRate: 94.2 },
      '90d': { applications: 3891, impact: -2.7, successRate: 93.1 },
    }
  };

  // Calculate rule distribution
  const ruleTypeDistribution = rules.reduce((acc: any, rule) => {
    acc[rule.type] = (acc[rule.type] || 0) + 1;
    return acc;
  }, {});

  // Calculate active/inactive ratio
  const activeRules = rules.filter(r => r.isActive).length;
  const inactiveRules = rules.length - activeRules;

  // Calculate priority distribution
  const priorityDistribution = {
    high: rules.filter(r => r.priority >= 80).length,
    medium: rules.filter(r => r.priority >= 40 && r.priority < 80).length,
    low: rules.filter(r => r.priority < 40).length,
  };

  // Rule type configurations for display
  const ruleTypeConfigs: Record<string, any> = {
    'SYSTEM_MARKUP': { label: 'System Markup', icon: Target, color: 'blue' },
    'SYSTEM_PROCESSING': { label: 'System Processing', icon: Zap, color: 'purple' },
    'BUSINESS_DISCOUNT': { label: 'Business Discount', icon: TrendingUp, color: 'green' },
    'PROMOTION': { label: 'Promotion', icon: BarChart3, color: 'orange' },
    'SEGMENT': { label: 'Customer Segment', icon: Users, color: 'pink' },
  };

  const getTypeConfig = (type: string) => ruleTypeConfigs[type] || ruleTypeConfigs['BUSINESS_DISCOUNT'];

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Rule Applications</p>
                <p className="text-2xl font-bold text-gray-900">
                  {mockAnalytics.performanceMetrics[selectedTimeframe]?.applications?.toLocaleString() || '0'}
                </p>
                <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                  <TrendingUp className="h-3 w-3" />
                  +12.3% vs previous period
                </p>
              </div>
              <Activity className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Success Rate</p>
                <p className="text-2xl font-bold text-gray-900">
                  {mockAnalytics.performanceMetrics[selectedTimeframe]?.successRate || 0}%
                </p>
                <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                  <CheckCircle className="h-3 w-3" />
                  Excellent performance
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Price Impact</p>
                <p className="text-2xl font-bold text-green-600">
                  {mockAnalytics.performanceMetrics[selectedTimeframe]?.impact || 0}%
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Customer savings per transaction
                </p>
              </div>
              <TrendingDown className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Rules</p>
                <p className="text-2xl font-bold text-gray-900">{activeRules}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {inactiveRules} inactive
                </p>
              </div>
              <Target className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Time Range Selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Rule Performance Analytics</h2>
        <div className="flex items-center gap-4">
          <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="conflicts">Conflicts</TabsTrigger>
          <TabsTrigger value="distribution">Distribution</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Rule Type Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Rule Type Distribution</CardTitle>
                <CardDescription>
                  Breakdown of rules by type and their usage
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(ruleTypeDistribution).map(([type, count]) => {
                  const config = getTypeConfig(type);
                  const Icon = config.icon;
                  const percentage = (count / rules.length) * 100;

                  return (
                    <div key={type} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Icon className={`h-4 w-4 text-${config.color}-600`} />
                          <span className="text-sm font-medium">{config.label}</span>
                        </div>
                        <span className="text-sm text-gray-600">{count} rules</span>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Priority Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Priority Distribution</CardTitle>
                <CardDescription>
                  Rule distribution by priority levels
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-red-500" />
                      <span className="text-sm font-medium">High Priority (80-100)</span>
                    </div>
                    <span className="text-sm text-gray-600">{priorityDistribution.high} rules</span>
                  </div>
                  <Progress 
                    value={(priorityDistribution.high / rules.length) * 100} 
                    className="h-2"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-yellow-500" />
                      <span className="text-sm font-medium">Medium Priority (40-79)</span>
                    </div>
                    <span className="text-sm text-gray-600">{priorityDistribution.medium} rules</span>
                  </div>
                  <Progress 
                    value={(priorityDistribution.medium / rules.length) * 100} 
                    className="h-2"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-green-500" />
                      <span className="text-sm font-medium">Low Priority (0-39)</span>
                    </div>
                    <span className="text-sm text-gray-600">{priorityDistribution.low} rules</span>
                  </div>
                  <Progress 
                    value={(priorityDistribution.low / rules.length) * 100} 
                    className="h-2"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Rules</CardTitle>
              <CardDescription>
                Rules with the highest impact on pricing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockAnalytics.topPerformingRules.map((rule, index) => (
                  <div key={rule.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-sm font-medium">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{rule.name}</p>
                        <p className="text-sm text-gray-600">{rule.applications} applications</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-medium ${rule.impact < 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {rule.impact}% impact
                      </p>
                      <p className="text-sm text-gray-500">avg per transaction</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Conflicts Tab */}
        <TabsContent value="conflicts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                Rule Conflicts
              </CardTitle>
              <CardDescription>
                Detected conflicts between pricing rules
              </CardDescription>
            </CardHeader>
            <CardContent>
              {mockAnalytics.ruleConflicts.length > 0 ? (
                <div className="space-y-4">
                  {mockAnalytics.ruleConflicts.map((conflict, index) => (
                    <div key={index} className="border border-yellow-200 rounded-lg p-4 bg-yellow-50">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-gray-900">
                            {conflict.rule1} ↔ {conflict.rule2}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            {conflict.conflicts} conflicts detected in the last {selectedTimeframe}
                          </p>
                        </div>
                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                          {conflict.conflicts} conflicts
                        </Badge>
                      </div>
                      <div className="mt-3">
                        <Button variant="outline" size="sm">
                          Resolve Conflict
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
                  <h3 className="mt-4 text-lg font-medium text-gray-900">No Conflicts Detected</h3>
                  <p className="mt-2 text-gray-500">
                    All pricing rules are working harmoniously together.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Distribution Tab */}
        <TabsContent value="distribution" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Rule Creation Timeline</CardTitle>
                <CardDescription>
                  When rules were created over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Mock timeline data */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full bg-blue-500" />
                      <span className="text-sm">Last 7 days: 2 rules</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full bg-green-500" />
                      <span className="text-sm">Last 30 days: 8 rules</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full bg-gray-400" />
                      <span className="text-sm">Older: {rules.length - 10} rules</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System vs Business Rules</CardTitle>
                <CardDescription>
                  Distribution of editable vs system rules
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-blue-500" />
                        <span className="text-sm font-medium">System Rules</span>
                      </div>
                      <span className="text-sm text-gray-600">
                        {rules.filter(r => !r.isEditable).length} rules
                      </span>
                    </div>
                    <Progress 
                      value={(rules.filter(r => !r.isEditable).length / rules.length) * 100} 
                      className="h-2"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-purple-500" />
                        <span className="text-sm font-medium">Business Rules</span>
                      </div>
                      <span className="text-sm text-gray-600">
                        {rules.filter(r => r.isEditable).length} rules
                      </span>
                    </div>
                    <Progress 
                      value={(rules.filter(r => r.isEditable).length / rules.length) * 100} 
                      className="h-2"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};