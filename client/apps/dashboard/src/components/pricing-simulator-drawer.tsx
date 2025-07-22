import {
  Badge,
  Button,
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  Label,
  Separator,
  SliderWithValue,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@workspace/ui';
import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Calculator, Globe, Clock, ChevronDown, ChevronUp, AlertTriangle, CheckCircle, TrendingUp, Settings } from 'lucide-react';

const CountUp = lazy(() => import('react-countup'));
import { Country } from '@/__generated__/graphql';
import { usePricingWithRules, PricingWithRules, AppliedRule } from '../hooks/usePricingWithRules';

interface PricingSimulatorDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  countries: Country[];
}

export const PricingSimulatorDrawer: React.FC<PricingSimulatorDrawerProps> = ({
  isOpen,
  onClose,
  countries,
}) => {
  const { calculateSinglePrice, loading, error: hookError } = usePricingWithRules();
  
  // Simulation state
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [simulatorDays, setSimulatorDays] = useState(7);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('ISRAELI_CARD');
  const [simulationResult, setSimulationResult] = useState<PricingWithRules | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showRuleDetails, setShowRuleDetails] = useState(false);
  const [showRecommendations, setShowRecommendations] = useState(true);
  
  // Available bundle durations (common eSIM Go durations)
  const availableBundles = [1, 3, 5, 7, 10, 14, 21, 30];
  
  // Find the best bundle for simulator
  const getBestBundle = (requestedDays: number) => {
    // Try exact match first
    if (availableBundles.includes(requestedDays)) {
      return requestedDays;
    }
    // Find smallest bundle that covers the requested days
    const suitableBundles = availableBundles.filter(bundle => bundle >= requestedDays);
    if (suitableBundles.length > 0) {
      return Math.min(...suitableBundles);
    }
    // If no bundle covers it, use the largest
    return Math.max(...availableBundles);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatPercentage = (rate: number) => {
    return (rate * 100).toFixed(1) + '%';
  };

  // Run simulation when country, duration, or payment method changes
  useEffect(() => {
    if (selectedCountry && simulatorDays) {
      runSimulation();
    }
  }, [selectedCountry, simulatorDays, selectedPaymentMethod]);

  const runSimulation = async () => {
    if (!selectedCountry) {
      setError('Please select a country');
      return;
    }

    const country = countries.find(c => c.iso === selectedCountry);
    if (!country) {
      setError('Country not found');
      return;
    }

    setError(null);
    setSimulationResult(null);
    
    try {
      const bestBundle = getBestBundle(simulatorDays);
      
      const result = await calculateSinglePrice({
        numOfDays: bestBundle,
        regionId: country.region,
        countryId: selectedCountry,
        paymentMethod: selectedPaymentMethod,
      });

      if (result.error) {
        setError(result.error);
        return;
      }

      if (result.pricing && result.pricing.finalPrice !== null && result.pricing.finalPrice !== undefined) {
        // Add context information for display
        const enhancedResult = {
          ...result,
          context: {
            requestedDays: simulatorDays,
            actualBundleDays: bestBundle,
            bundleName: `Unlimited Essential ${bestBundle} days`,
            countryName: country.name,
            unusedDays: Math.max(0, bestBundle - simulatorDays)
          }
        };
        
        setSimulationResult(enhancedResult);
      } else if (result.pricing && (result.pricing.finalPrice === null || result.pricing.finalPrice === undefined)) {
        setError('Pricing calculation returned invalid results. This may be due to insufficient profit margins or missing pricing rules.');
      } else {
        setError('No pricing data available for this country/duration');
      }
    } catch (error: any) {
      console.error('Simulation error:', error);
      setError(error.message || 'Failed to calculate pricing');
    }
  };

  const handleCountryChange = (countryIso: string) => {
    setSelectedCountry(countryIso);
    setSimulationResult(null);
  };

  const handleDurationChange = (days: number) => {
    setSimulatorDays(days);
    setSimulationResult(null);
  };

  if (!isOpen) {
    return null;
  }

  return (
    <Drawer direction="right" open={isOpen} onOpenChange={onClose}>
      <DrawerContent className="fixed right-0 top-0 bottom-0 w-[600px] z-50 bg-background border-l rounded-l-lg">
        <DrawerHeader>
          <DrawerTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Pricing Simulator
          </DrawerTitle>
          <DrawerDescription>
            Simulate pricing for any country and duration combination
          </DrawerDescription>
        </DrawerHeader>

        <div className="flex flex-col h-full overflow-hidden">
          {/* Top Section: Country & Duration Selection */}
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Configuration
            </h3>
            
            <div className="grid grid-cols-3 gap-4">
              {/* Country Selection */}
              <div>
                <Label htmlFor="country">Select Country</Label>
                <Select value={selectedCountry} onValueChange={handleCountryChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a country" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((country) => (
                      <SelectItem key={country.iso} value={country.iso}>
                        <div className="flex items-center gap-2">
                          <span>{country.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {country.iso}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Payment Method Selection */}
              <div>
                <Label htmlFor="paymentMethod">Payment Method</Label>
                <Select value={selectedPaymentMethod} onValueChange={setSelectedPaymentMethod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ISRAELI_CARD">
                      <div className="flex items-center gap-2">
                        <span>Israeli Card</span>
                        <Badge variant="outline" className="text-xs">Default</Badge>
                      </div>
                    </SelectItem>
                    <SelectItem value="FOREIGN_CARD">Foreign Card</SelectItem>
                    <SelectItem value="BIT">Bit Payment</SelectItem>
                    <SelectItem value="AMEX">American Express</SelectItem>
                    <SelectItem value="DINERS">Diners Club</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Simulation Trigger */}
              <div>
                <Label>&nbsp;</Label>
                <Button 
                  onClick={runSimulation} 
                  disabled={loading || !selectedCountry}
                  className="w-full"
                >
                  {loading ? 'Calculating...' : 'Run Simulation'}
                </Button>
              </div>
            </div>

            {/* Duration Selection */}
            <div className="mt-6">
              <Label htmlFor="duration" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Duration: {simulatorDays} days
              </Label>
              <div className="mt-3">
                <SliderWithValue
                  value={[simulatorDays]}
                  onValueChange={(value) => handleDurationChange(value[0])}
                  min={1}
                  max={30}
                  step={1}
                  className="w-full"
                />
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Simulate pricing for 1-30 days
              </p>
            </div>

            {/* Quick Day Buttons */}
            <div className="mt-4">
              <Label>Quick Select</Label>
              <div className="grid grid-cols-4 gap-2 mt-2">
                {[3, 5, 7, 10, 14, 21, 30].map((days) => (
                  <Button
                    key={days}
                    variant={simulatorDays === days ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleDurationChange(days)}
                  >
                    {days}d
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom Section: Simulation Results */}
          <div className="flex-1 p-6 overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Results</h3>
            
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <p className="text-red-800">{error}</p>
              </div>
            )}

            {loading && (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">Calculating pricing...</span>
              </div>
            )}

            {simulationResult && simulationResult.pricing && (
              <div className="space-y-4">
                {/* Bundle Information */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">Bundle Match</h4>
                  <div className="text-sm text-blue-800 space-y-1">
                    <p><strong>Requested:</strong> {simulationResult.context?.requestedDays} days</p>
                    <p><strong>Bundle Used:</strong> {simulationResult.context?.bundleName}</p>
                    <p><strong>Country:</strong> {simulationResult.context?.countryName}</p>
                    {simulationResult.context?.unusedDays && simulationResult.context.unusedDays > 0 && (
                      <p className="text-orange-600">
                        <strong>Unused Days:</strong> {simulationResult.context.unusedDays} days
                      </p>
                    )}
                  </div>
                </div>

                {/* Unused Days Discount Visualization */}
                {simulationResult.context?.unusedDays && simulationResult.context.unusedDays > 0 && (
                  <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-orange-900 mb-3 flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Unused Days Discount Preview
                    </h4>
                    
                    {/* Visual Day Blocks */}
                    <div className="mb-4">
                      <div className="flex items-center gap-1 text-xs text-gray-600 mb-2">
                        <span>Used Days</span>
                        <div className="flex-1 border-t border-gray-300"></div>
                        <span>Unused Days</span>
                      </div>
                      <div className="flex gap-1 mb-2">
                        {/* Used days - green blocks */}
                        {Array.from({ length: simulationResult.context.requestedDays || 0 }).map((_, i) => (
                          <div
                            key={`used-${i}`}
                            className="h-6 w-4 bg-green-400 rounded-sm flex items-center justify-center text-xs text-white font-medium"
                          >
                            {i + 1}
                          </div>
                        ))}
                        {/* Unused days - orange blocks */}
                        {Array.from({ length: simulationResult.context.unusedDays }).map((_, i) => (
                          <div
                            key={`unused-${i}`}
                            className="h-6 w-4 bg-orange-400 rounded-sm flex items-center justify-center text-xs text-white font-medium relative"
                          >
                            {(simulationResult.context?.requestedDays || 0) + i + 1}
                            <div className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full"></div>
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-between text-xs text-gray-600">
                        <span className="text-green-600">Used: {simulationResult.context.requestedDays} days</span>
                        <span className="text-orange-600">Unused: {simulationResult.context.unusedDays} days</span>
                      </div>
                    </div>

                    {/* Discount Calculation Display */}
                    {simulationResult.pricing.discounts.find(d => d.ruleName.toLowerCase().includes('unused')) && (
                      <div className="bg-white/70 p-3 rounded border-l-4 border-orange-400">
                        <div className="space-y-2">
                          {(() => {
                            const unusedDiscount = simulationResult.pricing.discounts.find(d => d.ruleName.toLowerCase().includes('unused'));
                            const discountPerDay = unusedDiscount ? unusedDiscount.amount / simulationResult.context.unusedDays : 0;
                            return (
                              <>
                                <div className="flex justify-between text-sm">
                                  <span>Discount per unused day:</span>
                                  <Suspense fallback={<span>{formatCurrency(discountPerDay)}</span>}>
                                    <span className="text-orange-700 font-medium">
                                      $<CountUp 
                                        end={discountPerDay} 
                                        duration={0.4} 
                                        decimals={2} 
                                        preserveValue 
                                        key={`discount-per-day-${discountPerDay}`}
                                      />
                                    </span>
                                  </Suspense>
                                </div>
                                <div className="flex justify-between text-sm font-medium">
                                  <span>Total unused days discount:</span>
                                  <Suspense fallback={<span>{formatCurrency(unusedDiscount?.amount || 0)}</span>}>
                                    <span className="text-green-600">
                                      -$<CountUp 
                                        end={unusedDiscount?.amount || 0} 
                                        duration={0.5} 
                                        decimals={2} 
                                        preserveValue 
                                        key={`total-unused-discount-${unusedDiscount?.amount}`}
                                      />
                                    </span>
                                  </Suspense>
                                </div>
                                <p className="text-xs text-gray-600 italic">
                                  Formula: {simulationResult.context.unusedDays} unused days × ${discountPerDay.toFixed(2)}/day = ${(unusedDiscount?.amount || 0).toFixed(2)} savings
                                </p>
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Applied Rules Section */}
                <div className="bg-purple-50 p-4 rounded-lg">
                  <Collapsible open={showRuleDetails} onOpenChange={setShowRuleDetails}>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" className="w-full justify-between p-0">
                        <h4 className="text-sm font-medium text-purple-900 flex items-center gap-2">
                          <Settings className="h-4 w-4" />
                          Applied Rules ({simulationResult.appliedRules.length})
                        </h4>
                        {showRuleDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-3">
                      <div className="space-y-2">
                        {simulationResult.ruleBreakdown.systemRules.length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-purple-800 mb-1">System Rules:</p>
                            {simulationResult.ruleBreakdown.systemRules.map((rule: AppliedRule) => (
                              <div key={rule.id} className="flex justify-between text-sm text-purple-700 bg-white/50 px-2 py-1 rounded">
                                <span>{rule.name}</span>
                                <span className={rule.impact >= 0 ? 'text-green-600' : 'text-red-600'}>
                                  {rule.impact >= 0 ? '+' : ''}{formatCurrency(rule.impact)}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                        {simulationResult.ruleBreakdown.businessRules.length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-purple-800 mb-1">Business Rules:</p>
                            {simulationResult.ruleBreakdown.businessRules.map((rule: AppliedRule) => (
                              <div key={rule.id} className="flex justify-between text-sm text-purple-700 bg-white/50 px-2 py-1 rounded">
                                <span>{rule.name}</span>
                                <span className={rule.impact >= 0 ? 'text-green-600' : 'text-red-600'}>
                                  {rule.impact >= 0 ? '+' : ''}{formatCurrency(rule.impact)}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="border-t pt-2">
                          <div className="flex justify-between text-sm font-medium text-purple-900">
                            <span>Total Rule Impact:</span>
                            <span className={simulationResult.ruleBreakdown.totalImpact >= 0 ? 'text-green-600' : 'text-red-600'}>
                              {simulationResult.ruleBreakdown.totalImpact >= 0 ? '+' : ''}{formatCurrency(simulationResult.ruleBreakdown.totalImpact)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </div>

                {/* Pricing Breakdown */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-3">Pricing Breakdown</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Base Cost:</span>
                      <Suspense fallback={<span>{formatCurrency(simulationResult.pricing.baseCost)}</span>}>
                        <span>$<CountUp 
                          end={simulationResult.pricing.baseCost} 
                          duration={0.3} 
                          decimals={2} 
                          preserveValue 
                          key={`base-${simulationResult.pricing.baseCost}`}
                        /></span>
                      </Suspense>
                    </div>
                    <div className="flex justify-between">
                      <span>Markup:</span>
                      <Suspense fallback={<span>{formatCurrency(simulationResult.pricing.markup)}</span>}>
                        <span>$<CountUp 
                          end={simulationResult.pricing.markup} 
                          duration={0.3} 
                          decimals={2} 
                          preserveValue 
                          key={`markup-${simulationResult.pricing.markup}`}
                        /></span>
                      </Suspense>
                    </div>
                    <div className="flex justify-between font-medium border-t pt-2">
                      <span>Subtotal:</span>
                      <Suspense fallback={<span>{formatCurrency(simulationResult.pricing.subtotal)}</span>}>
                        <span>$<CountUp 
                          end={simulationResult.pricing.subtotal} 
                          duration={0.3} 
                          decimals={2} 
                          preserveValue 
                          key={`subtotal-${simulationResult.pricing.subtotal}`}
                        /></span>
                      </Suspense>
                    </div>
                    
                    {simulationResult.pricing.discounts.map((discount, index) => (
                      <div key={index} className="flex justify-between text-green-600">
                        <span>{discount.ruleName} ({discount.type}):</span>
                        <Suspense fallback={<span>-{formatCurrency(discount.amount)}</span>}>
                          <span>-$<CountUp 
                            end={discount.amount} 
                            duration={0.4} 
                            decimals={2} 
                            preserveValue 
                            key={`discount-${index}-${discount.amount}`}
                          /></span>
                        </Suspense>
                      </div>
                    ))}
                    
                    <Separator className="my-2" />
                    
                    <div className="flex justify-between font-medium text-lg">
                      <span>Price After Discount:</span>
                      <Suspense fallback={<span className="text-blue-600">{formatCurrency(simulationResult.pricing.priceAfterDiscount)}</span>}>
                        <span className="text-blue-600">
                          $<CountUp 
                            end={simulationResult.pricing.priceAfterDiscount} 
                            duration={0.5} 
                            decimals={2} 
                            preserveValue 
                            key={`price-after-discount-${simulationResult.pricing.priceAfterDiscount}`}
                          />
                        </span>
                      </Suspense>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Price per day:</span>
                      <Suspense fallback={<span>{formatCurrency(simulationResult.pricing.priceAfterDiscount / (simulationResult.context?.requestedDays || 1))}</span>}>
                        <span>
                          $<CountUp 
                            end={simulationResult.pricing.priceAfterDiscount / (simulationResult.context?.requestedDays || 1)} 
                            duration={0.3} 
                            decimals={2} 
                            preserveValue 
                            key={`price-per-day-${simulationResult.pricing.priceAfterDiscount}-${simulationResult.context?.requestedDays}`}
                          />
                        </span>
                      </Suspense>
                    </div>
                    
                    <Separator className="my-2" />
                    
                    <div className="flex justify-between">
                      <span>Processing Fee ({formatPercentage(simulationResult.pricing.processingRate)}):</span>
                      <Suspense fallback={<span className="text-yellow-600">-{formatCurrency(simulationResult.pricing.processingFee)}</span>}>
                        <span className="text-yellow-600">-$<CountUp 
                          end={simulationResult.pricing.processingFee} 
                          duration={0.3} 
                          decimals={2} 
                          preserveValue 
                          key={`processing-fee-${simulationResult.pricing.processingFee}`}
                        /></span>
                      </Suspense>
                    </div>
                    <div className="flex justify-between">
                      <span>Revenue After Processing:</span>
                      <Suspense fallback={<span>{formatCurrency(simulationResult.pricing.revenueAfterProcessing)}</span>}>
                        <span>$<CountUp 
                          end={simulationResult.pricing.revenueAfterProcessing} 
                          duration={0.3} 
                          decimals={2} 
                          preserveValue 
                          key={`revenue-after-processing-${simulationResult.pricing.revenueAfterProcessing}`}
                        /></span>
                      </Suspense>
                    </div>
                    <div className="flex justify-between font-medium border-t pt-2">
                      <span>Final Profit:</span>
                      <Suspense fallback={<span className={`${simulationResult.pricing.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(simulationResult.pricing.profit)}</span>}>
                        <span className={`${simulationResult.pricing.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {simulationResult.pricing.profit >= 0 ? '+' : '-'}$<CountUp 
                            end={Math.abs(simulationResult.pricing.profit)} 
                            duration={0.5} 
                            decimals={2} 
                            preserveValue 
                            key={`final-profit-${simulationResult.pricing.profit}`}
                          />
                        </span>
                      </Suspense>
                    </div>
                  </div>
                </div>

                {/* Recommendations Section */}
                {simulationResult.recommendations.length > 0 && (
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <Collapsible open={showRecommendations} onOpenChange={setShowRecommendations}>
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" className="w-full justify-between p-0">
                          <h4 className="text-sm font-medium text-yellow-900 flex items-center gap-2">
                            <TrendingUp className="h-4 w-4" />
                            Smart Recommendations ({simulationResult.recommendations.length})
                          </h4>
                          {showRecommendations ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="mt-3">
                        <div className="space-y-3">
                          {simulationResult.recommendations.map((rec, index) => (
                            <div key={index} className="bg-white/70 p-3 rounded border-l-4 border-yellow-400">
                              <div className="flex items-start justify-between">
                                <div className="flex items-center gap-2">
                                  {rec.confidence === 'high' && <CheckCircle className="h-4 w-4 text-green-500" />}
                                  {rec.confidence === 'medium' && <AlertTriangle className="h-4 w-4 text-yellow-500" />}
                                  {rec.confidence === 'low' && <AlertTriangle className="h-4 w-4 text-gray-500" />}
                                  <span className="text-sm font-medium text-yellow-900">{rec.title}</span>
                                </div>
                                <Badge variant="outline" className={`text-xs ${
                                  rec.confidence === 'high' ? 'bg-green-100 text-green-800' :
                                  rec.confidence === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {rec.confidence}
                                </Badge>
                              </div>
                              <p className="text-sm text-yellow-800 mt-1">{rec.description}</p>
                              {rec.action && (
                                <p className="text-xs text-yellow-700 mt-2 italic">→ {rec.action}</p>
                              )}
                              <p className="text-xs font-medium text-green-700 mt-1">
                                Potential saving: {formatCurrency(rec.potentialSaving)}
                              </p>
                            </div>
                          ))}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </div>
                )}

                {/* Profit Analysis */}
                <div className={`${simulationResult.pricing.profit >= 0 ? 'bg-green-50' : 'bg-red-50'} p-4 rounded-lg`}>
                  <h4 className={`font-medium mb-2 ${simulationResult.pricing.profit >= 0 ? 'text-green-900' : 'text-red-900'}`}>
                    Profit Analysis
                  </h4>
                  <div className={`text-sm ${simulationResult.pricing.profit >= 0 ? 'text-green-800' : 'text-red-800'}`}>
                    <p>
                      <strong>Profit Margin:</strong> {' '}
                      {simulationResult.pricing.profit >= 0 ? '+' : ''}
                      {((simulationResult.pricing.profit / simulationResult.pricing.subtotal) * 100).toFixed(1)}%
                    </p>
                    <p>
                      <strong>Max Recommended Price:</strong> {' '}
                      {formatCurrency(simulationResult.pricing.maxRecommendedPrice)}
                    </p>
                    <p>
                      <strong>Max Discount Percentage:</strong> {' '}
                      {(simulationResult.pricing.maxDiscountPercentage * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <DrawerFooter className="border-t">
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Close
            </Button>
            {simulationResult && (
              <Button className="flex-1">
                Export Results
              </Button>
            )}
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};