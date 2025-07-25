import React, { useState } from 'react';
import { SplitView } from './common/SplitView';
import { PricingSimulatorPanel } from './pricing-simulator-panel';
import { PricingResultsPanel } from './pricing-results-panel';
import { Country, PaymentMethod } from '@/__generated__/graphql';
import { usePricingSimulator } from '../hooks/usePricingSimulator';

interface PricingSimulatorSplitViewProps {
  countries: Country[];
}

export const PricingSimulatorSplitView: React.FC<PricingSimulatorSplitViewProps> = ({ 
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

  const panels = [
    {
      id: 'simulator',
      defaultSize: 30,
      minSize: 200,
      maxSize: 500,
      content: (
        <PricingSimulatorPanel
          countries={countries}
          selectedCountry={selectedCountry}
          numOfDays={numOfDays}
          paymentMethod={paymentMethod}
          onCountryChange={setSelectedCountry}
          onDaysChange={setNumOfDays}
          onPaymentMethodChange={setPaymentMethod}
          onSimulate={handleSimulate}
          loading={loading}
        />
      ),
    },
    {
      id: 'results',
      defaultSize: 70,
      minSize: 400,
      content: (
        <PricingResultsPanel
          data={data}
          loading={loading}
          error={error}
          pipelineSteps={pipelineSteps}
          isStreaming={isStreaming}
          wsConnected={wsConnected}
        />
      ),
    },
  ];

  return (
    <div className="h-full">
      <SplitView
        panels={panels}
        direction="horizontal"
        autoSaveId="pricing-simulator-split"
        className="h-full"
      />
    </div>
  );
};