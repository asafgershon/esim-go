import { RESTDataSource, type DataSourceConfig } from "@apollo/datasource-rest";
import type { KeyValueCache } from "@apollo/utils.keyvaluecache";
import { cleanEnv, str } from "envalid";
import { GraphQLError } from "graphql";

const env = cleanEnv(process.env, {
  ESIM_GO_BASE_URL: str({
    desc: "The base URL for the eSIM Go API",
    default: "https://api.esim-go.com/v2.5",
  }),
  ESIM_GO_API_KEY: str({ desc: "The API key for the eSIM Go API" }),
});
/**
 * Base class for all eSIM Go API DataSources
 * Provides common functionality like authentication, error handling, and caching
 */
export abstract class ESIMGoDataSource extends RESTDataSource {
  override baseURL = env.ESIM_GO_BASE_URL;

  // Cache instance from options
  protected cache?: KeyValueCache;

  constructor(config?: DataSourceConfig) {
    super(config);
    this.cache = config?.cache;
  }

  /**
   * Add authentication header to all requests
   */
  override willSendRequest(_path: string, request: any) {
    const apiKey = env.ESIM_GO_API_KEY;
    if (!apiKey) {
      throw new GraphQLError("eSIM Go API key not configured", {
        extensions: {
          code: "CONFIGURATION_ERROR",
        },
      });
    }
    request.headers["X-API-KEY"] = apiKey;
    request.headers["Content-Type"] = "application/json";
    
    // Set timeout to prevent hanging requests
    request.timeout = 10000; // 10 seconds
  }

  /**
   * Wrapper for GET requests with error handling
   */
  protected async getWithErrorHandling<T>(
    path: string,
    params?: Record<string, any>,
    init: any = { baseURL: this.baseURL, headers: { "X-API-Key": env.ESIM_GO_API_KEY, "Content-Type": "application/json" } }
  ): Promise<T> {
    try {
      return await this.get<T>(path, {params });

    } catch (error: any) {
      console.log('error', error);
      this.handleApiError(error);
      throw error; // This line won't be reached but TypeScript needs it
    }
  }

  /**
   * Wrapper for POST requests with error handling
   */
  protected async postWithErrorHandling<T>(
    path: string,
    body?: Record<string, any>,
    init?: any
  ): Promise<T> {
    try {
      return await this.post<T>(path, { body, ...init });
    } catch (error: any) {
      this.handleApiError(error);
      throw error; // This line won't be reached but TypeScript needs it
    }
  }

  /**
   * Handle API errors consistently
   */
  private handleApiError(error: any): never {
    let errorMessage = "eSIM Go API error";
    let code = "ESIM_GO_API_ERROR";
    let httpStatus = 500;

    // Check if it's an HTTP error from the REST data source
    if (error.extensions?.response) {
      const response = error.extensions.response;
      httpStatus = response.status;

      try {
        const body = response.body;
        if (body?.message) {
          errorMessage = body.message;
        } else if (body?.error) {
          errorMessage = body.error;
        } else {
          errorMessage = `eSIM Go API error: ${response.status} ${response.statusText}`;
        }
      } catch {
        errorMessage = `eSIM Go API error: ${response.status} ${response.statusText}`;
      }

      // Map HTTP status codes to GraphQL error codes
      switch (response.status) {
        case 401:
          code = "UNAUTHORIZED";
          errorMessage = "Invalid eSIM Go API key";
          break;
        case 403:
          code = "FORBIDDEN";
          errorMessage = "Insufficient credits or permissions";
          break;
        case 404:
          code = "NOT_FOUND";
          break;
        case 429:
          code = "RATE_LIMIT_EXCEEDED";
          errorMessage = "eSIM Go API rate limit exceeded";
          break;
        case 500:
        case 502:
        case 503:
          code = "INTERNAL_SERVER_ERROR";
          errorMessage = "eSIM Go service temporarily unavailable";
          break;
      }
    } else if (error.message) {
      errorMessage = error.message;
    }

    throw new GraphQLError(errorMessage, {
      extensions: {
        code,
        httpStatus,
        originalError: error,
      },
    });
  }

  /**
   * Helper method to handle paginated responses
   */
  protected async getAllPages<T>(
    endpoint: string,
    params: Record<string, any> = {}
  ): Promise<T[]> {
    const results: T[] = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const response = await this.getWithErrorHandling<{
        data: T[];
        pagination?: {
          current_page: number;
          last_page: number;
          total: number;
        };
      }>(endpoint, {
        ...params,
        page: page.toString(),
        per_page: "100", // Max items per page
      });

      results.push(...response.data);

      if (response.pagination) {
        hasMore =
          response.pagination.current_page < response.pagination.last_page;
        page++;
      } else {
        hasMore = false;
      }
    }

    return results;
  }

  /**
   * Helper to generate cache keys
   */
  protected getCacheKey(
    prefix: string,
    params: Record<string, any> = {}
  ): string {
    const sortedParams = Object.keys(params)
      .sort()
      .map((key) => `${key}:${params[key]}`)
      .join(":");
    return `esim-go:${prefix}:${sortedParams}`;
  }
}
