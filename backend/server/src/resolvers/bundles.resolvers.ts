import { GraphQLError } from "graphql";
import { createLogger } from "../lib/logger";
import { BundleRepository } from "../repositories/catalog/bundle.repository";
import type {
  Bundle,
  CatalogBundle,
  Country,
  CustomerBundle,
  Provider,
  Resolvers,
} from "../types";

const logger = createLogger({ component: "BundleResolvers" });

export const bundlesResolvers: Partial<Resolvers> = {
  Query: {
    // ========== Bundle Queries ==========

    bundle: async (_, { id }, context) => {
      try {
        const bundle = await context.repositories.bundles.getById(id);

        if (!bundle) {
          throw new GraphQLError("Bundle not found", {
            extensions: { code: "NOT_FOUND" },
          });
        }

        // Return CatalogBundle with __typename
        return {
          __typename: "CatalogBundle",
          // FIX: Use our local, corrected helper function instead of the old static one.
          ...transformJsonBundle(bundle),
          // Add timestamps from the DB record
          createdAt: bundle.created_at,
          updatedAt: bundle.updated_at,
          // NOTE: 'synced_at' does not exist in your new table. It might need to be removed from the GraphQL schema later.
          // For now, we set it to null to avoid breaking the frontend.
          syncedAt: null,
        };
      } catch (error) {
        logger.error("Error fetching bundle", error as Error, { id });
        throw error;
      }
    },

    bundleStats: async (_, __, context) => {
      try {
        // Get total active bundles count
        const { count: totalBundles } = await context.repositories.bundles.search({
          limit: 1, // We only need the count
        });

        // Get unique countries, regions, and groups in parallel
        const [countries, regions, groups] = await Promise.all([
          context.repositories.bundles.getCountries(),
          context.repositories.bundles.getRegions(),
          context.repositories.bundles.getGroups(),
        ]);
        
        return {
          totalBundles,
          totalCountries: countries.length,
          totalRegions: regions.length,
          totalGroups: groups.length,
        };
      } catch (error) {
        logger.error("Error fetching bundle stats", error as Error);
        throw error;
      }
    },

    bundles: async (_, { filter, pagination }, context) => {
      try {
        const { data, count, hasNextPage, hasPreviousPage } =
          await context.repositories.bundles.search({
            countries: filter?.countries || undefined,
            groups: filter?.groups || undefined,
            regions: filter?.region ? [filter.region] : undefined,
            isUnlimited: Boolean(filter?.isUnlimited),
            minValidityInDays: filter?.validityInDays?.min || undefined,
            maxValidityInDays: filter?.validityInDays?.max || undefined,
            minPrice: filter?.priceRange?.min || undefined,
            maxPrice: filter?.priceRange?.max || undefined,
            limit: pagination?.limit || undefined,
            offset: pagination?.offset || undefined,
          });

        return {
          nodes: data.map((bundle) => ({
            __typename: "CatalogBundle",
            ...transformJsonBundle(bundle),
            createdAt: bundle.created_at,
            updatedAt: bundle.updated_at,
            syncedAt: null, // See note above
          })),
          totalCount: count,
          pageInfo: {
            currentPage: pagination?.offset || 0,
            limit: pagination?.limit || 0,
            offset: pagination?.offset || 0,
            pages: Math.ceil(count / (pagination?.limit || 1)),
            total: count,
            hasNextPage,
            hasPreviousPage,
          },
        };
      } catch (error) {
        logger.error("Error searching bundles", error as Error);
        throw error;
      }
    },

    // ========== Aggregation Queries ==========

    bundlesByCountry: async (_, __, context) => {
      try {
        const data = await context.repositories.bundles.byCountries();

        return data.map((country) => ({
          country: {
            iso: country.country_code,
            __typename: "Country",
          } as Country,
          bundleCount: Number(country.bundle_count),
          pricingRange: {
            min: Number(country.min_price),
            max: Number(country.max_price),
            avg: Number(country.avg_price),
            currency: "USD",
          },
          bundles: [],
          hasUnlimited: Boolean(country.has_unlimited),
          _countryCode: country.country_code,
        }));
      } catch (error) {
        logger.error("Error fetching bundles by countries", error as Error);
        throw error;
      }
    },

    bundlesByRegion: async (_, __, context) => {
      try {
        const data = await context.repositories.bundles.byRegions();

        return data.map((region) => ({
          region: region.region,
          bundleCount: Number(region.bundle_count),
          pricingRange: {
            min: Number(region.min_price),
            max: Number(region.max_price),
            avg: Number(region.avg_price),
            currency: "USD",
          },
          // NOTE: Your new SQL function doesn't return the list of countries.
          // This might need adjustment if the frontend uses it. For now, setting to empty array.
          countries: [], 
          countryCount: Number(region.country_count),
          hasUnlimited: Boolean(region.has_unlimited),
          bundles: [],
        }));
      } catch (error) {
        logger.error("Error fetching bundles by regions", error as Error);
        throw error;
      }
    },

    bundlesByGroup: async (_, __, context) => {
      try {
        const data = await context.repositories.bundles.byGroups();

        return data.map((group) => ({
          group: group.group_name,
          bundleCount: Number(group.bundle_count),
          pricingRange: {
            min: Number(group.min_price),
            max: Number(group.max_price),
            avg: Number(group.avg_price),
            currency: "USD",
          },
          countriesCount: Number(group.countries_count),
          hasUnlimited: Boolean(group.has_unlimited),
          bundles: [],
        }));
      } catch (error) {
        logger.error("Error fetching bundles by groups", error as Error);
        throw error;
      }
    },

    // ========== Detail Queries ==========

    bundlesForCountry: async (_, { countryCode }, context) => {
      try {
        const data = await context.repositories.bundles.byCountry(countryCode);

        const defualtResult = {
          bundleCount: 0,
          pricingRange: { min: 0, max: 0, avg: 0, currency: "USD" },
          groups: [],
          bundles: [],
          country: {
            iso: countryCode,
          } as Country,
          regions: [],
          hasUnlimited: false,
        };

        if (!data || data.length === 0) {
          return defualtResult;
        }

        const result = data[0];
        if (!result) {
          return defualtResult;
        }
        return {
          country: {
            iso: countryCode,
          } as Country,
          bundles:
            (Array.isArray(result.bundles) 
              ? result.bundles.map((bundle: any) => ({
                  __typename: "CatalogBundle",
                  ...transformJsonBundle(bundle),
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                  syncedAt: new Date().toISOString(),
                }))
              : []),
          bundleCount: Number(result.bundle_count),
          pricingRange: {
            min: Number(result.min_price),
            max: Number(result.max_price),
            currency: "USD",
          },
          groups: result.groups || [],
          regions: result.regions || [],
          hasUnlimited: Boolean(result.has_unlimited),
        };
      } catch (error) {
        logger.error("Error fetching bundles for country", error as Error, {
          countryCode,
        });
        throw error;
      }
    },

    bundlesForRegion: async (_, { region }, context) => {
      try {
        // FIX: Call 'byRegions' and filter the result, as 'byRegion' does not exist.
        const allRegionsData = await context.repositories.bundles.byRegions();
        const data = allRegionsData.filter((r: any) => r.region === region);
        
        const defualtResult = {
          bundleCount: 0,
          pricingRange: { min: 0, max: 0, avg: 0, currency: "USD" },
          groups: [],
          bundles: [],
          region: region,
          countries: [],
          hasUnlimited: false,
        };
        if (!data || data.length === 0) {
          return defualtResult;
        }

        const result = data[0];
        if (!result) {
          return defualtResult;
        }
        return {
          region: result.region,
          bundles:
            (Array.isArray((result as any).bundles)
              ? (result as any).bundles.map((bundle: any) => ({
                  __typename: "CatalogBundle",
                  ...transformJsonBundle(bundle),
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                  syncedAt: new Date().toISOString(),
                }))
              : []),
          bundleCount: Number(result.bundle_count),
          pricingRange: {
            min: Number(result.min_price),
            max: Number(result.max_price),
            currency: "USD",
          },
          countries: (result as any).countries || [],
          groups: (result as any).groups || [],
          hasUnlimited: Boolean(result.has_unlimited),
        };
      } catch (error) {
        logger.error("Error fetching bundles for region", error as Error, {
          region,
        });
        throw error;
      }
    },

    bundlesForGroup: async (_, { group }, context) => {
      try {
        const data = await context.repositories.bundles.byGroup(group);
        const defualtResult = {
          group: group,
          bundleCount: 0,
          pricingRange: { min: 0, max: 0, avg: 0, currency: "USD" },
          groups: [],
          bundles: [],
          countries: [],
          regions: [],
          hasUnlimited: false,
        };

        const result = data[0];
        if (!result) {
          return defualtResult;
        }
        return {
          // FIX: Use the 'group' input parameter as the primary source of truth.
          group: group,
          bundles:
            (Array.isArray((result as any).bundles)
              ? (result as any).bundles.map((bundle: any) => ({
                  __typename: "CatalogBundle",
                  ...transformJsonBundle(bundle),
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                  syncedAt: new Date().toISOString(),
                }))
              : []),
          bundleCount: Number(result.bundle_count),
          pricingRange: {
            min: Number(result.min_price),
            max: Number(result.max_price),
            currency: "USD",
          },
          // FIX: Cast to 'any' to resolve type inference issue.
          countries: (result as any).countries || [],
          regions: result.regions || [],
          hasUnlimited: Boolean(result.has_unlimited),
        };
      } catch (error) {
        logger.error("Error fetching bundles for group", error as Error, {
          group,
        });
        throw error;
      }
    },

    // ========== Filter Options ==========

    bundleFilterOptions: async (_, __, context) => {
      try {
        const [groups, countries, regions] = await Promise.all([
          context.repositories.bundles.getGroups(),
          context.repositories.bundles.getCountries(),
          context.repositories.bundles.getRegions(),
        ]);

        return {
          groups: groups.map((g) => ({
            value: g,
            label: formatGroupName(g),
          })),
          countries: countries.map((c) => ({
            value: c,
            label: c, // Country resolver can enhance this
          })),
          regions: regions.map((r) => ({
            value: r,
            label: r,
          })),
        };
      } catch (error) {
        logger.error("Error fetching filter options", error as Error);
        throw error;
      }
    },
  },

  // ========== Field Resolvers ==========

  BundlesByCountry: {
    bundles: async (parent, { limit = 3, offset = 0 }, context) => {
      try {
        // If we have the country code stored, fetch bundles
        if (parent.country.iso) {
          const data = await context.repositories.bundles.byCountry(
            parent.country.iso
          );

          if (data && data.length > 0) {
            const bundles = (data[0]?.bundles as Bundle[]) || [];
            // Apply pagination and return with proper type
            return bundles
              .slice(offset || 0, (offset || 0) + (limit || 0))
              .map((bundle) => ({
                __typename: "CatalogBundle",
                ...transformJsonBundle(bundle),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                syncedAt: new Date().toISOString(),
              }));
          }
        }

        return [];
      } catch (error) {
        logger.error("Error fetching country bundles", error as Error);
        return [];
      }
    },
  },

  BundlesByRegion: {
    bundles: async (parent, { limit = 3, offset = 0 }, context) => {
      try {
        if (parent.region) {
          // FIX: Use the robust 'search' method instead of the missing 'byRegion'.
          const { data: bundles } = await context.repositories.bundles.search({
            regions: [parent.region]
          });
          
          if (bundles) {
            return bundles
              .slice(offset || 0, (offset || 0) + (limit || 0))
              .map((bundle) => ({
                __typename: "CatalogBundle",
                ...transformJsonBundle(bundle),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                syncedAt: new Date().toISOString(),
              }));
          }
        }

        return [];
      } catch (error) {
        logger.error("Error fetching region bundles", error as Error);
        return [];
      }
    },
  },

  BundlesByGroup: {
    bundles: async (parent, { limit = 3, offset = 0 }, context) => {
      try {
        if (parent.group) {
          // FIX: Use the robust 'search' method here as well for consistency.
          const { data: bundles } = await context.repositories.bundles.search({
            groups: [parent.group]
          });

          if (bundles) {
            return bundles
              .slice(offset || 0, (offset || 0) + (limit || 0))
              .map((bundle) => ({
                __typename: "CatalogBundle",
                ...transformJsonBundle(bundle),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                syncedAt: new Date().toISOString(),
              }));
          }
        }

        return [];
      } catch (error) {
        logger.error("Error fetching group bundles", error as Error);
        return [];
      }
    },
  },
  Bundle: {
    __resolveType: (obj) => {
      // FIX: Check for a property that exists and makes sense. 'provider' is better.
      if ((obj as CatalogBundle).provider) { 
        return "CatalogBundle";
      }
      if ((obj as CustomerBundle).pricingBreakdown) {
        return "CustomerBundle";
      }
      return "CatalogBundle";
    },
  },
};

