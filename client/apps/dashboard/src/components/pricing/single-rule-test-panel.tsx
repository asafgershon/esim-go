import React, { useState, useEffect } from 'react';
import {
  Button,
  ScrollArea,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Badge,
  Switch,
  Alert,
  AlertDescription,
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
  Loader2,
} from 'lucide-react';
import { useLazyQuery, useQuery } from '@apollo/client';
import { toast } from 'sonner';
import { SIMULATE_PRICING_RULE, GET_COUNTRY_BUNDLES, GET_COUNTRIES } from '../../lib/graphql/queries';

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

interface SingleRuleTestPanelProps {
  rule: PricingRule;
}

interface Bundle {
  bundleName: string;
  countryName: string;
  countryId: string;
  duration: number;
  cost: number;
  costPlus: number;
  totalCost: number;
  discountRate: number;
  discountValue: number;
  priceAfterDiscount: number;
  processingRate: number;
  processingCost: number;
  finalRevenue: number;
  currency: string;
  pricePerDay: number;
  hasCustomDiscount: boolean;
  planId: string;
  isUnlimited: boolean;
  dataAmount: string;
  bundleGroup: string;
}

interface Country {
  iso: string;
  name: string;
  nameHebrew: string;
  region: string;
  flag: string;
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
  isNewUser?: boolean;
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

export const SingleRuleTestPanel: React.FC<SingleRuleTestPanelProps> = ({ rule }) => {
  const [selectedCountryId, setSelectedCountryId] = useState<string>('US');
  const [selectedBundle, setSelectedBundle] = useState<Bundle | null>(null);
  const [testContext, setTestContext] = useState<TestContext>(() => {
    return {
      bundleId: '',
      bundleName: '',
      bundleGroup: '',
      duration: 7,
      cost: 0,
      countryId: 'US',
      regionId: 'AMERICA',
      isNewUser: false,
      paymentMethod: 'FOREIGN_CARD',
      requestedDuration: 7,
    };
  });
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const [simulateRule] = useLazyQuery(SIMULATE_PRICING_RULE);
  
  // Query for countries
  const { data: countriesData, loading: countriesLoading } = useQuery(GET_COUNTRIES);
  
  // Query for bundles when country is selected
  const { data: bundlesData, loading: bundlesLoading, refetch: refetchBundles } = useQuery(
    GET_COUNTRY_BUNDLES,
    {
      variables: { countryId: selectedCountryId },
      skip: !selectedCountryId,
    }
  );

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


  const countries: Country[] = countriesData?.countries || [];
  const bundles: Bundle[] = bundlesData?.countryBundles || [];
  
  // Update test context when bundle selection changes
  useEffect(() => {
    if (selectedBundle) {
      setTestContext(prev => ({
        ...prev,
        bundleId: selectedBundle.planId,
        bundleName: selectedBundle.bundleName,
        bundleGroup: selectedBundle.bundleGroup,
        duration: selectedBundle.duration,
        cost: selectedBundle.cost,
        countryId: selectedBundle.countryId,
        regionId: getRegionForCountry(selectedBundle.countryId),
        requestedDuration: selectedBundle.duration,
      }));
    }
  }, [selectedBundle]);
  
  // Helper function to get region for country
  const getRegionForCountry = (countryId: string): string => {
    const country = countries.find(c => c.iso === countryId);
    return country?.region || 'AMERICA';
  };

  const handleRuleTest = async () => {
    setLoading(true);
    try {
      // Strip __typename from conditions and actions to avoid GraphQL input type errors
      const cleanConditions = rule.conditions.map(({ __typename, ...condition }) => condition);
      const cleanActions = rule.actions.map(({ __typename, ...action }) => action);

      const result = await simulateRule({
        variables: {
          rule: {
            type: rule.type,
            name: rule.name,
            description: rule.description,
            conditions: cleanConditions,
            actions: cleanActions,
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

        setTestResult(testResult);
        setShowResults(true);
        toast.success('Rule test completed successfully');
      }
    } catch (error) {
      console.error('Rule test failed:', error);
      toast.error('Rule test failed');
    } finally {
      setLoading(false);
    }
  };

  const copyTestContext = () => {
    navigator.clipboard.writeText(JSON.stringify(testContext, null, 2));
    toast.success('Test context copied to clipboard');
  };

  const exportResult = () => {
    if (!testResult) return;

    const exportData = {
      rule: {
        id: rule.id,
        name: rule.name,
        type: rule.type,
      },
      testContext,
      result: {
        matched: testResult.matched,
        impact: testResult.impact,
        finalPrice: testResult.finalPrice,
        appliedRules: testResult.appliedRules,
        breakdown: testResult.breakdown,
      },
      timestamp: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rule-test-${rule.name.replace(/\s+/g, '-').toLowerCase()}-${new Date().getTime()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success('Test result exported');
  };

  const typeConfig = getRuleTypeConfig(rule.type);
  const Icon = typeConfig.icon;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  return (
    <ScrollArea className="flex-1" showOnHover={true}>
      <div className="space-y-4 p-4">
        {/* Rule Information */}
        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Icon className="h-4 w-4 text-gray-600" />
                <h4 className="font-medium text-sm">{rule.name}</h4>
              </div>
              <p className="text-xs text-gray-600">
                {typeConfig.label} • Priority: {rule.priority} • {rule.isActive ? 'Active' : 'Inactive'}
              </p>
              {rule.description && (
                <p className="text-xs text-gray-500 mt-1">{rule.description}</p>
              )}
            </div>
            <Badge variant={rule.isActive ? 'default' : 'secondary'} className="text-xs">
              {rule.isActive ? 'Active' : 'Inactive'}
            </Badge>
          </div>
          
          <div className="grid grid-cols-2 gap-3 mt-3">
            <div>
              <div className="text-xs font-medium text-gray-700 mb-1">Conditions ({rule.conditions.length})</div>
              <div className="space-y-1">
                {rule.conditions.slice(0, 2).map((condition, index) => (
                  <div key={index} className="text-xs bg-white rounded px-2 py-1 border">
                    {condition.field} {condition.operator} {JSON.stringify(condition.value)}
                  </div>
                ))}
                {rule.conditions.length > 2 && (
                  <div className="text-xs text-gray-500">+{rule.conditions.length - 2} more</div>
                )}
              </div>
            </div>
            
            <div>
              <div className="text-xs font-medium text-gray-700 mb-1">Actions ({rule.actions.length})</div>
              <div className="space-y-1">
                {rule.actions.slice(0, 2).map((action, index) => (
                  <div key={index} className="text-xs bg-blue-50 rounded px-2 py-1 border border-blue-200">
                    {action.type}: {action.value}
                  </div>
                ))}
                {rule.actions.length > 2 && (
                  <div className="text-xs text-gray-500">+{rule.actions.length - 2} more</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Test Configuration */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-3">
            <TestTube className="h-4 w-4 text-gray-600" />
            <h3 className="font-medium text-sm">Test Configuration</h3>
          </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Country</Label>
                    <Select 
                      value={selectedCountryId} 
                      onValueChange={(value) => {
                        setSelectedCountryId(value);
                        setSelectedBundle(null); // Reset bundle when country changes
                      }}
                      disabled={countriesLoading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={countriesLoading ? "Loading countries..." : "Select country"} />
                      </SelectTrigger>
                      <SelectContent>
                        {countries.map((country) => (
                          <SelectItem key={country.iso} value={country.iso}>
                            {country.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Bundle</Label>
                    <Select 
                      value={selectedBundle?.planId || ''} 
                      onValueChange={(value) => {
                        const bundle = bundles.find(b => b.planId === value);
                        setSelectedBundle(bundle || null);
                      }}
                      disabled={bundlesLoading || !selectedCountryId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={
                          bundlesLoading 
                            ? "Loading bundles..." 
                            : !selectedCountryId 
                              ? "Select country first" 
                              : "Select bundle"
                        } />
                      </SelectTrigger>
                      <SelectContent>
                        {bundles.map((bundle) => (
                          <SelectItem key={bundle.planId} value={bundle.planId}>
                            {bundle.bundleName} - {bundle.duration}d - ${bundle.cost.toFixed(2)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Bundle Details (Read-only) */}
                {selectedBundle && (
                  <div className="bg-blue-50 p-3 rounded-lg space-y-2">
                    <div className="text-sm font-medium text-blue-900">Selected Bundle Details</div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div><span className="text-blue-700">Group:</span> {selectedBundle.bundleGroup}</div>
                      <div><span className="text-blue-700">Duration:</span> {selectedBundle.duration} days</div>
                      <div><span className="text-blue-700">Base Cost:</span> ${selectedBundle.cost.toFixed(2)}</div>
                      <div><span className="text-blue-700">Data:</span> {selectedBundle.isUnlimited ? 'Unlimited' : selectedBundle.dataAmount}</div>
                    </div>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-3">
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


          {!selectedBundle && selectedCountryId && bundles.length === 0 && !bundlesLoading && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                No bundles available for the selected country. Try selecting a different country.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2 pt-2">
            <Button 
              onClick={handleRuleTest} 
              disabled={loading || !selectedBundle || bundlesLoading}
              className="flex-1 flex items-center gap-2"
            >
              {loading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : bundlesLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              {bundlesLoading ? 'Loading...' : 'Test Rule'}
            </Button>
            <Button
              variant="outline"
              onClick={copyTestContext}
              disabled={!selectedBundle}
              className="flex items-center gap-2"
            >
              <Copy className="h-4 w-4" />
              Copy Context
            </Button>
          </div>
        </div>

        {/* Test Results */}
        {showResults && testResult && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <h3 className="font-medium text-sm">Test Results</h3>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={exportResult}
                className="flex items-center gap-2 h-7"
              >
                <Download className="h-3 w-3" />
                Export
              </Button>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <Badge 
                  variant={testResult.matched ? 'default' : 'secondary'}
                  className="text-sm"
                >
                  {testResult.matched ? 'Rule Matched' : 'Rule Not Matched'}
                </Badge>
                <div className="text-right">
                  <div className="font-mono font-medium text-lg">
                    {formatCurrency(testResult.finalPrice)}
                  </div>
                  {testResult.matched && (
                    <div className={`text-xs font-medium ${
                      testResult.impact < 0 ? 'text-green-600' : testResult.impact > 0 ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {testResult.impact < 0 ? '' : '+'}${testResult.impact.toFixed(2)} impact
                    </div>
                  )}
                </div>
              </div>
            </div>

            {testResult.breakdown && (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Base cost</span>
                  <span className="font-mono">{formatCurrency(testResult.breakdown.baseCost)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Markup</span>
                  <span className="font-mono">+ {formatCurrency(testResult.breakdown.markup)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Discounts</span>
                  <span className="font-mono text-green-600">- {formatCurrency(testResult.breakdown.discounts)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Processing fee</span>
                  <span className="font-mono text-orange-600">- {formatCurrency(testResult.breakdown.processingFee)}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="font-medium">Final price</span>
                  <span className="font-mono font-medium">{formatCurrency(testResult.finalPrice)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium">Net revenue</span>
                  <span className="font-mono font-medium text-green-600">{formatCurrency(testResult.breakdown.finalRevenue)}</span>
                </div>
              </div>
            )}

            {testResult.appliedRules.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700">Applied Rules</h4>
                <div className="space-y-1">
                  {testResult.appliedRules.map((appliedRule, index) => (
                    <div key={index} className="flex items-center justify-between bg-blue-50 rounded px-2 py-1.5 border border-blue-200">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{appliedRule.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {appliedRule.type}
                        </Badge>
                      </div>
                      <span className={`text-sm font-medium ${
                        appliedRule.impact < 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {appliedRule.impact < 0 ? '' : '+'}${appliedRule.impact.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!testResult.matched && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  This rule did not match the test context. Review the rule conditions to understand why it didn't apply.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </div>
    </ScrollArea>
  );
};