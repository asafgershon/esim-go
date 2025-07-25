import {
  Badge,
  Button,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui";
import Fuse from "fuse.js";
import {
  Check,
  ChevronRight,
  Clock,
  Database,
  Filter,
  Infinity,
  Package2,
  Search,
  Sparkles,
  TrendingUp,
  X,
} from "lucide-react";
import React, { useMemo, useState } from "react";
import type { FilterState } from "./types";
import { usePricingFilters } from "./usePricingFilters";

interface CommandFilterPaletteProps {
  selectedFilters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  showHighDemandOnly?: boolean;
  onHighDemandToggle?: () => void;
  totalBundles: number;
  filteredBundles: number;
  totalCountries?: number;
  hasBundlesSelected?: boolean;
}

type FilterCategory = "groups" | "durations" | "dataTypes" | "highDemand";

interface FilterCategoryConfig {
  key: FilterCategory;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  options?: { label: string; value: string }[];
}

export const CommandFilterPalette: React.FC<CommandFilterPaletteProps> = ({
  selectedFilters,
  onFiltersChange,
  showHighDemandOnly,
  onHighDemandToggle,
  totalBundles,
  filteredBundles,
  hasBundlesSelected,
}) => {
  const [open, setOpen] = useState(false);
  const [globalSearchOpen, setGlobalSearchOpen] = useState(false);
  const [globalSearchQuery, setGlobalSearchQuery] = useState("");
  const [dropdownSearchQuery, setDropdownSearchQuery] = useState("");
  const { filters } = usePricingFilters();

  // Calculate active filter count
  const activeFilterCount =
    selectedFilters.bundleGroups.size +
    selectedFilters.durations.size +
    selectedFilters.dataTypes.size +
    (showHighDemandOnly ? 1 : 0);

  // Filter categories configuration
  const filterCategories: FilterCategoryConfig[] = [
    {
      key: "groups",
      label: "Bundle Group",
      icon: Package2,
      options:
        filters?.groups.map((group) => ({
          label: group,
          value: group,
        })) || [],
    },
    {
      key: "durations",
      label: "Duration",
      icon: Clock,
      options:
        filters?.durations.map((d) => ({ label: d.label, value: d.value })) ||
        [],
    },
    {
      key: "dataTypes",
      label: "Data Type",
      icon: Database,
      options:
        filters?.dataTypes.map((d) => ({ label: d.label, value: d.value })) ||
        [],
    },
    {
      key: "highDemand",
      label: "High Demand",
      icon: TrendingUp,
    },
  ];

  const handleFilterChange = (category: FilterCategory, value: string) => {
    if (category === "highDemand") {
      onHighDemandToggle?.();
      return;
    }

    const currentSet = new Set(selectedFilters[category as keyof FilterState]);
    if (currentSet.has(value)) {
      currentSet.delete(value);
    } else {
      currentSet.add(value);
    }

    onFiltersChange({
      ...selectedFilters,
      [category]: currentSet,
    });
  };

  const clearAllFilters = () => {
    onFiltersChange({
      bundleGroups: new Set(),
      durations: new Set(),
      dataTypes: new Set(),
    });
    if (showHighDemandOnly) {
      onHighDemandToggle?.();
    }
    setDropdownSearchQuery("");
    setOpen(false);
  };

  const getSelectedCount = (category: FilterCategory): number => {
    if (category === "highDemand") {
      return showHighDemandOnly ? 1 : 0;
    }
    return selectedFilters[category as keyof FilterState]?.size || 0;
  };

  const isSelected = (category: FilterCategory, value: string): boolean => {
    if (category === "highDemand") {
      return showHighDemandOnly || false;
    }
    return selectedFilters[category as keyof FilterState]?.has(value) || false;
  };

  // Create search index for global search using Fuse.js
  const globalSearchIndex = useMemo(() => {
    if (!filters) return null;

    const searchData: Array<{
      category: FilterCategory;
      categoryLabel: string;
      value: string;
      label: string;
      icon: React.ComponentType<{ className?: string }>;
      searchText: string;
    }> = [];

    // Add bundle groups
    filters.groups.forEach((group) => {
      searchData.push({
        category: "groups",
        categoryLabel: "Bundle Group",
        value: group,
        label: group,
        icon: Package2,
        searchText: `${group} bundle group package`,
      });
    });

    // Add durations
    filters.durations.forEach((duration) => {
      searchData.push({
        category: "durations",
        categoryLabel: "Duration",
        value: duration.value,
        label: duration.label,
        icon: Clock,
        searchText: `${duration.label} ${duration.value} duration time period days`,
      });
    });

    // Add data types
    filters.dataTypes.forEach((dataType) => {
      searchData.push({
        category: "dataTypes",
        categoryLabel: "Data Type",
        value: dataType.value,
        label: dataType.label,
        icon: Database,
        searchText: `${dataType.label} ${dataType.value} data type ${
          dataType.isUnlimited ? "unlimited" : "limited"
        }`,
      });
    });

    // Add high demand
    searchData.push({
      category: "highDemand",
      categoryLabel: "High Demand",
      value: "highDemand",
      label: "High Demand",
      icon: TrendingUp,
      searchText: "high demand trending popular",
    });

    return new Fuse(searchData, {
      keys: ["label", "categoryLabel", "searchText"],
      threshold: 0.4,
      includeScore: true,
      minMatchCharLength: 1,
      shouldSort: true,
    });
  }, [filters]);

  // Global search results using Fuse.js
  const globalSearchResults = useMemo(() => {
    if (!globalSearchIndex || globalSearchQuery.length < 1) {
      return [];
    }

    const fuseResults = globalSearchIndex.search(globalSearchQuery);
    return fuseResults.map((result) => ({
      ...result.item,
      selected:
        result.item.category === "highDemand"
          ? showHighDemandOnly || false
          : selectedFilters[result.item.category as keyof FilterState]?.has(result.item.value) || false,
      score: result.score,
    }));
  }, [
    globalSearchIndex,
    globalSearchQuery,
    selectedFilters,
    showHighDemandOnly,
  ]);

  // Create Fuse.js index for dropdown categories and options
  const dropdownSearchIndex = useMemo(() => {
    const searchData: Array<{
      type: "category" | "option";
      category: FilterCategory;
      categoryLabel: string;
      value?: string;
      label: string;
      icon: React.ComponentType<{ className?: string }>;
    }> = [];

    filterCategories.forEach((category) => {
      // Add the category itself
      searchData.push({
        type: "category",
        category: category.key,
        categoryLabel: category.label,
        label: category.label,
        icon: category.icon,
      });

      // Add category options
      category.options?.forEach((option) => {
        searchData.push({
          type: "option",
          category: category.key,
          categoryLabel: category.label,
          value: option.value,
          label: option.label,
          icon: category.icon,
        });
      });
    });

    return new Fuse(searchData, {
      keys: ["label", "categoryLabel"],
      threshold: 0.3,
      includeScore: true,
      minMatchCharLength: 1,
    });
  }, [filterCategories]);

  // Filtered categories for dropdown search
  const filteredDropdownCategories = useMemo(() => {
    if (!dropdownSearchQuery || dropdownSearchQuery.length < 1) {
      return filterCategories;
    }

    const searchResults = dropdownSearchIndex.search(dropdownSearchQuery);
    const categoriesWithResults = new Set<FilterCategory>();

    // Collect all categories that have matches
    searchResults.forEach((result) => {
      categoriesWithResults.add(result.item.category);
    });

    return filterCategories.filter((category) =>
      categoriesWithResults.has(category.key)
    );
  }, [filterCategories, dropdownSearchQuery, dropdownSearchIndex]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Bundle Group filters */}
          {Array.from(selectedFilters.bundleGroups).map((group) => (
            <Badge
              key={group}
              variant="secondary"
              className="h-7 px-3 gap-2 text-xs bg-blue-50 border-blue-200 hover:bg-blue-100"
            >
              <Package2 className="h-3 w-3 text-blue-600" />
              <span className="text-blue-800">Bundle</span>
              <span className="text-blue-900 font-medium">is</span>
              <Popover>
                <PopoverTrigger asChild>
                  <button className="bg-blue-100 px-1.5 py-0.5 rounded text-blue-900 font-medium hover:bg-blue-200 transition-colors">
                    {group}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-0" align="start">
                  <Command className="rounded-lg border-none shadow-md">
                    <CommandInput
                      placeholder="Search bundle groups..."
                      className="border-none focus:ring-0"
                    />
                    <CommandList className="max-h-48">
                      <CommandEmpty>No bundle groups found.</CommandEmpty>
                      <CommandGroup>
                        {filters?.groups.map((bundleGroup) => (
                          <CommandItem
                            key={bundleGroup}
                            onSelect={() => {
                              // Remove old value and add new one
                              const newSet = new Set(
                                selectedFilters.bundleGroups
                              );
                              newSet.delete(group);
                              newSet.add(bundleGroup);
                              onFiltersChange({
                                ...selectedFilters,
                                bundleGroups: newSet,
                              });
                            }}
                            className="flex items-center gap-2"
                          >
                            <Package2 className="h-4 w-4 text-blue-600" />
                            {bundleGroup}
                            {selectedFilters.bundleGroups.has(bundleGroup) && (
                              <Check className="h-4 w-4 ml-auto text-blue-600" />
                            )}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <button
                onClick={() => handleFilterChange("groups", group)}
                className="ml-1 hover:bg-blue-200 rounded-full p-0.5 transition-colors"
              >
                <X className="h-2.5 w-2.5 text-blue-600" />
              </button>
            </Badge>
          ))}

          {/* Duration filters */}
          {Array.from(selectedFilters.durations).map((duration) => {
            const durationLabel =
              filters?.durations.find((d) => d.value === duration)?.label ||
              duration;
            return (
              <Badge
                key={duration}
                variant="secondary"
                className="h-7 px-3 gap-2 text-xs bg-green-50 border-green-200 hover:bg-green-100"
              >
                <Clock className="h-3 w-3 text-green-600" />
                <span className="text-green-800">Duration</span>
                <span className="text-green-900 font-medium">is</span>
                <Popover>
                  <PopoverTrigger asChild>
                    <button className="bg-green-100 px-1.5 py-0.5 rounded text-green-900 font-medium hover:bg-green-200 transition-colors">
                      {durationLabel}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-0" align="start">
                    <Command className="rounded-lg border-none shadow-md">
                      <CommandInput
                        placeholder="Search durations..."
                        className="border-none focus:ring-0"
                      />
                      <CommandList className="max-h-48">
                        <CommandEmpty>No durations found.</CommandEmpty>
                        <CommandGroup>
                          {filters?.durations.map((durationOption) => (
                            <CommandItem
                              key={durationOption.value}
                              onSelect={() => {
                                // Remove old value and add new one
                                const newSet = new Set(
                                  selectedFilters.durations
                                );
                                newSet.delete(duration);
                                newSet.add(durationOption.value);
                                onFiltersChange({
                                  ...selectedFilters,
                                  durations: newSet,
                                });
                              }}
                              className="flex items-center gap-2"
                            >
                              <Clock className="h-4 w-4 text-green-600" />
                              {durationOption.label}
                              {selectedFilters.durations.has(
                                durationOption.value
                              ) && (
                                <Check className="h-4 w-4 ml-auto text-green-600" />
                              )}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <button
                  onClick={() => handleFilterChange("durations", duration)}
                  className="ml-1 hover:bg-green-200 rounded-full p-0.5 transition-colors"
                >
                  <X className="h-2.5 w-2.5 text-green-600" />
                </button>
              </Badge>
            );
          })}

          {/* Data Type filters */}
          {Array.from(selectedFilters.dataTypes).map((dataType) => {
            const dataTypeLabel =
              filters?.dataTypes.find((d) => d.value === dataType)?.label ||
              dataType;
            return (
              <Badge
                key={dataType}
                variant="secondary"
                className="h-7 px-3 gap-2 text-xs bg-purple-50 border-purple-200 hover:bg-purple-100"
              >
                <Database className="h-3 w-3 text-purple-600" />
                <span className="text-purple-800">Data</span>
                <span className="text-purple-900 font-medium">is</span>
                <Popover>
                  <PopoverTrigger asChild>
                    <button className="bg-purple-100 px-1.5 py-0.5 rounded text-purple-900 font-medium hover:bg-purple-200 transition-colors">
                      {dataTypeLabel}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-0" align="start">
                    <Command className="rounded-lg border-none shadow-md">
                      <CommandInput
                        placeholder="Search data types..."
                        className="border-none focus:ring-0"
                      />
                      <CommandList className="max-h-48">
                        <CommandEmpty>No data types found.</CommandEmpty>
                        <CommandGroup>
                          {filters?.dataTypes.map((dataTypeOption) => (
                            <CommandItem
                              key={dataTypeOption.value}
                              onSelect={() => {
                                // Remove old value and add new one
                                const newSet = new Set(
                                  selectedFilters.dataTypes
                                );
                                newSet.delete(dataType);
                                newSet.add(dataTypeOption.value);
                                onFiltersChange({
                                  ...selectedFilters,
                                  dataTypes: newSet,
                                });
                              }}
                              className="flex items-center gap-2"
                            >
                              <Database className="h-4 w-4 text-purple-600" />
                              {dataTypeOption.label}
                              {selectedFilters.dataTypes.has(
                                dataTypeOption.value
                              ) && (
                                <Check className="h-4 w-4 ml-auto text-purple-600" />
                              )}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <button
                  onClick={() => handleFilterChange("dataTypes", dataType)}
                  className="ml-1 hover:bg-purple-200 rounded-full p-0.5 transition-colors"
                >
                  <X className="h-2.5 w-2.5 text-purple-600" />
                </button>
              </Badge>
            );
          })}

          {/* Global AI-like Filter button - Hidden until AI features are implemented */}
          {false && (
            <Popover
              open={globalSearchOpen}
              onOpenChange={(isOpen) => {
                setGlobalSearchOpen(isOpen);
                if (!isOpen) {
                  setGlobalSearchQuery("");
                }
              }}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 px-2.5 gap-2 border-dashed border-gray-300 hover:border-gray-400 text-gray-600 hover:text-gray-800"
                >
                  <Sparkles className="h-3 w-3" />
                  <span className="text-xs font-medium">AI Filter</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0" align="start">
                <Command className="rounded-lg border-none shadow-md">
                  <div className="flex items-center px-3 py-2 border-b">
                    <Search className="h-4 w-4 text-muted-foreground mr-2" />
                    <CommandInput
                      placeholder="Search across all filters..."
                      className="border-none focus:ring-0 flex-1"
                      value={globalSearchQuery}
                      onValueChange={setGlobalSearchQuery}
                    />
                  </div>
                  <CommandList className="max-h-64">
                    {globalSearchResults.length === 0 &&
                    globalSearchQuery.length >= 1 ? (
                      <CommandEmpty>
                        No filters found matching "{globalSearchQuery}".
                      </CommandEmpty>
                    ) : globalSearchQuery.length < 1 ? (
                      <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                        <Sparkles className="h-6 w-6 mx-auto mb-2 opacity-50" />
                        <p>Start typing to search across all filters</p>
                        <p className="text-xs mt-1 opacity-70">
                          Bundle groups, durations, data types, and more
                        </p>
                      </div>
                    ) : (
                      <CommandGroup>
                        {globalSearchResults.map((result, index) => {
                          const Icon = result.icon;
                          return (
                            <CommandItem
                              key={`${result.category}-${result.value}-${index}`}
                              onSelect={() => {
                                if (result.category === "highDemand") {
                                  onHighDemandToggle?.();
                                } else {
                                  handleFilterChange(
                                    result.category,
                                    result.value
                                  );
                                }
                                setGlobalSearchOpen(false);
                                setGlobalSearchQuery("");
                              }}
                              className="flex items-center gap-3 px-3 py-2"
                            >
                              <Icon className="h-4 w-4 text-muted-foreground" />
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium">
                                  {result.label}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {result.categoryLabel}
                                </div>
                              </div>
                              {result.selected && (
                                <Check className="h-4 w-4 text-primary" />
                              )}
                            </CommandItem>
                          );
                        })}
                      </CommandGroup>
                    )}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          )}

          {/* High Demand Quick Filter Button */}
          <Button
            variant={showHighDemandOnly ? "default" : "outline"}
            size="sm"
            onClick={onHighDemandToggle}
            className={`h-7 px-3 gap-2 ${
              showHighDemandOnly
                ? "bg-primary text-primary-foreground"
                : "border-dashed border-gray-300 hover:border-gray-400 text-gray-600 hover:text-gray-800"
            }`}
          >
            <TrendingUp className="h-3 w-3" />
            <span className="text-xs font-medium">High Demand</span>
          </Button>

          {/* Unlimited Data Quick Filter Button */}
          {filters?.dataTypes.find(dt => dt.isUnlimited) && (
            <Button
              variant={selectedFilters.dataTypes.has("unlimited") ? "default" : "outline"}
              size="sm"
              onClick={() => handleFilterChange("dataTypes", "unlimited")}
              className={`h-7 px-3 gap-2 ${
                selectedFilters.dataTypes.has("unlimited")
                  ? "bg-primary text-primary-foreground"
                  : "border-dashed border-gray-300 hover:border-gray-400 text-gray-600 hover:text-gray-800"
              }`}
            >
              <Infinity className="h-3 w-3" />
              <span className="text-xs font-medium">Unlimited</span>
            </Button>
          )}

          {/* Add Filter button */}
          <DropdownMenu
            open={open}
            onOpenChange={(isOpen) => {
              setOpen(isOpen);
              if (!isOpen) {
                setDropdownSearchQuery("");
              }
            }}
          >
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-7 w-7 p-0 border-dashed border-gray-300 hover:border-gray-400 text-gray-600 hover:text-gray-800"
              >
                <Filter className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-80 p-1" align="start">
              <div className="p-2 pb-1">
                <div className="flex items-center gap-2">
                  <Search className="h-3.5 w-3.5 text-muted-foreground" />
                  <input
                    placeholder="Filter..."
                    value={dropdownSearchQuery}
                    onChange={(e) => setDropdownSearchQuery(e.target.value)}
                    className="w-full bg-transparent border-none outline-none text-sm placeholder:text-muted-foreground"
                  />
                </div>
              </div>
              <DropdownMenuGroup>
                {filteredDropdownCategories.length === 0 &&
                dropdownSearchQuery.length >= 1 ? (
                  <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                    No filters found matching "{dropdownSearchQuery}".
                  </div>
                ) : dropdownSearchQuery.length >= 1 ? (
                  // Flat structure when searching - show all matching options directly
                  (() => {
                    const searchResults =
                      dropdownSearchIndex.search(dropdownSearchQuery);
                    const flatResults: Array<{
                      category: FilterCategory;
                      categoryLabel: string;
                      value?: string;
                      label: string;
                      icon: React.ComponentType<{ className?: string }>;
                      type: "category" | "option";
                    }> = [];

                    searchResults.forEach((result) => {
                      if (result.item.type === "option") {
                        flatResults.push(result.item);
                      } else if (
                        result.item.type === "category" &&
                        result.item.category === "highDemand"
                      ) {
                        flatResults.push(result.item);
                      }
                    });

                    return flatResults.map((item, index) => {
                      const Icon = item.icon;
                      const isHighDemand = item.category === "highDemand";
                      const isOptionSelected =
                        !isHighDemand && item.value
                          ? isSelected(item.category, item.value)
                          : showHighDemandOnly;

                      return (
                        <DropdownMenuItem
                          key={`${item.category}-${
                            item.value || "category"
                          }-${index}`}
                          onClick={() => {
                            if (isHighDemand) {
                              onHighDemandToggle?.();
                            } else if (item.value) {
                              handleFilterChange(item.category, item.value);
                            }
                            setDropdownSearchQuery("");
                            setOpen(false);
                          }}
                          className="flex items-center gap-2"
                        >
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <span className="text-sm">{item.label}</span>
                            <ChevronRight className="h-3 w-3 text-muted-foreground/50" />
                            <span className="text-xs text-muted-foreground">
                              {item.categoryLabel}
                            </span>
                          </div>
                          {isOptionSelected && (
                            <Check className="h-4 w-4 text-primary" />
                          )}
                        </DropdownMenuItem>
                      );
                    });
                  })()
                ) : (
                  // Nested structure when not searching
                  filteredDropdownCategories.map((category) => {
                    const selectedCount = getSelectedCount(category.key);
                    const Icon = category.icon;

                    if (category.key === "highDemand") {
                      return (
                        <DropdownMenuItem
                          key={category.key}
                          onClick={() => {
                            onHighDemandToggle?.();
                            setDropdownSearchQuery("");
                            setOpen(false);
                          }}
                          className="flex items-center justify-between cursor-pointer"
                        >
                          <div className="flex items-center gap-3">
                            <Icon className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{category.label}</span>
                          </div>
                          {selectedCount > 0 && (
                            <Badge
                              variant="secondary"
                              className="h-5 px-2 text-xs"
                            >
                              {selectedCount}
                            </Badge>
                          )}
                        </DropdownMenuItem>
                      );
                    }

                    return (
                      <DropdownMenuSub key={category.key}>
                        <DropdownMenuSubTrigger className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Icon className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{category.label}</span>
                          </div>
                          {selectedCount > 0 && (
                            <Badge
                              variant="secondary"
                              className="h-5 px-2 text-xs mr-2"
                            >
                              {selectedCount}
                            </Badge>
                          )}
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent className="w-64">
                          {category.options?.map((option) => (
                            <DropdownMenuItem
                              key={option.value}
                              onClick={() => {
                                handleFilterChange(category.key, option.value);
                                setDropdownSearchQuery("");
                                setOpen(false);
                              }}
                              className="flex items-center gap-2"
                            >
                              <Icon className="h-4 w-4 text-muted-foreground" />
                              {option.label}
                              {isSelected(category.key, option.value) && (
                                <Check className="h-4 w-4 ml-auto" />
                              )}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuSubContent>
                      </DropdownMenuSub>
                    );
                  })
                )}
              </DropdownMenuGroup>
              {activeFilterCount > 0 && (
                <>
                  <div className="border-t my-1" />
                  <DropdownMenuItem
                    onClick={clearAllFilters}
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    Clear all filters
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Results count */}
        {hasBundlesSelected && (
          <div className="text-sm text-muted-foreground">
            {filteredBundles === totalBundles
              ? `${totalBundles} bundle${totalBundles !== 1 ? "s" : ""}`
              : `${filteredBundles} of ${totalBundles} bundles`}
          </div>
        )}
      </div>
    </div>
  );
};