// ========== Helper Functions ==========

// FIX: This function is now the single source of truth for transformation.
// It's updated to match the new 'catalog_bundles' table schema.
export function transformJsonBundle(jsonBundle: any) {
  return {
    // This field doesn't exist anymore, mapping from 'name'
    esimGoName: jsonBundle.name, 
    name: jsonBundle.name || jsonBundle.description,
    description: jsonBundle.description,
    groups: jsonBundle.group_name ? [jsonBundle.group_name] : [],
    validityInDays: jsonBundle.validity_days || 0,
    dataAmountMB: jsonBundle.data_amount_mb,
    // This field doesn't exist, we might need to calculate it or remove it from the schema.
    dataAmountReadable: "Unknown", 
    isUnlimited: jsonBundle.unlimited || false,
    // This field now comes from a separate table. The resolver will need to fetch it separately if needed.
    countries: [], 
    region: jsonBundle.region,
    speed: jsonBundle.speed || ["4G"],
    basePrice: Number(jsonBundle.price_usd) || 0,
    currency: jsonBundle.currency || "USD",
    // This field is now a provider_id. The resolver would need to fetch provider details if needed.
    provider: "unknown" as Provider,
  };
}

function formatGroupName(group: string): string {
  return group
    .replace(/[_-]/g, " ")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

