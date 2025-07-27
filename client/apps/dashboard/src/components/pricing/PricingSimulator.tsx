import React, { useState } from 'react';
import { useLazyQuery, useQuery } from '@apollo/client';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Slider,
  Badge,
  Alert,
  AlertDescription,
} from '@workspace/ui';
import {
  Calculator,
  CreditCard,
  Globe,
  Calendar,
  Zap,
  RefreshCw,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  GET_COUNTRIES,
  GET_COUNTRY_BUNDLES,
  CALCULATE_BATCH_ADMIN_PRICING,
} from '../../lib/graphql/queries';
import {
  GetCountriesQuery,
  GetCountryBundlesQuery,
  CalculateBatchAdminPricingQuery,
  CalculateBatchAdminPricingQueryVariables,
  PricingRule,
} from '@/__generated__/graphql';
import { PipelineStepVisualization } from './PipelineStepVisualization';
import { RuleImpactCard } from './RuleImpactCard';

interface PricingSimulatorProps {
  selectedRule?: PricingRule | null;
  className?: string;
}

interface TestInputs {
  countryISO: string;
  duration: number;
  paymentMethod: string;
}

const paymentMethods = [
  { value: 'ISRAELI_CARD', label: 'Israeli Credit Card', icon: CreditCard },
  { value: 'FOREIGN_CARD', label: 'Foreign Credit Card', icon: CreditCard },
  { value: 'AMEX', label: 'American Express', icon: CreditCard },
  { value: 'BIT', label: 'Bit Payment', icon: CreditCard },
  { value: 'DINERS', label: 'Diners Club', icon: CreditCard },
];

