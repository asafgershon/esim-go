import { CountryBundle } from '@/__generated__/graphql';
import React, { useState } from 'react';
import { Button, Tabs, TabsList, TabsTrigger, TabsContent } from '@workspace/ui';
import { Calculator, DollarSign, Table, CreditCard } from 'lucide-react';
import { CountryPricingTableGrouped } from '../components/country-pricing-table-grouped';
import { PricingConfigDrawer } from '../components/pricing-config-drawer';
import { PricingSimulatorDrawer } from '../components/pricing-simulator-drawer';
import { ProcessingFeeManagement } from '../components/processing-fee-management';
import { MarkupTableManagement } from '../components/markup-table-management';
import { usePricingData, CountryGroupData } from '../hooks/usePricingData';





const PricingPage: React.FC = () => {
  const { countryGroups, loading, error, expandCountry, refreshConfigurations, countriesData } = usePricingData();
  
  const [selectedRow, setSelectedRow] = useState<CountryBundle | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('pricing');



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

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pricing" className="flex items-center gap-2">
            <Table className="h-4 w-4" />
            Pricing Table
          </TabsTrigger>
          <TabsTrigger value="processing-fees" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Processing Fees
          </TabsTrigger>
          <TabsTrigger value="markup-table" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Markup Table
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pricing">
          <CountryPricingTableGrouped 
            bundlesByCountry={countryGroups}
            onBundleClick={handleBundleClick}
            onExpandCountry={expandCountry}
          />
        </TabsContent>

        <TabsContent value="processing-fees">
          <ProcessingFeeManagement />
        </TabsContent>

        <TabsContent value="markup-table">
          <MarkupTableManagement />
        </TabsContent>
      </Tabs>

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


    </div>
  );
};

export default PricingPage;