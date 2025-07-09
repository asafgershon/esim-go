import { ESIMGoDataSource } from "./esim-go-base";
import type { ESIMGoDataPlan } from "./types";

/**
 * DataSource for eSIM Go Catalogue API
 * Handles browsing and searching available data plans
 */
export class CatalogueDataSource extends ESIMGoDataSource {
  /**
   * Get all available data plans
   * Caches for 1 hour as plans don't change frequently
   */
  async getAllBundels(): Promise<ESIMGoDataPlan[]> {
    const cacheKey = this.getCacheKey("catalogue:all");

    // Try to get from cache first
    const cached = await this.cache?.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // Fetch all pages of data plans
    const plans = await this.get<{ bundles: ESIMGoDataPlan[] }>("v2.5/catalogue");

    console.log('Plans', plans);
    // Cache for 1 hour
    await this.cache?.set(cacheKey, JSON.stringify(plans), { ttl: 3600 });

    return plans.bundles;
  }

  /**
   * Get data plans filtered by region
   */
  async getPlansByRegion(region: string): Promise<ESIMGoDataPlan[]> {
    const cacheKey = this.getCacheKey("catalogue:region", { region });

    // Try to get from cache first
    const cached = await this.cache?.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // Get all plans and filter by region
    const allPlans = await this.getAllBundels();
    const regionPlans = allPlans.filter(
      (plan) =>
        plan.baseCountry.region.toLowerCase() === region.toLowerCase() ||
        plan.countries.some(
          (country) => country.region.toLowerCase() === region.toLowerCase()
        )
    );

    // Cache for 1 hour
    await this.cache?.set(cacheKey, JSON.stringify(regionPlans), { ttl: 3600 });

    return regionPlans;
  }

  /**
   * Get data plans filtered by country ISO code
   */
  async getPlansByCountry(countryISO: string): Promise<ESIMGoDataPlan[]> {
    const cacheKey = this.getCacheKey("catalogue:country", { countryISO });

    // Try to get from cache first
    const cached = await this.cache?.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // Get all plans and filter by country
    const allPlans = await this.getAllBundels();
    const countryPlans = allPlans.filter(
      (plan) =>
        plan.baseCountry.iso === countryISO.toUpperCase() ||
        plan.countries.some(
          (country) => country.iso === countryISO.toUpperCase()
        ) ||
        plan.roamingCountries.some(
          (country) => country.iso === countryISO.toUpperCase()
        )
    );

    // Cache for 1 hour
    await this.cache?.set(cacheKey, JSON.stringify(countryPlans), {
      ttl: 3600,
    });

    return countryPlans;
  }

  /**
   * Get data plans filtered by duration
   */
  async getPlansByDuration(days: number): Promise<ESIMGoDataPlan[]> {
    const cacheKey = this.getCacheKey("catalogue:duration", { days });

    // Try to get from cache first
    const cached = await this.cache?.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // Get all plans and filter by duration
    const allPlans = await this.getAllBundels();
    const durationPlans = allPlans.filter((plan) => plan.duration === days);

    // Cache for 1 hour
    await this.cache?.set(cacheKey, JSON.stringify(durationPlans), {
      ttl: 3600,
    });

    return durationPlans;
  }

  /**
   * Get a specific plan by name
   */
  async getPlanByName(name: string): Promise<ESIMGoDataPlan | null> {
    const cacheKey = this.getCacheKey("catalogue:plan", { name });

    // Try to get from cache first
    const cached = await this.cache?.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // Get all plans and find the specific one
    const allPlans = await this.getAllBundels();
    const plan = allPlans.find((p) => p.name === name) || null;

    // Cache for 1 hour
    if (plan) {
      await this.cache?.set(cacheKey, JSON.stringify(plan), { ttl: 3600 });
    }

    return plan;
  }

  /**
   * Search plans by multiple criteria
   */
  async searchPlans(criteria: {
    region?: string;
    country?: string;
    duration?: number;
    maxPrice?: number;
    bundleGroup?: string;
  }): Promise<ESIMGoDataPlan[]> {
    const cacheKey = this.getCacheKey("catalogue:search", criteria);

    // Try to get from cache first
    const cached = await this.cache?.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // Get all plans and apply filters
    let plans = await this.getAllBundels();

    if (criteria.region) {
      plans = plans.filter(
        (plan) =>
          plan.baseCountry.region.toLowerCase() ===
            criteria.region!.toLowerCase() ||
          plan.countries.some(
            (country) =>
              country.region.toLowerCase() === criteria.region!.toLowerCase()
          )
      );
    }

    if (criteria.country) {
      plans = plans.filter(
        (plan) =>
          plan.baseCountry.iso === criteria.country!.toUpperCase() ||
          plan.countries.some(
            (country) => country.iso === criteria.country!.toUpperCase()
          ) ||
          plan.roamingCountries.some(
            (country) => country.iso === criteria.country!.toUpperCase()
          )
      );
    }

    if (criteria.duration !== undefined) {
      plans = plans.filter((plan) => plan.duration === criteria.duration);
    }

    if (criteria.maxPrice !== undefined) {
      plans = plans.filter((plan) => plan.price <= criteria.maxPrice!);
    }

    if (criteria.bundleGroup) {
      plans = plans.filter((plan) => plan.bundleGroup === criteria.bundleGroup);
    }

    // Sort by price (lowest first)
    plans.sort((a, b) => a.price - b.price);

    // Cache for 1 hour
    await this.cache?.set(cacheKey, JSON.stringify(plans), { ttl: 3600 });

    return plans;
  }

  /**
   * Get featured/popular plans
   * This is a business logic method that returns curated plans
   */
  async getFeaturedPlans(): Promise<ESIMGoDataPlan[]> {
    const cacheKey = this.getCacheKey("catalogue:featured");

    // Try to get from cache first
    const cached = await this.cache?.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // Get all plans
    const allPlans = await this.getAllBundels();

    // Featured plans logic: Get popular durations (7, 30 days) from major regions
    const featuredBundles = [
      "EUROPE_UNLIMITED",
      "ASIA_UNLIMITED",
      "USA_UNLIMITED",
      "GLOBAL_UNLIMITED",
    ];

    const featuredPlans = allPlans.filter(
      (plan) =>
        featuredBundles.includes(plan.bundleGroup || '') &&
        [7, 30].includes(plan.duration)
    );

    // Sort by region popularity and duration
    featuredPlans.sort((a, b) => {
      const regionOrder = [
        "GLOBAL_UNLIMITED",
        "EUROPE_UNLIMITED",
        "USA_UNLIMITED",
        "ASIA_UNLIMITED",
      ];
      const aIndex = regionOrder.indexOf(a.bundleGroup || '');
      const bIndex = regionOrder.indexOf(b.bundleGroup || '');
      if (aIndex !== bIndex) return aIndex - bIndex;
      return a.duration - b.duration;
    });

    // Cache for 1 hour
    await this.cache?.set(cacheKey, JSON.stringify(featuredPlans), {
      ttl: 3600,
    });

    return featuredPlans;
  }
}