export const PricingSimulator: React.FC<PricingSimulatorProps> = ({
  selectedRule,
  className = '',
}) => {
  const [testInputs, setTestInputs] = useState<TestInputs>({
    countryISO: '',
    duration: 7,
    paymentMethod: 'ISRAELI_CARD',
  });

  const [selectedBundle, setSelectedBundle] = useState<string>('');

  // Fetch countries
  const {
    data: countriesData,
    loading: countriesLoading,
  } = useQuery<GetCountriesQuery>(GET_COUNTRIES);

  // Fetch bundles for selected country
  const {
    data: bundlesData,
    loading: bundlesLoading,
    refetch: refetchBundles,
  } = useQuery<GetCountryBundlesQuery>(GET_COUNTRY_BUNDLES, {
    variables: { countryId: testInputs.countryISO },
    skip: !testInputs.countryISO,
  });

  // Calculate pricing
  const [
    calculatePricing,
    {
      data: pricingData,
      loading: pricingLoading,
      error: pricingError,
    },
  ] = useLazyQuery<
    CalculateBatchAdminPricingQuery,
    CalculateBatchAdminPricingQueryVariables
  >(CALCULATE_BATCH_ADMIN_PRICING);

  const countries = countriesData?.countries || [];
  const bundles = bundlesData?.bundlesForCountry?.bundles || [];

  const handleCountryChange = (countryISO: string) => {
    setTestInputs((prev) => ({ ...prev, countryISO }));
    setSelectedBundle(''); // Reset bundle selection when country changes
    if (countryISO) {
      refetchBundles();
    }
  };

  const handleRunTest = async () => {
    if (!testInputs.countryISO || !selectedBundle || selectedBundle === 'loading' || selectedBundle === 'no-bundles') {
      toast.error('Please select a country and bundle');
      return;
    }

    try {
      const bundle = bundles.find((b) => b.esimGoName === selectedBundle);
      if (!bundle) {
        toast.error('Selected bundle not found');
        return;
      }

      await calculatePricing({
        variables: {
          inputs: [
            {
              countryId: testInputs.countryISO,
              numOfDays: testInputs.duration,
              paymentMethod: testInputs.paymentMethod,
            },
          ],
        },
      });

      toast.success('Pricing calculation completed');
    } catch (error) {
      toast.error('Failed to calculate pricing');
      console.error('Pricing calculation error:', error);
    }
  };

  const pricingResult = pricingData?.calculatePrices?.[0];
  const appliedRules = pricingResult?.appliedRules || [];
  const selectedRuleApplied = selectedRule
    ? appliedRules.find((rule) => rule.name === selectedRule.name)
    : null;


  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-3">
        <Calculator className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-semibold">Pricing Simulator</h3>
        <Badge variant="outline" className="bg-green-50 text-green-700">
          Live Testing
        </Badge>
      </div>

      {selectedRule && (
        <Alert>
          <Zap className="h-4 w-4" />
          <AlertDescription>
            Testing rule: <strong>{selectedRule.name}</strong> ({selectedRule.category})
          </AlertDescription>
        </Alert>
      )}

      {/* Test Inputs */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Globe className="h-4 w-4" />
            Test Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          {/* Country Selection */}
          <div className="space-y-2">
            <Label htmlFor="country">Country</Label>
            <Select
              value={testInputs.countryISO}
              onValueChange={handleCountryChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a country" />
              </SelectTrigger>
              <SelectContent>
                {countriesLoading ? (
                  <SelectItem value="loading" disabled>
                    Loading countries...
                  </SelectItem>
                ) : (
                  countries.map((country) => (
                    <SelectItem key={country.iso} value={country.iso}>
                      {country.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Bundle Selection */}
          {testInputs.countryISO && (
            <div className="space-y-2">
              <Label htmlFor="bundle">Bundle</Label>
              <Select value={selectedBundle} onValueChange={setSelectedBundle}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a bundle" />
                </SelectTrigger>
                <SelectContent>
                  {bundlesLoading ? (
                    <SelectItem value="loading" disabled>
                      Loading bundles...
                    </SelectItem>
                  ) : bundles.length === 0 ? (
                    <SelectItem value="no-bundles" disabled>
                      No bundles available
                    </SelectItem>
                  ) : (
                    bundles.map((bundle) => (
                      <SelectItem key={bundle.esimGoName} value={bundle.esimGoName}>
                        {bundle.esimGoName} - {bundle.validityInDays} days
                        {bundle.isUnlimited ? ' (Unlimited)' : ` (${bundle.data})`}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Duration */}
          <div className="space-y-2">
            <Label htmlFor="duration">
              Duration: {testInputs.duration} days
            </Label>
            <Slider
              value={[testInputs.duration]}
              onValueChange={([value]) =>
                setTestInputs((prev) => ({ ...prev, duration: value }))
              }
              min={1}
              max={90}
              step={1}
              className="w-full"
            />
          </div>

          {/* Payment Method */}
          <div className="space-y-2">
            <Label htmlFor="payment">Payment Method</Label>
            <Select
              value={testInputs.paymentMethod}
              onValueChange={(value) =>
                setTestInputs((prev) => ({ ...prev, paymentMethod: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {paymentMethods.map((method) => {
                  const Icon = method.icon;
                  return (
                    <SelectItem key={method.value} value={method.value}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        {method.label}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Run Test Button */}
          <Button
            onClick={handleRunTest}
            disabled={
              !testInputs.countryISO || !selectedBundle || pricingLoading
            }
            className="w-full"
          >
            {pricingLoading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Calculating...
              </>
            ) : (
              <>
                <Calculator className="h-4 w-4 mr-2" />
                Run Pricing Test
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Error Display */}
      {pricingError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Error calculating pricing: {pricingError.message}
          </AlertDescription>
        </Alert>
      )}

      {/* Results */}
      {pricingResult && (
        <div className="space-y-4">
          {/* Rule Impact Card for Selected Rule */}
          {selectedRule && (
            <RuleImpactCard
              rule={selectedRule}
              appliedRule={selectedRuleApplied}
              pricingResult={pricingResult}
            />
          )}

          {/* Pipeline Visualization */}
          <PipelineStepVisualization
            pricingResult={pricingResult}
            appliedRules={appliedRules}
            selectedRule={selectedRule}
          />

          {/* Unused Days Discount Notice */}
          {pricingResult.unusedDays && pricingResult.unusedDays > 0 && (
            <Alert className="border-blue-200 bg-blue-50">
              <TrendingDown className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                <div className="font-medium mb-1">Unused Days Discount Applied</div>
                <div className="text-sm">
                  Requested {testInputs.duration} days, selected {pricingResult.duration}-day bundle. 
                  Discount: {pricingResult.unusedDays} unused days × ${pricingResult.discountPerDay?.toFixed(2) || '0.00'}/day = 
                  ${((pricingResult.unusedDays || 0) * (pricingResult.discountPerDay || 0)).toFixed(2)} total discount.
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Pricing Summary */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="h-4 w-4" />
                Final Pricing
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Base Cost:</span>
                    <span className="font-mono">
                      ${pricingResult.cost?.toFixed(3) || '0.000'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Markup:</span>
                    <span className="font-mono">
                      ${pricingResult.markup?.toFixed(3) || '0.000'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Discount:</span>
                    <span className="font-mono text-green-600">
                      -${pricingResult.discountValue?.toFixed(3) || '0.000'}
                    </span>
                  </div>
                  {pricingResult.unusedDays && pricingResult.unusedDays > 0 && (
                    <div className="flex justify-between text-xs text-blue-600 italic">
                      <span>  ↳ Includes unused days:</span>
                      <span className="font-mono">
                        -${((pricingResult.unusedDays || 0) * (pricingResult.discountPerDay || 0)).toFixed(3)}
                      </span>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Processing Fee:</span>
                    <span className="font-mono">
                      ${pricingResult.processingCost?.toFixed(3) || '0.000'}
                    </span>
                  </div>
                  <div className="flex justify-between font-semibold border-t pt-2">
                    <span>Final Price:</span>
                    <span className="font-mono text-lg">
                      ${pricingResult.finalRevenue?.toFixed(2) || '0.00'}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};