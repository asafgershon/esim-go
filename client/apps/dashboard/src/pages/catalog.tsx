import React, { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useLazyQuery } from '@apollo/client';
import { 
  GET_BUNDLES_BY_COUNTRY,
  GET_COUNTRY_BUNDLES,
  GET_CATALOG_SYNC_HISTORY,
  TRIGGER_CATALOG_SYNC,
  GET_AVAILABLE_BUNDLE_GROUPS
} from '@/lib/graphql/queries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@workspace/ui/components/card';
import { Button } from '@workspace/ui/components/button';
import { Badge } from '@workspace/ui/components/badge';
import { ScrollArea } from '@workspace/ui/components/scroll-area';
import { Skeleton } from '@workspace/ui/components/skeleton';
import { RefreshCw, Package, Globe, Database, ChevronRight, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Panel, PanelGroup } from 'react-resizable-panels';
import { AnimatePresence, motion } from 'framer-motion';
import { ErrorBoundary } from '@/components/error-boundary';
import { CatalogCountryCard } from '@/components/catalog/CatalogCountryCard';
import { CatalogSyncPanel } from '@/components/catalog/CatalogSyncPanel';
import { FilterDropdown } from '@/components/PricingSplitView/filters/FilterDropdown';
import { ResizeHandle } from '@/components/resize-handle';
import { toast } from 'sonner';

interface CountryBundle {
  bundleName: string;
  countryName: string;
  countryId: string;
  duration: number;
  cost: number;
  costPlus: number;
  totalCost: number;
  discountRate: number;
  discountValue: number;
  priceAfterDiscount: number;
  processingRate: number;
  processingCost: number;
  finalRevenue: number;
  currency: string;
  pricePerDay: number;
  hasCustomDiscount: boolean;
  bundleGroup?: string;
  isUnlimited?: boolean;
  dataAmount?: number;
}

interface CountryData {
  countryName: string;
  countryId: string;
  bundles?: CountryBundle[];
  bundleCount?: number;
}

