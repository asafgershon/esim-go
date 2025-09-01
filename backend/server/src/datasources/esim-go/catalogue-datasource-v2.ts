import type {
  CatalogueResponseInner,
  InventoryResponseBundlesInner,
} from "@hiilo/esim-go";
import { ESimGoClient } from "@hiilo/esim-go";
import { createLogger, withPerformanceLogging } from "../../lib/logger";
import type { SearchCatalogCriteria } from "../../repositories/catalog";
import { BundleRepository } from "../../repositories/catalog";
import { CatalogSyncServiceV2 } from "../../services/catalog-sync-v2.service";

/**
 * CatalogueDataSource V2 - Uses shared client and persistent storage
 *
 * This datasource primarily reads from the persistent catalog in Supabase
 * and falls back to direct API calls only when necessary
 */
export class CatalogueDataSourceV2 {
  private client: ESimGoClient;
  private catalogSyncService: CatalogSyncServiceV2;
  private bundleRepository: BundleRepository;
  private logger = createLogger({
    component: "CatalogueDataSourceV2",
    operationType: "catalog-datasource",
  });

  constructor(apiKey: string, baseUrl?: string) {
    this.client = new ESimGoClient({
      apiKey,
      baseUrl: baseUrl || "https://api.esim-go.com/v2.5",
      retryAttempts: 3,
    });
    this.catalogSyncService = new CatalogSyncServiceV2(apiKey, baseUrl);
    this.bundleRepository = new BundleRepository();
  }

  /**
   * Search for data plans using persistent storage
   */
  async searchPlans(criteria: SearchCatalogCriteria): Promise<{
    bundles: CatalogueResponseInner[];
    totalCount: number;
  }> {
    return withPerformanceLogging(
      this.logger,
      "search-plans",
      async () => {
        this.logger.info("Searching plans from persistent storage", {
          country: criteria.countries?.[0],
          duration: criteria.maxValidityInDays,
          bundleGroup: criteria.groups?.[0],
          dataAmount: criteria.dataAmountMB,
          limit: criteria.limit,
        });

        try {
          // First, try to get from persistent storage
          const result = await this.bundleRepository.search(criteria);

          if (result.data.length > 0) {
            this.logger.info("Found plans in persistent storage", {
              count: result.data.length,
              totalCount: result.count,
            });
            return {
              bundles: result.data,
              totalCount: result.count,
            };
          }

          // If no results and we have specific search criteria,
          // check if we need to sync this country
          if (criteria.countries?.[0] && result.data.length === 0) {
            this.logger.warn("No bundles found for country, may need sync", {
              country: criteria.countries?.[0],
            });

            // Optionally trigger a country sync in the background
            // Don't wait for it to complete
            this.catalogSyncService
              .triggerCountrySync(criteria.countries?.[0])
              .catch((error) => {
                this.logger.error("Failed to trigger country sync", error, {
                  country: criteria.countries?.[0],
                });
              });
          }

          return {
            bundles: result.data,
            totalCount: result.count,
          };
        } catch (error) {
          this.logger.error("Failed to search plans", error as Error, {
            criteria,
          });
          throw error;
        }
      },
      { country: criteria.countries?.[0], duration: criteria.maxValidityInDays }
    );
  }

  /**
   * Get a specific bundle by ID
   */
  async getBundleById(
    bundleId: string
  ): Promise<CatalogueResponseInner | null> {
    return withPerformanceLogging(
      this.logger,
      "get-bundle-by-id",
      async () => {
        this.logger.info("Fetching bundle by ID", { bundleId });

        try {
          // Try persistent storage first
          const bundle = await this.bundleRepository.getById(bundleId);

          if (bundle) {
            this.logger.info("Found bundle in persistent storage", {
              bundleId,
              name: bundle.esim_go_name,
              price: bundle.price,
            });
            return {
              ...bundle,
              description: bundle.description || undefined,
            } as CatalogueResponseInner;
          }

          // If not found, could make a direct API call if needed
          // But typically all bundles should be in the synced catalog
          this.logger.warn("Bundle not found in persistent storage", {
            bundleId,
          });
          return null;
        } catch (error) {
          this.logger.error("Failed to get bundle", error as Error, {
            bundleId,
          });
          throw error;
        }
      },
      { bundleId }
    );
  }

  /**
   * Check catalog sync status
   */
  async getCatalogSyncStatus(): Promise<any> {
    return withPerformanceLogging(
      this.logger,
      "get-catalog-sync-status",
      async () => {
        try {
          const status = await this.catalogSyncService.getSyncStatus();

          this.logger.info("Retrieved catalog sync status", {
            lastSync: status.sync.lastSyncedAt,
            totalBundles: status.sync.totalBundles,
            activeJobs: status.activeJobs.length,
          });

          return status;
        } catch (error) {
          this.logger.error("Failed to get sync status", error as Error);
          throw error;
        }
      }
    );
  }

  /**
   * Trigger a manual catalog sync
   */
  async triggerCatalogSync(
    type: "full" | "country" | "group",
    target?: string
  ): Promise<any> {
    return withPerformanceLogging(
      this.logger,
      "trigger-catalog-sync",
      async () => {
        this.logger.info("Triggering catalog sync", { type, target });

        try {
          let result;

          switch (type) {
            case "full":
              result = await this.catalogSyncService.triggerFullSync();
              break;
            case "country":
              if (!target)
                throw new Error("Country ID required for country sync");
              result = await this.catalogSyncService.triggerCountrySync(target);
              break;
            case "group":
              if (!target)
                throw new Error("Bundle group required for group sync");
              result = await this.catalogSyncService.triggerGroupSync(target);
              break;
            default:
              throw new Error(`Unknown sync type: ${type}`);
          }

          this.logger.info("Catalog sync triggered", {
            type,
            target,
            jobId: result.jobId,
            status: result.status,
          });

          return result;
        } catch (error) {
          this.logger.error("Failed to trigger sync", error as Error, {
            type,
            target,
          });
          throw error;
        }
      },
      { type, target }
    );
  }
}
