import { ESimGoClient } from '@esim-go/client';
import { createLogger, withPerformanceLogging } from '../../lib/logger';
import { CatalogSyncServiceV2 } from '../../services/catalog-sync-v2.service';
import { BundleRepository } from '../../repositories/catalog';
import type { 
  CatalogueResponseInner, 
  InventoryResponseBundlesInner 
} from '@esim-go/client';
import type { SearchCatalogCriteria } from '../../repositories/catalog';
import { supabaseAdmin } from '../../context/supabase-auth';

/**
 * CatalogueDataSource V2 - Uses shared client and persistent storage
 * 
 * This datasource primarily reads from the persistent catalog in Supabase
 * and falls back to direct API calls only when necessary
 */
export class CatalogueDataSourceV2 {
  private client: ESimGoClient;
  private catalogSyncService: CatalogSyncServiceV2;
  private bundleRepository: BundleRepository;
  private logger = createLogger({ 
    component: 'CatalogueDataSourceV2',
    operationType: 'catalog-datasource'
  });

  constructor(apiKey: string, baseUrl?: string) {
    this.client = new ESimGoClient({
      apiKey,
      baseUrl: baseUrl || 'https://api.esim-go.com/v2.5',
      retryAttempts: 3,
      logger: this.logger,
    });
    this.catalogSyncService = new CatalogSyncServiceV2(apiKey, baseUrl);
    this.bundleRepository = new BundleRepository(supabaseAdmin);
  }

  /**
   * Search for data plans using persistent storage
   */
  async searchPlans(criteria: SearchCatalogCriteria): Promise<{
    bundles: CatalogueResponseInner[];
    totalCount: number;
  }> {
    return withPerformanceLogging(
      this.logger,
      'search-plans',
      async () => {
        this.logger.info('Searching plans from persistent storage', {
          country: criteria.country,
          duration: criteria.duration,
          bundleGroup: criteria.bundleGroup,
          dataAmount: criteria.dataAmount,
          limit: criteria.limit,
        });

        try {
          // First, try to get from persistent storage
          const result = await this.bundleRepository.searchBundles(criteria);
          
          if (result.bundles.length > 0) {
            this.logger.info('Found plans in persistent storage', {
              count: result.bundles.length,
              totalCount: result.totalCount,
            });
            return result;
          }

          // If no results and we have specific search criteria, 
          // check if we need to sync this country
          if (criteria.country && result.bundles.length === 0) {
            this.logger.warn('No bundles found for country, may need sync', {
              country: criteria.country,
            });
            
            // Optionally trigger a country sync in the background
            // Don't wait for it to complete
            this.catalogSyncService.triggerCountrySync(criteria.country).catch(error => {
              this.logger.error('Failed to trigger country sync', error, {
                country: criteria.country,
              });
            });
          }

          return result;
        } catch (error) {
          this.logger.error('Failed to search plans', error as Error, { criteria });
          throw error;
        }
      },
      { country: criteria.country, duration: criteria.duration }
    );
  }

  /**
   * Get a specific bundle by ID
   */
  async getBundleById(bundleId: string): Promise<CatalogueResponseInner | null> {
    return withPerformanceLogging(
      this.logger,
      'get-bundle-by-id',
      async () => {
        this.logger.info('Fetching bundle by ID', { bundleId });

        try {
          // Try persistent storage first
          const bundle = await this.bundleRepository.getByBundleId(bundleId);
          
          if (bundle) {
            this.logger.info('Found bundle in persistent storage', {
              bundleId,
              name: bundle.name,
              price: bundle.price,
            });
            return bundle;
          }

          // If not found, could make a direct API call if needed
          // But typically all bundles should be in the synced catalog
          this.logger.warn('Bundle not found in persistent storage', { bundleId });
          return null;
        } catch (error) {
          this.logger.error('Failed to get bundle', error as Error, { bundleId });
          throw error;
        }
      },
      { bundleId }
    );
  }

  /**
   * Get available inventory (bundles the organization has purchased)
   */
  async getInventory(): Promise<InventoryResponseBundlesInner[]> {
    return withPerformanceLogging(
      this.logger,
      'get-inventory',
      async () => {
        this.logger.info('Fetching inventory from API');

        try {
          const response = await this.client.getInventoryWithRetry();
          
          if (response.data && response.data.bundles) {
            this.logger.info('Retrieved inventory', {
              bundleCount: response.data.bundles.length,
            });
            return response.data.bundles;
          }

          return [];
        } catch (error) {
          this.logger.error('Failed to get inventory', error as Error);
          throw error;
        }
      }
    );
  }

  /**
   * Get all unique countries from the catalog
   */
  async getAvailableCountries(): Promise<string[]> {
    return withPerformanceLogging(
      this.logger,
      'get-available-countries',
      async () => {
        try {
          const countries = await this.bundleRepository.getUniqueCountries();
          
          this.logger.info('Retrieved available countries', {
            count: countries.length,
          });
          
          return countries;
        } catch (error) {
          this.logger.error('Failed to get available countries', error as Error);
          throw error;
        }
      }
    );
  }

  /**
   * Get bundle statistics grouped by country
   */
  async getBundleStatsByCountry(countryId?: string): Promise<Array<{
    country: string;
    bundleCount: number;
    durations: number[];
    priceRange: { min: number; max: number };
  }>> {
    return withPerformanceLogging(
      this.logger,
      'get-bundle-stats-by-country',
      async () => {
        try {
          const stats = await this.bundleRepository.getBundleStatsByCountry(countryId);
          
          this.logger.info('Retrieved bundle statistics', {
            countryCount: stats.length,
            specificCountry: countryId,
          });
          
          return stats;
        } catch (error) {
          this.logger.error('Failed to get bundle stats', error as Error, { countryId });
          throw error;
        }
      },
      { countryId }
    );
  }

  /**
   * Check catalog sync status
   */
  async getCatalogSyncStatus(): Promise<any> {
    return withPerformanceLogging(
      this.logger,
      'get-catalog-sync-status',
      async () => {
        try {
          const status = await this.catalogSyncService.getSyncStatus();
          
          this.logger.info('Retrieved catalog sync status', {
            lastSync: status.sync.lastSyncedAt,
            totalBundles: status.sync.totalBundles,
            activeJobs: status.activeJobs.length,
          });
          
          return status;
        } catch (error) {
          this.logger.error('Failed to get sync status', error as Error);
          throw error;
        }
      }
    );
  }

  /**
   * Trigger a manual catalog sync
   */
  async triggerCatalogSync(type: 'full' | 'country' | 'group', target?: string): Promise<any> {
    return withPerformanceLogging(
      this.logger,
      'trigger-catalog-sync',
      async () => {
        this.logger.info('Triggering catalog sync', { type, target });

        try {
          let result;
          
          switch (type) {
            case 'full':
              result = await this.catalogSyncService.triggerFullSync();
              break;
            case 'country':
              if (!target) throw new Error('Country ID required for country sync');
              result = await this.catalogSyncService.triggerCountrySync(target);
              break;
            case 'group':
              if (!target) throw new Error('Bundle group required for group sync');
              result = await this.catalogSyncService.triggerGroupSync(target);
              break;
            default:
              throw new Error(`Unknown sync type: ${type}`);
          }
          
          this.logger.info('Catalog sync triggered', {
            type,
            target,
            jobId: result.jobId,
            status: result.status,
          });
          
          return result;
        } catch (error) {
          this.logger.error('Failed to trigger sync', error as Error, { type, target });
          throw error;
        }
      },
      { type, target }
    );
  }
}