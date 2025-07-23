import { BundlesByCountry, CountryBundle, Trip } from "../../__generated__/graphql";

// Extended types for additional display fields
export interface CountryBundleWithDisplay extends CountryBundle {
  // All these fields should come from the backend
  // Making them optional since backend might not always provide them
  pricePerDay?: number;
  hasCustomDiscount?: boolean;
  configurationLevel?: string;
  discountPerDay?: number;
  dataAmount?: string;
}

export interface BundlesByCountryWithBundles extends BundlesByCountry {
  bundles?: CountryBundleWithDisplay[];
  originalBundles?: CountryBundleWithDisplay[]; // For tracking unfiltered bundles
}

export interface CountryPricingSplitViewProps {
  bundlesByCountry: BundlesByCountryWithBundles[];
  tripsData?: Trip[];
  onExpandCountry: (countryId: string) => Promise<void>;
  loading?: boolean;
  showTrips?: boolean;
  onToggleTrips?: (show: boolean) => void;
}