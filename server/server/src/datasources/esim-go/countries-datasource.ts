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
    const queryParams: URLSearchParams = new URLSearchParams();

    if (params?.countries && params.countries.length > 0) {
      queryParams.set("countries", params.countries.join(","));
    }
    if (params?.isos && params.isos.length > 0) {
      queryParams.set("isos", params.isos.join(","));
    }

    // Always return all for countries (we don't need pagination for country list)
    queryParams.set("returnAll", "true");

    const cacheKey = this.getCacheKey("countries", queryParams);

    // Try cache first (1 hour - country data changes infrequently)
    const cached = await this.cache?.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    try {
      const response = await this.getWithErrorHandling<ESIMGoNetworkResponse>(
        "/v2.5/networks",
        queryParams
      );

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

      const countries = response.countryNetworks
        .filter((item) => Boolean(item.name))
        .map((item) => schema.parse(item));

      // Cache for 1 hour
      await this.cache?.set(cacheKey, JSON.stringify(countries));
      return countries;
    } catch (error) {
      if (error instanceof GraphQLError) {
        throw error;
      }
      throw new GraphQLError("Failed to fetch countries", {
        extensions: {
          code: "COUNTRIES_FETCH_ERROR",
          originalError: error,
        },
      });
    }
  }
}
