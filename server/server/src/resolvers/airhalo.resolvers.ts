import { GraphQLError } from 'graphql';
import type { Context } from '../context/types';
import { logger } from '../lib/logger';
import type { 
  AirHaloPackageFilter,
  AirHaloPackageType,
} from '../types';

/**
 * Transform AirHalo API response to GraphQL types
 */
const transformAirHaloPackageData = (data: any) => {
  return {
    id: data.id,
    title: data.title,
    slug: data.slug,
    image: data.image ? {
      url: data.image.url,
      width: data.image.width,
      height: data.image.height,
    } : null,
    operators: data.operators?.map((operator: any) => ({
      id: operator.id,
      title: operator.title,
      type: operator.type,
      countries: operator.countries?.map((country: any) => ({
        id: country.id,
        title: country.title,
        slug: country.slug,
      })) || [],
      packages: operator.packages?.map((pkg: any) => ({
        id: pkg.id,
        type: pkg.type,
        title: pkg.title,
        shortInfo: pkg.short_info,
        data: pkg.data,
        amount: pkg.amount,
        day: pkg.day,
        isUnlimited: pkg.is_unlimited,
        voice: pkg.voice,
        text: pkg.text,
        price: {
          value: pkg.price.value,
          currency: pkg.price.currency,
        },
        netPrice: {
          value: pkg.net_price.value,
          currency: pkg.net_price.currency,
        },
        prices: {
          netPrice: {
            value: pkg.prices.net_price.value,
            currency: pkg.prices.net_price.currency,
          },
          recommendedRetailPrice: {
            value: pkg.prices.recommended_retail_price.value,
            currency: pkg.prices.recommended_retail_price.currency,
          },
        },
        qrInstallation: pkg.qr_installation,
        manualInstallation: pkg.manual_installation,
        isFairUsagePolicy: pkg.is_fair_usage_policy,
        fairUsagePolicy: pkg.fair_usage_policy,
      })) || [],
      coverages: operator.coverages?.map((coverage: any) => ({
        networks: coverage.networks?.map((network: any) => ({
          name: network.name,
          type: network.type,
        })) || [],
      })) || [],
      apn: operator.apn ? {
        name: operator.apn.name,
        username: operator.apn.username,
        password: operator.apn.password,
        ios: operator.apn.ios ? {
          name: operator.apn.ios.name,
          username: operator.apn.ios.username,
          password: operator.apn.ios.password,
        } : null,
      } : null,
    })) || [],
  };
};

/**
 * Transform compatible devices response
 */
const transformCompatibleDevices = (data: any) => {
  return {
    data: data.data?.map((device: any) => ({
      manufacturer: device.manufacturer,
      model: device.model,
      esimSupport: device.esim_support || true, // Assume true if not specified
    })) || [],
  };
};

