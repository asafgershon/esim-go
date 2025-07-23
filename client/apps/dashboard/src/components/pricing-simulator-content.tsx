import { useLazyQuery } from '@apollo/client';
import {
  Badge,
  Button,
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
import { GET_COUNTRY_BUNDLES } from '../lib/graphql/queries';
import { Country } from '@/__generated__/graphql';

interface PricingSimulatorContentProps {
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
  processingCost: number;
  finalRevenue: number;
  currency: string;
  discountPerDay: number;
}

export const PricingSimulatorContent: React.FC<PricingSimulatorContentProps> = ({
  countries,
}) => {
  const [getCountryBundles, { loading }] = useLazyQuery(GET_COUNTRY_BUNDLES);
  
  // Simulation state
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [simulatorDays, setSimulatorDays] = useState(7);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('ISRAELI_CARD');
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
    
    try {
      const bestBundle = getBestBundle(simulatorDays);
      
      // First, search for bundles in this country
      const bundlesResult = await getCountryBundles({
        variables: {
          countryId: selectedCountry,
        },
      });
      
      if (!bundlesResult.data?.countryBundles || bundlesResult.data.countryBundles.length === 0) {
        setError('No bundles found for this country');
        return;
      }
      
      // Find a bundle that matches our duration (or closest match)
      const bundles = bundlesResult.data.countryBundles;
      const suitableBundle = bundles.find(bundle => bundle.duration === bestBundle) ||
                             bundles.find(bundle => bundle.duration >= bestBundle) ||
                             bundles[0]; // fallback to first bundle
      
      if (!suitableBundle) {
        setError('No suitable bundle found for this duration');
        return;
      }
      
      // Debug log to see what we have
      console.log('Suitable bundle found:', suitableBundle);
      
      // Use the bundle data directly since it already has pricing information
      if (suitableBundle.cost && suitableBundle.priceAfterDiscount) {
        const baseCost = suitableBundle.cost || 0;
        const costPlusMarkup = suitableBundle.costPlus;
        
        setSimulationResult({
          bundleName: suitableBundle.bundleName || `Bundle ${bestBundle} days`,
          countryName: suitableBundle.countryName || country.name,
          duration: suitableBundle.duration || bestBundle,
          cost: baseCost,
          costPlus: costPlusMarkup,
          totalCost: suitableBundle.totalCost || costPlusMarkup,
          discountRate: suitableBundle.discountRate || 0,
          discountValue: suitableBundle.discountValue || 0,
          priceAfterDiscount: suitableBundle.priceAfterDiscount || suitableBundle.totalCost || costPlusMarkup,
          processingCost: suitableBundle.processingCost || 0,
          finalRevenue: suitableBundle.finalRevenue || (suitableBundle.priceAfterDiscount || costPlusMarkup) - (suitableBundle.processingCost || 0),
          currency: suitableBundle.currency || 'USD',
          discountPerDay: suitableBundle.discountPerDay || 0,
        });
      } else {
        setError('Bundle found but pricing data is incomplete');
      }
    } catch (error) {
      const logger = { error: (msg: string, err: any) => console.error(msg, err) };
      logger.error('Simulation error:', error);
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

  return (
    <div className="space-y-6">

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Panel: Configuration */}
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Configuration
            </h3>
            
            <div className="space-y-4">
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
              <Button 
                onClick={runSimulation} 
                disabled={loading || !selectedCountry}
                className="w-full"
              >
                {loading ? 'Calculating...' : 'Run Simulation'}
              </Button>
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
        </div>

        {/* Right Panel: Results */}
        <div className="space-y-6">
          <h3 className="text-lg font-semibold">Results</h3>
          
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
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
                  {simulationResult.discountValue > 0 && (
                    <p className="text-green-600">
                      <strong>Discount Applied:</strong> {formatPercentage(simulationResult.discountRate)} discount
                    </p>
                  )}
                </div>
              </div>

              {/* Pricing Breakdown */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-3">Pricing Breakdown</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Base Cost:</span>
                    <span>{formatCurrency(simulationResult.cost)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cost Plus Markup:</span>
                    <span>{formatCurrency(simulationResult.costPlus)}</span>
                  </div>
                  <div className="flex justify-between font-medium border-t pt-2">
                    <span>Total Cost:</span>
                    <span>{formatCurrency(simulationResult.totalCost)}</span>
                  </div>
                  
                  {simulationResult.discountValue > 0 && (
                    <div className="flex justify-between font-medium">
                      <span>Discount ({formatPercentage(simulationResult.discountRate)}):</span>
                      <span className="text-green-600">-{formatCurrency(simulationResult.discountValue)}</span>
                    </div>
                  )}
                  
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
                    <span>Processing Cost:</span>
                    <span className="text-yellow-600">{formatCurrency(simulationResult.processingCost)}</span>
                  </div>
                  <div className="flex justify-between font-medium border-t pt-2">
                    <span>Final Revenue:</span>
                    <span className="text-green-600">
                      {formatCurrency(simulationResult.finalRevenue)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Profit Analysis */}
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2 text-green-900">Analysis</h4>
                <div className="text-sm text-green-800 space-y-1">
                  <p>
                    <strong>Profit Margin:</strong> {' '}
                    {((simulationResult.finalRevenue / simulationResult.priceAfterDiscount) * 100).toFixed(1)}%
                  </p>
                  <p>
                    <strong>Break-even Price:</strong> {' '}
                    {formatCurrency(simulationResult.cost + simulationResult.processingCost + 0.01)}
                  </p>
                  {simulationResult.discountPerDay > 0 && (
                    <p>
                      <strong>Discount Per Day:</strong> {' '}
                      {formatPercentage(simulationResult.discountPerDay)}
                    </p>
                  )}
                </div>
              </div>

              {/* Export Button */}
              <div className="pt-4">
                <Button className="w-full">
                  Export Results
                </Button>
              </div>
            </div>
          )}

          {!loading && !error && !simulationResult && (
            <div className="text-center text-gray-500 py-8">
              <Calculator className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Select a country and click "Run Simulation" to see pricing results</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};