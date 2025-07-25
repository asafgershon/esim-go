import { BundlesForCountry, BundlesForRegion, CatalogBundle } from "@/__generated__/graphql";
import {
  Button,
  List,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@workspace/ui";
import { AnimatePresence, motion } from "framer-motion";
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
  countriesData: BundlesForCountry[];
  regionsData: BundlesForRegion[];
  bundleGroups: { group: string }[];
  onLoadCountryBundles: (countryId: string) => Promise<CatalogBundle[]>;
  onLoadRegionBundles?: (region: string) => Promise<CatalogBundle[]>;
  onSync: () => void;
  syncLoading: boolean;
  showSyncPanel: boolean;
  onToggleSyncPanel: (show: boolean) => void;
  syncHistory: any[];
  syncHistoryLoading: boolean;
  loading: boolean;
  // New props for backend filtering
  onSearch?: (query: string) => void;
  onFilterByGroup?: (group: string | null) => void;
  searchQuery?: string;
  selectedBundleGroup?: string;
}

export function CatalogSplitViewRefactored({
  countriesData = [],
  regionsData = [],
  bundleGroups = [],
  onLoadCountryBundles,
  onLoadRegionBundles,
  onSync,
  syncLoading,
  showSyncPanel,
  onToggleSyncPanel,
  syncHistory,
  syncHistoryLoading,
  loading = false,
  onSearch,
  onFilterByGroup,
  searchQuery = "",
  selectedBundleGroup = "all",
}: CatalogSplitViewProps) {
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [selectedBundle, setSelectedBundle] = useState<CatalogBundle | null>(null);
  const [loadingCountries, setLoadingCountries] = useState<Set<string>>(new Set());
  const [countryBundles, setCountryBundles] = useState<Record<string, CatalogBundle[]>>({});
  const [regionBundles, setRegionBundles] = useState<Record<string, CatalogBundle[]>>({});
  const [showRegions, setShowRegions] = useState(false);

  // Get selected country data
  const selectedCountryData = useMemo(() => {
    if (!selectedCountry) return null;
    const country = countriesData.find((c) => c.country.iso === selectedCountry);
    if (!country) return null;

    const bundles = countryBundles[selectedCountry];
    return {
      ...country,
      bundles: bundles || [],
      bundleCount: bundles?.length || country.bundleCount,
    };
  }, [selectedCountry, countriesData, countryBundles]);

  // Get selected region data
  const selectedRegionData = useMemo(() => {
    if (!selectedRegion) return null;
    const region = regionsData.find((r) => r.region === selectedRegion);
    if (!region) return null;

    const bundles = regionBundles[selectedRegion];
    return {
      ...region,
      bundles: bundles || [],
      bundleCount: bundles?.length || region.bundleCount,
    };
  }, [selectedRegion, regionsData, regionBundles]);

  // Handle country selection
  const handleCountrySelect = useCallback(
    async (countryId: string) => {
      const country = countriesData.find((c) => c.country.iso === countryId);
      if (!country) return;

      setSelectedCountry(countryId);
      setSelectedRegion(null);
      setSelectedBundle(null);

      // Load bundles if not already loaded
      if (!countryBundles[countryId]) {
        setLoadingCountries((prev) => new Set(prev).add(countryId));

        try {
          const bundles = await onLoadCountryBundles(countryId);
          setCountryBundles((prev) => ({
            ...prev,
            [countryId]: bundles,
          }));
        } catch (error) {
          console.error("Error loading bundles for country:", countryId, error);
          toast.error(`Failed to load bundles for ${country.country.name}. Please try again.`);
        } finally {
          setLoadingCountries((prev) => {
            const next = new Set(prev);
            next.delete(countryId);
            return next;
          });
        }
      }
    },
    [countriesData, countryBundles, onLoadCountryBundles]
  );

  // Handle region selection
  const handleRegionSelect = useCallback(
    async (regionName: string) => {
      const region = regionsData.find((r) => r.region === regionName);
      if (!region) return;

      setSelectedRegion(regionName);
      setSelectedCountry(null);
      setSelectedBundle(null);

      // Load bundles if not already loaded
      if (!regionBundles[regionName] && onLoadRegionBundles) {
        setLoadingCountries((prev) => new Set(prev).add(regionName));

        try {
          const bundles = await onLoadRegionBundles(regionName);
          setRegionBundles((prev) => ({
            ...prev,
            [regionName]: bundles,
          }));
        } catch (error) {
          console.error("Error loading bundles for region:", regionName, error);
          toast.error(`Failed to load bundles for ${regionName}. Please try again.`);
        } finally {
          setLoadingCountries((prev) => {
            const next = new Set(prev);
            next.delete(regionName);
            return next;
          });
        }
      }
    },
    [regionsData, regionBundles, onLoadRegionBundles]
  );

  // Set default selection
  React.useEffect(() => {
    if (showRegions) {
      setSelectedCountry(null);
      if (!selectedRegion && regionsData.length > 0) {
        setSelectedRegion(regionsData[0].region);
      }
    } else {
      setSelectedRegion(null);
      if (!selectedCountry && countriesData.length > 0) {
        setSelectedCountry(countriesData[0].country.iso);
        handleCountrySelect(countriesData[0].country.iso);
      }
    }
  }, [showRegions, countriesData, regionsData, selectedCountry, selectedRegion, handleCountrySelect]);

  const bundleGroupOptions = [
    { label: "All Groups", value: "all" },
    ...bundleGroups.map((group) => ({
      label: group.group,
      value: group.group,
    })),
  ];

  const handleBundleGroupChange = (values: string[]) => {
    const newGroup = values.length === 0 ? "all" : values[0];
    if (onFilterByGroup) {
      onFilterByGroup(newGroup === "all" ? null : newGroup);
    }
  };

  const handleSearchChange = (value: string) => {
    if (onSearch) {
      onSearch(value);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Filter Bar */}
      <div className="flex-shrink-0 mb-4 flex items-center gap-4">
        <FilterDropdown
          title="Bundle Group"
          options={bundleGroupOptions}
          selected={new Set(selectedBundleGroup === "all" ? [] : [selectedBundleGroup])}
          onSelectionChange={handleBundleGroupChange}
          placeholder="All Groups"
        />
        {selectedBundleGroup !== "all" && (
          <div className="text-sm text-muted-foreground">
            Filtered by: <strong>{selectedBundleGroup}</strong>
          </div>
        )}
        <div className="ml-auto flex items-center gap-2">
          <Button onClick={onSync} disabled={syncLoading} size="sm" variant="ghost">
            <RefreshCw className={`mr-2 h-4 w-4 ${syncLoading ? "animate-spin" : ""}`} />
            Trigger Sync
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={`${showSyncPanel ? "bg-accent text-accent-foreground" : ""}`}
            onClick={() => onToggleSyncPanel(!showSyncPanel)}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Main Content with Resizable Panels */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <PanelGroup direction="horizontal" className="flex h-full" autoSaveId="catalog-layout">
          {/* Countries Panel */}
          <Panel defaultSize={25} minSize={15} maxSize={40} id="countries-panel" order={1}>
            <List.Container
              className="h-full"
              itemCount={showRegions ? regionsData.length : countriesData.length}
            >
              <List.Header>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-700">
                    {showRegions
                      ? `Regions (${regionsData.length})`
                      : `Countries (${countriesData.length})`}
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
                        {showRegions ? "Switch to countries view" : "Switch to regions view"}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </List.Header>
              <List.Search
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder={showRegions ? "Search regions..." : "Search countries..."}
              />
              <List.Content spacing="normal" padding={true}>
                <div className="space-y-2">
                  {showRegions ? (
                    // Regions view
                    regionsData.length === 0 ? (
                      <List.Empty
                        icon={<Globe className="h-12 w-12 mx-auto text-gray-300" />}
                        message="No regions data available. Load countries to see regional groupings."
                      />
                    ) : (
                      regionsData.map((region) => {
                        const isSelected = selectedRegion === region.region;
                        const isRegionLoading = loadingCountries.has(region.region);
                        const summary = {
                          count: region.bundleCount,
                          range: `${region.countries.length} countries`,
                          status: "loaded" as const,
                        };

                        return (
                          <List.Item key={region.region} asChild>
                            <CatalogRegionCard
                              region={region}
                              isSelected={isSelected}
                              isLoading={isRegionLoading}
                              onSelect={() => handleRegionSelect(region.region)}
                              summary={summary}
                            />
                          </List.Item>
                        );
                      })
                    )
                  ) : // Countries view
                  loading ? (
                    <List.Loading />
                  ) : countriesData.length === 0 ? (
                    <List.Empty
                      icon={<Database className="h-12 w-12 mx-auto text-gray-300" />}
                      message={
                        searchQuery
                          ? `No countries found matching "${searchQuery}"`
                          : selectedBundleGroup === "all"
                          ? "No catalog data available. Try syncing the catalog."
                          : `No bundles found for group: ${selectedBundleGroup}`
                      }
                    />
                  ) : (
                    countriesData.map((country) => {
                      const isSelected = selectedCountry === country.country.iso;
                      const isCountryLoading = loadingCountries.has(country.country.iso);
                      const bundles = countryBundles[country.country.iso];

                      // Use backend-provided pricing range
                      const summary = {
                        count: bundles?.length || country.bundleCount,
                        range: country.pricingRange || {
                          min: 0,
                          max: 0,
                          currency: "USD",
                        },
                        status: bundles ? ("loaded" as const) : ("pending" as const),
                      };

                      return (
                        <List.Item key={country.country.iso} asChild>
                          <CatalogCountryCard
                            country={country.country.iso}
                            countryName={country.country.name}
                            bundleCount={bundles?.length || country.bundleCount}
                            bundles={bundles}
                            isExpanded={false}
                            isLoading={isCountryLoading}
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
              <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-3 py-3 flex-shrink-0">
                <h3 className="text-sm font-medium text-gray-700">
                  Bundles (
                  {(selectedCountryData || selectedRegionData)?.bundleCount || 0})
                </h3>
              </div>

              <motion.div className="flex-1 flex flex-col min-h-0" layout>
                {selectedCountryData || selectedRegionData ? (
                  <div className="flex-1 min-h-0">
                    <CatalogBundlesTable
                      country={selectedCountryData}
                      region={selectedRegionData}
                      loadingCountries={loadingCountries}
                      selectedBundle={selectedBundle}
                      onBundleSelect={setSelectedBundle}
                    />
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center text-gray-500">
                      <div className="mb-4">
                        <Package className="h-12 w-12 mx-auto text-gray-300" />
                      </div>
                      <p className="text-lg">Select a {showRegions ? "Region" : "Country"}</p>
                      <p className="text-sm">
                        Click on a {showRegions ? "region" : "country"} from the list to view its
                        bundles
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
              <Panel defaultSize={25} minSize={20} maxSize={40} id="preview-panel" order={3}>
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
                        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-3 py-3 flex-shrink-0">
                          <div className="flex items-center justify-between">
                            <h3 className="text-sm font-medium text-gray-700">Bundle Details</h3>
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