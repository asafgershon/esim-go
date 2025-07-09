import { ESIMGoDataSource } from './esim-go-base';
import type { 
  ESIMGoESIM,
  ESIMGoBundle,
  UpdateESIMRequest,
  ESIMListResponse,
  BundleStatusResponse
} from './types';
import { GraphQLError } from 'graphql';

/**
 * DataSource for eSIM Go eSIMs API
 * Handles managing individual eSIMs and their bundles
 */
export class ESIMsDataSource extends ESIMGoDataSource {
  /**
   * Get list of eSIMs for the organization
   */
  async getESIMs(params?: {
    status?: string;
    iccid?: string;
    customer_ref?: string;
    page?: number;
  }): Promise<ESIMGoESIM[]> {
    const queryParams: Record<string, string> = {};
    
    if (params?.status) {
      queryParams.status = params.status;
    }
    if (params?.iccid) {
      queryParams.iccid = params.iccid;
    }
    if (params?.customer_ref) {
      queryParams.customer_ref = params.customer_ref;
    }
    if (params?.page) {
      queryParams.page = params.page.toString();
    }

    return await this.getAllPages<ESIMGoESIM>('/esims', queryParams);
  }

  /**
   * Get details of a specific eSIM by ICCID
   */
  async getESIM(iccid: string): Promise<ESIMGoESIM | null> {
    const cacheKey = this.getCacheKey('esim', { iccid });
    
    // Try cache first (5 minutes - status can change)
    const cached = await this.cache?.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    try {
      const esim = await this.getWithErrorHandling<ESIMGoESIM>(
        `/esims/${iccid}`
      );

      // Cache for 5 minutes
      await this.cache?.set(cacheKey, JSON.stringify(esim), { ttl: 300 });

      return esim;
    } catch (error: any) {
      // Return null for 404s
      if (error.extensions?.httpStatus === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Update eSIM details or perform actions
   */
  async updateESIM(
    iccid: string,
    request: UpdateESIMRequest
  ): Promise<ESIMGoESIM> {
    try {
      const body: Record<string, any> = {};
      
      if (request.customerRef !== undefined) {
        body.customer_ref = request.customerRef;
      }
      if (request.action) {
        body.action = request.action;
      }

      const esim = await this.postWithErrorHandling<ESIMGoESIM>(
        `/esims/${iccid}`,
        body
      );

      // Clear cache
      const cacheKey = this.getCacheKey('esim', { iccid });
      await this.cache?.delete(cacheKey);

      return esim;
    } catch (error) {
      if (error instanceof GraphQLError) {
        throw error;
      }
      throw new GraphQLError('Failed to update eSIM', {
        extensions: {
          code: 'ESIM_UPDATE_ERROR',
          originalError: error,
        },
      });
    }
  }

  /**
   * Get bundle status for a specific eSIM
   */
  async getBundleStatus(
    iccid: string,
    bundleName: string
  ): Promise<ESIMGoBundle | null> {
    const cacheKey = this.getCacheKey('bundle', { iccid, bundleName });
    
    // Try cache first (5 minutes - usage updates frequently)
    const cached = await this.cache?.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    try {
      const response = await this.getWithErrorHandling<BundleStatusResponse>(
        `/esims/${iccid}/bundles/${bundleName}`
      );

      if (!response.success || !response.bundle) {
        throw new GraphQLError(response.error || 'Failed to get bundle status', {
          extensions: {
            code: 'BUNDLE_STATUS_FAILED',
          },
        });
      }

      // Cache for 5 minutes
      await this.cache?.set(
        cacheKey, 
        JSON.stringify(response.bundle), 
        { ttl: 300 }
      );

      return response.bundle;
    } catch (error: any) {
      // Return null for 404s
      if (error.extensions?.httpStatus === 404) {
        return null;
      }
      
      if (error instanceof GraphQLError) {
        throw error;
      }
      throw new GraphQLError('Failed to get bundle status', {
        extensions: {
          code: 'BUNDLE_STATUS_ERROR',
          originalError: error,
        },
      });
    }
  }

  /**
   * Get all bundles for a specific eSIM
   */
  async getESIMBundles(iccid: string): Promise<ESIMGoBundle[]> {
    const cacheKey = this.getCacheKey('esim:bundles', { iccid });
    
    // Try cache first
    const cached = await this.cache?.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    try {
      // First get the eSIM details which includes bundles
      const esim = await this.getESIM(iccid);
      if (!esim) {
        return [];
      }

      const bundles = esim.bundles || [];

      // Cache for 5 minutes
      await this.cache?.set(cacheKey, JSON.stringify(bundles), { ttl: 300 });

      return bundles;
    } catch (error) {
      if (error instanceof GraphQLError) {
        throw error;
      }
      throw new GraphQLError('Failed to get eSIM bundles', {
        extensions: {
          code: 'ESIM_BUNDLES_ERROR',
          originalError: error,
        },
      });
    }
  }

  /**
   * Get usage statistics for an eSIM
   */
  async getESIMUsage(iccid: string): Promise<{
    totalUsed: number;
    totalRemaining: number | null;
    activeBundles: ESIMGoBundle[];
  }> {
    const bundles = await this.getESIMBundles(iccid);
    
    let totalUsed = 0;
    let totalRemaining: number | null = null;
    const activeBundles: ESIMGoBundle[] = [];

    for (const bundle of bundles) {
      if (bundle.state === 'ACTIVE') {
        activeBundles.push(bundle);
        totalUsed += bundle.usedData || 0;
        
        // For unlimited plans, remaining data might be null
        if (bundle.remainingData !== null && bundle.remainingData !== undefined) {
          if (totalRemaining === null) {
            totalRemaining = 0;
          }
          totalRemaining += bundle.remainingData;
        }
      }
    }

    return {
      totalUsed,
      totalRemaining,
      activeBundles,
    };
  }

  /**
   * Suspend an eSIM
   */
  async suspendESIM(iccid: string): Promise<ESIMGoESIM> {
    return await this.updateESIM(iccid, { action: 'SUSPEND' });
  }

  /**
   * Restore/reactivate a suspended eSIM
   */
  async restoreESIM(iccid: string): Promise<ESIMGoESIM> {
    return await this.updateESIM(iccid, { action: 'RESTORE' });
  }

  /**
   * Cancel an eSIM
   */
  async cancelESIM(iccid: string): Promise<ESIMGoESIM> {
    return await this.updateESIM(iccid, { action: 'CANCEL' });
  }
}