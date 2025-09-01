import { transformAndValidateMayaBundle } from "./maya.transformer.js";
import { createLogger, withPerformanceLogging } from "@hiilo/utils";
import { parse } from "csv";
import { readFileSync } from "fs";
import path from "path";
import z from "zod";
import { config } from "../../../config/index.js";
import { BundleDatabaseService } from "../../database/bundle-database.service.js";
import {
  catalogMetadataRepository,
  syncJobRepository,
} from "../../database/supabase.service.js";
const logger = createLogger({
  component: "MayaSyncService",
  operationType: "maya-sync",
});

// Parse CSV data into an array
const csvContent = readFileSync(
  path.join(__dirname, "../../../data/maya-regions.csv"),
  "utf8"
);
const countriesData: Array<MayaCountry> = [];

// Use the parse function to process the CSV
parse(csvContent, {
  columns: true,
  autoParse: true,
})
  .on("data", (row) => {
    countriesData.push(row);
  })
  .on("end", () => {
    console.log("Countries data length:", countriesData.length);
  })
  .on("error", (error) => {
    console.error("Error parsing CSV:", error);
  });

type MayaCountry = {
  ISO2: string;
  "APN Name": string;
  "Auto APN": string;
  "Wi-Fi Hotspot": string;
  Country: string;
  ISO3: string;
};

type MayaBundleResponse = {
  result: number;
  status: number;
  request_id: string;
  message: string;
  developer_message: string;
  products: MayaBundle[];
};

export const MayaBundleSchema = z.object({
  uid: z.string(),
  name: z.string(),
  countries_enabled: z.array(z.string()),
  data_quota_mb: z.number(),
  data_quota_bytes: z.number(),
  validity_days: z.number(),
  policy_id: z.number(),
  policy_name: z.string(),
  wholesale_price_usd: z.string(),
});

const MayaProductsResponseSchema = z.object({
  result: z.number(),
  status: z.number(),
  request_id: z.string(),
  message: z.string().optional(),
  developer_message: z.string(),
  products: z.array(MayaBundleSchema),
});

export type MayaBundle = z.infer<typeof MayaBundleSchema>;
type MayaProductsResponse = z.infer<typeof MayaProductsResponseSchema>;

export class MayaSyncService {
  private client = {};

  get countries() {
    return countriesData.map((country) => country.ISO2);
  }

  private bundleDatabase: BundleDatabaseService;

  constructor() {
    this.bundleDatabase = new BundleDatabaseService();
  }

  async getProducts(countryId?: string, regionId?: string) {
    const url = new URL(
      "https://api.maya.net/connectivity/v1/account/products"
    );
    if (countryId) {
      url.searchParams.set("country", countryId);
    }
    if (regionId) {
      url.searchParams.set("region", regionId);
    }
    console.log("auth", config.maya.auth, url.toString());
    const response = await fetch(url.toString(), {
      headers: {
        "Content-Type": "application/json",
        Authorization: config.maya.auth,
      },
    });
    const data = await response.json();
    const parsedData = MayaProductsResponseSchema.parse(data);
    return parsedData;
  }

  /**
   * Perform a full catalog sync using bundle group strategy
   */
  async performFullSync(jobId: string): Promise<void> {
    return withPerformanceLogging(
      logger,
      "full-catalog-sync",
      async () => {
        logger.info("Starting full catalog sync", {
          jobId,
          strategy: "countries",
        });

        const results = {
          totalBundles: 0,
          bundlesAdded: 0,
          bundlesUpdated: 0,
          errors: [] as string[],
          countries: [] as string[],
        };

        // Update job status to running
        await syncJobRepository.startJob(jobId);
        try {
          // Sync each bundle group
          for (const country of this.countries) {
            try {
              const countryResults = await this.syncCountryBundles(
                country,
                jobId
              );

              results.totalBundles += countryResults.processed;
              results.bundlesAdded += countryResults.added;
              results.bundlesUpdated += countryResults.updated;
              results.countries.push(country);

              if (countryResults.errors.length > 0) {
                results.errors.push(...countryResults.errors);
              }

              // Update job progress and mark as partial sync if any bundles were saved
              await syncJobRepository.updateJobProgress(jobId, {
                bundlesProcessed: results.totalBundles,
                bundlesAdded: results.bundlesAdded,
                bundlesUpdated: results.bundlesUpdated,
                metadata: {
                  progress: `Completed ${results.countries.length}/${this.countries.length} groups`,
                  currentGroup: country,
                  syncStatus:
                    results.countries.length === this.countries.length
                      ? "complete"
                      : "partial",
                  completedGroups: results.countries,
                  remainingGroups: this.countries.slice(
                    results.countries.length
                  ),
                },
              });

              logger.info("Country completed", {
                country,
                jobId,
                progress: `${results.countries.length}/${this.countries.length}`,
                totalBundles: results.totalBundles,
              });
            } catch (error) {
              const errorMsg = `Failed to sync country ${country}: ${
                (error as Error).message
              }`;
              logger.error("Country sync failed", error as Error, {
                country,
                jobId,
              });
              results.errors.push(errorMsg);
            }
          }

          // Determine if sync is complete or partial
          const isCompleteSync =
            results.countries.length === this.countries.length &&
            results.errors.length === 0;

          // Record sync in metadata (full or partial)
          if (isCompleteSync) {
            await catalogMetadataRepository.recordFullSync({
              totalBundles: results.totalBundles,
              bundleGroups: results.countries,
              metadata: {
                syncedAt: new Date().toISOString(),
                syncStatus: "complete",
                errors: results.errors,
              },
            });
          } else {
            // Record partial sync
            await catalogMetadataRepository.recordPartialSync({
              totalBundles: results.totalBundles,
              bundleGroups: results.countries,
              metadata: {
                syncedAt: new Date().toISOString(),
                syncStatus: "partial",
                completedGroups: results.countries,
                failedCountries: this.countries.filter(
                  (g) => !results.countries.includes(g)
                ),
                errors: results.errors,
              },
            });
          }

          // Complete the job
          await syncJobRepository.completeJob(jobId, {
            bundlesProcessed: results.totalBundles,
            bundlesAdded: results.bundlesAdded,
            bundlesUpdated: results.bundlesUpdated,
            metadata: {
              bundleGroups: results.countries,
              syncStatus: isCompleteSync ? "complete" : "partial",
              errors: results.errors,
              completedAt: new Date().toISOString(),
            },
          });

          logger.info(
            isCompleteSync
              ? "Full catalog sync completed"
              : "Partial catalog sync completed",
            {
              jobId,
              totalBundles: results.totalBundles,
              bundlesAdded: results.bundlesAdded,
              bundlesUpdated: results.bundlesUpdated,
              countries: results.countries,
              completedCountries: results.countries.length,
              totalCountries: this.countries.length,
              syncStatus: isCompleteSync ? "complete" : "partial",
              errors: results.errors.length,
            }
          );
        } catch (error) {
          // Fail the job
          await syncJobRepository.failJob(jobId, error as Error);
          throw error;
        }
      },
      { jobId }
    );
  }

