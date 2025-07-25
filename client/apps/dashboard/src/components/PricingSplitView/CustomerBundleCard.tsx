import { Bundle } from "@/__generated__/graphql";
import { Badge } from "@workspace/ui";
import { Calendar, Globe, Wifi } from "lucide-react";
import React from "react";

interface CustomerBundleCardProps {
  bundle: Bundle;
  isSelected: boolean;
  onClick: () => void;
}

export const CustomerBundleCard: React.FC<CustomerBundleCardProps> = ({
  bundle,
  isSelected,
  onClick,
}) => {
  // Type guard to check if bundle is CatalogBundle
  const isCatalogBundle = bundle.__typename === 'CatalogBundle';
  
  const formatDataAmount = (bundle: Bundle) => {
    if (bundle.isUnlimited) return "Unlimited";
    return bundle.dataAmountReadable || "Unknown";
  };

  const formatGroups = (groups: string[]) => {
    if (groups.length === 0) return null;
    // Show first group as primary badge
    return groups[0];
  };

  return (
    <div
      className={`border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
        isSelected ? "ring-2 ring-blue-500 bg-blue-50" : ""
      }`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-2">
          {/* Title and Description */}
          <div>
            <h4 className="font-medium text-gray-900">
              {bundle.name || "Unknown Bundle"}
            </h4>
            {isCatalogBundle && bundle.description && (
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                {bundle.description}
              </p>
            )}
          </div>

          {/* Bundle Details */}
          <div className="flex flex-wrap items-center gap-3 text-sm">
            {/* Duration */}
            <div className="flex items-center gap-1 text-gray-600">
              <Calendar className="h-3.5 w-3.5" />
              <span>
                {bundle.validityInDays} day{bundle.validityInDays !== 1 ? "s" : ""}
              </span>
            </div>

            {/* Data */}
            <div className="flex items-center gap-1 text-gray-600">
              <Wifi className="h-3.5 w-3.5" />
              <span>{formatDataAmount(bundle)}</span>
            </div>

            {/* Countries count */}
            <div className="flex items-center gap-1 text-gray-600">
              <Globe className="h-3.5 w-3.5" />
              <span>{bundle.countries.length} countries</span>
            </div>
          </div>

          {/* Groups and Region */}
          <div className="flex flex-wrap items-center gap-2">
            {isCatalogBundle && bundle.groups && formatGroups(bundle.groups) && (
              <Badge variant="secondary" className="text-xs">
                {formatGroups(bundle.groups)}
              </Badge>
            )}
            {bundle.region && (
              <Badge variant="outline" className="text-xs">
                {bundle.region}
              </Badge>
            )}
          </div>
        </div>

        {/* Pricing Section */}
        <div className="text-right space-y-1">
          {bundle.pricingBreakdown ? (
            <>
              <div className="text-xs text-gray-500 uppercase tracking-wider">
                Customer Price
              </div>
              <div className="text-xl font-semibold text-gray-900">
                ${bundle.pricingBreakdown.priceAfterDiscount.toFixed(2)}
              </div>
              <div className="text-xs text-gray-500">
                {bundle.pricingBreakdown.currency}
              </div>
              
              {/* Profit Information */}
              <div className="pt-2 mt-2 border-t border-gray-100">
                <div className="text-xs text-gray-600">
                  Profit: ${bundle.pricingBreakdown.netProfit.toFixed(2)}
                </div>
                <div className={`text-xs font-medium ${
                  bundle.pricingBreakdown.netProfit > 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {((bundle.pricingBreakdown.netProfit / bundle.pricingBreakdown.priceAfterDiscount) * 100).toFixed(1)}% margin
                </div>
                {/* Processing Fee Info */}
                {bundle.pricingBreakdown.processingCost && bundle.pricingBreakdown.processingCost > 0 && (
                  <div className="text-xs text-gray-500 mt-1">
                    Processing: -${bundle.pricingBreakdown.processingCost.toFixed(2)}
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="text-xs text-gray-500 uppercase tracking-wider">
                Base Cost
              </div>
              <div className="text-xl font-semibold text-gray-900">
                ${bundle.basePrice.toFixed(2)}
              </div>
              <div className="text-xs text-gray-500">
                {bundle.currency}
              </div>
              
              {/* Placeholder for pricing */}
              <div className="pt-2 mt-2 border-t border-gray-100">
                <div className="text-xs text-gray-400">
                  Calculating...
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};