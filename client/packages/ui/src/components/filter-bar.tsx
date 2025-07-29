import * as React from "react";
import { Check, ChevronDown, Filter, Search, X } from "lucide-react";
import { cn } from "../lib/utils";
import { Badge } from "./badge";
import { Button } from "./button";
import { Input } from "./input";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { Separator } from "./separator";

// Filter types
export interface FilterOption {
  label: string;
  value: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export interface FilterCategory {
  key: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  options: FilterOption[];
  color?: string; // For badge styling
}

export interface BaseFilterState {
  search?: string;
  [key: string]: string | Set<string> | boolean | undefined;
}

export interface FilterConfig {
  categories: FilterCategory[];
  quickFilters?: {
    key: string;
    label: string;
    icon?: React.ComponentType<{ className?: string }>;
    value: string | boolean;
    type: 'toggle' | 'select';
  }[];
  showSearch?: boolean;
  searchPlaceholder?: string;
  allowClearAll?: boolean;
}

export interface FilterBarProps {
  config: FilterConfig;
  filterState: BaseFilterState;
  onFilterChange: (filterState: BaseFilterState) => void;
  totalItems?: number;
  filteredItems?: number;
  className?: string;
}

export const FilterBar = React.forwardRef<HTMLDivElement, FilterBarProps>(
  ({ config, filterState, onFilterChange, totalItems, filteredItems, className }, ref) => {
    const [filterPopoverOpen, setFilterPopoverOpen] = React.useState(false);
    const [searchValue, setSearchValue] = React.useState(filterState.search || '');

    // Calculate active filter count
    const activeFilterCount = config.categories.reduce((count, category) => {
      const filterValue = filterState[category.key];
      if (filterValue instanceof Set) {
        return count + filterValue.size;
      }
      return count;
    }, 0);

    // Handle search change
    const handleSearchChange = (value: string) => {
      setSearchValue(value);
      onFilterChange({
        ...filterState,
        search: value,
      });
    };

    // Toggle filter value
    const toggleFilterValue = (categoryKey: string, value: string) => {
      const currentValues = filterState[categoryKey];
      if (currentValues instanceof Set) {
        const newValues = new Set(currentValues);
        if (newValues.has(value)) {
          newValues.delete(value);
        } else {
          newValues.add(value);
        }
        onFilterChange({
          ...filterState,
          [categoryKey]: newValues,
        });
      }
    };

    // Clear all filters
    const clearAllFilters = () => {
      const clearedState: any = { search: '' };
      config.categories.forEach(category => {
        clearedState[category.key] = new Set<string>();
      });
      onFilterChange(clearedState);
      setSearchValue('');
      setFilterPopoverOpen(false);
    };

    // Check if a value is selected
    const isValueSelected = (categoryKey: string, value: string): boolean => {
      const filterValue = filterState[categoryKey];
      return filterValue instanceof Set ? filterValue.has(value) : false;
    };

    // Get selected values for a category
    const getSelectedValues = (category: FilterCategory): string[] => {
      const filterValue = filterState[category.key];
      return filterValue instanceof Set ? Array.from(filterValue) : [];
    };

    return (
      <div ref={ref} className={cn("space-y-4", className)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Search input */}
            {config.showSearch && (
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder={config.searchPlaceholder || "Search..."}
                  value={searchValue}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-10 h-9"
                />
              </div>
            )}

            {/* Active filter badges */}
            {config.categories.map(category => {
              const selectedValues = getSelectedValues(category);
              if (selectedValues.length === 0) return null;
              
              // Get labels for selected values
              const selectedOptions = selectedValues
                .map(value => category.options.find(opt => opt.value === value))
                .filter((opt): opt is FilterOption => opt !== undefined);
              
              if (selectedOptions.length === 0) return null;
              
              // Prepare display text
              const displayItems = selectedOptions.slice(0, 2).map(opt => opt.label);
              const remainingCount = selectedOptions.length - 2;
              const displayText = displayItems.join(", ") + (remainingCount > 0 ? ` +${remainingCount} more` : "");
              
              return (
                <Popover key={category.key}>
                  <PopoverTrigger asChild>
                    <Badge
                      variant="secondary"
                      className={cn(
                        "h-7 px-3 gap-2 text-xs cursor-pointer",
                        category.color === "blue" && "bg-blue-50 border-blue-200 hover:bg-blue-100",
                        category.color === "green" && "bg-green-50 border-green-200 hover:bg-green-100",
                        category.color === "purple" && "bg-purple-50 border-purple-200 hover:bg-purple-100",
                        category.color === "orange" && "bg-orange-50 border-orange-200 hover:bg-orange-100"
                      )}
                    >
                      {category.icon && (
                        <category.icon className={cn(
                          "h-3 w-3",
                          category.color === "blue" && "text-blue-600",
                          category.color === "green" && "text-green-600",
                          category.color === "purple" && "text-purple-600",
                          category.color === "orange" && "text-orange-600"
                        )} />
                      )}
                      <span className={cn(
                        category.color === "blue" && "text-blue-800",
                        category.color === "green" && "text-green-800",
                        category.color === "purple" && "text-purple-800",
                        category.color === "orange" && "text-orange-800"
                      )}>
                        {category.label}:
                      </span>
                      <span className={cn(
                        "font-medium",
                        category.color === "blue" && "text-blue-900",
                        category.color === "green" && "text-green-900",
                        category.color === "purple" && "text-purple-900",
                        category.color === "orange" && "text-orange-900"
                      )}>
                        {displayText}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          // Clear all values for this category
                          onFilterChange({
                            ...filterState,
                            [category.key]: new Set<string>(),
                          });
                        }}
                        className={cn(
                          "ml-1 rounded-full p-0.5 transition-colors",
                          category.color === "blue" && "hover:bg-blue-200",
                          category.color === "green" && "hover:bg-green-200",
                          category.color === "purple" && "hover:bg-purple-200",
                          category.color === "orange" && "hover:bg-orange-200"
                        )}
                      >
                        <X className={cn(
                          "h-2.5 w-2.5",
                          category.color === "blue" && "text-blue-600",
                          category.color === "green" && "text-green-600",
                          category.color === "purple" && "text-purple-600",
                          category.color === "orange" && "text-orange-600"
                        )} />
                      </button>
                    </Badge>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-2" align="start">
                    <div className="space-y-1">
                      <div className="text-sm font-medium px-2 py-1">{category.label} Filters</div>
                      {selectedOptions.map(option => (
                        <button
                          key={option.value}
                          onClick={() => toggleFilterValue(category.key, option.value)}
                          className="w-full flex items-center justify-between px-2 py-1.5 text-sm rounded hover:bg-gray-100 transition-colors"
                        >
                          <span>{option.label}</span>
                          <X className="h-3 w-3 text-gray-500" />
                        </button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              );
            })}

            {/* Quick filters */}
            {config.quickFilters?.map(quickFilter => {
              if (quickFilter.type === 'toggle') {
                const isActive = filterState[quickFilter.key] === true;
                return (
                  <Button
                    key={quickFilter.key}
                    variant={isActive ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      onFilterChange({
                        ...filterState,
                        [quickFilter.key]: !isActive,
                      });
                    }}
                    className={cn(
                      "h-7 px-3 gap-2",
                      !isActive && "border-dashed"
                    )}
                  >
                    {quickFilter.icon && <quickFilter.icon className="h-3 w-3" />}
                    <span className="text-xs font-medium">{quickFilter.label}</span>
                  </Button>
                );
              }
              return null;
            })}

            {/* Filter popover */}
            <Popover open={filterPopoverOpen} onOpenChange={setFilterPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant={activeFilterCount > 0 ? "default" : "outline"}
                  size="sm"
                  className={cn(
                    "h-7 px-3 gap-2",
                    activeFilterCount === 0 && "border-dashed"
                  )}
                >
                  <Filter className="h-3 w-3" />
                  <span className="text-xs font-medium">Filter</span>
                  {activeFilterCount > 0 && (
                    <Badge
                      variant="secondary"
                      className="ml-1 h-4 px-1 text-xs"
                    >
                      {activeFilterCount}
                    </Badge>
                  )}
                  <ChevronDown className="h-3 w-3 ml-1" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-3" align="start">
                <div className="space-y-3">
                  <div className="text-sm font-medium">Filters</div>
                  
                  {config.categories.map((category, idx) => (
                    <div key={category.key}>
                      {idx > 0 && <Separator className="my-3" />}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                          {category.icon && <category.icon className="h-4 w-4" />}
                          {category.label}
                        </div>
                        <div className="space-y-1">
                          {category.options.map(option => {
                            const isSelected = isValueSelected(category.key, option.value);
                            return (
                              <button
                                key={option.value}
                                onClick={() => toggleFilterValue(category.key, option.value)}
                                className="w-full flex items-center justify-between px-3 py-2 text-sm rounded-md hover:bg-gray-100 transition-colors"
                              >
                                <div className="flex items-center gap-2">
                                  {option.icon && <option.icon className="h-4 w-4 text-muted-foreground" />}
                                  <span>{option.label}</span>
                                </div>
                                {isSelected && (
                                  <Check className="h-4 w-4 text-primary" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {config.allowClearAll && activeFilterCount > 0 && (
                    <>
                      <Separator className="my-3" />
                      <button
                        onClick={clearAllFilters}
                        className="w-full px-3 py-2 text-sm text-center text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                      >
                        Clear all filters
                      </button>
                    </>
                  )}
                </div>
              </PopoverContent>
            </Popover>

            {activeFilterCount > 0 && (
              <span className="text-xs text-muted-foreground">
                {activeFilterCount} active
              </span>
            )}
          </div>

          {/* Results count */}
          {totalItems !== undefined && (
            <div className="text-sm text-muted-foreground">
              {filteredItems !== undefined && filteredItems !== totalItems
                ? `${filteredItems} of ${totalItems} items`
                : `${totalItems} item${totalItems !== 1 ? 's' : ''}`}
            </div>
          )}
        </div>
      </div>
    );
  }
);

FilterBar.displayName = "FilterBar";