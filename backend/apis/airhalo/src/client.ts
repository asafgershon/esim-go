/* eslint-disable */
import { Configuration } from './generated/configuration';
import { 
  RESTAPIEndpointsBrowsePackagesApi,
  RESTAPIEndpointsAuthenticateApi,
  RESTAPIEndpointsPlaceOrderApi,
  RESTAPIEndpointsManageOrdersESIMsApi,
  type RESTAPIEndpointsAuthenticateApiV2TokenPostRequest,
  type RESTAPIEndpointsBrowsePackagesApiV2PackagesGetRequest,
  type RESTAPIEndpointsBrowsePackagesApiV2CompatibleDevicesGetRequest,
  type RESTAPIEndpointsPlaceOrderApiV2OrdersPostRequest
} from './generated/api';
import type {
  V2PackagesGet200Response,
  V2TokenPost200Response,
  V2OrdersPost200Response,
  V2OrdersGet200Response
} from './generated/models';

export interface AirHaloClientConfig {
  baseUrl?: string;
  clientId: string;
  clientSecret: string;
  timeout?: number;
}

export interface AirHaloPackageFilter {
  limit?: number;
  page?: number;
  type?: 'local' | 'regional' | 'global';
  countries?: string[];
  region?: string;
}

export interface AirHaloPackageSearchCriteria {
  // Basic filters
  limit?: number;
  page?: number;
  
  // Geographic filters
  countries?: string[];
  regions?: string[];
  type?: 'local' | 'regional' | 'global';
  
  // Duration filters (in days)
  minDuration?: number;
  maxDuration?: number;
  exactDuration?: number;
  
  // Data amount filters
  minDataAmount?: number; // in MB
  maxDataAmount?: number; // in MB
  isUnlimited?: boolean;
  
  // Price filters
  minPrice?: number;
  maxPrice?: number;
  currency?: string;
  
  // Additional filters
  sortBy?: 'price' | 'data' | 'duration' | 'popularity';
  sortDirection?: 'asc' | 'desc';
}

export interface EnhancedPackageInfo {
  id: string;
  title: string;
  slug: string;
  countries: string[];
  regions: string[];
  type: 'local' | 'regional' | 'global';
  operators: Array<{
    id: string;
    title: string;
    countries: string[];
    packages: Array<{
      id: string;
      amount: number;
      day: number;
      price: number;
      currency: string;
      is_unlimited: boolean;
      pricePerGB?: number;
      durationCategory: 'short' | 'medium' | 'long';
    }>;
  }>;
}

export class AirHaloClient {
  private configuration: Configuration;
  private packagesApi: RESTAPIEndpointsBrowsePackagesApi;
  private authApi: RESTAPIEndpointsAuthenticateApi;
  private ordersApi: RESTAPIEndpointsPlaceOrderApi;
  private manageOrdersApi: RESTAPIEndpointsManageOrdersESIMsApi;
  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;
  private clientId: string;
  private clientSecret: string;

  constructor(config: AirHaloClientConfig) {
    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret;
    
    this.configuration = new Configuration({
      basePath: config.baseUrl || 'https://api.airalo.com',
      baseOptions: {
        timeout: config.timeout || 30000,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      }
    });

    this.packagesApi = new RESTAPIEndpointsBrowsePackagesApi(this.configuration);
    this.authApi = new RESTAPIEndpointsAuthenticateApi(this.configuration);
    this.ordersApi = new RESTAPIEndpointsPlaceOrderApi(this.configuration);
    this.manageOrdersApi = new RESTAPIEndpointsManageOrdersESIMsApi(this.configuration);
  }

  /**
   * Authenticate with AirHalo API and get access token
   */
  private async authenticate(): Promise<string> {
    if (this.accessToken && this.tokenExpiry && new Date() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      const requestParams: RESTAPIEndpointsAuthenticateApiV2TokenPostRequest = {
        accept: 'application/json',
        clientId: this.clientId,
        clientSecret: this.clientSecret,
        grantType: 'client_credentials'
      };

      const response = await this.authApi.v2TokenPost(requestParams);
      const tokenData = response.data as V2TokenPost200Response;
      this.accessToken = tokenData.data.access_token;
      
      // Set token expiry (subtract 5 minutes for safety)
      const expiresIn = tokenData.data.expires_in * 1000; // Convert to milliseconds
      this.tokenExpiry = new Date(Date.now() + expiresIn - 300000); // -5 minutes

      return this.accessToken;
    } catch (error) {
      throw new Error(`AirHalo authentication failed: ${error}`);
    }
  }

