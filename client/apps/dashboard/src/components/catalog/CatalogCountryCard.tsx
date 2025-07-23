import { CatalogBundle } from '@/__generated__/graphql';
import { Card, CardContent } from '@workspace/ui/components/card';
import React from 'react';

interface CatalogCountryCardProps {
  country: string;
  countryName: string;
  bundleCount?: number;
  bundles?: CatalogBundle[];
  isExpanded: boolean;
  isLoading?: boolean;
  isSelected?: boolean;
  onToggle: () => void;
  summary?: {
    count: number;
    range: string;
    status: "pending" | "loaded";
  };
}

export const CatalogCountryCard: React.FC<CatalogCountryCardProps> = ({
  country,
  countryName,
  isLoading = false,
  isSelected = false,
  onToggle,
  summary
}) => {

  const formatDataAmount = (bundle: CatalogBundle): string => {
    if (bundle.unlimited) return 'Unlimited';
    return bundle.data?.toString() || 'Unknown';
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
    <Card 
      className={`group hover:shadow-md transition-all cursor-pointer ${
        isSelected 
          ? 'ring-2 ring-blue-500 border-blue-500 bg-blue-50' 
          : 'hover:border-gray-300'
      }`}
      onClick={onToggle}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{getCountryFlag(country)}</span>
            <div>
              <h3 className="font-medium">{countryName || getCountryName(country)}</h3>
              <p className="text-sm text-muted-foreground">
                {summary ? `${summary.count} bundles • ${summary.range}` : 'Loading...'}
              </p>
            </div>
          </div>
          {isLoading && (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};