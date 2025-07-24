import {
  SyncJobType,
  type BundleFilter,
  type CatalogBundle,
  type GetBundlesByCountryQuery,
  type GetBundlesByCountryQueryVariables,
  type GetBundlesByRegionQuery,
  type GetBundlesByRegionQueryVariables,
  type GetBundlesQuery,
  type GetBundlesQueryVariables,
  type GetCatalogSyncHistoryQuery,
  type GetCatalogSyncHistoryQueryVariables,
  type GetCountryBundlesQuery,
  type GetCountryBundlesQueryVariables,
  type PaginationInput,
  type TriggerCatalogSyncMutation,
  type TriggerCatalogSyncMutationVariables
} from "@/__generated__/graphql";
import { CatalogSplitView } from "@/components/catalog/CatalogSplitView";
import { PageLayout } from "@/components/common/PageLayout";
import { ErrorBoundary } from "@/components/error-boundary";
import {
  SyncConflictModal,
  type ConflictingJob,
} from "@/components/SyncConflictModal";
import {
  GET_AVAILABLE_BUNDLE_GROUPS,
  GET_BUNDLES_BY_COUNTRY,
  GET_BUNDLES_BY_REGION,
  GET_CATALOG_SYNC_HISTORY,
  GET_COUNTRY_BUNDLES,
  GET_REGION_BUNDLES,
  TRIGGER_CATALOG_SYNC,
} from "@/lib/graphql/queries";
import { gql, useLazyQuery, useMutation, useQuery } from "@apollo/client";
import { Database } from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";

const GET_BUNDLES = gql(`
  query GetBundles($filter: BundleFilter, $pagination: PaginationInput) {
    bundles(filter: $filter, pagination: $pagination) {
      nodes {
        ... on CatalogBundle {
          esimGoName
          name
          description
          groups
          validityInDays
          dataAmountMB
          dataAmountReadable
          isUnlimited
          countries
          region
          basePrice
          currency
          createdAt
          updatedAt
          syncedAt
        }
      }
      totalCount
      pageInfo {
        hasNextPage
        hasPreviousPage
      }
    }
  }
`);

// Custom hook for fetching catalog bundles with filters and pagination
function useCatalogBundles(options?: {
  filter?: BundleFilter;
  pagination?: PaginationInput;
  skip?: boolean;
}) {
  const { data, loading, error, fetchMore, refetch } = useQuery<
    GetBundlesQuery,
    GetBundlesQueryVariables
  >(GET_BUNDLES, {
    variables: {
      filter: options?.filter,
      pagination: options?.pagination || { limit: 50, offset: 0 },
    },
    skip: options?.skip,
    notifyOnNetworkStatusChange: true,
  });

  const loadMore = useCallback(async () => {
    if (!data?.bundles.pageInfo.hasNextPage) return;

    const currentOffset = options?.pagination?.offset || 0;
    const currentLimit = options?.pagination?.limit || 50;

    await fetchMore({
      variables: {
        pagination: {
          limit: currentLimit,
          offset: currentOffset + currentLimit,
        },
      },
      updateQuery: (prev, { fetchMoreResult }) => {
        if (!fetchMoreResult) return prev;
        return {
          ...prev,
          bundles: {
            ...fetchMoreResult.bundles,
            nodes: [...prev.bundles.nodes, ...fetchMoreResult.bundles.nodes],
          },
        };
      },
    });
  }, [data, fetchMore, options?.pagination]);

  return {
    bundles: data?.bundles.nodes || [],
    totalCount: data?.bundles.totalCount || 0,
    pageInfo: data?.bundles.pageInfo,
    loading,
    error,
    refetch,
    loadMore,
  };
}