function CatalogPageContent() {
  const [expandedCountries, setExpandedCountries] = useState<Set<string>>(new Set());
  const [showSyncPanel, setShowSyncPanel] = useState(false);
  const [selectedBundleGroup, setSelectedBundleGroup] = useState<string>('all');
  const [countryBundles, setCountryBundles] = useState<Record<string, CountryBundle[]>>({});
  const [loadingCountries, setLoadingCountries] = useState<Set<string>>(new Set());
  
  // Queries
  const { data: catalogData, loading: catalogLoading, refetch: refetchCatalog } = useQuery(GET_BUNDLES_BY_COUNTRY);
  const { data: bundleGroupsData } = useQuery(GET_AVAILABLE_BUNDLE_GROUPS);
  const { data: syncHistoryData, loading: syncHistoryLoading, refetch: refetchSyncHistory } = useQuery(GET_CATALOG_SYNC_HISTORY, {
    variables: { params: { limit: 10 } },
    skip: !showSyncPanel
  });
  
  // Mutations
  const [triggerSync, { loading: syncLoading }] = useMutation(TRIGGER_CATALOG_SYNC, {
    onCompleted: (data) => {
      if (data.triggerCatalogSync.success) {
        toast.success(data.triggerCatalogSync.message || 'Catalog sync triggered successfully');
        refetchSyncHistory();
      } else {
        toast.error(data.triggerCatalogSync.error || 'Failed to trigger sync');
      }
    },
    onError: (error) => {
      toast.error(`Sync error: ${error.message}`);
    }
  });
  
  // Enhance country data with loaded bundles
  const enhancedCountryData = useMemo(() => {
    if (!catalogData?.bundlesByCountry) return [];
    
    return catalogData.bundlesByCountry.map(country => {
      const bundles = countryBundles[country.countryId];
      let filteredBundles = bundles;
      
      // Apply bundle group filter if bundles are loaded
      if (bundles && selectedBundleGroup !== 'all') {
        filteredBundles = bundles.filter(bundle => bundle.bundleGroup === selectedBundleGroup);
      }
      
      return {
        ...country,
        bundles: filteredBundles,
        bundleCount: filteredBundles?.length || (bundles ? 0 : undefined)
      };
    }).filter(country => {
      // If bundles are loaded and filter is applied, only show countries with matching bundles
      if (country.bundles && selectedBundleGroup !== 'all') {
        return country.bundleCount > 0;
      }
      return true;
    });
  }, [catalogData, countryBundles, selectedBundleGroup]);
  
  // Calculate stats
  const stats = useMemo(() => {
    if (!catalogData?.bundlesByCountry) {
      return { totalCountries: 0, totalBundles: 0, avgBundlesPerCountry: 0 };
    }
    
    const totalCountries = enhancedCountryData.length;
    const totalBundles = enhancedCountryData.reduce((sum, country) => {
      // Only count bundles that are loaded
      if (country.bundles) {
        return sum + country.bundles.length;
      }
      return sum;
    }, 0);
    const avgBundlesPerCountry = totalCountries > 0 ? Math.round(totalBundles / totalCountries) : 0;
    
    return { totalCountries, totalBundles, avgBundlesPerCountry };
  }, [enhancedCountryData]);
  
  // Lazy load country bundles  
  const [getCountryBundles] = useLazyQuery(GET_COUNTRY_BUNDLES);
  
  const handleCountryToggle = useCallback(async (countryCode: string) => {
    setExpandedCountries(prev => {
      const newSet = new Set(prev);
      if (newSet.has(countryCode)) {
        newSet.delete(countryCode);
        return newSet;
      } else {
        newSet.add(countryCode);
        // Load bundles if not already loaded
        if (!countryBundles[countryCode]) {
          loadCountryBundles(countryCode);
        }
        return newSet;
      }
    });
  }, [countryBundles]);
  
  const loadCountryBundles = async (countryId: string) => {
    setLoadingCountries(prev => new Set(prev).add(countryId));
    try {
      const { data } = await getCountryBundles({
        variables: { countryId }
      });
      if (data?.countryBundles) {
        setCountryBundles(prev => ({
          ...prev,
          [countryId]: data.countryBundles
        }));
      }
    } catch (error) {
      toast.error(`Failed to load bundles for country ${countryId}`);
    } finally {
      setLoadingCountries(prev => {
        const newSet = new Set(prev);
        newSet.delete(countryId);
        return newSet;
      });
    }
  };
  
  const handleSyncClick = async () => {
    try {
      await triggerSync({
        variables: {
          params: {
            jobType: 'full-sync',
            priority: 'normal'
          }
        }
      });
    } catch (error) {
      // Error handled by onError
    }
  };
  
  const bundleGroups = bundleGroupsData?.availableBundleGroups || [];
  const bundleGroupOptions = [
    { label: 'All Groups', value: 'all' },
    ...bundleGroups.map(group => ({ label: group, value: group }))
  ];
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Catalog Management</h1>
          <p className="text-muted-foreground">
            Browse and manage the eSIM bundle catalog synced from eSIM Go
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={showSyncPanel ? "default" : "outline"}
            size="sm"
            onClick={() => setShowSyncPanel(!showSyncPanel)}
          >
            <RefreshCw className={`h-4 w-4 ${syncLoading ? 'animate-spin' : ''}`} />
          </Button>
          {!showSyncPanel && (
            <Button onClick={handleSyncClick} disabled={syncLoading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${syncLoading ? 'animate-spin' : ''}`} />
              Sync Catalog
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Countries</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCountries}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bundles</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalBundles}</div>
            <p className="text-xs text-muted-foreground">
              Avg {stats.avgBundlesPerCountry} per country
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Sync</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm">
              {syncHistoryData?.catalogSyncHistory?.jobs?.[0] ? (
                <>
                  <div className="font-medium">
                    {new Date(syncHistoryData.catalogSyncHistory.jobs[0].completedAt || syncHistoryData.catalogSyncHistory.jobs[0].createdAt).toLocaleDateString()}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {syncHistoryData.catalogSyncHistory.jobs[0].status}
                  </div>
                </>
              ) : (
                <span className="text-muted-foreground">No sync history</span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Bar */}
      <Card>
        <CardContent className="p-3">
          <div className="flex items-center gap-4">
            <FilterDropdown
              title="Bundle Group"
              options={bundleGroupOptions}
              selected={new Set(selectedBundleGroup === 'all' ? [] : [selectedBundleGroup])}
              onSelectionChange={(values) => {
                setSelectedBundleGroup(values.length === 0 ? 'all' : values[0]);
              }}
              placeholder="All Groups"
            />
            <div className="ml-auto text-sm text-muted-foreground">
              {selectedBundleGroup !== 'all' && (
                <span>Filtered by: <strong>{selectedBundleGroup}</strong></span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Area with Resizable Panels */}
      <div className="h-[700px] flex flex-col" key={showSyncPanel ? 'with-sync' : 'without-sync'}>
        <PanelGroup
          direction="horizontal"
          className="flex h-full"
          autoSaveId={showSyncPanel ? "catalog-layout-with-sync" : "catalog-layout-without-sync"}
        >
          {/* Countries Panel */}
          <Panel
            defaultSize={showSyncPanel ? 60 : 100}
            minSize={showSyncPanel ? 40 : 100}
            maxSize={showSyncPanel ? 80 : 100}
            id="countries-panel"
          >
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Countries</CardTitle>
                <CardDescription>
                  Browse catalog bundles by country
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[calc(100vh-400px)]">
                  {catalogLoading ? (
                    <div className="space-y-3">
                      {[...Array(5)].map((_, i) => (
                        <Skeleton key={i} className="h-20 w-full" />
                      ))}
                    </div>
                  ) : enhancedCountryData.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-sm text-muted-foreground">
                        {selectedBundleGroup === 'all' 
                          ? 'No catalog data available. Try syncing the catalog.'
                          : `No bundles found for group: ${selectedBundleGroup}`}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {enhancedCountryData.map((countryData) => (
                        <CatalogCountryCard
                          key={countryData.countryId}
                          country={countryData.countryId}
                          countryName={countryData.countryName}
                          bundleCount={countryData.bundleCount}
                          bundles={countryData.bundles}
                          isExpanded={expandedCountries.has(countryData.countryId)}
                          isLoading={loadingCountries.has(countryData.countryId)}
                          onToggle={() => handleCountryToggle(countryData.countryId)}
                        />
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </Panel>
          
          {/* Sync Panel - With smooth transitions */}
          <AnimatePresence>
            {showSyncPanel && (
              <React.Fragment>
                <ResizeHandle />
                <motion.div
                  key="sync-panel-group"
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: "auto", opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{ 
                    type: "spring",
                    stiffness: 300,
                    damping: 30,
                    mass: 0.8
                  }}
                  style={{ display: "flex", overflow: "hidden" }}
                >
                  <Panel
                    defaultSize={40}
                    minSize={20}
                    maxSize={60}
                    id="sync-panel"
                  >
                    <div className="h-full">
                      <CatalogSyncPanel
                        syncHistory={syncHistoryData?.catalogSyncHistory?.jobs || []}
                        loading={syncHistoryLoading}
                        onClose={() => setShowSyncPanel(false)}
                        onSync={handleSyncClick}
                        syncLoading={syncLoading}
                      />
                    </div>
                  </Panel>
                </motion.div>
              </React.Fragment>
            )}
          </AnimatePresence>
        </PanelGroup>
      </div>
    </div>
  );
}

export function CatalogPage() {
  return (
    <ErrorBoundary>
      <CatalogPageContent />
    </ErrorBoundary>
  );
}