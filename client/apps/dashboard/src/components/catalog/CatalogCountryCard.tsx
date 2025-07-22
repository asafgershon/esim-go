import React from 'react';
import { Card, CardContent } from '@workspace/ui/components/card';
import { Badge } from '@workspace/ui/components/badge';
import { Button } from '@workspace/ui/components/button';
import { 
  ChevronRight, 
  ChevronDown, 
  Package, 
  Clock, 
  DollarSign,
  Database,
  Wifi,
  WifiOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CatalogBundle {
  id: string;
  esimGoName: string;
  bundleGroup?: string;
  description?: string;
  duration?: number;
  dataAmount: number;
  unlimited: boolean;
  priceCents: number;
  currency: string;
  regions: string[];
  syncedAt: string;
}

interface CatalogCountryCardProps {
  country: string;
  bundleCount: number;
  bundles?: CatalogBundle[];
  isExpanded: boolean;
  onToggle: () => void;
}

export const CatalogCountryCard: React.FC<CatalogCountryCardProps> = ({
  country,
  bundleCount,
  bundles,
  isExpanded,
  onToggle
}) => {
  const formatPrice = (priceCents: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(priceCents / 100);
  };
  
  const formatDataAmount = (bytes: number): string => {
    if (bytes === -1) return 'Unlimited';
    
    const gb = bytes / (1024 * 1024 * 1024);
    if (gb >= 1) {
      return `${gb.toFixed(1)} GB`;
    }
    
    const mb = bytes / (1024 * 1024);
    return `${Math.round(mb)} MB`;
  };
  
  const getCountryFlag = (countryCode: string): string => {
    // Simple mapping for common countries - can be expanded
    const flags: Record<string, string> = {
      'US': '🇺🇸', 'GB': '🇬🇧', 'FR': '🇫🇷', 'DE': '🇩🇪', 'ES': '🇪🇸',
      'IT': '🇮🇹', 'JP': '🇯🇵', 'CN': '🇨🇳', 'KR': '🇰🇷', 'IN': '🇮🇳',
      'BR': '🇧🇷', 'MX': '🇲🇽', 'CA': '🇨🇦', 'AU': '🇦🇺', 'NZ': '🇳🇿',
      'IL': '🇮🇱', 'AE': '🇦🇪', 'SA': '🇸🇦', 'EG': '🇪🇬', 'ZA': '🇿🇦'
    };
    return flags[countryCode] || '🌍';
  };
  
  const getCountryName = (countryCode: string): string => {
    try {
      const displayNames = new Intl.DisplayNames(['en'], { type: 'region' });
      return displayNames.of(countryCode) || countryCode;
    } catch {
      return countryCode;
    }
  };
  
  return (
    <Card className="overflow-hidden">
      <Button
        variant="ghost"
        className="w-full p-0 h-auto justify-start"
        onClick={onToggle}
      >
        <div className="flex items-center justify-between w-full p-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{getCountryFlag(country)}</span>
            <div className="text-left">
              <h3 className="font-medium">{countryName || getCountryName(country)}</h3>
              <p className="text-sm text-muted-foreground">
                {bundleCount !== undefined ? `${bundleCount} bundle${bundleCount !== 1 ? 's' : ''}` : 'Click to load bundles'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              <Package className="h-3 w-3 mr-1" />
              {bundleCount}
            </Badge>
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </div>
      </Button>
      
      <AnimatePresence>
        {isExpanded && bundles && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <CardContent className="pt-0 pb-4">
              <div className="space-y-2">
                {bundles.map((bundle) => (
                  <div
                    key={bundle.id}
                    className="bg-muted/50 rounded-lg p-3 space-y-2"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium text-sm">{bundle.bundleName}</h4>
                        {bundle.hasCustomDiscount && (
                          <p className="text-xs text-green-600">
                            Custom pricing applied
                          </p>
                        )}
                      </div>
                      {bundle.bundleGroup && (
                        <Badge variant="outline" className="text-xs">
                          {bundle.bundleGroup}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 text-xs">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span>{bundle.duration || 0} days</span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        {bundle.isUnlimited ? (
                          <Wifi className="h-3 w-3 text-muted-foreground" />
                        ) : (
                          <WifiOff className="h-3 w-3 text-muted-foreground" />
                        )}
                        <span>{formatDataAmount(bundle)}</span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3 text-muted-foreground" />
                        <span>{formatPrice(bundle.priceAfterDiscount, bundle.currency)}</span>
                      </div>
                      
                      {bundle.discountValue > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          -{bundle.discountRate}%
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
};