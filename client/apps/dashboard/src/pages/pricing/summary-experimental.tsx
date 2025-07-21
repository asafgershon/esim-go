import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { CountryBundle } from '@/__generated__/graphql';
import { CountryPricingSplitView } from '../../components/country-pricing-split-view';
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

  return (
    <div className="h-full flex flex-col">

      <div className="flex-1 min-h-0">
        <CountryPricingSplitView 
          bundlesByCountry={countryGroups}
          onExpandCountry={expandCountry}
        />
      </div>
    </div>
  );
};