  /**
   * Get packages/bundles from AirHalo
   */
  async getPackages(filter?: AirHaloPackageFilter): Promise<V2PackagesGet200Response> {
    const token = await this.authenticate();
    
    try {
      const requestParams: RESTAPIEndpointsBrowsePackagesApiV2PackagesGetRequest = {
        accept: 'application/json',
        authorization: `Bearer ${token}`,
        filterType: filter?.type,
        filterCountry: filter?.countries?.join(','),
        limit: filter?.limit?.toString(),
        page: filter?.page?.toString(),
        include: undefined
      };

      const response = await this.packagesApi.v2PackagesGet(requestParams);
      return response.data as V2PackagesGet200Response;
    } catch (error) {
      throw new Error(`Failed to fetch AirHalo packages: ${error}`);
    }
  }

  /**
   * Get compatible devices
   */
  async getCompatibleDevices() {
    const token = await this.authenticate();
    
    try {
      const requestParams: RESTAPIEndpointsBrowsePackagesApiV2CompatibleDevicesGetRequest = {
        accept: 'application/json',
        authorization: `Bearer ${token}`
      };

      const response = await this.packagesApi.v2CompatibleDevicesGet(requestParams);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch compatible devices: ${error}`);
    }
  }

  /**
   * Place an order for a package
   */
  async placeOrder(packageId: string, quantity: number = 1, customData?: Record<string, any>): Promise<V2OrdersPost200Response> {
    const token = await this.authenticate();
    
    try {
      const requestParams: RESTAPIEndpointsPlaceOrderApiV2OrdersPostRequest = {
        accept: 'application/json',
        authorization: `Bearer ${token}`,
        quantity: quantity.toString(),
        packageId: packageId,
        type: 'sim',
        description: customData?.description || '',
        brandSettingsName: customData?.brandSettingsName || '',
        toEmail: customData?.toEmail || '',
        sharingOption: customData?.sharingOption || '',
        copyAddress: customData?.copyAddress || ''
      };

      const response = await this.ordersApi.v2OrdersPost(requestParams);
      return response.data as V2OrdersPost200Response;
    } catch (error) {
      throw new Error(`Failed to place AirHalo order: ${error}`);
    }
  }

  /**
   * Get orders from AirHalo
   */
  async getOrders(limit?: number, page?: number): Promise<V2OrdersGet200Response> {
    const token = await this.authenticate();
    
    try {
      const requestParams = {
        accept: 'application/json',
        authorization: `Bearer ${token}`,
        limit: limit?.toString(),
        page: page?.toString()
      };

      const response = await this.manageOrdersApi.v2OrdersGet(requestParams);
      return response.data as V2OrdersGet200Response;
    } catch (error) {
      throw new Error(`Failed to fetch AirHalo orders: ${error}`);
    }
  }

  /**
   * Get order details by ID
   */
  async getOrderById(orderId: string): Promise<any> {
    const token = await this.authenticate();
    
    try {
      const requestParams = {
        accept: 'application/json',
        authorization: `Bearer ${token}`,
        orderId: orderId
      };

      const response = await this.manageOrdersApi.v2OrdersOrderIdGet(requestParams);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch AirHalo order ${orderId}: ${error}`);
    }
  }

  /**
   * Enhanced search packages with comprehensive filtering
   */
  async searchPackages(criteria: AirHaloPackageSearchCriteria): Promise<EnhancedPackageInfo[]> {
    const token = await this.authenticate();
    
    try {
      // Build base request parameters
      const requestParams: RESTAPIEndpointsBrowsePackagesApiV2PackagesGetRequest = {
        accept: 'application/json',
        authorization: `Bearer ${token}`,
        limit: criteria.limit?.toString() || '50',
        page: criteria.page?.toString() || '1',
        filterType: criteria.type,
        filterCountry: criteria.countries?.join(','),
        include: undefined
      };

      // For regions, we'll need to do client-side filtering as the API may not support direct region filtering
      const response = await this.packagesApi.v2PackagesGet(requestParams);
      const rawPackages = (response.data as V2PackagesGet200Response).data || [];

      // Transform and filter packages
      let enhancedPackages = this.transformPackages(rawPackages);

      // Apply client-side filters
      enhancedPackages = this.applyClientSideFilters(enhancedPackages, criteria);

      // Apply sorting
      if (criteria.sortBy) {
        enhancedPackages = this.sortPackages(enhancedPackages, criteria.sortBy, criteria.sortDirection);
      }

      return enhancedPackages;
    } catch (error) {
      throw new Error(`Failed to search AirHalo packages: ${error}`);
    }
  }

  /**
   * Transform raw API packages into enhanced format
   */
  private transformPackages(rawPackages: any[]): EnhancedPackageInfo[] {
    return rawPackages.map(pkg => {
      const countries = pkg.operators?.flatMap((op: any) => 
        op.countries?.map((c: any) => c.iso) || []
      ) || [];

      const regions = [...new Set(pkg.operators?.flatMap((op: any) => 
        op.countries?.map((c: any) => c.region).filter((r: any) => r) || []
      ) || [])].filter((r): r is string => typeof r === 'string');

      const operators = pkg.operators?.map((op: any) => ({
        id: op.id,
        title: op.title,
        countries: op.countries?.map((c: any) => c.iso) || [],
        packages: op.packages?.map((p: any) => {
          const isUnlimited = p.amount === null || p.amount === 0 || p.is_unlimited;
          const pricePerGB = !isUnlimited && p.amount ? (p.price / (p.amount / 1024)) : undefined;
          
          let durationCategory: 'short' | 'medium' | 'long' = 'medium';
          if (p.day <= 7) durationCategory = 'short';
          else if (p.day >= 30) durationCategory = 'long';

          return {
            id: p.id,
            amount: p.amount || 0,
            day: p.day,
            price: p.price,
            currency: p.currency || 'USD',
            is_unlimited: isUnlimited,
            pricePerGB,
            durationCategory
          };
        }) || []
      })) || [];

      return {
        id: pkg.id,
        title: pkg.title,
        slug: pkg.slug,
        countries,
        regions,
        type: pkg.type || 'local',
        operators
      };
    });
  }

  /**
   * Apply client-side filters to packages
   */
  private applyClientSideFilters(packages: EnhancedPackageInfo[], criteria: AirHaloPackageSearchCriteria): EnhancedPackageInfo[] {
    return packages.filter(pkg => {
      // Region filter
      if (criteria.regions?.length) {
        const hasMatchingRegion = criteria.regions.some(region => 
          pkg.regions.some(pkgRegion => 
            pkgRegion.toLowerCase().includes(region.toLowerCase())
          )
        );
        if (!hasMatchingRegion) return false;
      }

      // Filter operators and packages based on criteria
      const filteredOperators = pkg.operators.map(operator => ({
        ...operator,
        packages: operator.packages.filter(p => {
          // Duration filters
          if (criteria.exactDuration && p.day !== criteria.exactDuration) return false;
          if (criteria.minDuration && p.day < criteria.minDuration) return false;
          if (criteria.maxDuration && p.day > criteria.maxDuration) return false;

          // Data amount filters
          if (criteria.isUnlimited !== undefined) {
            if (criteria.isUnlimited && !p.is_unlimited) return false;
            if (!criteria.isUnlimited && p.is_unlimited) return false;
          }
          
          if (!p.is_unlimited) {
            if (criteria.minDataAmount && p.amount < criteria.minDataAmount) return false;
            if (criteria.maxDataAmount && p.amount > criteria.maxDataAmount) return false;
          }

          // Price filters
          if (criteria.minPrice && p.price < criteria.minPrice) return false;
          if (criteria.maxPrice && p.price > criteria.maxPrice) return false;
          if (criteria.currency && p.currency !== criteria.currency) return false;

          return true;
        })
      })).filter(operator => operator.packages.length > 0);

      // Only include packages that have at least one matching operator/package
      if (filteredOperators.length === 0) return false;

      return {
        ...pkg,
        operators: filteredOperators
      };
    }).map(pkg => ({
      ...pkg,
      operators: pkg.operators.map(operator => ({
        ...operator,
        packages: operator.packages.filter(p => {
          // Re-apply filters after transformation
          if (criteria.exactDuration && p.day !== criteria.exactDuration) return false;
          if (criteria.minDuration && p.day < criteria.minDuration) return false;
          if (criteria.maxDuration && p.day > criteria.maxDuration) return false;
          if (criteria.isUnlimited !== undefined) {
            if (criteria.isUnlimited && !p.is_unlimited) return false;
            if (!criteria.isUnlimited && p.is_unlimited) return false;
          }
          if (!p.is_unlimited) {
            if (criteria.minDataAmount && p.amount < criteria.minDataAmount) return false;
            if (criteria.maxDataAmount && p.amount > criteria.maxDataAmount) return false;
          }
          if (criteria.minPrice && p.price < criteria.minPrice) return false;
          if (criteria.maxPrice && p.price > criteria.maxPrice) return false;
          if (criteria.currency && p.currency !== criteria.currency) return false;
          return true;
        })
      })).filter(operator => operator.packages.length > 0)
    })).filter(pkg => pkg.operators.length > 0);
  }

  /**
   * Sort packages based on criteria
   */
  private sortPackages(packages: EnhancedPackageInfo[], sortBy: string, direction: 'asc' | 'desc' = 'asc'): EnhancedPackageInfo[] {
    const multiplier = direction === 'desc' ? -1 : 1;

    return packages.sort((a, b) => {
      switch (sortBy) {
        case 'price':
          const minPriceA = Math.min(...a.operators.flatMap(op => op.packages.map(p => p.price)));
          const minPriceB = Math.min(...b.operators.flatMap(op => op.packages.map(p => p.price)));
          return (minPriceA - minPriceB) * multiplier;

        case 'data':
          const maxDataA = Math.max(...a.operators.flatMap(op => op.packages.map(p => p.is_unlimited ? Infinity : p.amount)));
          const maxDataB = Math.max(...b.operators.flatMap(op => op.packages.map(p => p.is_unlimited ? Infinity : p.amount)));
          return (maxDataA - maxDataB) * multiplier;

        case 'duration':
          const maxDurationA = Math.max(...a.operators.flatMap(op => op.packages.map(p => p.day)));
          const maxDurationB = Math.max(...b.operators.flatMap(op => op.packages.map(p => p.day)));
          return (maxDurationA - maxDurationB) * multiplier;

        case 'popularity':
          // Sort by number of countries covered (more countries = more popular)
          return (a.countries.length - b.countries.length) * multiplier;

        default:
          return 0;
      }
    });
  }

  /**
   * Find packages similar to a given package specification
   */
  async findSimilarPackages(targetSpec: {
    countries?: string[];
    duration?: number;
    dataAmount?: number;
    isUnlimited?: boolean;
    maxPriceDifference?: number;
  }): Promise<EnhancedPackageInfo[]> {
    const searchCriteria: AirHaloPackageSearchCriteria = {
      countries: targetSpec.countries,
      isUnlimited: targetSpec.isUnlimited,
      limit: 100 // Get more results for similarity matching
    };

    // Add duration range (±3 days)
    if (targetSpec.duration) {
      searchCriteria.minDuration = Math.max(1, targetSpec.duration - 3);
      searchCriteria.maxDuration = targetSpec.duration + 3;
    }

    // Add data amount range (±20%)
    if (targetSpec.dataAmount && !targetSpec.isUnlimited) {
      const margin = targetSpec.dataAmount * 0.2;
      searchCriteria.minDataAmount = Math.max(0, targetSpec.dataAmount - margin);
      searchCriteria.maxDataAmount = targetSpec.dataAmount + margin;
    }

    const allPackages = await this.searchPackages(searchCriteria);

    // Score packages by similarity
    const scoredPackages = allPackages.map(pkg => {
      let score = 0;
      
      // Country match bonus
      if (targetSpec.countries?.length) {
        const matchingCountries = pkg.countries.filter(c => targetSpec.countries!.includes(c));
        score += (matchingCountries.length / targetSpec.countries.length) * 100;
      }

      // Duration similarity
      if (targetSpec.duration) {
        pkg.operators.forEach(op => {
          op.packages.forEach(p => {
            const durationDiff = Math.abs(p.day - targetSpec.duration!);
            score += Math.max(0, 20 - durationDiff); // Max 20 points for exact match
          });
        });
      }

      // Data amount similarity
      if (targetSpec.dataAmount && !targetSpec.isUnlimited) {
        pkg.operators.forEach(op => {
          op.packages.forEach(p => {
            if (!p.is_unlimited) {
              const dataDiff = Math.abs(p.amount - targetSpec.dataAmount!);
              const percentDiff = dataDiff / targetSpec.dataAmount!;
              score += Math.max(0, 30 * (1 - percentDiff)); // Max 30 points for exact match
            }
          });
        });
      }

      return { package: pkg, score };
    });

    // Sort by score and return top matches
    return scoredPackages
      .sort((a, b) => b.score - a.score)
      .slice(0, 20) // Return top 20 similar packages
      .map(item => item.package);
  }
}