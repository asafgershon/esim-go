import React from "react";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@workspace/ui";
import { Globe, MapPin } from "lucide-react";

export interface DisplayRegionData {
  regionName: string;
  countryCount: number;
  bundleCount: number;
}

interface CatalogRegionCardProps {
  region: DisplayRegionData;
  isSelected: boolean;
  isLoading?: boolean;
  onSelect: () => void;
  summary?: {
    count: number;
    range: string;
    status: "pending" | "loaded";
  };
}

export const CatalogRegionCard: React.FC<CatalogRegionCardProps> = ({
  region,
  isSelected,
  isLoading = false,
  onSelect,
  summary,
}) => {
  // Format region name for display
  const formatRegionName = (regionName: string): string => {
    // Convert from something like "middle_east" to "Middle East"
    return regionName
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  return (
    <Card 
      className={`group hover:shadow-md transition-all cursor-pointer ${
        isSelected 
          ? 'ring-2 ring-blue-500 border-blue-500 bg-blue-50' 
          : 'hover:border-gray-300'
      }`}
      onClick={onSelect}
    >
      <CardHeader className="p-4">
        <CardTitle className="text-base flex items-center justify-between">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="flex items-center gap-2 cursor-default">
                  <Globe className="h-4 w-4" />
                  {formatRegionName(region.regionName)}
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>Region: {formatRegionName(region.regionName)}</p>
                <p>{region.countryCount} countries</p>
                <p>{region.bundleCount} bundles</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          {isLoading && (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          )}
        </CardTitle>
        
        <CardDescription className="text-sm">
          <div className="flex items-center gap-1 mb-1">
            <MapPin className="h-3 w-3" />
            <span>{region.countryCount} countries</span>
          </div>
          <div className="text-xs text-gray-500">
            {summary ? `${summary.count} bundles • ${summary.range}` : `${region.bundleCount} bundles`}
          </div>
        </CardDescription>
      </CardHeader>
    </Card>
  );
};