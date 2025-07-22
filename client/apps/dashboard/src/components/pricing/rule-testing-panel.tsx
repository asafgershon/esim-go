import React, { useState } from 'react';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  Badge,
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Alert,
  AlertDescription,
  Progress,
} from '@workspace/ui';
import {
  Play,
  TestTube,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Info,
  RefreshCw,
  Target,
  Zap,
  BarChart3,
  Users,
  Copy,
  Download,
} from 'lucide-react';
import { useLazyQuery } from '@apollo/client';
import { toast } from 'sonner';
import { SIMULATE_PRICING_RULE, CALCULATE_PRICE_WITH_RULES } from '../../lib/graphql/queries';

interface PricingRule {
  id: string;
  type: string;
  name: string;
  description: string;
  conditions: any[];
  actions: any[];
  priority: number;
  isActive: boolean;
  isEditable: boolean;
  createdAt: string;
  updatedAt: string;
}

interface RuleTestingPanelProps {
  rules: PricingRule[];
}

interface TestContext {
  bundleId: string;
  bundleName: string;
  bundleGroup: string;
  duration: number;
  cost: number;
  countryId: string;
  regionId: string;
  userId?: string;
  isNewUser: boolean;
  paymentMethod: string;
  requestedDuration?: number;
}

interface TestResult {
  ruleId?: string;
  ruleName?: string;
  matched: boolean;
  impact: number;
  finalPrice: number;
  appliedRules: Array<{
    id: string;
    name: string;
    type: string;
    impact: number;
  }>;
  recommendations?: string[];
  breakdown?: {
    baseCost: number;
    markup: number;
    discounts: number;
    processingFee: number;
    finalRevenue: number;
  };
}

