import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  Badge,
  Alert,
  AlertDescription,
  Separator,
  ScrollArea,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@workspace/ui';
import {
  Play,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Download,
  Copy,
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

interface RuleTestModalProps {
  rule: PricingRule;
  open: boolean;
  onOpenChange: (open: boolean) => void;
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
  breakdown?: {
    baseCost: number;
    markup: number;
    discounts: number;
    processingFee: number;
    finalRevenue: number;
  };
}

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

export const RuleTestModal: React.FC<RuleTestModalProps> = ({ rule, open, onOpenChange }) => {
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
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('configure');

  const [simulateRule] = useLazyQuery(SIMULATE_PRICING_RULE);
  const [calculatePrice] = useLazyQuery(CALCULATE_PRICE_WITH_RULES);

  const handleTestRule = async () => {
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

        setTestResult(testResult);
        setActiveTab('results');
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Test Rule: {rule.name}</DialogTitle>
          <DialogDescription>
            Configure test parameters and see how this rule affects pricing
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="configure">Configure Test</TabsTrigger>
            <TabsTrigger value="results" disabled={!testResult}>
              Results {testResult && <CheckCircle className="ml-2 h-3 w-3" />}
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[500px] mt-4">
            <TabsContent value="configure" className="space-y-4 pr-4">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium mb-3">Bundle Information</h3>
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
                </div>

                <Separator />

                <div>
                  <h3 className="text-sm font-medium mb-3">Location & Payment</h3>
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
                </div>

                <Separator />

                <div>
                  <h3 className="text-sm font-medium mb-3">Customer & Pricing</h3>
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
                </div>

                <Separator />

                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium mb-2">Rule Details</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Type:</span>
                      <Badge variant="outline">{rule.type}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Priority:</span>
                      <span className="font-medium">{rule.priority}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <Badge variant={rule.isActive ? 'default' : 'secondary'}>
                        {rule.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button 
                    onClick={handleTestRule} 
                    disabled={loading}
                    className="flex-1 flex items-center gap-2"
                  >
                    {loading ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                    Run Test
                  </Button>
                  <Button
                    variant="outline"
                    onClick={copyTestContext}
                    className="flex items-center gap-2"
                  >
                    <Copy className="h-4 w-4" />
                    Copy Context
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="results" className="space-y-4 pr-4">
              {testResult && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={testResult.matched ? 'default' : 'secondary'}
                        className="text-base py-1"
                      >
                        {testResult.matched ? 'Rule Matched' : 'Rule Not Matched'}
                      </Badge>
                      {testResult.matched && (
                        <span className={`text-sm font-medium ${
                          testResult.impact < 0 ? 'text-green-600' : testResult.impact > 0 ? 'text-red-600' : 'text-gray-600'
                        }`}>
                          {testResult.impact < 0 ? '' : '+'}${testResult.impact.toFixed(2)} impact
                        </span>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={exportResult}
                      className="flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Export
                    </Button>
                  </div>

                  {testResult.breakdown && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="text-sm font-medium mb-3">Price Breakdown</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Base Cost:</span>
                          <span className="font-medium">${testResult.breakdown.baseCost.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Markup:</span>
                          <span className="font-medium">${testResult.breakdown.markup.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Discounts:</span>
                          <span className="font-medium text-green-600">-${testResult.breakdown.discounts.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Processing Fee:</span>
                          <span className="font-medium">${testResult.breakdown.processingFee.toFixed(2)}</span>
                        </div>
                        <Separator className="my-2" />
                        <div className="flex justify-between">
                          <span className="font-medium">Final Price:</span>
                          <span className="font-bold text-lg">${testResult.finalPrice.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Revenue:</span>
                          <span className="font-medium">${testResult.breakdown.finalRevenue.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {testResult.appliedRules.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium mb-2">Applied Rules</h3>
                      <div className="space-y-2">
                        {testResult.appliedRules.map((appliedRule, index) => (
                          <div key={index} className="flex items-center justify-between bg-blue-50 rounded-lg px-3 py-2">
                            <div>
                              <span className="font-medium text-sm">{appliedRule.name}</span>
                              <Badge variant="outline" className="ml-2 text-xs">
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
                        This rule did not match the test context. Check the rule conditions to understand why.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};