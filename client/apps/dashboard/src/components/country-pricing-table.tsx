import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@workspace/ui/components/table';
import { Badge } from '@workspace/ui/components/badge';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@workspace/ui/components/button';

interface PricingData {
  bundleName: string;
  countryName: string;
  duration: number;
  cost: number;
  costPlus: number;
  totalCost: number;
  discountRate: number;
  discountValue: number;
  priceAfterDiscount: number;
  processingRate: number;
  processingCost: number;
  revenueAfterProcessing: number;
  finalRevenue: number;
  currency: string;
}

interface CountryGroupData {
  countryName: string;
  countryId: string;
  totalBundles: number;
  avgPricePerDay: number;
  hasCustomDiscount: boolean;
  discountRate?: number;
  bundles?: PricingData[];
  lastFetched?: string;
}

interface CountryPricingTableProps {
  countries: CountryGroupData[];
  onCountryClick: (country: CountryGroupData) => void;
  onBundleClick?: (bundle: PricingData) => void;
  onExpandCountry: (countryId: string) => Promise<void>;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

const formatPercentage = (rate: number) => {
  return (rate * 100).toFixed(0) + '%';
};

const formatLastFetched = (lastFetched?: string) => {
  if (!lastFetched) return 'Not cached';
  const date = new Date(lastFetched);
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
  return `${Math.floor(diffInMinutes / 1440)}d ago`;
};

export function CountryPricingTable({
  countries,
  onCountryClick,
  onBundleClick,
  onExpandCountry,
}: CountryPricingTableProps) {
  const [expandedCountries, setExpandedCountries] = useState<Set<string>>(new Set());
  const [loadingCountries, setLoadingCountries] = useState<Set<string>>(new Set());

  const toggleCountry = async (countryId: string) => {
    const isExpanded = expandedCountries.has(countryId);
    
    if (!isExpanded) {
      // Expand country - fetch bundles if not loaded
      const country = countries.find(c => c.countryId === countryId);
      if (country && !country.bundles) {
        setLoadingCountries(prev => new Set(prev).add(countryId));
        try {
          await onExpandCountry(countryId);
        } finally {
          setLoadingCountries(prev => {
            const next = new Set(prev);
            next.delete(countryId);
            return next;
          });
        }
      }
      setExpandedCountries(prev => new Set(prev).add(countryId));
    } else {
      // Collapse country
      setExpandedCountries(prev => {
        const next = new Set(prev);
        next.delete(countryId);
        return next;
      });
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[300px]">Country</TableHead>
            <TableHead>Total Bundles</TableHead>
            <TableHead>Avg Price/Day</TableHead>
            <TableHead>Discount Applied</TableHead>
            <TableHead>Last Fetched</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {countries.map((country) => {
            const isExpanded = expandedCountries.has(country.countryId);
            const isLoading = loadingCountries.has(country.countryId);

            return (
              <React.Fragment key={country.countryId}>
                {/* Country Group Row */}
                <TableRow 
                  className="bg-gray-50 font-medium hover:bg-gray-100 cursor-pointer"
                  onClick={() => toggleCountry(country.countryId)}
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                      <span>{country.countryName}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{country.totalBundles}</Badge>
                  </TableCell>
                  <TableCell>
                    {formatCurrency(country.avgPricePerDay)}
                  </TableCell>
                  <TableCell>
                    {country.hasCustomDiscount ? (
                      <Badge variant="default">
                        {formatPercentage(country.discountRate || 0)}
                      </Badge>
                    ) : (
                      <Badge variant="outline">Default</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-gray-500">
                      {formatLastFetched(country.lastFetched)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onCountryClick(country);
                      }}
                    >
                      Configure
                    </Button>
                  </TableCell>
                </TableRow>

                {/* Bundle Rows (when expanded) */}
                {isExpanded && (
                  <>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24">
                          <div className="flex justify-center items-center">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                            <span className="ml-2 text-gray-600">Loading bundles...</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      country.bundles?.map((bundle, index) => (
                        <TableRow 
                          key={`${country.countryId}-${bundle.duration}`}
                          className="hover:bg-gray-50 cursor-pointer"
                          onClick={() => {
                            console.log('Bundle clicked:', bundle);
                            onBundleClick?.(bundle);
                          }}
                        >
                          <TableCell className="pl-12">
                            {bundle.bundleName}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{bundle.duration} days</Badge>
                          </TableCell>
                          <TableCell>
                            {formatCurrency(bundle.priceAfterDiscount / bundle.duration)}
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-gray-600">
                              {formatCurrency(bundle.priceAfterDiscount)}
                            </span>
                          </TableCell>
                          <TableCell>
                            {/* Empty cell to align with Last Fetched column */}
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="text-sm text-green-600">
                              +{formatCurrency(bundle.finalRevenue)}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </>
                )}
              </React.Fragment>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}