export const RuleTestingPanel: React.FC<RuleTestingPanelProps> = ({ rules }) => {
  const [selectedRule, setSelectedRule] = useState<string>('');
  const [testContext, setTestContext] = useState<TestContext>({
    bundleId: 'test-bundle-1',
    bundleName: 'Standard Fixed 7d',
    bundleGroup: 'Standard Fixed',
    duration: 7,
    cost: 5.50,
    countryId: 'US',
    regionId: 'North America',
    userId: 'test-user-1',
    isNewUser: false,
    paymentMethod: 'FOREIGN_CARD',
    requestedDuration: 7,
  });
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTab, setSelectedTab] = useState('single');

  const [simulateRule] = useLazyQuery(SIMULATE_PRICING_RULE);
  const [calculatePrice] = useLazyQuery(CALCULATE_PRICE_WITH_RULES);

  // Mock data for batch testing
  const batchTestScenarios = [
    { name: 'New User - US - 7 days', countryId: 'US', duration: 7, isNewUser: true },
    { name: 'Returning User - UK - 14 days', countryId: 'GB', duration: 14, isNewUser: false },
    { name: 'Premium User - Japan - 30 days', countryId: 'JP', duration: 30, isNewUser: false },
    { name: 'Israeli Card - IL - 7 days', countryId: 'IL', duration: 7, paymentMethod: 'ISRAELI_CARD' },
    { name: 'Business User - Germany - 60 days', countryId: 'DE', duration: 60, isNewUser: false },
  ];

  // Rule type configurations
  const ruleTypes = [
    { value: 'SYSTEM_MARKUP', label: 'System Markup', icon: Target, color: 'blue' },
    { value: 'SYSTEM_PROCESSING', label: 'System Processing', icon: Zap, color: 'purple' },
    { value: 'BUSINESS_DISCOUNT', label: 'Business Discount', icon: TrendingUp, color: 'green' },
    { value: 'PROMOTION', label: 'Promotional Rule', icon: BarChart3, color: 'orange' },
    { value: 'SEGMENT', label: 'Customer Segment', icon: Users, color: 'pink' },
  ];

  const getRuleTypeConfig = (type: string) => {
    return ruleTypes.find(rt => rt.value === type) || ruleTypes[2];
  };

  const paymentMethods = [
    { value: 'ISRAELI_CARD', label: 'Israeli Card' },
    { value: 'FOREIGN_CARD', label: 'Foreign Card' },
    { value: 'BIT', label: 'Bit Payment' },
    { value: 'AMEX', label: 'American Express' },
    { value: 'DINERS', label: 'Diners Club' },
  ];

  const bundleGroups = [
    'Standard Fixed',
    'Standard - Unlimited Lite',
    'Standard - Unlimited Essential',
    'Standard - Unlimited Plus',
    'Regional Bundles',
  ];

  const countries = [
    { code: 'US', name: 'United States', region: 'North America' },
    { code: 'GB', name: 'United Kingdom', region: 'Europe' },
    { code: 'IL', name: 'Israel', region: 'Middle East' },
    { code: 'JP', name: 'Japan', region: 'Asia' },
    { code: 'DE', name: 'Germany', region: 'Europe' },
    { code: 'FR', name: 'France', region: 'Europe' },
    { code: 'AU', name: 'Australia', region: 'Oceania' },
  ];

  const handleSingleRuleTest = async () => {
    if (!selectedRule) {
      toast.error('Please select a rule to test');
      return;
    }

    const rule = rules.find(r => r.id === selectedRule);
    if (!rule) {
      toast.error('Rule not found');
      return;
    }

    setLoading(true);
    try {
      const result = await simulateRule({
        variables: {
          rule: {
            type: rule.type,
            name: rule.name,
            description: rule.description,
            conditions: rule.conditions,
            actions: rule.actions,
            priority: rule.priority,
            isActive: true,
          },
          testContext,
        },
      });

      if (result.data?.simulatePricingRule) {
        const simulation = result.data.simulatePricingRule;
        const testResult: TestResult = {
          ruleId: rule.id,
          ruleName: rule.name,
          matched: simulation.appliedRules.length > 0,
          impact: simulation.appliedRules.reduce((sum: number, r: any) => sum + r.impact, 0),
          finalPrice: simulation.finalPrice,
          appliedRules: simulation.appliedRules,
          breakdown: {
            baseCost: simulation.baseCost,
            markup: simulation.markup,
            discounts: simulation.totalDiscount,
            processingFee: simulation.processingFee,
            finalRevenue: simulation.finalRevenue,
          },
        };

        setTestResults([testResult]);
        toast.success('Rule test completed successfully');
      }
    } catch (error) {
      console.error('Rule test failed:', error);
      toast.error('Rule test failed');
    } finally {
      setLoading(false);
    }
  };

  const handleFullPricingTest = async () => {
    setLoading(true);
    try {
      const result = await calculatePrice({
        variables: {
          input: {
            numOfDays: testContext.duration,
            regionId: testContext.regionId,
            countryId: testContext.countryId,
            paymentMethod: testContext.paymentMethod,
          },
        },
      });

      if (result.data?.calculatePriceWithRules) {
        const calculation = result.data.calculatePriceWithRules;
        const testResult: TestResult = {
          matched: calculation.appliedRules.length > 0,
          impact: calculation.appliedRules.reduce((sum: number, r: any) => sum + r.impact, 0),
          finalPrice: calculation.finalPrice,
          appliedRules: calculation.appliedRules,
          breakdown: {
            baseCost: calculation.baseCost,
            markup: calculation.markup,
            discounts: calculation.totalDiscount,
            processingFee: calculation.processingFee,
            finalRevenue: calculation.finalRevenue,
          },
        };

        setTestResults([testResult]);
        toast.success('Full pricing test completed successfully');
      }
    } catch (error) {
      console.error('Full pricing test failed:', error);
      toast.error('Full pricing test failed');
    } finally {
      setLoading(false);
    }
  };

  const handleBatchTest = async () => {
    setLoading(true);
    try {
      const batchResults: TestResult[] = [];
      
      for (const scenario of batchTestScenarios) {
        const country = countries.find(c => c.code === scenario.countryId);
        if (!country) continue;

        const result = await calculatePrice({
          variables: {
            input: {
              numOfDays: scenario.duration,
              regionId: country.region,
              countryId: scenario.countryId,
              paymentMethod: scenario.paymentMethod || testContext.paymentMethod,
            },
          },
        });

        if (result.data?.calculatePriceWithRules) {
          const calculation = result.data.calculatePriceWithRules;
          batchResults.push({
            matched: calculation.appliedRules.length > 0,
            impact: calculation.appliedRules.reduce((sum: number, r: any) => sum + r.impact, 0),
            finalPrice: calculation.finalPrice,
            appliedRules: calculation.appliedRules,
            breakdown: {
              baseCost: calculation.baseCost,
              markup: calculation.markup,
              discounts: calculation.totalDiscount,
              processingFee: calculation.processingFee,
              finalRevenue: calculation.finalRevenue,
            },
          });
        }
      }

      setTestResults(batchResults);
      toast.success(`Batch test completed: ${batchResults.length} scenarios tested`);
    } catch (error) {
      console.error('Batch test failed:', error);
      toast.error('Batch test failed');
    } finally {
      setLoading(false);
    }
  };

  const exportTestResults = () => {
    const exportData = testResults.map((result, index) => ({
      scenario: batchTestScenarios[index]?.name || `Test ${index + 1}`,
      matched: result.matched,
      impact: result.impact,
      finalPrice: result.finalPrice,
      appliedRules: result.appliedRules.map(r => r.name).join(', '),
      baseCost: result.breakdown?.baseCost,
      markup: result.breakdown?.markup,
      discounts: result.breakdown?.discounts,
      processingFee: result.breakdown?.processingFee,
      finalRevenue: result.breakdown?.finalRevenue,
    }));

    const csvContent = [
      Object.keys(exportData[0]).join(','),
      ...exportData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rule-test-results-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success('Test results exported successfully');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Rule Testing Lab</h2>
          <p className="text-gray-600 mt-1">
            Test individual rules or full pricing scenarios with custom contexts
          </p>
        </div>
        {testResults.length > 0 && (
          <Button onClick={exportTestResults} variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export Results
          </Button>
        )}
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="single">Single Rule Test</TabsTrigger>
          <TabsTrigger value="full">Full Pricing Test</TabsTrigger>
          <TabsTrigger value="batch">Batch Testing</TabsTrigger>
        </TabsList>

        {/* Single Rule Test Tab */}
        <TabsContent value="single" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Test Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TestTube className="h-5 w-5" />
                  Rule Test Configuration
                </CardTitle>
                <CardDescription>
                  Select a rule and configure the test context
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Rule to Test</Label>
                  <Select value={selectedRule} onValueChange={setSelectedRule}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a rule to test" />
                    </SelectTrigger>
                    <SelectContent>
                      {rules.map((rule) => {
                        const typeConfig = getRuleTypeConfig(rule.type);
                        const Icon = typeConfig.icon;
                        return (
                          <SelectItem key={rule.id} value={rule.id}>
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4" />
                              <div>
                                <div className="font-medium">{rule.name}</div>
                                <div className="text-xs text-gray-500">{typeConfig.label}</div>
                              </div>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Country</Label>
                    <Select 
                      value={testContext.countryId} 
                      onValueChange={(value) => {
                        const country = countries.find(c => c.code === value);
                        setTestContext(prev => ({ 
                          ...prev, 
                          countryId: value,
                          regionId: country?.region || 'Unknown'
                        }));
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {countries.map((country) => (
                          <SelectItem key={country.code} value={country.code}>
                            {country.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Duration (days)</Label>
                    <Input
                      type="number"
                      value={testContext.duration}
                      onChange={(e) => setTestContext(prev => ({ 
                        ...prev, 
                        duration: parseInt(e.target.value) || 1 
                      }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Bundle Group</Label>
                    <Select 
                      value={testContext.bundleGroup} 
                      onValueChange={(value) => setTestContext(prev => ({ ...prev, bundleGroup: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {bundleGroups.map((group) => (
                          <SelectItem key={group} value={group}>
                            {group}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Payment Method</Label>
                    <Select 
                      value={testContext.paymentMethod} 
                      onValueChange={(value) => setTestContext(prev => ({ ...prev, paymentMethod: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {paymentMethods.map((method) => (
                          <SelectItem key={method.value} value={method.value}>
                            {method.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Base Cost ($)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={testContext.cost}
                      onChange={(e) => setTestContext(prev => ({ 
                        ...prev, 
                        cost: parseFloat(e.target.value) || 0 
                      }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>New User</Label>
                    <Switch
                      checked={testContext.isNewUser}
                      onCheckedChange={(checked) => setTestContext(prev => ({ 
                        ...prev, 
                        isNewUser: checked 
                      }))}
                    />
                  </div>
                </div>

                <Button 
                  onClick={handleSingleRuleTest} 
                  disabled={loading || !selectedRule}
                  className="w-full flex items-center gap-2"
                >
                  {loading ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                  Test Rule
                </Button>
              </CardContent>
            </Card>

            {/* Selected Rule Preview */}
            {selectedRule && (
              <Card>
                <CardHeader>
                  <CardTitle>Rule Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const rule = rules.find(r => r.id === selectedRule);
                    if (!rule) return null;

                    const typeConfig = getRuleTypeConfig(rule.type);
                    const Icon = typeConfig.icon;

                    return (
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-full bg-${typeConfig.color}-100`}>
                            <Icon className={`h-4 w-4 text-${typeConfig.color}-600`} />
                          </div>
                          <div>
                            <h3 className="font-medium">{rule.name}</h3>
                            <p className="text-sm text-gray-500">{typeConfig.label}</p>
                          </div>
                          <div className="ml-auto">
                            <Badge variant={rule.isActive ? 'default' : 'secondary'}>
                              {rule.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                        </div>

                        {rule.description && (
                          <p className="text-sm text-gray-600">{rule.description}</p>
                        )}

                        <div className="space-y-3">
                          <div>
                            <h4 className="text-sm font-medium text-gray-900 mb-2">Conditions</h4>
                            <div className="space-y-1">
                              {rule.conditions.map((condition, index) => (
                                <div key={index} className="text-xs bg-gray-50 rounded px-2 py-1">
                                  {condition.field} {condition.operator} {JSON.stringify(condition.value)}
                                </div>
                              ))}
                            </div>
                          </div>

                          <div>
                            <h4 className="text-sm font-medium text-gray-900 mb-2">Actions</h4>
                            <div className="space-y-1">
                              {rule.actions.map((action, index) => (
                                <div key={index} className="text-xs bg-blue-50 rounded px-2 py-1">
                                  {action.type}: {action.value}
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-sm">
                            <span>Priority: <strong>{rule.priority}</strong></span>
                            <span>Created: {new Date(rule.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Full Pricing Test Tab */}
        <TabsContent value="full" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Full Pricing Engine Test
              </CardTitle>
              <CardDescription>
                Test the complete pricing calculation with all active rules
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Country</Label>
                    <Select 
                      value={testContext.countryId} 
                      onValueChange={(value) => {
                        const country = countries.find(c => c.code === value);
                        setTestContext(prev => ({ 
                          ...prev, 
                          countryId: value,
                          regionId: country?.region || 'Unknown'
                        }));
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {countries.map((country) => (
                          <SelectItem key={country.code} value={country.code}>
                            {country.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Duration (days)</Label>
                    <Input
                      type="number"
                      value={testContext.duration}
                      onChange={(e) => setTestContext(prev => ({ 
                        ...prev, 
                        duration: parseInt(e.target.value) || 1 
                      }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Payment Method</Label>
                    <Select 
                      value={testContext.paymentMethod} 
                      onValueChange={(value) => setTestContext(prev => ({ ...prev, paymentMethod: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {paymentMethods.map((method) => (
                          <SelectItem key={method.value} value={method.value}>
                            {method.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button 
                  onClick={handleFullPricingTest} 
                  disabled={loading}
                  className="w-full flex items-center gap-2"
                >
                  {loading ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                  Run Full Pricing Test
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Batch Testing Tab */}
        <TabsContent value="batch" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Batch Testing Scenarios
              </CardTitle>
              <CardDescription>
                Test multiple scenarios to understand rule behavior across different contexts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {batchTestScenarios.map((scenario, index) => (
                    <div key={index} className="border rounded-lg p-3">
                      <h4 className="font-medium text-sm">{scenario.name}</h4>
                      <div className="text-xs text-gray-500 mt-1">
                        {scenario.countryId} • {scenario.duration} days • {scenario.isNewUser ? 'New' : 'Returning'}
                      </div>
                    </div>
                  ))}
                </div>

                <Button 
                  onClick={handleBatchTest} 
                  disabled={loading}
                  className="w-full flex items-center gap-2"
                >
                  {loading ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                  Run Batch Test ({batchTestScenarios.length} scenarios)
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Test Results */}
      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Test Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {testResults.map((result, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Badge variant={result.matched ? 'default' : 'secondary'}>
                        {result.matched ? 'Matched' : 'No Match'}
                      </Badge>
                      {result.ruleName && (
                        <Badge variant="outline">{result.ruleName}</Badge>
                      )}
                      {selectedTab === 'batch' && (
                        <span className="text-sm font-medium">
                          {batchTestScenarios[index]?.name || `Scenario ${index + 1}`}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-medium ${
                        result.impact < 0 ? 'text-green-600' : result.impact > 0 ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {result.impact < 0 ? '' : '+'}${result.impact.toFixed(2)} impact
                      </span>
                      <span className="text-lg font-bold">${result.finalPrice.toFixed(2)}</span>
                    </div>
                  </div>

                  {result.breakdown && (
                    <div className="grid grid-cols-5 gap-4 mb-3">
                      <div className="text-center">
                        <div className="text-sm text-gray-500">Base Cost</div>
                        <div className="font-medium">${result.breakdown.baseCost.toFixed(2)}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-gray-500">Markup</div>
                        <div className="font-medium">${result.breakdown.markup.toFixed(2)}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-gray-500">Discounts</div>
                        <div className="font-medium text-green-600">-${result.breakdown.discounts.toFixed(2)}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-gray-500">Processing</div>
                        <div className="font-medium">${result.breakdown.processingFee.toFixed(2)}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-gray-500">Revenue</div>
                        <div className="font-medium">${result.breakdown.finalRevenue.toFixed(2)}</div>
                      </div>
                    </div>
                  )}

                  {result.appliedRules.length > 0 && (
                    <div>
                      <h5 className="text-sm font-medium mb-2">Applied Rules</h5>
                      <div className="space-y-1">
                        {result.appliedRules.map((appliedRule, ruleIndex) => (
                          <div key={ruleIndex} className="flex items-center justify-between text-sm bg-blue-50 rounded px-2 py-1">
                            <span className="font-medium">{appliedRule.name}</span>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {appliedRule.type}
                              </Badge>
                              <span className={appliedRule.impact < 0 ? 'text-green-600' : 'text-red-600'}>
                                {appliedRule.impact < 0 ? '' : '+'}${appliedRule.impact.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {result.recommendations && result.recommendations.length > 0 && (
                    <Alert className="mt-3">
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        <div className="space-y-1">
                          {result.recommendations.map((rec, recIndex) => (
                            <div key={recIndex} className="text-sm">{rec}</div>
                          ))}
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {testResults.length === 0 && (
        <Card className="p-12">
          <div className="text-center">
            <TestTube className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">No Test Results</h3>
            <p className="mt-2 text-gray-500">
              Run a test to see how your pricing rules perform in different scenarios
            </p>
          </div>
        </Card>
      )}
    </div>
  );
};