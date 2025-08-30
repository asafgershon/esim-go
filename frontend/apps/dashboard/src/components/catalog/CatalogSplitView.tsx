import { BundlesByCountry, BundlesByRegion, CatalogBundle } from "@/__generated__/graphql";
import {
  BaseFilterState,
  Button,
  FilterBar,
  FilterConfig,
  FilterOption,
  List,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@workspace/ui";
import { AnimatePresence, motion } from "framer-motion";
import Fuse from "fuse.js";
import { Clock, Database, Globe, Infinity, Package, Package2, RefreshCw, X } from "lucide-react";
import React, { useCallback, useMemo, useState } from "react";
import { Panel, PanelGroup } from "react-resizable-panels";
import { ResizeHandle } from "../resize-handle";
import { CatalogBundlePreview } from "./CatalogBundlePreview";
import { CatalogBundlesTable } from "./CatalogBundlesTable";
import { CatalogCountryCard } from "./CatalogCountryCard";
import { CatalogRegionCard } from "./CatalogRegionCard";
import { CatalogSyncPanel } from "./CatalogSyncPanel";

// Catalog-specific filter state
interface CatalogFilterState extends BaseFilterState {
  bundleGroups: Set<string>;
  durations: Set<string>;
  dataTypes: Set<string>;
  regions?: Set<string>;
}

// Duration filter options 
const DURATION_OPTIONS: FilterOption[] = [
  { label: "Short (1-7 days)", value: "short" },
  { label: "Medium (8-30 days)", value: "medium" },
  { label: "Long (31+ days)", value: "long" },
];

// Data type filter options
const DATA_TYPE_OPTIONS: FilterOption[] = [
  { label: "Unlimited", value: "unlimited" },
  { label: "Limited", value: "limited" },
];

interface CatalogSplitViewProps {
  countriesData: BundlesByCountry[];
  regionsData: BundlesByRegion[];
  bundleGroups: { group: string }[];
  showSyncPanel: boolean;
  onToggleSyncPanel: (show: boolean) => void;
  syncHistory: any[];
  syncHistoryLoading: boolean;
  loading: boolean;
  onSync: () => void;
  syncLoading: boolean;
  selectedCountryId?: string;
  onCountrySelect?: (countryId: string | null) => void;
}

export function CatalogSplitView({
  countriesData = [],
  regionsData = [],
  bundleGroups = [],
  showSyncPanel,
  onToggleSyncPanel,
  syncHistory,
  syncHistoryLoading,
  loading = false,
  onSync,
  syncLoading,
  selectedCountryId,
  onCountrySelect,
}: CatalogSplitViewProps) {
  const [selectedCountry, setSelectedCountry] = useState<string | null>(selectedCountryId || null);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [selectedBundle, setSelectedBundle] = useState<CatalogBundle | null>(
    null
  );
  const [showRegions, setShowRegions] = useState(false);
  
  // New unified filter state
  const [filterState, setFilterState] = useState<CatalogFilterState>({
    search: "",
    bundleGroups: new Set<string>(),
    durations: new Set<string>(),
    dataTypes: new Set<string>(),
    regions: new Set<string>(),
  });

  // Configure Fuse.js for country search
  const countryFuse = useMemo(() => {
    const fuseOptions = {
      keys: ["country.name", "country.iso"],
      threshold: 0.3,
      includeScore: true,
    };

    return new Fuse(countriesData, fuseOptions);
  }, [countriesData]);

  // Configure Fuse.js for region search
  const regionFuse = useMemo(() => {
    const fuseOptions = {
      keys: ["region"],
      threshold: 0.3,
      includeScore: true,
    };

    return new Fuse(regionsData, fuseOptions);
  }, [regionsData]);

  // Filter countries by search query
  const filteredCountriesData = useMemo(() => {
    let filtered = countriesData;

    // Apply search filter
    if (filterState.search?.trim()) {
      const searchResults = countryFuse.search(filterState.search);
      const searchedIds = new Set(
        searchResults.map((result) => result.item.country.iso)
      );
      filtered = filtered.filter((country) => searchedIds.has(country.country.iso));
    }

    return filtered;
  }, [
    countriesData,
    filterState.search,
    countryFuse,
  ]);

  // Get selected country data with filtered bundles
  const selectedCountryData = useMemo(() => {
    if (!selectedCountry) return null;
    const country = filteredCountriesData.find(
      (country) => country.country.iso === selectedCountry
    );
    return country || null;
  }, [selectedCountry, filteredCountriesData]);

  // Get selected region data
  const selectedRegionData = useMemo(() => {
    if (!selectedRegion) return null;
    return regionsData.find((r) => r.region === selectedRegion) || null;
  }, [selectedRegion, regionsData]);

  // Handle country selection
  const handleCountrySelect = useCallback(
    (countryId: string) => {
      setSelectedCountry(countryId);
      onCountrySelect?.(countryId);
      setSelectedRegion(null); // Clear region selection
      setSelectedBundle(null); // Clear selected bundle when changing country
    },
    [onCountrySelect]
  );

  // Handle region selection
  const handleRegionSelect = useCallback(
    (regionName: string) => {
      setSelectedRegion(regionName);
      setSelectedCountry(null); // Clear country selection
      setSelectedBundle(null); // Clear selected bundle
    },
    []
  );

  // Get summary info for a country
  const getCountrySummary = (country: BundlesByCountry) => {
    return {
      count: country.bundleCount || 0,
      range: country.pricingRange || {
        min: 0,
        max: 0,
        currency: "USD",
      },
      status: "loaded" as const,
    };
  };

  // Sync with external selectedCountryId prop
  React.useEffect(() => {
    if (selectedCountryId && selectedCountryId !== selectedCountry) {
      setSelectedCountry(selectedCountryId);
    }
  }, [selectedCountryId, selectedCountry]);

  // Set default selection based on current view
  React.useEffect(() => {
    if (showRegions) {
      // Clear country selection when switching to regions
      setSelectedCountry(null);
      onCountrySelect?.(null);
      if (!selectedRegion && regionsData.length > 0) {
        setSelectedRegion(regionsData[0].region);
      }
    } else {
      // Clear region selection when switching to countries
      setSelectedRegion(null);
      if (!selectedCountry && !selectedCountryId && filteredCountriesData.length > 0) {
        const firstCountryId = filteredCountriesData[0].country.iso;
        setSelectedCountry(firstCountryId);
        onCountrySelect?.(firstCountryId);
        handleCountrySelect(firstCountryId);
      }
    }
  }, [
    showRegions,
    filteredCountriesData,
    regionsData,
    selectedCountry,
    selectedCountryId,
    selectedRegion,
    handleCountrySelect,
    onCountrySelect,
  ]);

  // Create filter configuration
  const filterConfig: FilterConfig = useMemo(() => ({
    categories: [
      {
        key: 'bundleGroups',
        label: 'Bundle Group',
        icon: Package2,
        color: 'blue',
        options: bundleGroups.map((group) => ({
          label: group.group,
          value: group.group,
        })),
      },
      {
        key: 'durations',
        label: 'Duration',
        icon: Clock,
        color: 'green',
        options: DURATION_OPTIONS,
      },
      {
        key: 'dataTypes',
        label: 'Data Type',
        icon: Infinity,
        color: 'purple',
        options: DATA_TYPE_OPTIONS,
      },
    ],
    quickFilters: [
      {
        key: 'showRegions',
        label: showRegions ? 'Countries' : 'Regions',
        icon: Globe,
        value: showRegions,
        type: 'toggle' as const,
      },
    ],
    showSearch: true,
    searchPlaceholder: showRegions ? "Search regions..." : "Search countries...",
    allowClearAll: true,
  }), [bundleGroups, showRegions]);

  // Handle filter change and special quick filters
  const handleFilterChange = useCallback((newFilterState: CatalogFilterState) => {
    // Check if showRegions toggle was changed
    if ('showRegions' in newFilterState && newFilterState.showRegions !== showRegions) {
      setShowRegions(newFilterState.showRegions as boolean);
    }
    
    // Update the main filter state
    setFilterState(newFilterState);
  }, [showRegions]);

  // Calculate filtered bundles count for currently selected country
  const filteredBundlesCount = useMemo(() => {
    if (!selectedCountryData?.bundles) return 0;
    
    let filtered = selectedCountryData.bundles;
    
    // Apply bundle group filter
    if (filterState.bundleGroups.size > 0) {
      filtered = filtered.filter(bundle => 
        bundle.groups?.some(g => filterState.bundleGroups.has(g))
      );
    }
    
    // Apply duration filter
    if (filterState.durations.size > 0) {
      filtered = filtered.filter(bundle => {
        const duration = bundle.validityInDays;
        return Array.from(filterState.durations).some(filterValue => {
          switch (filterValue) {
            case "short": return duration >= 1 && duration <= 7;
            case "medium": return duration >= 8 && duration <= 30;
            case "long": return duration >= 31;
            default: return false;
          }
        });
      });
    }
    
    // Apply data type filter
    if (filterState.dataTypes.size > 0) {
      filtered = filtered.filter(bundle => {
        const isUnlimited = bundle.isUnlimited;
        return Array.from(filterState.dataTypes).some(filterValue => {
          switch (filterValue) {
            case "unlimited": return isUnlimited;
            case "limited": return !isUnlimited;
            default: return false;
          }
        });
      });
    }
    
    return filtered.length;
  }, [selectedCountryData, filterState]);

  return (
    <div className="h-full flex flex-col">
      {/* Filter Bar */}
      <div className="flex-shrink-0 mb-4">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <FilterBar
              config={filterConfig}
              filterState={filterState}
              onFilterChange={handleFilterChange}
              totalItems={selectedCountryData?.bundles?.length}
              filteredItems={filteredBundlesCount}
            />
          </div>
          <Button
            variant="ghost"
            size="sm"
            className={`h-7 ${
              showSyncPanel ? "bg-accent text-accent-foreground" : ""
            }`}
            onClick={() => onToggleSyncPanel(!showSyncPanel)}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Main Content with Resizable Panels */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <PanelGroup
          direction="horizontal"
          className="flex h-full"
          autoSaveId="catalog-layout"
        >
          {/* Countries Panel */}
          <Panel
            defaultSize={25}
            minSize={15}
            maxSize={40}
            id="countries-panel"
            order={1}
          >
            <List.Container
              className="h-full"
              itemCount={
                showRegions ? regionsData.length : filteredCountriesData.length
              }
            >
              <List.Header>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-700">
                    {showRegions
                      ? `Regions (${regionsData.length})`
                      : `Countries (${filteredCountriesData.length})`}
                  </h3>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          onClick={() => setShowRegions(!showRegions)}
                          variant="ghost"
                          size="sm"
                          className={`flex items-center gap-2 ${
                            showRegions ? "text-blue-600 bg-blue-50" : ""
                          }`}
                        >
                          <Globe className="h-4 w-4" />
                          {showRegions ? "Countries" : "Regions"}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        {showRegions
                          ? "Switch to countries view"
                          : "Switch to regions view"}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </List.Header>
              <List.Content spacing="normal" padding={true}>
                <div className="space-y-2">
                  {showRegions ? (
                    // Regions view
                    regionsData.length === 0 ? (
                      <List.Empty
                        icon={
                          <Globe className="h-12 w-12 mx-auto text-gray-300" />
                        }
                        message="No regions data available. Load countries to see regional groupings."
                      />
                    ) : (
                      regionsData.map((region) => {
                        const isSelected = selectedRegion === region.region;
                        const summary = {
                          count: region.bundleCount,
                          range: region.region,
                          status: "loaded" as const,
                        };

                        return (
                          <List.Item key={region.region} asChild>
                            <CatalogRegionCard
                              region={region}
                              isSelected={isSelected}
                              isLoading={false}
                              onSelect={() =>
                                handleRegionSelect(region.region)
                              }
                              summary={summary}
                            />
                          </List.Item>
                        );
                      })
                    )
                  ) : // Countries view
                  loading ? (
                    <List.Loading />
                  ) : filteredCountriesData.length === 0 ? (
                    <List.Empty
                      icon={
                        <Database className="h-12 w-12 mx-auto text-gray-300" />
                      }
                      message={
                        filterState.search
                          ? `No countries found matching "${filterState.search}"`
                          : filterState.bundleGroups.size === 0
                          ? "No catalog data available. Try syncing the catalog."
                          : `No bundles found for selected group filters`
                      }
                    />
                  ) : (
                    filteredCountriesData.map((country) => {
                      const summary = getCountrySummary(country);
                      const isSelected = selectedCountry === country.country.iso;

                      return (
                        <List.Item key={country.country.iso} asChild>
                          <CatalogCountryCard
                            country={country.country.iso}
                            countryName={country.country.name}
                            bundleCount={country.bundleCount}
                            bundles={[]}
                            isExpanded={false}
                            isLoading={false}
                            isSelected={isSelected}
                            onToggle={() => handleCountrySelect(country.country.iso)}
                            summary={summary}
                          />
                        </List.Item>
                      );
                    })
                  )}
                </div>
              </List.Content>
            </List.Container>
          </Panel>

          <ResizeHandle />

          {/* Bundles Panel */}
          <Panel
            defaultSize={showSyncPanel ? 50 : 75}
            minSize={showSyncPanel ? 40 : 60}
            id="bundles-panel"
            order={2}
          >
            <div className="h-full flex flex-col">
              {/* Bundles Header */}
              <div className="sticky top-0 z-10 border-b border-gray-200 px-3 py-3 flex-shrink-0">
                <h3 className="text-sm font-medium text-gray-700">
                  Bundles
                  {selectedCountryData && ` (${selectedCountryData.bundleCount || 0})`}
                  {selectedRegionData && ` (${selectedRegionData.bundleCount || 0})`}
                </h3>
              </div>

              <motion.div className="flex-1 flex flex-col min-h-0" layout>
                {selectedCountry || selectedRegion ? (
                  <div className="flex-1 min-h-0">
                    <CatalogBundlesTable
                      countryId={selectedCountry}
                      regionName={selectedRegion}
                      selectedBundle={selectedBundle}
                      onBundleSelect={setSelectedBundle}
                      bundleGroupFilter={filterState.bundleGroups.size > 0 ? Array.from(filterState.bundleGroups)[0] : "all"}
                      filterState={filterState}
                    />
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center text-gray-500">
                      <div className="mb-4">
                        <Package className="h-12 w-12 mx-auto text-gray-300" />
                      </div>
                      <p className="text-lg">
                        Select a {showRegions ? "Region" : "Country"}
                      </p>
                      <p className="text-sm">
                        Click on a {showRegions ? "region" : "country"} from the
                        list to view its bundles
                      </p>
                    </div>
                  </div>
                )}
              </motion.div>
            </div>
          </Panel>

          {/* Preview/Sync Panel */}
          {(selectedBundle || showSyncPanel) && (
            <>
              <ResizeHandle />
              <Panel
                defaultSize={25}
                minSize={20}
                maxSize={40}
                id="preview-panel"
                order={3}
              >
                <AnimatePresence mode="wait">
                  {showSyncPanel ? (
                    <motion.div
                      key="sync-content"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.2 }}
                      className="h-full"
                    >
                      <CatalogSyncPanel
                        syncHistory={syncHistory}
                        loading={syncHistoryLoading}
                        onClose={() => onToggleSyncPanel(false)}
                        onSync={onSync}
                        syncLoading={syncLoading}
                      />
                    </motion.div>
                  ) : selectedBundle ? (
                    <motion.div
                      key="preview-content"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.2 }}
                      className="h-full"
                    >
                      <div className="h-full flex flex-col">
                        {/* Preview Header */}
                        <div className="sticky top-0 z-10  border-b border-gray-200 px-3 py-3 flex-shrink-0">
                          <div className="flex items-center justify-between">
                            <h3 className="text-sm font-medium text-gray-700">
                              Bundle Details
                            </h3>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedBundle(null)}
                              className="h-6 w-6 p-0 hover:bg-gray-100"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <div className="flex-1 overflow-auto">
                          <CatalogBundlePreview bundle={selectedBundle} />
                        </div>
                      </div>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </Panel>
            </>
          )}
        </PanelGroup>
      </div>
    </div>
  );
}
