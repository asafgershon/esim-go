import type { CountryBundle, GetCatalogSyncHistoryQueryVariables, GetCatalogSyncHistoryQuery } from "@/__generated__/graphql";
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
import { useLazyQuery, useMutation, useQuery } from "@apollo/client";
import { Database } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

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
  } = useQuery(GET_BUNDLES_BY_COUNTRY);
  const { data: regionsData, loading: regionsLoading } = useQuery(
    GET_BUNDLES_BY_REGION
  );
  const { data: bundleGroupsData } = useQuery(GET_AVAILABLE_BUNDLE_GROUPS);
  const {
    data: syncHistoryData,
    loading: syncHistoryLoading,
    refetch: refetchSyncHistory,
  } = useQuery<GetCatalogSyncHistoryQuery, GetCatalogSyncHistoryQueryVariables>(GET_CATALOG_SYNC_HISTORY, {
    variables: { params: { limit: 10 } },
    skip: !showSyncPanel,
  });

  // Mutations
  const [triggerCatalogSync, { loading: syncLoading }] = useMutation(
    TRIGGER_CATALOG_SYNC,
    {
      onCompleted: (data) => {
        if (data.triggerCatalogSync.success) {
          toast.success("Catalog sync triggered successfully");
          refetchSyncHistory();
        } else if (data.triggerCatalogSync.conflictingJob) {
          // Handle conflicts on the server side - this shouldn't normally happen
          // since we check on frontend first, but good to have fallback
          const conflictJob: ConflictingJob = {
            id: data.triggerCatalogSync.conflictingJob.id,
            jobType: data.triggerCatalogSync.conflictingJob.jobType,
            status: data.triggerCatalogSync.conflictingJob.status as
              | "pending"
              | "running"
              | "completed"
              | "failed"
              | "cancelled",
            createdAt: data.triggerCatalogSync.conflictingJob.createdAt,
            startedAt: data.triggerCatalogSync.conflictingJob.startedAt,
          };
          setConflictingJob(conflictJob);
          setShowConflictModal(true);
        } else {
          toast.error(
            data.triggerCatalogSync.error || "Failed to trigger sync"
          );
        }
      },
      onError: (error) => {
        toast.error(`Sync error: ${error.message}`);
      },
    }
  );

  // Lazy load country bundles
  const [getCountryBundles] = useLazyQuery(GET_COUNTRY_BUNDLES);
  const [getRegionBundles] = useLazyQuery(GET_REGION_BUNDLES);

  const loadCountryBundles = async (
    countryId: string
  ): Promise<CountryBundle[]> => {
    try {
      const { data } = await getCountryBundles({
        variables: { countryId },
      });
      return data?.countryBundles || [];
    } catch (error) {
      toast.error(`Failed to load bundles for country ${countryId}`);
      throw error;
    }
  };

  const loadRegionBundles = async (
    regionName: string
  ): Promise<CountryBundle[]> => {
    try {
      const { data } = await getRegionBundles({
        variables: { regionName },
      });
      return data?.bundles || [];
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
        bundleGroup: runningJob.group || '',
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
            type: "FULL_SYNC",
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
  const countriesData = catalogData?.bundlesCountries || [];
  const regionsDataArray = regionsData?.bundlesRegions || [];

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
