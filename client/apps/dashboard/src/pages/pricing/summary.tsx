import { CountryBundle, Trip } from '@/__generated__/graphql';
import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { BundlesByCountryWithBundles, CountryPricingSplitView } from '../../components/country-pricing-split-view';

interface OutletContext {
  countryGroups: BundlesByCountryWithBundles[];
  tripsData: Trip[];
  expandCountry: (countryId: string) => Promise<void>;
  handleBundleClick?: (bundle: CountryBundle) => void;
  loading: boolean;
  error: string | null;
  showTrips: boolean;
  setShowTrips: (show: boolean) => void;
}

export const PricingSummaryPage: React.FC = () => {
  const { countryGroups, tripsData, expandCountry, showTrips, setShowTrips } = useOutletContext<OutletContext>();

  return (
    <div className="h-full flex flex-col">

      <div className="flex-1 min-h-0">
        <CountryPricingSplitView 
          bundlesByCountry={countryGroups}
          tripsData={tripsData}
          onExpandCountry={expandCountry}
          showTrips={showTrips}
          onToggleTrips={setShowTrips}
        />
      </div>
    </div>
  );
};