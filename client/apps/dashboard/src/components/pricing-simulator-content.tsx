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
  Badge,
  Progress,
  Separator,
  Alert,
  AlertDescription,
} from '@workspace/ui';
import {
  Calculator,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Percent,
  Clock,
  Zap,
  AlertCircle,
  CheckCircle,
  BarChart3,
  Globe,
  CreditCard,
} from 'lucide-react';

import { Country, PaymentMethod } from '@/__generated__/graphql';
import { usePricingSimulator } from '../hooks/usePricingSimulator';
import { PricingPipelineStream } from './pricing-pipeline-stream';

interface PricingSimulatorContentProps {
  countries: Country[];
}

const PAYMENT_METHOD_LABELS = {
  [PaymentMethod.IsraeliCard]: 'Israeli Card',
  [PaymentMethod.ForeignCard]: 'Foreign Card',
  [PaymentMethod.Bit]: 'Bit',
  [PaymentMethod.Amex]: 'American Express',
  [PaymentMethod.Diners]: 'Diners Club',
};

export const PricingSimulatorContent: React.FC<PricingSimulatorContentProps> = ({ countries }) => {
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [numOfDays, setNumOfDays] = useState<number>(7);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.IsraeliCard);
  const [showComparison, setShowComparison] = useState(false);
  
  const {
    simulate,
    clear,
    data,
    loading,
    error,
    pipelineSteps,
    isStreaming,
    wsConnected,
    comparePaymentMethods,
    analyzeProfitability,
  } = usePricingSimulator();

  const handleSimulate = () => {
    if (!selectedCountry || numOfDays < 1) return;
    
    simulate({
      numOfDays,
      countryId: selectedCountry,
      paymentMethod,
    });
  };

  const handleClear = () => {
    clear();
    setShowComparison(false);
  };

  const profitAnalysis = analyzeProfitability();
  const selectedCountryData = countries.find(c => c.iso === selectedCountry);

  const formatCurrency = (amount: number, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  const getProfitMarginColor = (margin: number) => {
    if (margin < 0) return 'text-red-600';
    if (margin < 10) return 'text-yellow-600';
    if (margin < 25) return 'text-blue-600';
    return 'text-green-600';
  };

  const getProfitMarginBadgeVariant = (category: string) => {
    switch (category) {
      case 'negative': return 'destructive';
      case 'low': return 'secondary';
      case 'medium': return 'default';
      case 'high': return 'default';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      {/* Simulation Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Simulation Parameters
          </CardTitle>
          <CardDescription>
            Configure your pricing scenario
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a country" />
                </SelectTrigger>
                <SelectContent>
                  {countries.map((country) => (
                    <SelectItem key={country.iso} value={country.iso}>
                      <div className="flex items-center gap-2">
                        {country.flag && <span>{country.flag}</span>}
                        <span>{country.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="days">Number of Days</Label>
              <Input
                id="days"
                type="number"
                min="1"
                max="365"
                value={numOfDays}
                onChange={(e) => setNumOfDays(parseInt(e.target.value) || 1)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment">Payment Method</Label>
            <Select value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PAYMENT_METHOD_LABELS).map(([method, label]) => (
                  <SelectItem key={method} value={method}>
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      <span>{label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={handleSimulate} 
              disabled={!selectedCountry || loading}
              className="flex-1"
            >
              {loading ? (
                <>
                  <Zap className="h-4 w-4 mr-2 animate-spin" />
                  Calculating...
                </>
              ) : (
                <>
                  <Calculator className="h-4 w-4 mr-2" />
                  Simulate Pricing
                </>
              )}
            </Button>
            <Button variant="outline" onClick={handleClear} disabled={loading}>
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Pipeline Steps (when streaming) */}
      {(isStreaming || pipelineSteps.length > 0) && (
        <PricingPipelineStream
          steps={pipelineSteps}
          isStreaming={isStreaming}
          wsConnected={wsConnected}
        />
      )}

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to calculate pricing: {error.message}
          </AlertDescription>
        </Alert>
      )}

      {/* Pricing Results */}
      {data && (
        <div className="space-y-6">
          {/* Main Pricing Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Pricing Summary
              </CardTitle>
              <CardDescription>
                {selectedCountryData?.name} • {data.days} days • {data.bundle.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(data.totalPrice, data.currency)}
                  </div>
                  <div className="text-sm text-muted-foreground">Customer Price</div>
                </div>
                
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <div className="text-2xl font-bold">
                    {formatCurrency(data.dailyPrice, data.currency)}
                  </div>
                  <div className="text-sm text-muted-foreground">Per Day</div>
                </div>
                
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <div className={`text-2xl font-bold ${getProfitMarginColor(data.profitMargin)}`}>
                    {data.profitMargin.toFixed(1)}%
                  </div>
                  <div className="text-sm text-muted-foreground">Profit Margin</div>
                </div>
                
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <div className="text-2xl font-bold text-blue-600">
                    {formatCurrency(data.netProfit, data.currency)}
                  </div>
                  <div className="text-sm text-muted-foreground">Net Profit</div>
                </div>
              </div>

              {data.hasDiscount && (
                <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2 text-green-700">
                    <TrendingDown className="h-4 w-4" />
                    <span className="font-medium">
                      Discount Applied: {formatCurrency(data.discountAmount, data.currency)} 
                      ({data.discountRate.toFixed(1)}% off)
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Profit Analysis */}
          {profitAnalysis && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Profitability Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <Badge variant={getProfitMarginBadgeVariant(profitAnalysis.profitMarginCategory)}>
                    {profitAnalysis.profitMarginCategory.toUpperCase()} MARGIN
                  </Badge>
                  <Badge variant={profitAnalysis.isprofitable ? "default" : "destructive"}>
                    {profitAnalysis.isprofitable ? "PROFITABLE" : "LOSS"}
                  </Badge>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium">Recommendations:</h4>
                  {profitAnalysis.recommendations.map((rec, index) => (
                    <div key={index} className="flex items-start gap-2 text-sm">
                      <div className="h-1.5 w-1.5 rounded-full bg-blue-500 mt-2"></div>
                      <span>{rec}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Detailed Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Cost Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span>Base Cost (Supplier)</span>
                  <span className="font-mono">{formatCurrency(data.cost, data.currency)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Cost + Markup</span>
                  <span className="font-mono">{formatCurrency(data.costPlus, data.currency)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Total Before Processing</span>
                  <span className="font-mono">{formatCurrency(data.totalCostBeforeProcessing, data.currency)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Processing Fee ({(data.processingRate * 100).toFixed(1)}%)</span>
                  <span className="font-mono">{formatCurrency(data.processingCost, data.currency)}</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center font-semibold">
                  <span>Final Revenue</span>
                  <span className="font-mono">{formatCurrency(data.finalRevenue, data.currency)}</span>
                </div>
                <div className="flex justify-between items-center font-semibold text-green-600">
                  <span>Net Profit</span>
                  <span className="font-mono">{formatCurrency(data.netProfit, data.currency)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Applied Rules */}
          {data.appliedRules.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Applied Pricing Rules
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.appliedRules.map((rule, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div>
                        <div className="font-medium">{rule.name}</div>
                        <div className="text-sm text-muted-foreground">{rule.type}</div>
                      </div>
                      <div className="text-right">
                        <div className={`font-mono font-semibold ${rule.impact >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {rule.impact >= 0 ? '+' : ''}{formatCurrency(rule.impact, data.currency)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Bundle Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Bundle Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Bundle Name</div>
                  <div className="font-medium">{data.bundle.name}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Duration</div>
                  <div className="font-medium">{data.bundle.duration} days</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Data</div>
                  <div className="font-medium">
                    {data.bundle.isUnlimited ? 'Unlimited' : `${data.bundle.data} MB`}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Group</div>
                  <div className="font-medium">{data.bundle.group || 'N/A'}</div>
                </div>
                {data.unusedDays && data.unusedDays > 0 && (
                  <div className="col-span-2">
                    <Alert>
                      <Clock className="h-4 w-4" />
                      <AlertDescription>
                        {data.unusedDays} unused days detected. Bundle is longer than requested duration.
                      </AlertDescription>
                    </Alert>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};