import { GraphQLError } from "graphql";
import { ESIMGoDataSource } from "./esim-go-base";
import type { ESIMGoInventoryBundle, ESIMGoInventoryResponse, ESIMGoInventoryItem } from "./types";

/**
 * DataSource for eSIM Go Inventory API
 * Handles retrieving bundle inventory and availability
 */
export class InventoryDataSource extends ESIMGoDataSource {
  /**
   * Get all available bundles from inventory
   * Caches for 5 minutes as inventory changes frequently
   */
  async getAllBundles(): Promise<ESIMGoInventoryBundle[]> {
    const cacheKey = this.getCacheKey("inventory:all");

    // Try to get from cache first
    const cached = await this.cache?.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    try {
      // Fetch inventory from API
      const response = await this.getWithErrorHandling<ESIMGoInventoryResponse>(
        "/v2.5/inventory"
      );

      // Cache for 5 minutes (inventory changes more frequently than catalogue)
      await this.cache?.set(cacheKey, JSON.stringify(response.bundles), { ttl: 300 });

      return response.bundles;
    } catch (error) {
      if (error instanceof GraphQLError) {
        throw error;
      }
      throw new GraphQLError("Failed to fetch inventory", {
        extensions: {
          code: "INVENTORY_FETCH_ERROR",
          originalError: error,
        },
      });
    }
  }

  /**
   * Get bundle by name from inventory
   */
  async getBundleByName(bundleName: string): Promise<ESIMGoInventoryBundle | null> {
    const cacheKey = this.getCacheKey("inventory:bundle", { bundleName });

    // Try to get from cache first
    const cached = await this.cache?.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    try {
      const allBundles = await this.getAllBundles();
      const bundle = allBundles.find(b => b.name === bundleName) || null;

      // Cache for 5 minutes
      if (bundle) {
        await this.cache?.set(cacheKey, JSON.stringify(bundle), { ttl: 300 });
      }

      return bundle;
    } catch (error) {
      if (error instanceof GraphQLError) {
        throw error;
      }
      throw new GraphQLError(`Failed to fetch bundle: ${bundleName}`, {
        extensions: {
          code: "BUNDLE_FETCH_ERROR",
          originalError: error,
        },
      });
    }
  }

  /**
   * Get bundles filtered by country ISO code
   */
  async getBundlesByCountry(countryISO: string): Promise<ESIMGoInventoryBundle[]> {
    const cacheKey = this.getCacheKey("inventory:country", { countryISO });

    // Try to get from cache first
    const cached = await this.cache?.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    try {
      const allBundles = await this.getAllBundles();
      const countryBundles = allBundles.filter(bundle =>
        bundle.countries.some(country => country.iso === countryISO.toUpperCase())
      );

      // Cache for 5 minutes
      await this.cache?.set(cacheKey, JSON.stringify(countryBundles), { ttl: 300 });

      return countryBundles;
    } catch (error) {
      if (error instanceof GraphQLError) {
        throw error;
      }
      throw new GraphQLError(`Failed to fetch bundles for country: ${countryISO}`, {
        extensions: {
          code: "COUNTRY_BUNDLES_FETCH_ERROR",
          originalError: error,
        },
      });
    }
  }

  /**
   * Get bundles filtered by region
   */
  async getBundlesByRegion(region: string): Promise<ESIMGoInventoryBundle[]> {
    const cacheKey = this.getCacheKey("inventory:region", { region });

    // Try to get from cache first
    const cached = await this.cache?.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    try {
      const allBundles = await this.getAllBundles();
      const regionBundles = allBundles.filter(bundle =>
        bundle.countries.some(country => 
          country.region.toLowerCase() === region.toLowerCase()
        )
      );

      // Cache for 5 minutes
      await this.cache?.set(cacheKey, JSON.stringify(regionBundles), { ttl: 300 });

      return regionBundles;
    } catch (error) {
      if (error instanceof GraphQLError) {
        throw error;
      }
      throw new GraphQLError(`Failed to fetch bundles for region: ${region}`, {
        extensions: {
          code: "REGION_BUNDLES_FETCH_ERROR",
          originalError: error,
        },
      });
    }
  }

