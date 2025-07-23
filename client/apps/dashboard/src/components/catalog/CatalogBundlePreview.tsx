import React from "react";
import { Badge } from "@workspace/ui/components/badge";
import { 
  Clock, 
  DollarSign, 
  Wifi, 
  WifiOff, 
  Package,
  TrendingUp,
  Calculator
} from "lucide-react";
import { CountryBundle } from "@/__generated__/graphql";



interface CatalogBundlePreviewProps {
  bundle: CountryBundle;
}

export const CatalogBundlePreview: React.FC<CatalogBundlePreviewProps> = ({ bundle }) => {
  const formatPrice = (price: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(price);
  };

  const formatPercentage = (rate: number) => {
    return `${Math.round(rate * 100)}%`;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Bundle Header */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">{bundle.bundleName}</h3>
        <div className="flex items-center gap-2">
          {bundle.bundleGroup && (
            <Badge variant="outline">{bundle.bundleGroup}</Badge>
          )}
        </div>
      </div>

      {/* Bundle Details */}
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Duration</p>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{bundle.duration} days</span>
            </div>
          </div>
          
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Data</p>
            <div className="flex items-center gap-2">
              {bundle.isUnlimited ? (
                <Wifi className="h-4 w-4 text-muted-foreground" />
              ) : (
                <WifiOff className="h-4 w-4 text-muted-foreground" />
              )}
              <span className="font-medium">{bundle.dataAmount || 'Unknown'}</span>
            </div>
          </div>
        </div>

        {/* Bundle Information */}
        <div className="border rounded-lg p-4 space-y-3">
          <h4 className="font-medium flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Catalog Price
          </h4>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium">Base Price</span>
              <span className="font-semibold text-lg">
                {formatPrice(bundle.cost || 0, bundle.currency)}
              </span>
            </div>
            
            {bundle.cost && bundle.duration && bundle.pricePerDay && (
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Per Day</span>
                
                <span>{formatPrice(bundle.pricePerDay) || formatPrice(bundle.cost / bundle.duration, bundle.currency)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Additional Info */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>Country: {bundle.countryName} ({bundle.countryId})</p>
          {bundle.planId && <p>Plan ID: {bundle.planId}</p>}
        </div>
      </div>
    </div>
  );
};