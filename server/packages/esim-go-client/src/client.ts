import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios';
import {
  CatalogueApi,
  ESIMsApi,
  OrganisationApi,
  Configuration,
  type CatalogueResponseInner,
  type BundleGroup,
  type BundleGroupList,
  type ESIMs,
  type EsimsApplyPostRequest,
  type ESIMApplyResponse,
  type ApplyBundleWithICCIDRequest,
  EsimsGetDirectionEnum,
  EsimsGetOrderByEnum,
  EsimsGetFilterByEnum,
  EsimsGetPerPageEnum,
} from './generated';
import {
  type ESimGoClientConfig,
  type ESimGoApiResponse,
  type CatalogSearchCriteria,
  ESimGoApiError,
  ESimGoRateLimitError,
  ESimGoAuthError,
} from './types';

// Simple logger interface to avoid dependency on external logger
interface SimpleLogger {
  info(message: string, data?: any): void;
  warn(message: string, data?: any): void;
  error(message: string, error?: Error, data?: any): void;
  debug(message: string, data?: any): void;
}

// Simple retry function
async function withRetry<T>(
  operation: () => Promise<T>,
  maxAttempts: number = 3,
  baseDelay: number = 1000,
  logger?: SimpleLogger
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;

      if (attempt === maxAttempts) {
        break;
      }

      // Don't retry on authentication errors
      if ((error as any).response?.status === 401) {
        logger?.warn('Authentication error, not retrying', {
          attempt,
          error: lastError.message,
        });
        break;
      }

      const delay = baseDelay * Math.pow(2, attempt - 1);
      logger?.warn('Operation failed, retrying', {
        attempt,
        maxAttempts,
        delay,
        error: lastError.message,
      });

      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  if (lastError) {
    throw lastError;
  }

  throw new Error('Retry operation completed without success or error');
}

export class ESimGoClient {
  private axiosInstance: AxiosInstance;
  private catalogueApi: CatalogueApi;
  private esimsApi: ESIMsApi;
  private organisationApi: OrganisationApi;
  private logger?: SimpleLogger;
  private config: ESimGoClientConfig;

