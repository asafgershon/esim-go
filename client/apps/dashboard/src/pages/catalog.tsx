import {
  GetBundlesByGroupQuery,
  GetBundlesByGroupQueryVariables,
  SyncJobType,
  type BundleFilter,
  type GetBundlesByCountryQuery,
  type GetBundlesByCountryQueryVariables,
  type GetBundlesByRegionQuery,
  type GetBundlesByRegionQueryVariables,
  type GetBundlesQuery,
  type GetBundlesQueryVariables,
  type GetCatalogSyncHistoryQuery,
  type GetCatalogSyncHistoryQueryVariables,
  type PaginationInput,
  type TriggerCatalogSyncMutation,
  type TriggerCatalogSyncMutationVariables,
} from "@/__generated__/graphql";
import { CatalogSplitView } from "@/components/catalog/CatalogSplitView";
import { PageLayout } from "@/components/common/PageLayout";
import { ErrorBoundary } from "@/components/error-boundary";
import {
  SyncConflictModal,
  type ConflictingJob,
} from "@/components/SyncConflictModal";
import {
  GET_BUNDLES_BY_COUNTRY,
  GET_BUNDLES_BY_REGION,
  GET_BUNDLES_BY_GROUP,
  GET_CATALOG_SYNC_HISTORY,
  TRIGGER_CATALOG_SYNC,
} from "@/lib/graphql/queries";
import { gql, useMutation, useQuery } from "@apollo/client";
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
  const { data: regionsData, loading: regionsLoading } = useQuery<
    GetBundlesByRegionQuery,
    GetBundlesByRegionQueryVariables
  >(GET_BUNDLES_BY_REGION);
  const { data: bundleGroupsData } = useQuery<
    GetBundlesByGroupQuery,
    GetBundlesByGroupQueryVariables
  >(GET_BUNDLES_BY_GROUP);
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

  // Pass the data directly - it already has the correct structure from GraphQL
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
            bundleGroups={bundleGroupsData?.bundlesByGroup || []}
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
