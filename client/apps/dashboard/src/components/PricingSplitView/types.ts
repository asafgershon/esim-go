import { BundlesByCountry, CountryBundle } from "../../__generated__/graphql";

// Extended types for additional display fields
export interface CountryBundleWithDisplay extends CountryBundle {
  pricePerDay: number;
  hasCustomDiscount: boolean;
  configurationLevel?: string;
  discountPerDay?: number;
  dataAmount?: string;
}

export interface BundlesByCountryWithBundles extends BundlesByCountry {
  bundles?: CountryBundleWithDisplay[];
}

export interface CountryPricingSplitViewProps {
  bundlesByCountry: BundlesByCountryWithBundles[];
  onExpandCountry: (countryId: string) => Promise<void>;
  loading?: boolean;
}