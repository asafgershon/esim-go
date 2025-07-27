import { BundlesByCountry, BundlesByRegion, BundlesForRegion, CatalogBundle } from "@/__generated__/graphql";
import {
  Button,
  List,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@workspace/ui";
import { AnimatePresence, motion } from "framer-motion";
import Fuse from "fuse.js";
import { Database, Globe, Package, RefreshCw, X } from "lucide-react";
import React, { useCallback, useMemo, useState } from "react";
import { Panel, PanelGroup } from "react-resizable-panels";
import { toast } from "sonner";
import { FilterDropdown } from "../PricingSplitView/filters/FilterDropdown";
import { ResizeHandle } from "../resize-handle";
import { CatalogBundlePreview } from "./CatalogBundlePreview";
import { CatalogBundlesTable } from "./CatalogBundlesTable";
import { CatalogCountryCard } from "./CatalogCountryCard";
import { CatalogRegionCard } from "./CatalogRegionCard";
import { CatalogSyncPanel } from "./CatalogSyncPanel";

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
}: CatalogSplitViewProps) {
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [selectedBundle, setSelectedBundle] = useState<CatalogBundle | null>(
    null
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBundleGroup, setSelectedBundleGroup] = useState<string>("all");
  const [showRegions, setShowRegions] = useState(false);

  // Configure Fuse.js for country search
  const countryFuse = useMemo(() => {
    const fuseOptions = {
      keys: ["countryName", "countryId"],
      threshold: 0.3,
      includeScore: true,
    };

    return new Fuse(countriesData, fuseOptions);
  }, [countriesData]);

  // Configure Fuse.js for region search
  const regionFuse = useMemo(() => {
    const fuseOptions = {
      keys: ["regionName"],
      threshold: 0.3,
      includeScore: true,
    };

    return new Fuse(regionsData, fuseOptions);
  }, [regionsData]);

  // Filter countries by search query and bundle group
  const filteredCountriesData = useMemo(() => {
    let filtered = countriesData;

    // Apply search filter
    if (searchQuery.trim()) {
      const searchResults = countryFuse.search(searchQuery);
      const searchedIds = new Set(
        searchResults.map((result) => result.item.country.iso)
      );
      filtered = filtered.filter((country) => searchedIds.has(country.country.iso));
    }

    // Note: Bundle group filtering is now handled in the table component

    return filtered;
  }, [
    countriesData,
    searchQuery,
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
      setSelectedRegion(null); // Clear region selection
      setSelectedBundle(null); // Clear selected bundle when changing country
    },
    []
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

  // Set default selection based on current view
  React.useEffect(() => {
    if (showRegions) {
      // Clear country selection when switching to regions
      setSelectedCountry(null);
      if (!selectedRegion && regionsData.length > 0) {
        setSelectedRegion(regionsData[0].region);
      }
    } else {
      // Clear region selection when switching to countries
      setSelectedRegion(null);
      if (!selectedCountry && filteredCountriesData.length > 0) {
        setSelectedCountry(filteredCountriesData[0].country.iso);
        handleCountrySelect(filteredCountriesData[0].country.iso);
      }
    }
  }, [
    showRegions,
    filteredCountriesData,
    regionsData,
    selectedCountry,
    selectedRegion,
    handleCountrySelect,
  ]);

  const bundleGroupOptions = [
    { label: "All Groups", value: "all" },
    ...bundleGroups.map((group) => ({
      label: group.group,
      value: group.group,
    })),
  ];

  return (
    <div className="h-full flex flex-col">
      {/* Filter Bar */}
      <div className="flex-shrink-0 mb-4 flex items-center gap-4">
        <FilterDropdown
          title="Bundle Group"
          options={bundleGroupOptions}
          selected={
            new Set(selectedBundleGroup === "all" ? [] : [selectedBundleGroup])
          }
          onSelectionChange={(values) => {
            setSelectedBundleGroup(values.length === 0 ? "all" : values[0]);
          }}
          placeholder="All Groups"
        />
        {selectedBundleGroup !== "all" && (
          <div className="text-sm text-muted-foreground">
            Filtered by: <strong>{selectedBundleGroup}</strong>
          </div>
        )}
        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className={`${
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
              <List.Search
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder={
                  showRegions ? "Search regions..." : "Search countries..."
                }
              />
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
                        searchQuery
                          ? `No countries found matching "${searchQuery}"`
                          : selectedBundleGroup === "all"
                          ? "No catalog data available. Try syncing the catalog."
                          : `No bundles found for group: ${selectedBundleGroup}`
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
                      bundleGroupFilter={selectedBundleGroup}
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
