import React from "react";
import {
  Button,
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@workspace/ui";
import { Star, MapPin } from "lucide-react";
import { BundlesByCountryWithBundles } from "./types";
import { PricingRange } from "@/__generated__/graphql";

interface CountryCardProps {
  country: BundlesByCountryWithBundles;
  isSelected: boolean;
  isLoading: boolean;
  isHighDemand: boolean;
  onSelect: () => void;
  onToggleHighDemand: (e: React.MouseEvent) => void;
  toggleLoading: boolean;
  summary: {
    count: number;
    range: PricingRange;
    status: "pending" | "loaded";
  };
}

export const CountryCard: React.FC<CountryCardProps> = ({
  country,
  isSelected,
  isLoading,
  isHighDemand,
  onSelect,
  onToggleHighDemand,
  toggleLoading,
  summary,
}) => {
  return (
    <Card 
      className={`group hover:shadow-md transition-all cursor-pointer ${
        isSelected 
          ? 'lg:ring-2 lg:ring-blue-500 lg:border-blue-500 lg:bg-blue-50' 
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
                  {country.country.flag + '    ' || <MapPin className="h-4 w-4" />}
                  {country.country.name || country.country.iso}
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>Country: {country.country.name || 'Unknown'}</p>
                <p>Code: {country.country.iso}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          {/* High Demand Toggle Button */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-6 w-6 p-0 rounded-full transition-all ${
                    isHighDemand 
                      ? 'bg-orange-500 hover:bg-orange-600 opacity-100' 
                      : 'bg-orange-50 border border-orange-200 hover:bg-orange-500 hover:border-orange-500 opacity-0 group-hover:opacity-100'
                  }`}
                  style={{
                    fontSize: 0
                  }}
                  onClick={onToggleHighDemand}
                  disabled={toggleLoading}
                >
                  <Star 
                    className="transition-colors"
                    style={{
                      width: '10px',
                      height: '10px',
                      color: isHighDemand ? 'white' : '#ea580c',
                      fill: isHighDemand ? 'white' : 'transparent'
                    }}
                  />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  {isHighDemand 
                    ? 'Remove from high demand' 
                    : 'Mark as high demand'}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>
        <CardDescription className="text-sm">
          {isLoading ? (
            <span className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
              Loading bundles...
            </span>
          ) : (
            `${summary.count} bundles • ${
              summary.range.min === summary.range.max 
                ? `$${summary.range.min.toFixed(2)}`
                : `$${summary.range.min.toFixed(2)} - $${summary.range.max.toFixed(2)}`
            }`
          )}
        </CardDescription>
      </CardHeader>
    </Card>
  );
};