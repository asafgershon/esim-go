import { CountryBundle } from '@/__generated__/graphql';
import React, { useState } from 'react';
import { Button } from '@workspace/ui/components/button';
import { Calculator, CreditCard, DollarSign } from 'lucide-react';
import { CountryPricingTableGrouped } from '../components/country-pricing-table-grouped';
import { PricingConfigDrawer } from '../components/pricing-config-drawer';
import { PricingSimulatorDrawer } from '../components/pricing-simulator-drawer';
import { ProcessingFeeDrawer } from '../components/processing-fee-drawer';
import { MarkupTableDrawer } from '../components/markup-table-drawer';
import { usePricingData, CountryGroupData } from '../hooks/usePricingData';





const PricingPage: React.FC = () => {
  const { countryGroups, loading, error, expandCountry, refreshConfigurations, countriesData } = usePricingData();
  
  const [selectedRow, setSelectedRow] = useState<CountryBundle | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [isProcessingFeeOpen, setIsProcessingFeeOpen] = useState(false);
  const [isMarkupTableOpen, setIsMarkupTableOpen] = useState(false);



  // Handle bundle click to open drawer
  const handleBundleClick = (bundle: CountryBundle) => {
    console.log('handleBundleClick called with:', bundle);
    setSelectedRow(bundle);
    setIsDrawerOpen(true);
  };

  // Handle drawer close
  const handleDrawerClose = () => {
    setIsDrawerOpen(false);
    setSelectedRow(null);
  };

  // Handle configuration saved
  const handleConfigurationSaved = () => {
    refreshConfigurations();
  };


  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading pricing data from eSIM Go API...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Pricing Management</h1>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-2 text-red-600 hover:text-red-800"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Pricing Management</h1>
        <div className="flex items-center gap-4">
          <Button
            onClick={() => setIsMarkupTableOpen(true)}
            variant="outline"
            className="flex items-center gap-2"
          >
            <DollarSign className="h-4 w-4" />
            Markup Table
          </Button>
          <Button
            onClick={() => setIsProcessingFeeOpen(true)}
            variant="outline"
            className="flex items-center gap-2"
          >
            <CreditCard className="h-4 w-4" />
            Processing Fee
          </Button>
          <Button
            onClick={() => setIsSimulatorOpen(true)}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Calculator className="h-4 w-4" />
            Pricing Simulator
          </Button>
          <div className="text-sm text-gray-500">
            {countryGroups.length} countries
          </div>
        </div>
      </div>

      <CountryPricingTableGrouped 
        bundlesByCountry={countryGroups}
        onBundleClick={handleBundleClick}
        onExpandCountry={expandCountry}
      />

      {/* Drawer for pricing configuration */}
      <PricingConfigDrawer
        isOpen={isDrawerOpen}
        onClose={handleDrawerClose}
        pricingData={selectedRow}
        onConfigurationSaved={handleConfigurationSaved}
      />

      {/* Pricing Simulator Drawer */}
      <PricingSimulatorDrawer
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
        countries={countriesData?.countries || []}
      />

      {/* Processing Fee Management Drawer */}
      <ProcessingFeeDrawer
        isOpen={isProcessingFeeOpen}
        onClose={() => setIsProcessingFeeOpen(false)}
      />

      {/* Markup Table Management Drawer */}
      <MarkupTableDrawer
        isOpen={isMarkupTableOpen}
        onClose={() => setIsMarkupTableOpen(false)}
      />
    </div>
  );
};

export default PricingPage;