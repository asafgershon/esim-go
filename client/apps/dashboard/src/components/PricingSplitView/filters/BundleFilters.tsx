import { Alert, AlertDescription, Button, Skeleton } from '@workspace/ui';
import { RotateCcw, X, TrendingUp } from 'lucide-react';
import React from 'react';
import { FilterDropdown } from './FilterDropdown';
import type { FilterProps, FilterState } from './types';
import { usePricingFilters } from './usePricingFilters';

interface BundleFiltersProps extends FilterProps {
  totalBundles: number;
  filteredBundles: number;
  // High demand filter props
  showHighDemandOnly?: boolean;
  onHighDemandToggle?: () => void;
  highDemandLoading?: boolean;
  totalCountries?: number;
}

export const BundleFilters: React.FC<BundleFiltersProps> = ({
  onFiltersChange,
  selectedFilters,
  totalBundles,
  filteredBundles,
  showHighDemandOnly,
  onHighDemandToggle,
  highDemandLoading,
  totalCountries
}) => {
  const { filters, loading, error } = usePricingFilters();

  // Show loading skeleton while fetching filters
  if (loading) {
    return (
      <div className="flex items-center gap-2 p-3 border-b bg-background/95">
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-24" />
        </div>
      </div>
    );
  }

  // Show error state
  if (error || !filters) {
    return (
      <div className="p-3 border-b">
        <Alert variant="destructive">
          <AlertDescription>
            Failed to load filter options: {error || 'Unknown error'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const handleFilterChange = (filterType: keyof FilterState, values: string[]) => {
    const newFilters = {
      ...selectedFilters,
      [filterType]: new Set(values)
    };
    onFiltersChange(newFilters);
  };

  const handleClearAll = () => {
    onFiltersChange({
      bundleGroups: new Set(),
      durations: new Set(),
      dataTypes: new Set()
    });
  };

  const hasActiveFilters = 
    selectedFilters.bundleGroups.size > 0 ||
    selectedFilters.durations.size > 0 ||
    selectedFilters.dataTypes.size > 0;

  const totalActiveFilters = 
    selectedFilters.bundleGroups.size +
    selectedFilters.durations.size +
    selectedFilters.dataTypes.size;

  return (
    <div className="flex items-center justify-between p-3 border-b bg-background/95">
      <div className="flex items-center gap-2">
        {/* High Demand Filter (if provided) */}
        {onHighDemandToggle && (
          <Button
            variant={showHighDemandOnly ? "default" : "outline"}
            size="sm"
            onClick={onHighDemandToggle}
            disabled={highDemandLoading}
            className="h-9 flex items-center gap-2"
          >
            <TrendingUp className="h-4 w-4" />
            High Demand
            {showHighDemandOnly && totalCountries && (
              <span className="ml-1 bg-primary-foreground/20 px-1 rounded text-xs">
                {totalCountries}
              </span>
            )}
          </Button>
        )}
        
        <FilterDropdown
          title="Bundle Group"
          options={filters.bundleGroups}
          selected={selectedFilters.bundleGroups}
          onSelectionChange={(values) => handleFilterChange('bundleGroups', values)}
          placeholder="All Groups"
        />
        
        <FilterDropdown
          title="Duration"
          options={filters.durations.map(d => ({
            label: d.label,
            value: d.value
          }))}
          selected={selectedFilters.durations}
          onSelectionChange={(values) => handleFilterChange('durations', values)}
          placeholder="All Durations"
        />
        
        <FilterDropdown
          title="Data Type"
          options={filters.dataTypes.map(d => ({
            label: d.label,
            value: d.value
          }))}
          selected={selectedFilters.dataTypes}
          onSelectionChange={(values) => handleFilterChange('dataTypes', values)}
          placeholder="All Types"
        />
        
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearAll}
            className="h-9 px-3 text-sm text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="h-4 w-4 mr-1" />
            Reset
            <X className="h-4 w-4 ml-1" />
          </Button>
        )}
      </div>
      
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        {hasActiveFilters && (
          <span className="text-primary font-medium">
            {totalActiveFilters} filter{totalActiveFilters !== 1 ? 's' : ''} active
          </span>
        )}
        <span>
          {filteredBundles === totalBundles 
            ? `${totalBundles} bundle${totalBundles !== 1 ? 's' : ''}`
            : `Showing ${filteredBundles} of ${totalBundles} bundles`
          }
        </span>
      </div>
    </div>
  );
};