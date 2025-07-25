import { Bundle } from "@/__generated__/graphql";
import { ScrollArea } from "@workspace/ui";
import { Package } from "lucide-react";
import React, { useEffect, useState } from "react";
import { BundlesByCountryWithBundles } from "./types";
import { CustomerBundleCard } from "./CustomerBundleCard";
import { useLazyQuery } from "@apollo/client";
import { CALCULATE_BATCH_ADMIN_PRICING } from "../../lib/graphql/queries";

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
  const [bundlesWithPricing, setBundlesWithPricing] = useState<Bundle[]>([]);
  const [pricingLoading, setPricingLoading] = useState(false);
  
  const [calculateBatchPricing] = useLazyQuery(CALCULATE_BATCH_ADMIN_PRICING);

  // Calculate pricing when bundles are loaded
  useEffect(() => {
    if (!country.bundles || country.bundles.length === 0) return;
    
    const calculatePricing = async () => {
      setPricingLoading(true);
      
      // Get unique durations from bundles
      const uniqueDurations = Array.from(new Set(
        country.bundles!.map(bundle => bundle.validityInDays).filter(days => days > 0)
      ));
      
      // Create pricing requests
      const requests = uniqueDurations.map(days => ({
        numOfDays: days,
        countryId: country.country.iso.toUpperCase(),
        paymentMethod: 'ISRAELI_CARD' // Default payment method
      }));
      
      try {
        const result = await calculateBatchPricing({
          variables: { requests }
        });
        
        if (result.data?.calculateBatchPricing) {
          // Create a map of duration to pricing data
          const pricingMap = new Map();
          result.data.calculateBatchPricing.forEach((pricing: any) => {
            pricingMap.set(pricing.duration, pricing);
          });
          
          // Merge pricing data with bundles
          const bundlesWithPricing = country.bundles!.map(bundle => ({
            ...bundle,
            pricingBreakdown: pricingMap.get(bundle.validityInDays)
          }));
          
          setBundlesWithPricing(bundlesWithPricing);
        }
      } catch (error) {
        console.error('Error calculating pricing:', error);
        // Fallback to bundles without pricing
        setBundlesWithPricing(country.bundles!);
      } finally {
        setPricingLoading(false);
      }
    };
    
    calculatePricing();
  }, [country.bundles, country.country.iso, calculateBatchPricing]);

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

  // Show pricing loading state
  if (pricingLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Calculating pricing...</span>
      </div>
    );
  }

  // Use bundles with pricing if available, otherwise use original bundles
  const displayBundles = bundlesWithPricing.length > 0 ? bundlesWithPricing : country.bundles;
  const sortedBundles = [...displayBundles].sort(
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
