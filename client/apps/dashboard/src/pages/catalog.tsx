import React, { useState } from 'react';
import { useQuery, useMutation, useLazyQuery } from '@apollo/client';
import { 
  GET_BUNDLES_BY_COUNTRY,
  GET_BUNDLES_BY_REGION,
  GET_COUNTRY_BUNDLES,
  GET_REGION_BUNDLES,
  GET_CATALOG_SYNC_HISTORY,
  SYNC_CATALOG,
  GET_AVAILABLE_BUNDLE_GROUPS
} from '@/lib/graphql/queries';
import { Database } from 'lucide-react';
import { ErrorBoundary } from '@/components/error-boundary';
import { CatalogSplitView } from '@/components/catalog/CatalogSplitView';
import { PageLayout } from '@/components/common/PageLayout';
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
  const [showSyncPanel, setShowSyncPanel] = useState(false);
  
  // Queries
  const { data: catalogData, loading: catalogLoading, refetch: refetchCatalog } = useQuery(GET_BUNDLES_BY_COUNTRY);
  const { data: regionsData, loading: regionsLoading } = useQuery(GET_BUNDLES_BY_REGION);
  const { data: bundleGroupsData } = useQuery(GET_AVAILABLE_BUNDLE_GROUPS);
  const { data: syncHistoryData, loading: syncHistoryLoading, refetch: refetchSyncHistory } = useQuery(GET_CATALOG_SYNC_HISTORY, {
    variables: { params: { limit: 10 } },
    skip: !showSyncPanel
  });
  
  // Mutations
  const [syncCatalog, { loading: syncLoading }] = useMutation(SYNC_CATALOG, {
    onCompleted: (data) => {
      if (data.syncCatalog.success) {
        toast.success('Catalog sync triggered successfully');
        refetchSyncHistory();
      } else {
        toast.error(data.syncCatalog.error || 'Failed to trigger sync');
      }
    },
    onError: (error) => {
      toast.error(`Sync error: ${error.message}`);
    }
  });
  
  // Lazy load country bundles  
  const [getCountryBundles] = useLazyQuery(GET_COUNTRY_BUNDLES);
  const [getRegionBundles] = useLazyQuery(GET_REGION_BUNDLES);
  
  const loadCountryBundles = async (countryId: string): Promise<CountryBundle[]> => {
    try {
      const { data } = await getCountryBundles({
        variables: { countryId }
      });
      return data?.countryBundles || [];
    } catch (error) {
      toast.error(`Failed to load bundles for country ${countryId}`);
      throw error;
    }
  };

  const loadRegionBundles = async (regionName: string): Promise<CountryBundle[]> => {
    try {
      const { data } = await getRegionBundles({
        variables: { regionName }
      });
      return data?.regionBundles || [];
    } catch (error) {
      toast.error(`Failed to load bundles for region ${regionName}`);
      throw error;
    }
  };
  
  const handleSyncClick = async () => {
    try {
      await syncCatalog({
        variables: {
          force: false
        }
      });
    } catch (error) {
      // Error handled by onError
    }
  };
  
  const bundleGroups = bundleGroupsData?.availableBundleGroups || [];
  const countriesData = catalogData?.bundlesByCountry || [];
  const regionsDataArray = regionsData?.bundlesByRegion || [];
  
  return (
    <PageLayout.Container>
      <PageLayout.Header
        title="Catalog Management"
        subtitle="Catalog Browser"
        description="Browse and sync the eSIM bundle catalog from eSIM Go"
        icon={<Database className="h-5 w-5" />}
      />
      
      <PageLayout.Content>
        <div className="h-[calc(100vh-240px)]">
          <CatalogSplitView
            countriesData={countriesData}
            regionsData={regionsDataArray}
            bundleGroups={bundleGroups}
            onLoadCountryBundles={loadCountryBundles}
            onLoadRegionBundles={loadRegionBundles}
            onSync={handleSyncClick}
            syncLoading={syncLoading}
            showSyncPanel={showSyncPanel}
            onToggleSyncPanel={setShowSyncPanel}
            syncHistory={syncHistoryData?.catalogSyncHistory?.jobs || []}
            syncHistoryLoading={syncHistoryLoading}
            loading={catalogLoading || regionsLoading}
          />
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