import { CatalogBundle, Provider } from "@/__generated__/graphql";
import { Badge } from "@workspace/ui/components/badge";
import {
  Clock,
  DollarSign,
  Wifi,
  WifiOff
} from "lucide-react";
import React from "react";
import EsimGoLogo from "@/assets/esimgo.jpeg?url";
import MayaLogo from "@/assets/maya.png?url";


interface CatalogBundlePreviewProps {
  bundle: CatalogBundle;
}

export const CatalogBundlePreview: React.FC<CatalogBundlePreviewProps> = ({ bundle }) => {
  const formatPrice = (price: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(price);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Bundle Header */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">{bundle.name}</h3>
        <p className="text-sm text-muted-foreground">{bundle.esimGoName}</p>
        <div className="flex items-center gap-2 flex-wrap">
          {bundle.groups && bundle.groups.map((group, index) => (
            <Badge key={index} variant="outline">{group}</Badge>
          ))}
        </div>
      </div>

      {/* Bundle Details */}
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Duration</p>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{bundle.validityInDays} days</span>
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
              <span className="font-medium">{bundle.dataAmountReadable}</span>
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
                {formatPrice(bundle.basePrice || 0, bundle.currency)}
              </span>
            </div>
            {bundle.provider === Provider.EsimGo && (<img src={EsimGoLogo} alt="EsimGo" className="h-4 w-4 rounded-xl" />)}
            {bundle.provider === Provider.Maya && (<img src={MayaLogo} alt="Maya" className="h-4 w-4 rounded-xl" />)}
            {bundle.basePrice && bundle.validityInDays && (
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Per Day</span>
                
                <span>{formatPrice(bundle.basePrice / bundle.validityInDays, bundle.currency)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Additional Info */}
        <div className="space-y-3">
          {bundle.description && (
            <div>
              <h4 className="font-medium text-sm mb-1">Description</h4>
              <p className="text-sm text-muted-foreground">{bundle.description}</p>
            </div>
          )}
          
          <div className="text-sm text-muted-foreground space-y-1">
            {/* Countries or Region info */}
            {bundle.countries && bundle.countries.length > 0 ? (
              <>
                <p><span className="font-medium">Countries:</span> {bundle.countries.length} {bundle.countries.length === 1 ? 'country' : 'countries'}</p>
                <p className="text-xs">{bundle.countries.join(', ')}</p>
              </>
            ) : bundle.region ? (
              <p><span className="font-medium">Coverage:</span> {bundle.region} region</p>
            ) : (
              <p><span className="font-medium">Coverage:</span> Check bundle details for coverage information</p>
            )}
            
            {/* Additional region info if both exist */}
            {bundle.region && bundle.countries && bundle.countries.length > 0 && (
              <p><span className="font-medium">Region:</span> {bundle.region}</p>
            )}
            
            {/* Data amount in MB if different from readable */}
            {bundle.dataAmountMB && !bundle.isUnlimited && (
              <p><span className="font-medium">Data:</span> {bundle.dataAmountMB} MB</p>
            )}
            
            {/* Speed info */}
            {bundle.speed && bundle.speed.length > 0 && (
              <p><span className="font-medium">Speed:</span> {bundle.speed.join(', ')}</p>
            )}
          </div>
          
          <div className="text-xs text-muted-foreground pt-2 border-t">
            <p>Plan ID: {bundle.esimGoName}</p>
            {bundle.syncedAt && (
              <p>Last synced: {new Date(bundle.syncedAt).toLocaleDateString()}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};