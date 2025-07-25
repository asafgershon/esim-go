import { Bundle } from "@/__generated__/graphql";
import { ScrollArea } from "@workspace/ui";
import { Package } from "lucide-react";
import React from "react";
import { BundlesByCountryWithBundles } from "./types";
import { CustomerBundleCard } from "./CustomerBundleCard";

interface BundlesTableProps {
  country: BundlesByCountryWithBundles;
  loadingCountries: Set<string>;
  selectedBundle: Bundle | null;
  onBundleSelect: (bundle: Bundle) => void;
}

export const BundlesTable: React.FC<BundlesTableProps> = ({
  country,
  loadingCountries,
  selectedBundle,
  onBundleSelect,
}) => {
  const isCountryLoading = loadingCountries.has(country.country.iso);

  if (isCountryLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading bundles...</span>
      </div>
    );
  }

  if (!country.bundles || country.bundles.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center text-gray-500">
          <Package className="h-12 w-12 mx-auto text-gray-300 mb-4" />
          <p className="text-lg">No bundles available</p>
          <p className="text-sm">This country has no pricing data available</p>
        </div>
      </div>
    );
  }

  const sortedBundles = [...country.bundles].sort(
    (a, b) => (a.validityInDays || 0) - (b.validityInDays || 0)
  );

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1" showOnHover={true}>
        <div className="space-y-2 p-2">
          {sortedBundles.map((bundle, index) => (
            <CustomerBundleCard
              key={
                bundle.name
                  ? `${bundle.name}-${bundle.validityInDays}`
                  : `bundle-${index}`
              }
              bundle={bundle}
              isSelected={selectedBundle === bundle}
              onClick={() => onBundleSelect(bundle)}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};
