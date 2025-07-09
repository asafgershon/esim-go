import * as countriesList from "countries-list";
import { getCountryNameHebrew, regionNamesHebrew } from "./hebrew-names";
import { GraphQLError } from "graphql";
import z from "zod";
import { ESIMGoDataSource } from "./esim-go-base";
import type { ESIMGoNetworkCountry, ESIMGoNetworkResponse } from "./types";

/**
 * DataSource for eSIM Go Countries API
 * Handles retrieving country information from the networks endpoint
 */
export class CountriesDataSource extends ESIMGoDataSource {
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
    // Always use the same cache key regardless of filters to maximize cache hits
    const cacheKey = this.getCacheKey("countries:all");

    // Try cache first (1 hour - country data changes infrequently)
    const cached = await this.cache?.get(cacheKey);
    let allCountries;
    
    if (cached) {
      allCountries = JSON.parse(cached);
    } else {
      // Fetch all countries from API (only when not cached)
      const queryParams = new URLSearchParams();
      queryParams.set("returnAll", "true");

      try {
        const response = await this.getWithErrorHandling<ESIMGoNetworkResponse>(
          "/v2.5/networks",
          Object.fromEntries(queryParams.entries())
        );

        // Check if the response indicates an error (e.g., access denied)
        if (!response || !response.countryNetworks || (response as any).message) {
          throw new GraphQLError("eSIM Go API access denied or invalid response", {
            extensions: {
              code: "ESIM_GO_ACCESS_DENIED",
              apiResponse: response,
            },
          });
        }

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

        // Cache for 1 hour
        await this.cache?.set(cacheKey, JSON.stringify(allCountries), { ttl: 3600 });
      } catch (error) {
        console.error("Countries API error:", error);
        
        // For development/demo purposes, return mock data if API fails
        console.warn("Using fallback countries data due to API error");
        allCountries = this.getFallbackCountries();
        
        // Cache fallback data for 5 minutes
        await this.cache?.set(cacheKey, JSON.stringify(allCountries), { ttl: 300 });
      }
    }

    // Apply client-side filtering if parameters are provided
    let filteredCountries = allCountries;

    if (params?.countries && params.countries.length > 0) {
      const countryNamesSet = new Set(params.countries.map(c => c.toLowerCase()));
      filteredCountries = filteredCountries.filter((country: any) => 
        countryNamesSet.has(country.country.toLowerCase())
      );
    }

    if (params?.isos && params.isos.length > 0) {
      const isoSet = new Set(params.isos.map(iso => iso.toUpperCase()));
      filteredCountries = filteredCountries.filter((country: any) => 
        isoSet.has(country.iso.toUpperCase())
      );
    }

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
}
