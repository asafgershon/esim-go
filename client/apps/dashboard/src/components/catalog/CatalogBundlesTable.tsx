import React from "react";
import { ScrollArea } from "@workspace/ui";
import { Package, Clock, DollarSign, Wifi, WifiOff } from "lucide-react";
import { Badge } from "@workspace/ui/components/badge";

interface CountryBundle {
  bundleName: string;
  countryName: string;
  countryId: string;
  duration: number;
  cost: number;
  costPlus: number;
  totalCost: number;
  discountRate: number;
  discountValue: number;
  priceAfterDiscount: number;
  processingRate: number;
  processingCost: number;
  finalRevenue: number;
  currency: string;
  pricePerDay: number;
  hasCustomDiscount: boolean;
  bundleGroup?: string;
  isUnlimited?: boolean;
  dataAmount?: string;
  planId?: string;
}

interface CountryData {
  countryName: string;
  countryId: string;
  bundles?: CountryBundle[];
  bundleCount?: number;
}

interface CatalogBundlesTableProps {
  country: CountryData;
  loadingCountries: Set<string>;
  selectedBundle: CountryBundle | null;
  onBundleSelect: (bundle: CountryBundle) => void;
}

export const CatalogBundlesTable: React.FC<CatalogBundlesTableProps> = ({ 
  country, 
  loadingCountries,
  selectedBundle,
  onBundleSelect
}) => {
  const isCountryLoading = loadingCountries.has(country.countryId);
  
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
          <p className="text-sm">This country has no catalog data available</p>
        </div>
      </div>
    );
  }

  const sortedBundles = [...country.bundles].sort((a, b) => (a.duration || 0) - (b.duration || 0));

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(price);
  };

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1" showOnHover={true}>
        <div className="space-y-1 p-2">
          {sortedBundles.map((bundle, index) => (
            <div
              key={bundle.planId || `${bundle.bundleName}-${index}`}
              className={`border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                selectedBundle?.planId === bundle.planId ? 'ring-2 ring-blue-500 bg-blue-50' : ''
              }`}
              onClick={() => onBundleSelect(bundle)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div>
                      <h4 className="font-medium">{bundle.bundleName || 'Unknown Bundle'}</h4>
                      <p className="text-sm text-gray-500">
                        {bundle.duration || 0} day{(bundle.duration || 0) !== 1 ? 's' : ''} • 
                        {bundle.dataAmount && ` ${bundle.dataAmount}`}
                        {bundle.bundleGroup && (
                          <span className="inline-flex items-center ml-2">
                            <Badge variant="outline" className="text-xs">
                              {bundle.bundleGroup}
                            </Badge>
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-lg font-semibold">
                    {formatPrice(bundle.cost || 0, bundle.currency || 'USD')}
                  </div>
                  <div className="text-sm text-gray-500">
                    {formatPrice((bundle.cost || 0) / (bundle.duration || 1), bundle.currency || 'USD')}/day
                  </div>
                </div>
              </div>
              
              <div className="mt-2 flex items-center gap-4 text-xs text-gray-600">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{bundle.duration} days</span>
                </div>
                
                <div className="flex items-center gap-1">
                  {bundle.isUnlimited ? (
                    <Wifi className="h-3 w-3" />
                  ) : (
                    <WifiOff className="h-3 w-3" />
                  )}
                  <span>{bundle.dataAmount || 'Unknown'}</span>
                </div>
                
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};