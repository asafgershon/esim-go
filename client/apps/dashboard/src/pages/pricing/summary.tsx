import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { CountryBundle } from '@/__generated__/graphql';
import { CountryPricingTableGrouped } from '../../components/country-pricing-table-grouped';
import { PricingConfigDrawer } from '../../components/pricing-config-drawer';

interface OutletContext {
  countryGroups: any[];
  expandCountry: (iso: string) => void;
  handleBundleClick?: (bundle: CountryBundle) => void;
  loading: boolean;
  error: string | null;
}

export const PricingSummaryPage: React.FC = () => {
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
    <>
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
    </>
  );
};