  /**
   * Sync bundles for a specific country
   */
  async syncCountryBundles(
    countryId: string,
    jobId: string
  ): Promise<{
    processed: number;
    added: number;
    updated: number;
    errors: string[];
  }> {
    return withPerformanceLogging(
      logger,
      "sync-country-bundles",
      async () => {
        logger.info("Starting country bundle sync", { countryId, jobId });

        await syncJobRepository.startJob(jobId);

        try {
          const bundles: MayaBundle[] = [];

          // Fetch bundles for the specific country
          const response = await this.getProducts(countryId);

          if (response.products) {
            bundles.push(...response.products);
          }

          // Transform and upsert bundles
          const validBundles = bundles
            .map((bundle) => transformAndValidateMayaBundle(bundle, "USD"))
            .filter((bundle) => bundle !== null);

          const allErrors: string[] = validBundles
            .filter((bundle) => bundle !== null)
            .map(
              (bundle) =>
                `Transform error for ${bundle?.esim_go_name}: ${bundle?.esim_go_name}`
            );

          let upsertResult = { added: 0, updated: 0, errors: [] as string[] };

          if (validBundles.length > 0) {
            console.log("validBundles", validBundles);
            upsertResult = await this.bundleDatabase.bulkUpsert(validBundles);
            allErrors.push(...upsertResult.errors);
          }

          await syncJobRepository.completeJob(jobId, {
            bundlesProcessed: bundles.length,
            bundlesAdded: upsertResult.added,
            bundlesUpdated: upsertResult.updated,
            metadata: {
              countryId,
              errors: allErrors,
            },
          });

          logger.info("Country bundle sync completed", {
            countryId,
            jobId,
            processed: bundles.length,
            added: upsertResult.added,
            updated: upsertResult.updated,
          });
          return {
            processed: bundles.length,
            added: upsertResult.added,
            updated: upsertResult.updated,
            errors: allErrors,
          };
        } catch (error) {
          await syncJobRepository.failJob(jobId, error as Error);
          throw error;
        }
      },
      { countryId, jobId }
    );
  }

  /**
   * Check API health
   */
  async checkApiHealth(): Promise<void> {
    try {
      const startTime = Date.now();

      // Try to fetch a small set of bundles
      const response = await this.getProducts();

      const responseTime = Date.now() - startTime;

      if (response) {
        await catalogMetadataRepository.updateApiHealth("healthy", {
          responseTime,
          checkedAt: new Date().toISOString(),
        });
      } else {
        await catalogMetadataRepository.updateApiHealth("degraded", {
          responseTime,
          checkedAt: new Date().toISOString(),
          reason: "Empty response",
        });
      }
    } catch (error) {
      await catalogMetadataRepository.updateApiHealth("down", {
        error: (error as Error).message,
        checkedAt: new Date().toISOString(),
      });
    }
  }

  /**
   * Handle stuck jobs
   */
  async handleStuckJobs(): Promise<void> {
    const cancelledCount = await syncJobRepository.cancelStuckJobs(
      config.worker.stuckJobThreshold
    );

    if (cancelledCount > 0) {
      logger.warn("Cancelled stuck jobs", {
        count: cancelledCount,
        threshold: config.worker.stuckJobThreshold,
      });
    }
  }

  /**
   * Clean up old jobs
   */
  async cleanupOldJobs(): Promise<void> {
    const deletedCount = await syncJobRepository.cleanupOldJobs(
      config.worker.cleanupOldJobsDays
    );

    if (deletedCount > 0) {
      logger.info("Cleaned up old jobs", {
        count: deletedCount,
        daysToKeep: config.worker.cleanupOldJobsDays,
      });
    }
  }
}