export const airHaloResolvers = {
  Query: {
    /**
     * Get AirHalo packages with filtering
     */
    airHaloPackages: async (
      _: any,
      { filter }: { filter?: AirHaloPackageFilter },
      context: Context
    ) => {
      try {
        logger.info('Fetching AirHalo packages', { filter });

        if (!context.services.airHaloClient) {
          throw new GraphQLError('AirHalo client not configured', {
            extensions: { code: 'SERVICE_UNAVAILABLE' }
          });
        }

        // Transform GraphQL filter to AirHalo API filter
        const airHaloFilter = {
          limit: filter?.limit,
          page: filter?.page,
          type: filter?.type?.toLowerCase() as 'local' | 'regional' | 'global' | undefined,
          countries: filter?.countries,
        };

        const response = await context.services.airHaloClient.getPackages(airHaloFilter);

        return {
          data: response.data?.map(transformAirHaloPackageData) || [],
          links: response.links ? {
            first: response.links.first,
            last: response.links.last,
            prev: response.links.prev,
            next: response.links.next,
          } : null,
          meta: response.meta ? {
            currentPage: response.meta.current_page,
            from: response.meta.from,
            lastPage: response.meta.last_page,
            path: response.meta.path,
            perPage: response.meta.per_page,
            to: response.meta.to,
            total: response.meta.total,
          } : null,
        };
      } catch (error) {
        logger.error('Failed to fetch AirHalo packages', error);
        throw new GraphQLError('Failed to fetch AirHalo packages', {
          extensions: { code: 'EXTERNAL_API_ERROR' }
        });
      }
    },

    /**
     * Get AirHalo compatible devices
     */
    airHaloCompatibleDevices: async (
      _: any,
      __: any,
      context: Context
    ) => {
      try {
        logger.info('Fetching AirHalo compatible devices');

        if (!context.services.airHaloClient) {
          throw new GraphQLError('AirHalo client not configured', {
            extensions: { code: 'SERVICE_UNAVAILABLE' }
          });
        }

        const response = await context.services.airHaloClient.getCompatibleDevices();
        return transformCompatibleDevices(response);
      } catch (error) {
        logger.error('Failed to fetch AirHalo compatible devices', error);
        throw new GraphQLError('Failed to fetch AirHalo compatible devices', {
          extensions: { code: 'EXTERNAL_API_ERROR' }
        });
      }
    },

    /**
     * Compare AirHalo packages for a specific country
     */
    compareAirHaloPackages: async (
      _: any,
      { countryCode }: { countryCode: string },
      context: Context
    ) => {
      try {
        logger.info('Comparing AirHalo packages for country', { countryCode });

        if (!context.services.airHaloClient) {
          throw new GraphQLError('AirHalo client not configured', {
            extensions: { code: 'SERVICE_UNAVAILABLE' }
          });
        }

        const response = await context.services.airHaloClient.getPackages({
          type: 'local',
          countries: [countryCode],
          limit: 50, // Get more packages for comparison
        });

        return response.data?.map(transformAirHaloPackageData) || [];
      } catch (error) {
        logger.error('Failed to compare AirHalo packages', error);
        throw new GraphQLError('Failed to compare AirHalo packages', {
          extensions: { code: 'EXTERNAL_API_ERROR' }
        });
      }
    },

    /**
     * Get pricing data for specific packages
     */
    airHaloPricingData: async (
      _: any,
      { packageIds }: { packageIds: string[] },
      context: Context
    ) => {
      try {
        logger.info('Fetching AirHalo pricing data', { packageIds });

        if (!context.services.airHaloClient) {
          throw new GraphQLError('AirHalo client not configured', {
            extensions: { code: 'SERVICE_UNAVAILABLE' }
          });
        }

        // Get all packages and filter by IDs
        // This is a simplified implementation - in production, you might want
        // to make individual API calls or use a batch endpoint if available
        const response = await context.services.airHaloClient.getPackages({
          limit: 1000, // Get a large set to search through
        });

        const packages: any[] = [];
        response.data?.forEach(packageData => {
          packageData.operators?.forEach((operator: any) => {
            operator.packages?.forEach((pkg: any) => {
              if (packageIds.includes(pkg.id)) {
                packages.push({
                  id: pkg.id,
                  type: pkg.type,
                  title: pkg.title,
                  shortInfo: pkg.short_info,
                  data: pkg.data,
                  amount: pkg.amount,
                  day: pkg.day,
                  isUnlimited: pkg.is_unlimited,
                  voice: pkg.voice,
                  text: pkg.text,
                  price: {
                    value: pkg.price.value,
                    currency: pkg.price.currency,
                  },
                  netPrice: {
                    value: pkg.net_price.value,
                    currency: pkg.net_price.currency,
                  },
                  prices: {
                    netPrice: {
                      value: pkg.prices.net_price.value,
                      currency: pkg.prices.net_price.currency,
                    },
                    recommendedRetailPrice: {
                      value: pkg.prices.recommended_retail_price.value,
                      currency: pkg.prices.recommended_retail_price.currency,
                    },
                  },
                  qrInstallation: pkg.qr_installation,
                  manualInstallation: pkg.manual_installation,
                  isFairUsagePolicy: pkg.is_fair_usage_policy,
                  fairUsagePolicy: pkg.fair_usage_policy,
                });
              }
            });
          });
        });

        return packages;
      } catch (error) {
        logger.error('Failed to fetch AirHalo pricing data', error);
        throw new GraphQLError('Failed to fetch AirHalo pricing data', {
          extensions: { code: 'EXTERNAL_API_ERROR' }
        });
      }
    },
  },
};