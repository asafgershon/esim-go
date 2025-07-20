import { useLazyQuery } from '@apollo/client';
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
} from '@workspace/ui';
import React, { useState, useEffect } from 'react';
import { Calculator, Globe, Clock } from 'lucide-react';
import { CALCULATE_BATCH_PRICING } from '../lib/graphql/queries';
import { Country } from '@/__generated__/graphql';

interface PricingSimulatorDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  countries: Country[];
}

interface SimulationResult {
  bundleName: string;
  countryName: string;
  duration: number;
  cost: number;
  costPlus: number;
  totalCost: number;
  discountRate: number;
  discountValue: number;
  priceAfterDiscount: number;
  processingRate: number;
  processingCost: number;
  revenueAfterProcessing: number;
  finalRevenue: number;
  currency: string;
}

export const PricingSimulatorDrawer: React.FC<PricingSimulatorDrawerProps> = ({
  isOpen,
  onClose,
  countries,
}) => {
  const [calculateBatchPricing, { loading }] = useLazyQuery(CALCULATE_BATCH_PRICING);
  
  // Simulation state
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [simulatorDays, setSimulatorDays] = useState(7);
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
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

  // Run simulation when country or duration changes
  useEffect(() => {
    if (selectedCountry && simulatorDays) {
      runSimulation();
    }
  }, [selectedCountry, simulatorDays]);

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
    
    try {
      const bestBundle = getBestBundle(simulatorDays);
      
      const result = await calculateBatchPricing({
        variables: {
          inputs: [{
            numOfDays: bestBundle,
            regionId: country.region,
            countryId: selectedCountry,
          }],
        },
      });

      if (result.data?.calculatePrices && result.data.calculatePrices.length > 0) {
        const pricingData = result.data.calculatePrices[0];
        
        // Apply unused days discount if applicable
        const unusedDays = Math.max(0, bestBundle - simulatorDays);
        const unusedDaysDiscount = unusedDays > 0 ? (unusedDays / bestBundle) * 0.1 : 0;
        const basePrice = pricingData.totalCost;
        const priceAfterUnusedDiscount = basePrice * (1 - unusedDaysDiscount);
        const finalPrice = priceAfterUnusedDiscount * (1 - pricingData.discountRate);
        
        setSimulationResult({
          ...pricingData,
          bundleName: `UL essential ${bestBundle} days`,
          countryName: country.name,
          duration: bestBundle,
          priceAfterDiscount: finalPrice,
          discountValue: priceAfterUnusedDiscount * pricingData.discountRate,
          processingCost: finalPrice * pricingData.processingRate,
          revenueAfterProcessing: finalPrice * (1 - pricingData.processingRate),
          finalRevenue: finalPrice * (1 - pricingData.processingRate) - pricingData.cost - pricingData.costPlus,
        });
      } else {
        setError('No pricing data available for this country/duration');
      }
    } catch (error) {
      console.error('Simulation error:', error);
      setError('Failed to calculate pricing');
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
            
            <div className="grid grid-cols-2 gap-4">
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

            {simulationResult && (
              <div className="space-y-4">
                {/* Bundle Information */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">Bundle Match</h4>
                  <div className="text-sm text-blue-800 space-y-1">
                    <p><strong>Requested:</strong> {simulatorDays} days</p>
                    <p><strong>Bundle Used:</strong> {simulationResult.bundleName}</p>
                    <p><strong>Country:</strong> {simulationResult.countryName}</p>
                    {simulationResult.duration > simulatorDays && (
                      <p className="text-orange-600">
                        <strong>Unused Days:</strong> {simulationResult.duration - simulatorDays} days
                      </p>
                    )}
                  </div>
                </div>

                {/* Pricing Breakdown */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-3">Pricing Breakdown</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>eSIM Go Cost:</span>
                      <span>{formatCurrency(simulationResult.cost)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Our Markup:</span>
                      <span>{formatCurrency(simulationResult.costPlus)}</span>
                    </div>
                    <div className="flex justify-between font-medium border-t pt-2">
                      <span>Total Cost:</span>
                      <span>{formatCurrency(simulationResult.totalCost)}</span>
                    </div>
                    
                    {simulationResult.duration > simulatorDays && (
                      <div className="flex justify-between text-orange-600">
                        <span>Unused Days Discount:</span>
                        <span>-{formatCurrency(simulationResult.totalCost * ((simulationResult.duration - simulatorDays) / simulationResult.duration) * 0.1)}</span>
                      </div>
                    )}
                    
                    <div className="flex justify-between">
                      <span>Customer Discount ({formatPercentage(simulationResult.discountRate)}):</span>
                      <span className="text-green-600">-{formatCurrency(simulationResult.discountValue)}</span>
                    </div>
                    
                    <Separator className="my-2" />
                    
                    <div className="flex justify-between font-medium text-lg">
                      <span>Final Price:</span>
                      <span className="text-blue-600">
                        {formatCurrency(simulationResult.priceAfterDiscount)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Price per day:</span>
                      <span>
                        {formatCurrency(simulationResult.priceAfterDiscount / simulatorDays)}
                      </span>
                    </div>
                    
                    <Separator className="my-2" />
                    
                    <div className="flex justify-between">
                      <span>Processing Fee ({formatPercentage(simulationResult.processingRate)}):</span>
                      <span className="text-yellow-600">-{formatCurrency(simulationResult.processingCost)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Revenue After Processing:</span>
                      <span>{formatCurrency(simulationResult.revenueAfterProcessing)}</span>
                    </div>
                    <div className="flex justify-between font-medium border-t pt-2">
                      <span>Final Revenue (Profit):</span>
                      <span className={`${simulationResult.finalRevenue >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(simulationResult.finalRevenue)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Profit Analysis */}
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2 text-green-900">Profit Analysis</h4>
                  <div className="text-sm text-green-800">
                    <p>
                      <strong>Profit Margin:</strong> {' '}
                      {simulationResult.finalRevenue >= 0 ? '+' : ''}
                      {((simulationResult.finalRevenue / simulationResult.totalCost) * 100).toFixed(1)}%
                    </p>
                    <p>
                      <strong>Break-even Price:</strong> {' '}
                      {formatCurrency(simulationResult.cost + simulationResult.costPlus + simulationResult.processingCost + 0.01)}
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