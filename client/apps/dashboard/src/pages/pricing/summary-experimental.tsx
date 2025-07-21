import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { CountryBundle } from '@/__generated__/graphql';
import { CountryPricingSplitView } from '../../components/country-pricing-split-view';
import { PricingConfigDrawer } from '../../components/pricing-config-drawer';
import { Badge } from '@workspace/ui';

interface OutletContext {
  countryGroups: any[];
  expandCountry: (iso: string) => void;
  handleBundleClick?: (bundle: CountryBundle) => void;
  loading: boolean;
  error: string | null;
}

export const PricingSummaryExperimentalPage: React.FC = () => {
  const { countryGroups, expandCountry } = useOutletContext<OutletContext>();
  
  const [selectedRow, setSelectedRow] = useState<CountryBundle | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Handle bundle click to open drawer
  const handleBundleClick = (bundle: CountryBundle) => {
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
    // Refresh would be handled by parent context
  };

  return (
    <div className="h-full flex flex-col">
      {/* Experimental Badge */}
      <div className="flex-shrink-0 flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">Split-View Layout</h2>
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            Experimental
          </Badge>
        </div>
        <p className="text-sm text-gray-600">
          New simplified layout for easier country and bundle management
        </p>
      </div>

      <div className="flex-1 min-h-0">
        <CountryPricingSplitView 
          bundlesByCountry={countryGroups}
          onBundleClick={handleBundleClick}
          onExpandCountry={expandCountry}
        />
      </div>
      
      {/* Drawer for pricing configuration */}
      <PricingConfigDrawer
        isOpen={isDrawerOpen}
        onClose={handleDrawerClose}
        pricingData={selectedRow}
        onConfigurationSaved={handleConfigurationSaved}
      />
    </div>
  );
};