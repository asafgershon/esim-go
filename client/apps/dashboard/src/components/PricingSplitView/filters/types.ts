// Filter types for pricing split view

export interface FilterState {
  bundleGroups: Set<string>;
  durations: Set<string>;
  dataTypes: Set<string>;
}

export interface DurationRange {
  label: string;
  value: string;
  minDays: number;
  maxDays: number;
}

export interface DataType {
  label: string;
  value: string;
  isUnlimited: boolean;
}

export interface FilterProps {
  onFiltersChange: (filters: FilterState) => void;
  selectedFilters: FilterState;
}