  /**
   * Get bundles filtered by duration
   */
  async getBundlesByDuration(duration: number): Promise<ESIMGoInventoryBundle[]> {
    const cacheKey = this.getCacheKey("inventory:duration", { duration });

    // Try to get from cache first
    const cached = await this.cache?.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    try {
      const allBundles = await this.getAllBundles();
      const durationBundles = allBundles.filter(bundle => bundle.duration === duration);

      // Cache for 5 minutes
      await this.cache?.set(cacheKey, JSON.stringify(durationBundles), { ttl: 300 });

      return durationBundles;
    } catch (error) {
      if (error instanceof GraphQLError) {
        throw error;
      }
      throw new GraphQLError(`Failed to fetch bundles for duration: ${duration}`, {
        extensions: {
          code: "DURATION_BUNDLES_FETCH_ERROR",
          originalError: error,
        },
      });
    }
  }

  /**
   * Get available bundles (with remaining inventory > 0)
   */
  async getAvailableBundles(): Promise<ESIMGoInventoryBundle[]> {
    const cacheKey = this.getCacheKey("inventory:available");

    // Try to get from cache first
    const cached = await this.cache?.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    try {
      const allBundles = await this.getAllBundles();
      const availableBundles = allBundles.filter(bundle =>
        bundle.available.some(item => item.remaining > 0)
      );

      // Cache for 5 minutes
      await this.cache?.set(cacheKey, JSON.stringify(availableBundles), { ttl: 300 });

      return availableBundles;
    } catch (error) {
      if (error instanceof GraphQLError) {
        throw error;
      }
      throw new GraphQLError("Failed to fetch available bundles", {
        extensions: {
          code: "AVAILABLE_BUNDLES_FETCH_ERROR",
          originalError: error,
        },
      });
    }
  }

  /**
   * Check if a specific bundle has available inventory
   */
  async isBundleAvailable(bundleName: string): Promise<boolean> {
    try {
      const bundle = await this.getBundleByName(bundleName);
      if (!bundle) return false;

      return bundle.available.some(item => item.remaining > 0);
    } catch (error) {
      console.error(`Error checking bundle availability for ${bundleName}:`, error);
      return false;
    }
  }

  /**
   * Get total remaining inventory for a bundle
   */
  async getBundleRemainingInventory(bundleName: string): Promise<number> {
    try {
      const bundle = await this.getBundleByName(bundleName);
      if (!bundle) return 0;

      return bundle.available.reduce((total, item) => total + item.remaining, 0);
    } catch (error) {
      console.error(`Error getting remaining inventory for ${bundleName}:`, error);
      return 0;
    }
  }

  /**
   * Search bundles by multiple criteria
   */
  async searchBundles(criteria: {
    country?: string;
    region?: string;
    duration?: number;
    unlimited?: boolean;
    availableOnly?: boolean;
  }): Promise<ESIMGoInventoryBundle[]> {
    const cacheKey = this.getCacheKey("inventory:search", criteria);

    // Try to get from cache first
    const cached = await this.cache?.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    try {
      let bundles = await this.getAllBundles();

      // Apply filters
      if (criteria.country) {
        bundles = bundles.filter(bundle =>
          bundle.countries.some(country => country.iso === criteria.country!.toUpperCase())
        );
      }

      if (criteria.region) {
        bundles = bundles.filter(bundle =>
          bundle.countries.some(country =>
            country.region.toLowerCase() === criteria.region!.toLowerCase()
          )
        );
      }

      if (criteria.duration !== undefined) {
        bundles = bundles.filter(bundle => bundle.duration === criteria.duration);
      }

      if (criteria.unlimited !== undefined) {
        bundles = bundles.filter(bundle => bundle.unlimited === criteria.unlimited);
      }

      if (criteria.availableOnly) {
        bundles = bundles.filter(bundle =>
          bundle.available.some(item => item.remaining > 0)
        );
      }

      // Cache for 5 minutes
      await this.cache?.set(cacheKey, JSON.stringify(bundles), { ttl: 300 });

      return bundles;
    } catch (error) {
      if (error instanceof GraphQLError) {
        throw error;
      }
      throw new GraphQLError("Failed to search bundles", {
        extensions: {
          code: "BUNDLE_SEARCH_ERROR",
          originalError: error,
        },
      });
    }
  }
} 