  constructor(config: ESimGoClientConfig, logger?: SimpleLogger) {
    this.config = config;
    this.logger = logger;

    // Create axios instance with custom configuration
    const baseUrl = config.baseUrl || 'https://api.esim-go.com/v2.5';
    
    this.axiosInstance = axios.create({
      baseURL: baseUrl,
      timeout: config.timeout || 30000,
      headers: {
        'X-API-KEY': config.apiKey,
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor for debugging
    this.axiosInstance.interceptors.request.use(
      (config) => {
        // Log the full request details
        this.logger?.info('API Request', {
          method: config.method,
          url: config.url,
          fullURL: `${config.baseURL}${config.url}`,
          headers: {
            'X-API-KEY': config.headers['X-API-KEY'] ? '[REDACTED]' : undefined,
            'Content-Type': config.headers['Content-Type'],
          },
          params: config.params,
          baseURL: config.baseURL,
        });
        return config;
      },
      (error) => {
        this.logger?.error('Request error', error);
        return Promise.reject(error);
      }
    );

    // Add response interceptor for error handling
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error: any) => {
        const status = error.response?.status;
        const message = error.response?.data?.message || error.message;

        // Log error response details
        this.logger?.error('API Error Response', error, {
          status,
          url: error.config?.url,
          fullURL: error.config?.baseURL + error.config?.url,
          method: error.config?.method,
          responseData: error.response?.data,
        });

        if (status === 401) {
          throw new ESimGoAuthError(message, error.response?.data);
        } else if (status === 429) {
          const retryAfter = error.response?.headers['retry-after'];
          throw new ESimGoRateLimitError(message, retryAfter, error.response?.data);
        } else if (status >= 400) {
          throw new ESimGoApiError(message, status, error.response?.data, error);
        }

        throw error;
      }
    );

    // Initialize API clients
    const configuration = new Configuration({
      basePath: baseUrl,
      apiKey: config.apiKey,
    });

    this.catalogueApi = new CatalogueApi(configuration, undefined, this.axiosInstance);
    this.esimsApi = new ESIMsApi(configuration, undefined, this.axiosInstance);
    this.organisationApi = new OrganisationApi(configuration, undefined, this.axiosInstance);
  }

  // Enhanced catalog methods with retry logic
  async getCatalogueWithRetry(params: {
    group?: string;
    countries?: string;
    perPage?: number;
    page?: number;
  }): Promise<ESimGoApiResponse<CatalogueResponseInner[]>> {
    return withRetry(
      async () => {
        this.logger?.debug('Fetching catalogue', { params });

        const response = await this.catalogueApi.catalogueGet(params);

        // Log the raw response to understand its structure
        this.logger?.debug('Raw API response', {
          hasData: !!response.data,
          dataType: typeof response.data,
          dataKeys: response.data ? Object.keys(response.data) : [],
          sampleData: JSON.stringify(response.data).slice(0, 200),
        });

        // Handle both array response and object with bundles property
        let bundles: CatalogueResponseInner[] = [];
        if (Array.isArray(response.data)) {
          bundles = response.data;
        } else if (response.data && typeof response.data === 'object' && 'bundles' in response.data) {
          bundles = (response.data as any).bundles || [];
        }

        this.logger?.info('Catalogue fetched', {
          bundleCount: bundles.length,
          group: params.group,
          operationType: 'catalogue-fetch',
        });

        return {
          data: bundles,
          metadata: {
            requestId: this.generateRequestId(),
            timestamp: new Date().toISOString(),
            cached: false,
            source: 'api' as const,
          },
        };
      },
      this.config.retryAttempts || 3,
      1000,
      this.logger
    );
  }

  // Get organization groups for dynamic bundle filtering
  async getOrganizationGroups(): Promise<ESimGoApiResponse<BundleGroup[]>> {
    return withRetry(
      async () => {
        this.logger?.debug('Fetching organization groups');

        const response = await this.organisationApi.organisationGroupsGet();

        this.logger?.info('Organization groups fetched', {
          groupCount: response.data?.groups?.length || 0,
          operationType: 'organization-groups-fetch',
        });

        return {
          data: response.data?.groups || [],
          metadata: {
            requestId: this.generateRequestId(),
            timestamp: new Date().toISOString(),
            cached: false,
            source: 'api' as const,
          },
        };
      },
      this.config.retryAttempts || 3,
      1000,
      this.logger
    );
  }

  // Enhanced eSIM methods
  async applyBundleToEsim(request: {
    iccid: string;
    bundles: string[];
    customerReference?: string;
  }): Promise<ESimGoApiResponse<ESIMApplyResponse>> {
    return withRetry(
      async () => {
        this.logger?.debug('Applying bundle to eSIM', { 
          iccid: request.iccid,
          bundleCount: request.bundles.length
        });

        // For now, apply the first bundle only (API limitation)
        // TODO: Support applying multiple bundles by making multiple API calls
        const bundleName = request.bundles[0];
        if (!bundleName) {
          throw new ESimGoApiError('At least one bundle must be provided');
        }

        const applyRequest: ApplyBundleWithICCIDRequest = {
          iccid: request.iccid,
          name: bundleName,
        };

        const response = await this.esimsApi.esimsApplyPost({
          esimsApplyPostRequest: applyRequest
        });

        this.logger?.info('Bundle applied to eSIM', {
          iccid: request.iccid,
          bundleCount: request.bundles.length,
          operationType: 'bundle-application',
        });

        return {
          data: response.data,
          metadata: {
            requestId: this.generateRequestId(),
            timestamp: new Date().toISOString(),
            cached: false,
            source: 'api' as const,
          },
        };
      },
      this.config.retryAttempts || 3,
      1000,
      this.logger
    );
  }

  // Get eSIMs with filtering
  async getEsims(params?: {
    page?: string;
    perPage?: EsimsGetPerPageEnum;
    direction?: EsimsGetDirectionEnum;
    orderBy?: EsimsGetOrderByEnum;
    filterBy?: EsimsGetFilterByEnum;
    filter?: string;
  }): Promise<ESimGoApiResponse<ESIMs>> {
    return withRetry(
      async () => {
        this.logger?.debug('Fetching eSIMs', { params });

        const response = await this.esimsApi.esimsGet(params);

        this.logger?.info('eSIMs fetched', {
          esimCount: response.data?.esims?.length || 0,
          operationType: 'esims-fetch',
        });

        return {
          data: response.data,
          metadata: {
            requestId: this.generateRequestId(),
            timestamp: new Date().toISOString(),
            cached: false,
            source: 'api' as const,
          },
        };
      },
      this.config.retryAttempts || 3,
      1000,
      this.logger
    );
  }

  // Search catalog with enhanced filtering
  async searchCatalog(criteria: CatalogSearchCriteria): Promise<ESimGoApiResponse<CatalogueResponseInner[]>> {
    const searchParams: any = {};

    if (criteria.countries?.length) {
      searchParams.countries = criteria.countries.join(',');
    }

    if (criteria.bundleGroups?.length) {
      // Search each bundle group separately for optimal performance
      const allBundles: CatalogueResponseInner[] = [];
      
      for (const group of criteria.bundleGroups) {
        const groupResult = await this.getCatalogueWithRetry({
          group,
          perPage: 50, // Max per page to avoid 401 errors
        });
        allBundles.push(...groupResult.data);
      }

      // Apply additional filtering
      const filteredBundles = allBundles.filter(bundle => {
        if (criteria.minDuration && bundle.duration && bundle.duration < criteria.minDuration) {
          return false;
        }
        if (criteria.maxDuration && bundle.duration && bundle.duration > criteria.maxDuration) {
          return false;
        }
        if (criteria.unlimited !== undefined && bundle.unlimited !== criteria.unlimited) {
          return false;
        }
        // Add more filters as needed
        return true;
      });

      return {
        data: filteredBundles,
        metadata: {
          requestId: this.generateRequestId(),
          timestamp: new Date().toISOString(),
          cached: false,
          source: 'api' as const,
        },
      };
    }

    // Fallback to regular catalog search
    return this.getCatalogueWithRetry(searchParams);
  }

  // Utility method to generate request IDs
  private generateRequestId(): string {
    return Math.random().toString(36).substring(2, 12);
  }

  // Health check method
  async healthCheck(): Promise<boolean> {
    try {
      await this.organisationApi.organisationGet();
      return true;
    } catch (error) {
      this.logger?.error('Health check failed', error as Error);
      return false;
    }
  }
}