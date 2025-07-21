import * as countriesList from "countries-list";
import { getCountryNameHebrew, regionNamesHebrew } from "./hebrew-names";
import { GraphQLError } from "graphql";
import z from "zod";
import { ESIMGoDataSource } from "./esim-go-base";
import type { ESIMGoNetworkCountry, ESIMGoNetworkResponse } from "./types";
import { createLogger } from "../../lib/logger";

/**
 * DataSource for eSIM Go Countries API
 * Handles retrieving country information from the networks endpoint
 */
export class CountriesDataSource extends ESIMGoDataSource {
  private countriesLogger = createLogger({ component: 'CountriesDataSource' });

  /**
   * Get all available countries that have eSIM coverage
   */
  async getCountries(params?: {
    countries?: string[]; // Array of country names to filter
    isos?: string[]; // Array of ISO country codes to filter§
  }): Promise<
    Pick<
      ESIMGoNetworkCountry,
      "iso" | "country" | "region" | "flag" | "hebrewName"
    >[]
  > {
    this.countriesLogger.info("🌍 getCountries called with params", params);
    
    // Always use the same cache key regardless of filters to maximize cache hits
    const cacheKey = this.getCacheKey("countries:all");
    this.countriesLogger.debug("🔑 Cache key", { cacheKey });

    this.countriesLogger.debug("🔑 Cache", { cache: this.cache });

    // Try cache first (1 hour - country data changes infrequently)
    const cached = await this.cache?.get(cacheKey);
    let allCountries;
    
    if (cached) {
      this.countriesLogger.info("✅ Cache HIT - using cached countries data");
      allCountries = JSON.parse(cached);
      this.countriesLogger.debug("📊 Cached countries count", { count: allCountries.length });
    } else {
      this.countriesLogger.info("❌ Cache MISS - fetching from API");
      
      // Fetch all countries from API (only when not cached)
      const queryParams = new URLSearchParams();
      queryParams.set("returnAll", "true");
      this.countriesLogger.debug("🔗 API call params", Object.fromEntries(queryParams.entries()));

      try {
        this.countriesLogger.info("🚀 Making API call to /v2.5/networks...");
        
        // Add aggressive timeout for countries endpoint specifically
        const response = await Promise.race([
          this.getWithErrorHandling<ESIMGoNetworkResponse>(
            "/v2.5/networks",
            Object.fromEntries(queryParams.entries())
          ),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error("Countries API timeout")), 10000)
          )
        ]) as ESIMGoNetworkResponse;

        this.countriesLogger.info("📡 API response received, checking validity...");

        // Check if the response indicates an error (e.g., access denied)
        if (!response || !response.countryNetworks || (response as any).message) {
          this.countriesLogger.error("❌ API response invalid", {
            hasResponse: !!response,
            hasCountryNetworks: !!(response && response.countryNetworks),
            message: (response as any)?.message
          });
          throw new GraphQLError("eSIM Go API access denied or invalid response", {
            extensions: {
              code: "ESIM_GO_ACCESS_DENIED",
              apiResponse: response,
            },
          });
        }

        this.countriesLogger.info("✅ API response valid, processing countries...");
        this.countriesLogger.debug("📊 Raw countries from API", { count: response.countryNetworks.length });

        const schema = z
          .object({
            name: z.string(),
          })
          .transform((data) => ({
            iso: data.name,
            country:
              countriesList.getCountryData(
                data.name as countriesList.TCountryCode
              )?.name || "",
            region:
              countriesList.getCountryData(
                data.name as countriesList.TCountryCode
              )?.continent || "",
            flag:
              countriesList.getEmojiFlag(
                data.name as countriesList.TCountryCode
              ) || "",
            hebrewName: getCountryNameHebrew(data.name) || "",
          }));

        allCountries = response.countryNetworks
          .filter((item) => Boolean(item.name))
          .map((item) => schema.parse(item));

        this.countriesLogger.info("✅ Countries processed successfully", { count: allCountries.length });

        // Cache for 1 day
        await this.cache?.set(cacheKey, JSON.stringify(allCountries), { ttl: 86400 });
        this.countriesLogger.debug("💾 Countries cached for 1 day");
      } catch (error: any) {
        this.countriesLogger.error("Countries API error", {
          message: error.message,
          code: error.code,
          type: error.constructor.name,
          stack: error.stack?.split('\n')[0]
        });
        
        // Use fallback for any API error (timeout, access denied, network issues, etc.)
        this.countriesLogger.warn("Using fallback countries data due to API error", { errorMessage: error.message });
        allCountries = this.getFallbackCountries();
        this.countriesLogger.info("🔄 Fallback countries loaded", { count: allCountries.length });
        
        // Cache fallback data for 5 minutes (shorter than real data)
        await this.cache?.set(cacheKey, JSON.stringify(allCountries), { ttl: 300 });
        this.countriesLogger.debug("💾 Fallback countries cached for 5 minutes");
      }
    }

    this.countriesLogger.info("🏁 Starting filtering process...");
    this.countriesLogger.debug("📊 Total countries before filtering", { count: allCountries.length });

    // Apply client-side filtering if parameters are provided
    let filteredCountries = allCountries;

    if (params?.countries && params.countries.length > 0) {
      this.countriesLogger.debug("🔍 Filtering by country names", { countries: params.countries });
      const countryNamesSet = new Set(params.countries.map(c => c.toLowerCase()));
      filteredCountries = filteredCountries.filter((country: any) => 
        countryNamesSet.has(country.country.toLowerCase())
      );
      this.countriesLogger.debug("📊 Countries after name filter", { count: filteredCountries.length });
    }

    if (params?.isos && params.isos.length > 0) {
      this.countriesLogger.debug("🔍 Filtering by ISO codes", { isos: params.isos });
      const isoSet = new Set(params.isos.map(iso => iso.toUpperCase()));
      filteredCountries = filteredCountries.filter((country: any) => 
        isoSet.has(country.iso.toUpperCase())
      );
      this.countriesLogger.debug("📊 Countries after ISO filter", { count: filteredCountries.length });
    }

    this.countriesLogger.info("✅ getCountries completed", { returning: filteredCountries.length });
    this.countriesLogger.debug("🌍 Final country list", { 
      countries: filteredCountries.map((c: any) => `${c.iso} - ${c.country}`)
    });

    return filteredCountries;
  }

  /**
   * Fallback countries data when API is unavailable
   */
  private getFallbackCountries() {
    // Essential countries for demo/development
    const fallbackCountryCodes = [
      'US', 'CA', 'GB', 'FR', 'DE', 'ES', 'IT', 'NL', 'JP', 'KR', 
      'AU', 'BR', 'MX', 'IN', 'CN', 'RU', 'ZA', 'EG', 'AE', 'SG'
    ];

    return fallbackCountryCodes.map(iso => {
      const countryData = countriesList.getCountryData(iso as countriesList.TCountryCode);
      return {
        iso,
        country: countryData?.name || iso,
        region: countryData?.continent || 'Unknown',
        flag: countriesList.getEmojiFlag(iso as countriesList.TCountryCode) || '🌍',
        hebrewName: getCountryNameHebrew(iso) || countryData?.name || iso,
      };
    });
  }
  
  async getCountryByCode(iso: string) {
    const countries = await this.getCountries();
    return countries.find((country: any) => country.iso === iso);
  }
}
