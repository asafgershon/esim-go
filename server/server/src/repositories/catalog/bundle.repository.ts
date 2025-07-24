import { BaseSupabaseRepository } from "../base-supabase.repository";
import { type Database } from "../../database.types";
import { createLogger, withPerformanceLogging } from "../../lib/logger";
import type { CatalogueResponseInner } from "@esim-go/client";
import {
  transformBundlesToDatabase,
  convertCentsToDollars,
  convertBytesToMB,
} from "./bundle-transform.schema";
import type { PricingRange } from "../../types";

type CatalogBundle = Database["public"]["Tables"]["catalog_bundles"]["Row"];
type CatalogBundleInsert =
  Database["public"]["Tables"]["catalog_bundles"]["Insert"];
type CatalogBundleUpdate =
  Database["public"]["Tables"]["catalog_bundles"]["Update"];

export interface SearchCatalogCriteria {
  countries?: string[];
  bundleGroups?: string[];
  minDuration?: number;
  maxDuration?: number;
  unlimited?: boolean;
  limit?: number;
  offset?: number;
}

export class BundleRepository extends BaseSupabaseRepository<
  CatalogBundle,
  CatalogBundleInsert,
  CatalogBundleUpdate
> {
  private logger = createLogger({
    component: "BundleRepository",
    operationType: "catalog-persistence",
  });

  constructor() {
    super("catalog_bundles");
  }

  /**
   * Get bundle by bundle ID
   */
  async getByBundleId(bundleId: string): Promise<CatalogBundle | null> {
    return withPerformanceLogging(
      this.logger,
      "get-bundle-by-id",
      async () => {
        const { data, error } = await this.supabase
          .from("catalog_bundles")
          .select("*")
          .eq("esim_go_name", bundleId)
          .single();

        if (error) {
          if (error.code === "PGRST116") {
            return null; // Not found
          }
          this.logger.error("Failed to get bundle by id", error, { bundleId });
          throw error;
        }

        return data;
      },
      { bundleId }
    );
  }

  /**
   * Bulk upsert bundles from eSIM Go API
   */
  async bulkUpsert(bundles: CatalogueResponseInner[]): Promise<{
    added: number;
    updated: number;
    errors: string[];
  }> {
    return withPerformanceLogging(
      this.logger,
      "bulk-upsert-bundles",
      async () => {
        const results = {
          added: 0,
          updated: 0,
          errors: [] as string[],
        };

        // Transform all bundles with Zod validation
        const { validBundles, errors: transformErrors } =
          transformBundlesToDatabase(bundles);

        // Log transformation errors
        if (transformErrors.length > 0) {
          transformErrors.forEach(({ error, index }) => {
            this.logger.warn("Bundle transformation failed", {
              bundleIndex: index,
              error,
              operationType: "bundle-transformation",
            });
            results.errors.push(
              `Transformation error at index ${index}: ${error}`
            );
          });
        }

        this.logger.info("Bundle transformation completed", {
          totalBundles: bundles.length,
          validBundles: validBundles.length,
          transformationErrors: transformErrors.length,
          operationType: "bundle-transformation-summary",
        });

        if (validBundles.length === 0) {
          this.logger.warn("No valid bundles after transformation");
          return results;
        }

        // Process valid bundles in batches to avoid overwhelming the database
        const batchSize = 100;
        for (let i = 0; i < validBundles.length; i += batchSize) {
          const batch = validBundles.slice(i, i + batchSize);

          try {
            const { data, error } = await this.supabase
              .from("catalog_bundles")
              .upsert(batch, {
                onConflict: "esim_go_name",
                ignoreDuplicates: false,
              })
              .select();

            if (error) {
              this.logger.error("Batch upsert failed", error, {
                batchIndex: i / batchSize,
                batchSize: batch.length,
              });
              results.errors.push(`Batch ${i / batchSize}: ${error.message}`);
            } else if (data) {
              // Count new vs updated based on created_at timestamps
              const now = new Date();
              data.forEach((bundle) => {
                const createdAt = new Date(bundle.created_at || "");
                const timeDiff = now.getTime() - createdAt.getTime();
                // If created within last 10 seconds, consider it new
                if (timeDiff < 10000) {
                  results.added++;
                } else {
                  results.updated++;
                }
              });

              this.logger.debug("Batch upsert successful", {
                batchIndex: i / batchSize,
                insertedCount: data.length,
                operationType: "batch-upsert",
              });
            }
          } catch (error) {
            this.logger.error("Batch processing error", error as Error, {
              batchIndex: i / batchSize,
            });
            results.errors.push(
              `Batch ${i / batchSize}: ${(error as Error).message}`
            );
          }
        }

        this.logger.info("Bulk upsert completed", {
          totalBundles: bundles.length,
          added: results.added,
          updated: results.updated,
          errors: results.errors.length,
          operationType: "bulk-upsert-summary",
        });

        return results;
      },
      { bundleCount: bundles.length }
    );
  }

  /**
   * Search bundles with filtering
   */
  async searchBundles(criteria: SearchCatalogCriteria): Promise<{
    bundles: CatalogBundle[];
    totalCount: number;
  }> {
    return withPerformanceLogging(
      this.logger,
      "search-bundles",
      async () => {
        let query = this.supabase
          .from("catalog_bundles")
          .select("*", { count: "exact" });

        // Apply filters
        if (criteria.countries?.length) {
          // TODO: Fix JSONB country filtering - temporarily disabled
          // The country filtering has syntax issues with JSONB queries
          // For now, skip country filtering to prevent errors
          this.logger.warn(
            "Country filtering temporarily disabled due to JSONB query issues",
            {
              requestedCountries: criteria.countries,
              operationType: "country-filter-disabled",
            }
          );
        }

        if (criteria.bundleGroups?.length) {
          query = query.in("bundle_group", criteria.bundleGroups);
        }

        if (criteria.minDuration !== undefined) {
          query = query.gte("duration", criteria.minDuration);
        }

        if (criteria.maxDuration !== undefined) {
          query = query.lte("duration", criteria.maxDuration);
        }

        if (criteria.unlimited !== undefined) {
          query = query.eq("unlimited", criteria.unlimited);
        }

        // Apply pagination
        const limit = criteria.limit || 50;
        const offset = criteria.offset || 0;
        query = query
          .order("duration", { ascending: true })
          .order("data_amount", { ascending: true })
          .range(offset, offset + limit - 1);

        const { data, error, count } = await query;

        if (error) {
          this.logger.error("Search bundles failed", error, { criteria });
          throw error;
        }

        return {
          bundles: data || [],
          totalCount: count || 0,
        };
      },
      { criteria }
    );
  }

  /**
   * Get bundles by group
   */
  async getBundlesByGroup(bundleGroup: string): Promise<CatalogBundle[]> {
    const { data, error } = await this.supabase
      .from("catalog_bundles")
      .select("*")
      .eq("bundle_group", bundleGroup)
      .order("duration", { ascending: true });

    if (error) {
      this.logger.error("Failed to get bundles by group", error, {
        bundleGroup,
      });
      throw error;
    }

    return data || [];
  }

  /**
   * Get all unique bundle groups
   */
  async getAvailableBundleGroups(): Promise<string[]> {
    const { data, error } = await this.supabase
      .from("catalog_bundles")
      .select("bundle_group")
      .not("bundle_group", "is", null)
      .order("bundle_group");

    if (error) {
      this.logger.error("Failed to get bundle groups", error);
      throw error;
    }

    // Extract unique groups
    const uniqueGroups = [
      ...new Set(data?.map((row) => row.bundle_group) || []),
    ];
    return uniqueGroups.filter(Boolean) as string[];
  }

  /**
   * Get all unique countries from bundles
   */
  async getUniqueCountries(): Promise<string[]> {
    const { data, error } = await this.supabase
      .from("catalog_bundles")
      .select("countries");

    if (error) {
      this.logger.error("Failed to get unique countries", error);
      throw error;
    }

    const allCountries = new Set<string>();

    for (const bundle of data || []) {
      if (bundle.countries && Array.isArray(bundle.countries)) {
        for (const country of bundle.countries) {
          if (typeof country === "string") {
            allCountries.add(country);
          }
        }
      }
    }

    const uniqueCountries = Array.from(allCountries).sort();

    this.logger.info("Retrieved unique countries", {
      countryCount: uniqueCountries.length,
      operationType: "get-unique-countries",
    });

    return uniqueCountries;
  }

  /**
   * Get bundles for a specific country
   */
  async getBundlesByCountry(countryId: string): Promise<CatalogBundle[]> {
    return withPerformanceLogging(
      this.logger,
      "get-bundles-by-country",
      async () => {
        // First try with contains operator
        let { data, error } = await this.supabase
          .from("catalog_bundles")
          .select("*")
          .contains("countries", [countryId]);

        // If contains fails, fallback to fetching all and filtering
        if (error) {
          this.logger.warn("Contains query failed, using fallback filtering", {
            countryId,
            error: error.message,
          });

          const { data: allBundles, error: fallbackError } = await this.supabase
            .from("catalog_bundles")
            .select("*");

          if (fallbackError) {
            throw fallbackError;
          }

          data = (allBundles || []).filter(
            (bundle) =>
              bundle.countries &&
              Array.isArray(bundle.countries) &&
              bundle.countries.includes(countryId)
          );
        }

        this.logger.info("Retrieved bundles for country", {
          countryId,
          bundleCount: data?.length || 0,
          operationType: "get-bundles-by-country",
        });

        return data || [];
      },
      { countryId }
    );
  }

  /**
   * Get bundles grouped by country with counts - efficient aggregation
   */
  async getBundlesByCountryAggregation(): Promise<
    Array<{
      countryId: string;
      countryName: string;
      bundleCount: number;
      priceRange: PricingRange;
    }>
  > {
    return withPerformanceLogging(
      this.logger,
      "get-bundles-by-country-aggregation",
      async () => {
        const { data, error } = await this.supabase
          .from("catalog_bundles")
          .select("countries, price_cents");

        if (error) {
          this.logger.error("Failed to get country aggregation", error);
          throw error;
        }

        // Aggregate countries, count bundles, and track prices per country
        const countryBundleCount = new Map<string, number>();
        const countryPrices = new Map<string, number[]>();

        this.logger.debug("Raw bundle data sample", {
          totalBundles: data?.length || 0,
          sampleBundles: (data || []).slice(0, 3).map((bundle) => ({
            countries: bundle.countries,
            countryType: typeof bundle.countries,
            isArray: Array.isArray(bundle.countries),
            price_cents: bundle.price_cents,
          })),
          operationType: "country-aggregation-debug",
        });

        for (const bundle of data || []) {
          if (bundle.countries && Array.isArray(bundle.countries)) {
            const priceCents = bundle.price_cents;
            const isValidPrice =
              priceCents !== null &&
              priceCents !== undefined &&
              typeof priceCents === "number" &&
              priceCents > 0;

            for (const country of bundle.countries) {
              if (typeof country === "string") {
                // Count bundles for this country
                countryBundleCount.set(
                  country,
                  (countryBundleCount.get(country) || 0) + 1
                );

                // Track prices for this country (only valid prices)
                if (isValidPrice) {
                  if (!countryPrices.has(country)) {
                    countryPrices.set(country, []);
                  }
                  countryPrices.get(country)!.push(priceCents);
                }
              } else {
                this.logger.debug("Non-string country found", {
                  country,
                  type: typeof country,
                });
              }
            }
          } else {
            this.logger.debug("Bundle without valid countries array", {
              countries: bundle.countries,
              type: typeof bundle.countries,
              price_cents: bundle.price_cents,
            });
          }
        }

        // Convert to array and calculate per-country pricing ranges
        const result = Array.from(countryBundleCount.entries())
          .map(([countryIso, bundleCount]) => {
            const prices = countryPrices.get(countryIso) || [];
            let priceRange: PricingRange;

            if (prices.length > 0) {
              const minPrice = Math.min(...prices);
              const maxPrice = Math.max(...prices);
              priceRange = { min: minPrice, max: maxPrice };
            } else {
              // No valid pricing data for this country
              priceRange = { min: 0, max: 0 };
              this.logger.debug("Country has no valid pricing data", {
                countryId: countryIso,
                bundleCount,
                operationType: "country-pricing-debug",
              });
            }

            return {
              countryId: countryIso, // Using ISO code as the ID
              countryName: countryIso, // For now, use ISO code as name - frontend will map to full names
              bundleCount,
              priceRange,
            };
          })
          .sort((a, b) => a.countryName.localeCompare(b.countryName));

        // Add detailed pricing logging
        const pricingStats = {
          countriesWithPricing: 0,
          countriesWithoutPricing: 0,
          totalValidPrices: 0,
          samplePricingRanges: [] as Array<{
            countryId: string;
            min: number;
            max: number;
            bundleCount: number;
          }>,
        };

        result.forEach((country) => {
          if (country.priceRange.min > 0 || country.priceRange.max > 0) {
            pricingStats.countriesWithPricing++;
            pricingStats.totalValidPrices +=
              countryPrices.get(country.countryId)?.length || 0;

            // Add to sample (first 5 countries with pricing)
            if (pricingStats.samplePricingRanges.length < 5) {
              pricingStats.samplePricingRanges.push({
                countryId: country.countryId,
                min: country.priceRange.min,
                max: country.priceRange.max,
                bundleCount: country.bundleCount,
              });
            }
          } else {
            pricingStats.countriesWithoutPricing++;
          }
        });

        this.logger.info("Country aggregation completed", {
          countryCount: result.length,
          totalBundles: data?.length || 0,
          pricingStats,
          uniqueCountries: Array.from(countryBundleCount.keys()).slice(0, 10), // Limit to first 10 for logging
          operationType: "country-aggregation",
        });

        return result;
      }
    );
  }

  /**
   * Get bundles grouped by bundle group with counts and pricing - efficient aggregation
   */
  async getBundlesByGroupAggregation(): Promise<
    Array<{
      bundleGroup: string;
      bundleCount: number;
      priceRange: PricingRange;
      countryCount: number;
    }>
  > {
    return withPerformanceLogging(
      this.logger,
      "get-bundles-by-group-aggregation",
      async () => {
        const { data, error } = await this.supabase
          .from("catalog_bundles")
          .select("bundle_group, price_cents, countries");

        if (error) {
          this.logger.error("Failed to get bundle group aggregation", error);
          throw error;
        }

        // Aggregate bundle groups, count bundles, track prices, and count unique countries
        const groupBundleCount = new Map<string, number>();
        const groupPrices = new Map<string, number[]>();
        const groupCountries = new Map<string, Set<string>>();

        this.logger.debug("Raw bundle data sample for groups", {
          totalBundles: data?.length || 0,
          sampleBundles: (data || []).slice(0, 3).map((bundle) => ({
            bundle_group: bundle.bundle_group,
            price_cents: bundle.price_cents,
            countries: bundle.countries,
            countryType: typeof bundle.countries,
            isArray: Array.isArray(bundle.countries),
          })),
          operationType: "group-aggregation-debug",
        });

        for (const bundle of data || []) {
          const bundleGroup = bundle.bundle_group;
          if (
            bundleGroup &&
            typeof bundleGroup === "string" &&
            bundleGroup.trim()
          ) {
            const groupName = bundleGroup.trim();

            // Count bundles for this group
            groupBundleCount.set(
              groupName,
              (groupBundleCount.get(groupName) || 0) + 1
            );

            // Track prices for this group (only valid prices)
            const priceCents = bundle.price_cents;
            const isValidPrice =
              priceCents !== null &&
              priceCents !== undefined &&
              typeof priceCents === "number" &&
              priceCents > 0;

            if (isValidPrice) {
              if (!groupPrices.has(groupName)) {
                groupPrices.set(groupName, []);
              }
              groupPrices.get(groupName)!.push(priceCents);
            }

            // Track unique countries for this group
            if (bundle.countries && Array.isArray(bundle.countries)) {
              if (!groupCountries.has(groupName)) {
                groupCountries.set(groupName, new Set());
              }
              const countrySet = groupCountries.get(groupName)!;
              for (const country of bundle.countries) {
                if (typeof country === "string") {
                  countrySet.add(country);
                }
              }
            }
          } else {
            this.logger.debug("Bundle without valid bundle_group", {
              bundle_group: bundleGroup,
              type: typeof bundleGroup,
              price_cents: bundle.price_cents,
            });
          }
        }

        // Convert to array and calculate per-group pricing ranges and country counts
        const result = Array.from(groupBundleCount.entries())
          .map(([bundleGroup, bundleCount]) => {
            const prices = groupPrices.get(bundleGroup) || [];
            let priceRange: PricingRange;

            if (prices.length > 0) {
              const minPrice = Math.min(...prices);
              const maxPrice = Math.max(...prices);
              priceRange = { min: minPrice, max: maxPrice };
            } else {
              // No valid pricing data for this group
              priceRange = { min: 0, max: 0 };
              this.logger.debug("Bundle group has no valid pricing data", {
                bundleGroup,
                bundleCount,
                operationType: "group-pricing-debug",
              });
            }

            const countrySet = groupCountries.get(bundleGroup) || new Set();
            const countryCount = countrySet.size;

            return {
              bundleGroup,
              bundleCount,
              priceRange,
              countryCount,
            };
          })
          .sort((a, b) => a.bundleGroup.localeCompare(b.bundleGroup));

        // Add detailed pricing and country logging
        const groupStats = {
          groupsWithPricing: 0,
          groupsWithoutPricing: 0,
          totalValidPrices: 0,
          sampleGroupRanges: [] as Array<{
            bundleGroup: string;
            min: number;
            max: number;
            bundleCount: number;
            countryCount: number;
          }>,
        };

        result.forEach((group) => {
          if (group.priceRange.min > 0 || group.priceRange.max > 0) {
            groupStats.groupsWithPricing++;
            groupStats.totalValidPrices +=
              groupPrices.get(group.bundleGroup)?.length || 0;

            // Add to sample (first 5 groups with pricing)
            if (groupStats.sampleGroupRanges.length < 5) {
              groupStats.sampleGroupRanges.push({
                bundleGroup: group.bundleGroup,
                min: group.priceRange.min,
                max: group.priceRange.max,
                bundleCount: group.bundleCount,
                countryCount: group.countryCount,
              });
            }
          } else {
            groupStats.groupsWithoutPricing++;
          }
        });

        this.logger.info("Bundle group aggregation completed", {
          groupCount: result.length,
          totalBundles: data?.length || 0,
          groupStats,
          bundleGroups: result.map((g) => ({
            name: g.bundleGroup,
            bundles: g.bundleCount,
            countries: g.countryCount,
            priceRange: g.priceRange,
          })),
          operationType: "group-aggregation",
        });

        return result;
      }
    );
  }

  /**
   * Get bundles grouped by data type (unlimited vs limited) with counts - efficient aggregation
   */
  async getBundlesByDataTypeAggregation(): Promise<
    Array<{
      dataType: string;
      label: string;
      isUnlimited: boolean;
      bundleCount: number;
      priceRange: PricingRange;
      countryCount: number;
    }>
  > {
    return withPerformanceLogging(
      this.logger,
      "get-bundles-by-datatype-aggregation",
      async () => {
        const { data, error } = await this.supabase
          .from("catalog_bundles")
          .select("unlimited, data_amount, price_cents, countries");

        if (error) {
          this.logger.error("Failed to get data type aggregation", error);
          throw error;
        }

        // Aggregate by data type (unlimited vs limited), count bundles, track prices, and count unique countries
        const dataTypeStats = new Map<
          string,
          {
            bundleCount: number;
            prices: number[];
            countries: Set<string>;
            isUnlimited: boolean;
            label: string;
          }
        >();

        this.logger.debug("Raw bundle data sample for data types", {
          totalBundles: data?.length || 0,
          sampleBundles: (data || []).slice(0, 3).map((bundle) => ({
            unlimited: bundle.unlimited,
            data_amount: bundle.data_amount,
            price_cents: bundle.price_cents,
            countries: bundle.countries,
            countryType: typeof bundle.countries,
            isArray: Array.isArray(bundle.countries),
          })),
          operationType: "datatype-aggregation-debug",
        });

        for (const bundle of data || []) {
          // Determine data type based on unlimited flag and data_amount
          const isUnlimited =
            bundle.unlimited === true || bundle.data_amount === -1;
          const dataType = isUnlimited ? "unlimited" : "limited";
          const label = isUnlimited ? "Unlimited" : "Limited";

          // Initialize stats for this data type if not exists
          if (!dataTypeStats.has(dataType)) {
            dataTypeStats.set(dataType, {
              bundleCount: 0,
              prices: [],
              countries: new Set(),
              isUnlimited,
              label,
            });
          }

          const stats = dataTypeStats.get(dataType)!;

          // Count bundles for this data type
          stats.bundleCount += 1;

          // Track prices for this data type (only valid prices)
          const priceCents = bundle.price_cents;
          const isValidPrice =
            priceCents !== null &&
            priceCents !== undefined &&
            typeof priceCents === "number" &&
            priceCents > 0;

          if (isValidPrice) {
            stats.prices.push(priceCents);
          }

          // Track unique countries for this data type
          if (bundle.countries && Array.isArray(bundle.countries)) {
            for (const country of bundle.countries) {
              if (typeof country === "string") {
                stats.countries.add(country);
              }
            }
          }
        }

        // Convert to array and calculate pricing ranges and country counts
        const result = Array.from(dataTypeStats.entries())
          .map(([dataType, stats]) => {
            let priceRange: PricingRange;

            if (stats.prices.length > 0) {
              const minPrice = Math.min(...stats.prices);
              const maxPrice = Math.max(...stats.prices);
              priceRange = { min: minPrice, max: maxPrice };
            } else {
              // No valid pricing data for this data type
              priceRange = { min: 0, max: 0 };
              this.logger.debug("Data type has no valid pricing data", {
                dataType,
                bundleCount: stats.bundleCount,
                operationType: "datatype-pricing-debug",
              });
            }

            return {
              dataType,
              label: stats.label,
              isUnlimited: stats.isUnlimited,
              bundleCount: stats.bundleCount,
              priceRange,
              countryCount: stats.countries.size,
            };
          })
          .sort((a, b) => a.label.localeCompare(b.label)); // Sort by label (Limited, Unlimited)

        // Add detailed logging
        const dataTypeStatsForLogging = {
          typesWithPricing: 0,
          typesWithoutPricing: 0,
          totalValidPrices: 0,
          dataTypeRanges: [] as Array<{
            dataType: string;
            label: string;
            min: number;
            max: number;
            bundleCount: number;
            countryCount: number;
          }>,
        };

        result.forEach((type) => {
          if (type.priceRange.min > 0 || type.priceRange.max > 0) {
            dataTypeStatsForLogging.typesWithPricing++;
            dataTypeStatsForLogging.totalValidPrices +=
              dataTypeStats.get(type.dataType)?.prices.length || 0;
          } else {
            dataTypeStatsForLogging.typesWithoutPricing++;
          }

          dataTypeStatsForLogging.dataTypeRanges.push({
            dataType: type.dataType,
            label: type.label,
            min: type.priceRange.min,
            max: type.priceRange.max,
            bundleCount: type.bundleCount,
            countryCount: type.countryCount,
          });
        });

        this.logger.info("Data type aggregation completed", {
          dataTypeCount: result.length,
          totalBundles: data?.length || 0,
          dataTypeStatsForLogging,
          operationType: "datatype-aggregation",
        });

        return result;
      }
    );
  }

  /**
   * Get bundles grouped by duration with counts - efficient aggregation
   */
  async getBundlesByDurationAggregation(): Promise<
    Array<{
      duration: number;
      label: string;
      bundleCount: number;
      priceRange: PricingRange;
      countryCount: number;
    }>
  > {
    return withPerformanceLogging(
      this.logger,
      "get-bundles-by-duration-aggregation",
      async () => {
        const { data, error } = await this.supabase
          .from("catalog_bundles")
          .select("duration, price_cents, countries");

        if (error) {
          this.logger.error("Failed to get duration aggregation", error);
          throw error;
        }

        // Aggregate by duration, count bundles, track prices, and count unique countries
        const durationStats = new Map<
          number,
          {
            bundleCount: number;
            prices: number[];
            countries: Set<string>;
            label: string;
          }
        >();

        this.logger.debug("Raw bundle data sample for durations", {
          totalBundles: data?.length || 0,
          sampleBundles: (data || []).slice(0, 3).map((bundle) => ({
            duration: bundle.duration,
            price_cents: bundle.price_cents,
            countries: bundle.countries,
            countryType: typeof bundle.countries,
            isArray: Array.isArray(bundle.countries),
          })),
          operationType: "duration-aggregation-debug",
        });

        for (const bundle of data || []) {
          const duration = bundle.duration;
          if (duration && typeof duration === "number" && duration > 0) {
            const label = `${duration} days`;

            // Initialize stats for this duration if not exists
            if (!durationStats.has(duration)) {
              durationStats.set(duration, {
                bundleCount: 0,
                prices: [],
                countries: new Set(),
                label,
              });
            }

            const stats = durationStats.get(duration)!;

            // Count bundles for this duration
            stats.bundleCount += 1;

            // Track prices for this duration (only valid prices)
            const priceCents = bundle.price_cents;
            const isValidPrice =
              priceCents !== null &&
              priceCents !== undefined &&
              typeof priceCents === "number" &&
              priceCents > 0;

            if (isValidPrice) {
              stats.prices.push(priceCents);
            }

            // Track unique countries for this duration
            if (bundle.countries && Array.isArray(bundle.countries)) {
              for (const country of bundle.countries) {
                if (typeof country === "string") {
                  stats.countries.add(country);
                }
              }
            }
          } else {
            this.logger.debug("Bundle without valid duration", {
              duration: duration || 0,
              type: typeof duration,
              price_cents: bundle.price_cents,
            });
          }
        }

        // Convert to array and calculate pricing ranges and country counts
        const result = Array.from(durationStats.entries())
          .map(([duration, stats]) => {
            let priceRange: PricingRange;

            if (stats.prices.length > 0) {
              const minPrice = Math.min(...stats.prices);
              const maxPrice = Math.max(...stats.prices);
              priceRange = { min: minPrice, max: maxPrice };
            } else {
              // No valid pricing data for this duration
              priceRange = { min: 0, max: 0 };
              this.logger.debug("Duration has no valid pricing data", {
                duration,
                bundleCount: stats.bundleCount,
                operationType: "duration-pricing-debug",
              });
            }

            return {
              duration,
              label: stats.label,
              bundleCount: stats.bundleCount,
              priceRange,
              countryCount: stats.countries.size,
            };
          })
          .sort((a, b) => a.duration - b.duration); // Sort by duration ascending

        // Add detailed logging
        const durationStatsForLogging = {
          durationsWithPricing: 0,
          durationsWithoutPricing: 0,
          totalValidPrices: 0,
          durationRanges: [] as Array<{
            duration: number;
            label: string;
            min: number;
            max: number;
            bundleCount: number;
            countryCount: number;
          }>,
        };

        result.forEach((dur) => {
          if (dur.priceRange.min > 0 || dur.priceRange.max > 0) {
            durationStatsForLogging.durationsWithPricing++;
            durationStatsForLogging.totalValidPrices +=
              durationStats.get(dur.duration)?.prices.length || 0;
          } else {
            durationStatsForLogging.durationsWithoutPricing++;
          }

          durationStatsForLogging.durationRanges.push({
            duration: dur.duration,
            label: dur.label,
            min: dur.priceRange.min,
            max: dur.priceRange.max,
            bundleCount: dur.bundleCount,
            countryCount: dur.countryCount,
          });
        });

        this.logger.info("Duration aggregation completed", {
          durationCount: result.length,
          totalBundles: data?.length || 0,
          durationStatsForLogging,
          operationType: "duration-aggregation",
        });

        return result;
      }
    );
  }

  /**
   * Get bundles grouped by region with counts - efficient aggregation
   */
  async getBundlesByRegionAggregation(): Promise<
    Array<{
      regionName: string;
      bundleCount: number;
      countryCount: number;
    }>
  > {
    return withPerformanceLogging(
      this.logger,
      "get-bundles-by-region-aggregation",
      async () => {
        const { data, error } = await this.supabase
          .from("catalog_bundles")
          .select("regions, countries");

        if (error) {
          this.logger.error("Failed to get region aggregation", error);
          throw error;
        }

        // Aggregate regions and count bundles + countries
        const regionStats = new Map<
          string,
          { bundleCount: number; countries: Set<string> }
        >();

        this.logger.debug("Raw bundle data for regions", {
          totalBundles: data?.length || 0,
          sampleBundles: (data || []).slice(0, 3).map((bundle) => ({
            regions: bundle.regions,
            countries: bundle.countries,
            regionType: typeof bundle.regions,
            isRegionArray: Array.isArray(bundle.regions),
          })),
          operationType: "region-aggregation-debug",
        });

        for (const bundle of data || []) {
          if (bundle.regions && Array.isArray(bundle.regions)) {
            for (const region of bundle.regions) {
              if (typeof region === "string" && region.trim()) {
                if (!regionStats.has(region)) {
                  regionStats.set(region, {
                    bundleCount: 0,
                    countries: new Set(),
                  });
                }

                const stats = regionStats.get(region)!;
                stats.bundleCount += 1;

                // Add countries from this bundle to the region's country set
                if (bundle.countries && Array.isArray(bundle.countries)) {
                  for (const country of bundle.countries) {
                    if (typeof country === "string") {
                      stats.countries.add(country);
                    }
                  }
                }
              }
            }
          }
        }

        // Convert to array and sort by region name
        const result = Array.from(regionStats.entries())
          .map(([regionName, stats]) => ({
            regionName,
            bundleCount: stats.bundleCount,
            countryCount: stats.countries.size,
          }))
          .sort((a, b) => a.regionName.localeCompare(b.regionName));

        this.logger.info("Region aggregation completed", {
          regionCount: result.length,
          totalBundles: data?.length || 0,
          regions: result.map((r) => ({
            name: r.regionName,
            bundles: r.bundleCount,
            countries: r.countryCount,
          })),
          operationType: "region-aggregation",
        });

        return result;
      }
    );
  }

  /**
   * Get bundles for a specific region
   */
  async getBundlesByRegion(regionName: string): Promise<CatalogBundle[]> {
    return withPerformanceLogging(
      this.logger,
      "get-bundles-by-region",
      async () => {
        // JSONB contains operator has syntax issues with JSON arrays
        // Use manual filtering approach with pagination to get all bundles
        let allBundles: CatalogBundle[] = [];
        let hasMore = true;
        let offset = 0;
        const pageSize = 1000; // Supabase default limit

        while (hasMore) {
          const { data, error } = await this.supabase
            .from("catalog_bundles")
            .select("*")
            .range(offset, offset + pageSize - 1);

          if (error) {
            this.logger.error("Failed to get bundles by region", error, {
              regionName,
              offset,
              operationType: "get-bundles-by-region",
            });
            throw error;
          }

          if (data && data.length > 0) {
            allBundles = allBundles.concat(data);
            offset += pageSize;
            hasMore = data.length === pageSize; // Continue if we got a full page
          } else {
            hasMore = false;
          }
        }

        // Filter bundles that have this region in their regions array
        const filteredBundles = allBundles.filter(
          (bundle) =>
            bundle.regions &&
            Array.isArray(bundle.regions) &&
            bundle.regions.includes(regionName)
        );

        this.logger.info("Retrieved bundles for region", {
          regionName,
          bundleCount: filteredBundles.length,
          totalBundlesScanned: allBundles.length,
          operationType: "get-bundles-by-region",
        });

        return filteredBundles;
      }
    );
  }

  /**
   * Update bundle pricing
   */
  async updatePricing(
    bundleId: string,
    price: number
  ): Promise<CatalogBundle | null> {
    const { data, error } = await this.supabase
      .from("catalog_bundles")
      .update({
        price_cents: Math.round(price * 100), // Convert to cents
        updated_at: new Date().toISOString(),
      })
      .eq("esim_go_name", bundleId)
      .select()
      .single();

    if (error) {
      this.logger.error("Failed to update bundle pricing", error, {
        bundleId,
        price,
      });
      throw error;
    }

    return data;
  }

  /**
   * Get stale bundles that need refresh
   */
  async getStaleBundles(daysOld: number = 30): Promise<CatalogBundle[]> {
    const staleDate = new Date();
    staleDate.setDate(staleDate.getDate() - daysOld);

    const { data, error } = await this.supabase
      .from("catalog_bundles")
      .select("*")
      .lt("updated_at", staleDate.toISOString())
      .order("updated_at", { ascending: true })
      .limit(100);

    if (error) {
      this.logger.error("Failed to get stale bundles", error, { daysOld });
      throw error;
    }

    return data || [];
  }

  /**
   * Delete bundles not seen in recent syncs
   */
  async deleteOrphanedBundles(daysOld: number = 60): Promise<number> {
    const orphanDate = new Date();
    orphanDate.setDate(orphanDate.getDate() - daysOld);

    const { data, error } = await this.supabase
      .from("catalog_bundles")
      .delete()
      .lt("updated_at", orphanDate.toISOString())
      .select("id");

    if (error) {
      this.logger.error("Failed to delete orphaned bundles", error, {
        daysOld,
      });
      throw error;
    }

    const deletedCount = data?.length || 0;

    if (deletedCount > 0) {
      this.logger.info("Deleted orphaned bundles", {
        deletedCount,
        daysOld,
        operationType: "cleanup",
      });
    }

    return deletedCount;
  }
}
