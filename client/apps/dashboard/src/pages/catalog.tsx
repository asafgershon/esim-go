import React, { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useLazyQuery } from '@apollo/client';
import { 
  GET_BUNDLES_BY_COUNTRY,
  GET_COUNTRY_BUNDLES,
  GET_CATALOG_SYNC_HISTORY,
  TRIGGER_CATALOG_SYNC,
  GET_AVAILABLE_BUNDLE_GROUPS
} from '@/lib/graphql/queries';
import { Button } from '@workspace/ui/components/button';
import { Badge } from '@workspace/ui/components/badge';
import { List } from '@workspace/ui';
import { RefreshCw, Package, Globe, Database, ChevronRight, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Panel, PanelGroup } from 'react-resizable-panels';
import { AnimatePresence, motion } from 'framer-motion';
import { ErrorBoundary } from '@/components/error-boundary';
import { CatalogCountryCard } from '@/components/catalog/CatalogCountryCard';
import { CatalogSyncPanel } from '@/components/catalog/CatalogSyncPanel';
import { FilterDropdown } from '@/components/PricingSplitView/filters/FilterDropdown';
import { ResizeHandle } from '@/components/resize-handle';
import { PageLayout } from '@/components/common/PageLayout';
import { toast } from 'sonner';
import { cn } from '@workspace/ui/lib/utils';

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
    <PageLayout.Container>
      <PageLayout.Header
        title="Catalog Management"
        subtitle="Catalog Browser"
        description="Browse and sync the eSIM bundle catalog from eSIM Go"
        icon={<Database className="h-5 w-5" />}
        actions={
          !showSyncPanel && (
            <Button onClick={handleSyncClick} disabled={syncLoading} size="sm" variant="ghost">
              <RefreshCw className={`mr-2 h-4 w-4 ${syncLoading ? 'animate-spin' : ''}`} />
              Trigger Sync
            </Button>
          )
        }
      />
      
      <PageLayout.Content>
        <div className="space-y-4">
          {/* Filter Bar - No card wrapper, just the filter controls */}
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

          {/* Main Content Area with Resizable Panels */}
          <div className="h-[calc(100vh-300px)] flex flex-col" key={showSyncPanel ? 'with-sync' : 'without-sync'}>
        <PanelGroup
          direction="horizontal"
          className="flex h-full"
        >
          {/* Countries Panel */}
          <Panel
            defaultSize={showSyncPanel ? 80 : 100}
            minSize={showSyncPanel ? 70 : 100}
            maxSize={showSyncPanel ? 90 : 100}
            id="countries-panel"
          >
            <List.Container className="h-full" itemCount={enhancedCountryData.length}>
              <List.Header className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-700">Countries ({enhancedCountryData.length})</h3>
                  <p className="text-xs text-muted-foreground">Browse catalog bundles by country</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-8 w-8 p-0",
                    showSyncPanel && "bg-accent text-accent-foreground"
                  )}
                  onClick={() => setShowSyncPanel(!showSyncPanel)}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </List.Header>
              <List.Content>
                {catalogLoading ? (
                  <List.Loading />
                ) : enhancedCountryData.length === 0 ? (
                  <List.Empty
                    icon={<Database className="h-12 w-12 mx-auto text-gray-300" />}
                    message={
                      selectedBundleGroup === 'all' 
                        ? 'No catalog data available. Try syncing the catalog.'
                        : `No bundles found for group: ${selectedBundleGroup}`
                    }
                  />
                ) : (
                  enhancedCountryData.map((countryData) => (
                    <List.Item key={countryData.countryId} asChild>
                      <CatalogCountryCard
                        country={countryData.countryId}
                        countryName={countryData.countryName}
                        bundleCount={countryData.bundleCount}
                        bundles={countryData.bundles}
                        isExpanded={expandedCountries.has(countryData.countryId)}
                        isLoading={loadingCountries.has(countryData.countryId)}
                        onToggle={() => handleCountryToggle(countryData.countryId)}
                      />
                    </List.Item>
                  ))
                )}
              </List.Content>
            </List.Container>
          </Panel>
          
          {/* Sync Panel */}
          {showSyncPanel && (
            <>
              <ResizeHandle />
              <Panel
                defaultSize={20}
                minSize={15}
                maxSize={25}
                id="sync-panel"
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key="sync-content"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.2 }}
                    className="h-full"
                  >
                    <CatalogSyncPanel
                      syncHistory={syncHistoryData?.catalogSyncHistory?.jobs || []}
                      loading={syncHistoryLoading}
                      onClose={() => setShowSyncPanel(false)}
                      onSync={handleSyncClick}
                      syncLoading={syncLoading}
                    />
                  </motion.div>
                </AnimatePresence>
              </Panel>
            </>
          )}
        </PanelGroup>
          </div>
        </div>
      </PageLayout.Content>
    </PageLayout.Container>
  );
}

export function CatalogPage() {
  return (
    <ErrorBoundary>
      <CatalogPageContent />
    </ErrorBoundary>
  );
}