import { Bundle, BundlesByCountry, Trip } from "../../__generated__/graphql";



export interface BundlesByCountryWithBundles extends BundlesByCountry {
  bundles?: Bundle[];
  originalBundles?: Bundle[]; // For tracking unfiltered bundles
}

export interface CountryPricingSplitViewProps {
  bundlesByCountry: BundlesByCountryWithBundles[];
  tripsData?: Trip[];
  onExpandCountry: (countryId: string) => Promise<void>;
  loading?: boolean;
  showTrips?: boolean;
  onToggleTrips?: (show: boolean) => void;
  selectedCountryId?: string;
  onCountrySelect?: (countryId: string | null) => void;
}