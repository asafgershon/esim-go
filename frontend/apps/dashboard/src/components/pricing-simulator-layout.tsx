import React, { useState } from 'react';
import { 
  Combobox,
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue,
  Input,
  Button
} from '@workspace/ui';
import { Play, Loader2 } from 'lucide-react';
import { Country, PaymentMethod } from '@/__generated__/graphql';
import { usePricingSimulator } from '../hooks/usePricingSimulator';
import { PricingResultsPanel } from './pricing-results-panel';

interface PricingSimulatorLayoutProps {
  countries: Country[];
}

export const PricingSimulatorLayout: React.FC<PricingSimulatorLayoutProps> = ({ 
  countries 
}) => {
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [numOfDays, setNumOfDays] = useState<number>(7);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.IsraeliCard);
  
  const {
    simulate,
    clear,
    data,
    loading,
    error,
    pipelineSteps,
    isStreaming,
    wsConnected,
    calculationSteps,
    calculationProgress,
  } = usePricingSimulator();

  const handleSimulate = () => {
    if (!selectedCountry || numOfDays < 1) return;
    
    // Clear previous results before starting new simulation
    clear();
    
    simulate({
      numOfDays,
      countryId: selectedCountry,
      paymentMethod,
    });
  };

  const paymentMethods = [
    { value: PaymentMethod.IsraeliCard, label: 'Israeli Card (1.4%)' },
    { value: PaymentMethod.ForeignCard, label: 'Foreign Card (3.9%)' },
    { value: PaymentMethod.Bit, label: 'Bit (0.7%)' },
    { value: PaymentMethod.Amex, label: 'Amex (5.7%)' },
    { value: PaymentMethod.Diners, label: 'Diners (6.4%)' },
  ];

  // Transform countries data for Combobox component
  const countryOptions = React.useMemo(() => 
    countries.map((country) => ({
      value: country.iso,
      label: country.name,
      icon: country.flag || undefined,
      keywords: [country.name, country.iso] // Add keywords for better search
    })), 
    [countries]
  );

  return (
    <div className="h-full flex flex-col">
      {/* Top Bar with Controls */}
      <div className="border-b bg-white shadow-sm">
        <div className="px-6 py-3">
          <div className="flex items-center gap-3">
            {/* Country Selector */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-600 whitespace-nowrap">Country:</span>
              <div className="w-64">
                <Combobox
                  options={countryOptions}
                  value={selectedCountry}
                  onValueChange={setSelectedCountry}
                  placeholder="Select country"
                  emptyMessage="No country found."
                  className="h-9"
                />
              </div>
            </div>

            {/* Days Input */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-600 whitespace-nowrap">Days:</span>
              <Input
                type="number"
                min={1}
                max={365}
                value={numOfDays}
                onChange={(e) => setNumOfDays(parseInt(e.target.value) || 1)}
                className="h-9 w-20"
                placeholder="Days"
              />
            </div>

            {/* Payment Method */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-600 whitespace-nowrap">Payment:</span>
              <div className="w-48">
                <Select 
                  value={paymentMethod} 
                  onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}
                >
                  <SelectTrigger className="h-9">
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

            {/* Spacer */}
            <div className="flex-1" />

            {/* Run Button */}
            <Button
              onClick={handleSimulate}
              disabled={!selectedCountry || numOfDays < 1 || loading}
              size="sm"
              className="px-6"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Run Simulation
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Results Panel */}
      <div className="flex-1 overflow-hidden">
        <PricingResultsPanel
          data={data ? {
            ...data,
            pricingSteps: calculationSteps.length > 0 ? calculationSteps : data.pricingSteps,
          } : null}
          loading={loading}
          error={error}
          pipelineSteps={pipelineSteps}
          isStreaming={isStreaming || !calculationProgress?.isComplete}
          wsConnected={wsConnected}
        />
      </div>
    </div>
  );
};