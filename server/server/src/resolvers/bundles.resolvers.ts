import { GraphQLError } from "graphql";
import { createLogger } from "../lib/logger";
import { BundleRepository } from "../repositories/catalog/bundle.repository";
import type {
    Bundle,
    CatalogBundle,
    Country,
    CustomerBundle,
    Resolvers,
} from "../types";

const logger = createLogger({ component: "BundleResolvers" });

type BundleResolvers = Resolvers["Bundle"] &
  Resolvers &
  Resolvers["BundlesByCountry"] &
  Resolvers["BundlesForCountry"] &
  Resolvers["BundlesByRegion"] &
  Resolvers["BundlesForRegion"] &
  Resolvers["BundlesForGroup"] &
  Resolvers["BundlesByGroup"] &
  Resolvers["CatalogBundle"] &
  Resolvers["CustomerBundle"];

export const bundlesResolvers: BundleResolvers = {
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
          ...BundleRepository.transformCatalogToBundle(bundle),
          // Add timestamps from the DB record
          createdAt: bundle.created_at,
          updatedAt: bundle.updated_at,
          syncedAt: bundle.synced_at,
        };
      } catch (error) {
        logger.error("Error fetching bundle", error as Error, { id });
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
            ...BundleRepository.transformCatalogToBundle(bundle),
            createdAt: bundle.created_at,
            updatedAt: bundle.updated_at,
            syncedAt: bundle.synced_at,
          })),
          totalCount: count,
          pageInfo: {
            currentPage: pagination?.offset || 0,
            limit: pagination?.limit || 0,
            offset: pagination?.offset || 0,
            pages: Math.ceil(count / (pagination?.limit || 0)),
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
          countries: region.countries || [],
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
            result.bundles?.map((bundle: any) => ({
              __typename: "CatalogBundle",
              ...transformJsonBundle(bundle),
              // Add default timestamps for JSON bundles
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              syncedAt: new Date().toISOString(),
            })) || [],
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
        const data = await context.repositories.bundles.byRegion(region);
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
            result.bundles?.map((bundle) => ({
              __typename: "CatalogBundle",
              ...transformJsonBundle(bundle),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              syncedAt: new Date().toISOString(),
            })) || [],
          bundleCount: Number(result.bundle_count),
          pricingRange: {
            min: Number(result.min_price),
            max: Number(result.max_price),
            currency: "USD",
          },
          countries: result.countries || [],
          groups: result.groups || [],
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
          group: result.group_name,
          bundles:
            result.bundles?.map((bundle) => ({
              __typename: "CatalogBundle",
              ...transformJsonBundle(bundle),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              syncedAt: new Date().toISOString(),
            })) || [],
          bundleCount: Number(result.bundle_count),
          pricingRange: {
            min: Number(result.min_price),
            max: Number(result.max_price),
            currency: "USD",
          },
          countries: result.countries || [],
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
        // Use pre-fetched data if available
        if (parent.bundles && parent.bundles.length > 0) {
          return parent.bundles
            .slice(offset || 0, (offset || 0) + (limit || 0))
            .map((bundle) => ({
              __typename: "CatalogBundle",
              ...transformJsonBundle(bundle),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              syncedAt: new Date().toISOString(),
            }));
        }

        // Otherwise fetch if needed
        if (parent.region) {
          const data = await context.repositories.bundles.byRegion(
            parent.region
          );

          if (data && data.length > 0) {
            const bundles = (data[0]?.bundles as Bundle[]) || [];
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
        // Use pre-fetched data if available
        if (parent.bundles && parent.bundles.length > 0) {
          return parent.bundles
            .slice(offset || 0, (offset || 0) + (limit || 0))
            .map((bundle) => ({
              __typename: "CatalogBundle",
              ...transformJsonBundle(bundle),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              syncedAt: new Date().toISOString(),
            }));
        }

        // Otherwise fetch if needed
        if (parent.group) {
          const data = await context.repositories.bundles.byGroup(parent.group);

          if (data && data.length > 0) {
            const bundles = (data[0]?.bundles as Bundle[]) || [];
            return bundles.slice(offset || 0, (offset || 0) + (limit || 0)).map((bundle) => ({
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
};

// ========== Helper Functions ==========

function transformJsonBundle(jsonBundle: any) {
  return {
    esimGoName: jsonBundle.esim_go_name,
    name: jsonBundle.name || jsonBundle.esim_go_name,
    description: jsonBundle.description,
    groups: jsonBundle.groups || [],
    validityInDays: jsonBundle.validity_in_days || 0,
    dataAmountMB: jsonBundle.data_amount_mb,
    dataAmountReadable: jsonBundle.data_amount_readable || "Unknown",
    isUnlimited: jsonBundle.is_unlimited || false,
    countries: jsonBundle.countries || [],
    region: jsonBundle.region,
    speed: jsonBundle.speed || ["4G"],
    basePrice: Number(jsonBundle.price) || 0,
    currency: jsonBundle.currency || "USD",
  };
}

function formatGroupName(group: string): string {
  return group
    .replace(/[_-]/g, " ")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}