function CatalogPageContent() {
  const [showSyncPanel, setShowSyncPanel] = useState(false);
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [conflictingJob, setConflictingJob] = useState<ConflictingJob | null>(
    null
  );

  // Queries
  const {
    data: catalogData,
    loading: catalogLoading,
    refetch: refetchCatalog,
  } = useQuery<GetBundlesByCountryQuery, GetBundlesByCountryQueryVariables>(
    GET_BUNDLES_BY_COUNTRY
  );
  const { data: regionsData, loading: regionsLoading } = useQuery(
    GET_BUNDLES_BY_REGION
  );
  const { data: bundleGroupsData } = useQuery(GET_AVAILABLE_BUNDLE_GROUPS);
  const {
    data: syncHistoryData,
    loading: syncHistoryLoading,
    refetch: refetchSyncHistory,
  } = useQuery<GetCatalogSyncHistoryQuery, GetCatalogSyncHistoryQueryVariables>(
    GET_CATALOG_SYNC_HISTORY,
    {
      variables: { params: { limit: 10 } },
      skip: !showSyncPanel,
    }
  );

  // Mutations
  const [triggerCatalogSync, { loading: syncLoading }] = useMutation<
    TriggerCatalogSyncMutation,
    TriggerCatalogSyncMutationVariables
  >(TRIGGER_CATALOG_SYNC, {
    onCompleted: (data) => {
      if (data.triggerCatalogSync?.success) {
        toast.success("Catalog sync triggered successfully");
        refetchSyncHistory();
      } else if (data.triggerCatalogSync?.conflictingJob) {
        // Handle conflicts on the server side - this shouldn't normally happen
        // since we check on frontend first, but good to have fallback
        const conflictJob: ConflictingJob = {
          id: data.triggerCatalogSync?.conflictingJob?.id,
          jobType: data.triggerCatalogSync?.conflictingJob?.jobType,
          status: data.triggerCatalogSync?.conflictingJob?.status as
            | "pending"
            | "running"
            | "completed"
            | "failed"
            | "cancelled",
          createdAt: data.triggerCatalogSync?.conflictingJob?.createdAt || "",
          startedAt: data.triggerCatalogSync?.conflictingJob?.startedAt || "",
        };
        setConflictingJob(conflictJob);
        setShowConflictModal(true);
      } else {
        toast.error(data.triggerCatalogSync?.error || "Failed to trigger sync");
      }
    },
    onError: (error) => {
      toast.error(`Sync error: ${error.message}`);
    },
  });

  // Lazy queries for loading country and region bundles
  const [getCountryBundlesLazy] = useLazyQuery<
    GetCountryBundlesQuery,
    GetCountryBundlesQueryVariables
  >(GET_COUNTRY_BUNDLES);
  const [getRegionBundlesLazy] = useLazyQuery<
    GetBundlesByRegionQuery,
    GetBundlesByRegionQueryVariables
  >(GET_REGION_BUNDLES);

  const loadCountryBundles = async (
    countryId: string
  ): Promise<CatalogBundle[]> => {
    try {
      // Use the GET_COUNTRY_BUNDLES query to fetch bundles for the country
      const { data } = await getCountryBundlesLazy({
        variables: { countryId },
      });

      if (!data?.bundlesForCountry?.bundles) {
        return [];
      }

      // Return the bundles as CatalogBundle[]
      return data.bundlesForCountry.bundles as CatalogBundle[];
    } catch (error) {
      toast.error(`Failed to load bundles for country ${countryId}`);
      throw error;
    }
  };

  const loadRegionBundles = async (
    regionName: string
  ): Promise<CatalogBundle[]> => {
    try {
      // Use the GET_REGION_BUNDLES query to fetch bundles for the region
      const { data } = await getRegionBundlesLazy({
        variables: {  },
      });

      if (!data?.bundlesByRegion) {
        return [];
      }

      // Return the bundles as CatalogBundle[]
      return data.bundlesByRegion.bundles
    } catch (error) {
      toast.error(`Failed to load bundles for region ${regionName}`);
      throw error;
    }
  };

  const handleSyncClick = async () => {
    // Check for running sync jobs
    const syncHistory = syncHistoryData?.catalogSyncHistory?.jobs || [];
    const runningJob = syncHistory.find(
      (job) => job.status === "running" || job.status === "pending"
    );

    if (runningJob) {
      // Map job data to ConflictingJob format
      const conflictJob: ConflictingJob = {
        id: runningJob.id,
        jobType: runningJob.jobType,
        status: runningJob.status as
          | "pending"
          | "running"
          | "completed"
          | "failed"
          | "cancelled",
        createdAt: runningJob.createdAt,
        startedAt: runningJob.startedAt,
        bundleGroup: runningJob.group || "",
        bundlesProcessed: runningJob.bundlesProcessed || 0,
      };

      setConflictingJob(conflictJob);
      setShowConflictModal(true);
      return;
    }

    // No conflicts, proceed with sync
    await performSync(false);
  };

  const performSync = async (force: boolean) => {
    try {
      await triggerCatalogSync({
        variables: {
          params: {
            type: SyncJobType.FullSync,
            force,
          },
        },
      });
    } catch (error) {
      // Error handled by onError
    }
  };

  const handleForceSync = async () => {
    setShowConflictModal(false);
    setConflictingJob(null);
    await performSync(true);
  };

  const bundleGroups = bundleGroupsData?.availableBundleGroups || [];

  // Map bundlesByCountry to DisplayCountryData format
  const countriesData = (catalogData?.bundlesByCountry || []).map(
    (item) => ({
      iso: item.country.iso,
      name: item.country.name,
      nameHebrew: item.country.nameHebrew,
      region: item.country.region,
      flag: item.country.flag,
      bundleCount: item.bundleCount,
      pricingRange: item.pricingRange, // Include pricing range from backend
    })
  );

  // Map bundlesByRegion to DisplayRegionData format
  const regionsDataArray = (regionsData?.bundlesByRegion || []).map(
    (item: any) => ({
      regionName: item.region,
      countryCount: 0, // This field is not available in the new schema
      bundleCount: item.bundleCount,
    })
  );

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

      {conflictingJob && (
        <SyncConflictModal
          isOpen={showConflictModal}
          onClose={() => {
            setShowConflictModal(false);
            setConflictingJob(null);
          }}
          onConfirmForce={handleForceSync}
          conflictingJob={conflictingJob}
          syncType="catalog sync"
        />
      )}
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
