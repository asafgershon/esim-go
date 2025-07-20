import { RESTDataSource, type DataSourceConfig, type GetRequest } from "@apollo/datasource-rest";
import type { KeyValueCache } from "@apollo/utils.keyvaluecache";
import { cleanEnv, str } from "envalid";
import { GraphQLError } from "graphql";
import { createLogger } from "../../lib/logger";

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

  // Logger instance
  protected log = createLogger({ component: 'ESIMGoDataSource' });

  // Rate limiting properties
  private requestCount = 0;
  private lastResetTime = Date.now();
  private readonly MAX_REQUESTS_PER_MINUTE = 100;

  constructor(config?: DataSourceConfig) {
    super(config);
    this.cache = config?.cache;
  }

  /**
   * Add authentication header to all requests
   */
  override willSendRequest(_path: string, request: any) {
    // Check rate limit
    this.enforceRateLimit();
    
    const apiKey = env.ESIM_GO_API_KEY;
    if (!apiKey) {
      throw new GraphQLError("eSIM Go API key not configured", {
        extensions: {
          code: "CONFIGURATION_ERROR",
        },
      });
    }
    
    // Set headers
    request.headers["X-API-Key"] = apiKey;
    request.headers["Content-Type"] = "application/json";
    request.headers["User-Agent"] = "curl/8.7.1"; // Mimic curl user agent
    
    
    // Set timeout to prevent hanging requests
    request.timeout = 15000; // 15 seconds
    
    // Set body size limits to handle large API responses
    request.maxBodyLength = Infinity
    request.maxContentLength = 50 * 1024 * 1024; // 50MB
  }

  /**
   * Rate limiting to prevent API exhaustion
   */
  private enforceRateLimit() {
    const now = Date.now();
    const timeWindow = 60 * 1000; // 1 minute
    
    // Reset counter if time window passed
    if (now - this.lastResetTime > timeWindow) {
      this.requestCount = 0;
      this.lastResetTime = now;
    }
    
    // Check if we're over the limit
    if (this.requestCount >= this.MAX_REQUESTS_PER_MINUTE) {
      throw new GraphQLError("API rate limit exceeded", {
        extensions: {
          code: "RATE_LIMIT_EXCEEDED",
          retryAfter: Math.ceil((timeWindow - (now - this.lastResetTime)) / 1000),
        },
      });
    }
    
    this.requestCount++;
  }

  protected async get<TResult = any>(
    path: string,
    request?: GetRequest<any>,
  ): Promise<TResult> {
    // willSendRequest already sets the headers, so we don't need to duplicate them here
    return (
      await this.fetch<TResult>(path, {
        method: 'GET',
        ...request,
      })
    ).parsedBody;
  }


  /**
   * Wrapper for GET requests with error handling
   */
  async getWithErrorHandling<T>(
    path: string,
    params?: Record<string, any>,
    init: any = {}
  ): Promise<T> {
    try {
      // TEMPORARY: Use native fetch to test if Apollo is the issue
      const url = new URL(path, this.baseURL);
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          url.searchParams.append(key, String(value));
        });
      }
      
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'X-API-Key': env.ESIM_GO_API_KEY,
          'Content-Type': 'application/json',
          'User-Agent': 'curl/8.7.1',
        },
        signal: AbortSignal.timeout(15000),
      });
      
      if (!response.ok) {
        const errorBody = await response.text();
        this.log.error('Native fetch failed', undefined, {
          status: response.status,
          statusText: response.statusText,
          errorBody,
          operationType: 'api-request-fallback'
        });
        throw new Error(`${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      return result;
      
    } catch (error: any) {
      this.log.error('Native fetch error', error, { operationType: 'api-request-fallback' });
      this.log.error('eSIM Go API error', error);
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
      return await this.post<T>(path, { 
        body, 
        ...init,
        timeout: 15000, // 15 second timeout
      });
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
    params: Record<string, any> = {},
    maxPages: number = 100 // Prevent infinite loops
  ): Promise<T[]> {
    const results: T[] = [];
    let page = 1;
    let hasMore = true;

    while (hasMore && page <= maxPages) {
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

      // Safety check: if we get no data, stop pagination
      if (!response.data || response.data.length === 0) {
        break;
      }
    }

    if (page > maxPages) {
      this.log.warn(`Pagination stopped at maximum pages (${maxPages}) for endpoint: ${endpoint}`);
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
