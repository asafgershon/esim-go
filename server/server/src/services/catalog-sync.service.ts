import { type KeyValueCache } from "@apollo/utils.keyvaluecache";
import { cleanEnv, str } from "envalid";
import { CatalogueDataSource } from '../datasources/esim-go/catalogue-datasource';
import { type ESIMGoDataPlan } from '../datasources/esim-go/types';
import { createDistributedLock, type LockResult } from '../lib/distributed-lock';
import { createLogger, withPerformanceLogging } from '../lib/logger';

const env = cleanEnv(process.env, {
  ESIM_GO_API_KEY: str({ desc: "The API key for the eSIM Go API" }),
});

export class CatalogSyncService {
  private catalogueDataSource: CatalogueDataSource;
  private syncInterval: NodeJS.Timeout | null = null;
  private syncLock = createDistributedLock('catalog-sync');
  private cache: KeyValueCache<string>;
  private logger = createLogger({ 
    component: 'CatalogSyncService',
    operationType: 'catalog-sync'
  });
  
  /**
   * Get available bundle groups dynamically from eSIM Go organization API
   * This replaces hard-coded groups and prevents 401 errors for unavailable groups
   */
  private async getBundleGroups(): Promise<string[]> {
    try {
      const organizationGroups = await this.catalogueDataSource.getOrganizationGroups();
      const groupNames = organizationGroups.map(group => group.name);
      
      this.logger.info('✅ Retrieved dynamic bundle groups', {
        groupCount: groupNames.length,
        groups: groupNames,
        operationType: 'dynamic-bundle-groups'
      });
      
      return groupNames;
    } catch (error) {
      this.logger.error('Failed to get dynamic bundle groups', error as Error, {
        operationType: 'dynamic-bundle-groups-error'
      });
      
      // Fallback to known working group from investigation
      const fallbackGroups = ['Standard Fixed'];
      this.logger.warn('Using fallback bundle groups', { 
        fallbackGroups,
        operationType: 'bundle-groups-fallback'
      });
      
      return fallbackGroups;
    }
  }

  constructor(catalogueDataSource: CatalogueDataSource, cache: KeyValueCache<string>) {
    this.catalogueDataSource = catalogueDataSource;
    this.cache = cache;
  }

  /**
   * Sync bundles for a specific country
   */
  async syncCountryBundles(countryId: string): Promise<void> {
    this.logger.info('Starting country sync', { countryId, operationType: 'country-sync' });
    const startTime = Date.now();
    
    try {
      const allBundles: ESIMGoDataPlan[] = [];
      let page = 1;
      let hasMore = true;
      
      while (hasMore) {
        try {
          
          const response = await this.catalogueDataSource.getWithErrorHandling<{
            bundles: ESIMGoDataPlan[];
            totalCount: number;
          }>('/v2.5/catalogue', {
            perPage: 50,
            
            page: page,
            countries: countryId.toUpperCase()
          }, {
            headers: {
              'X-API-Key': env.ESIM_GO_API_KEY,
            },
          });
          
          if (response.bundles.length === 0) {
            this.logger.info('Empty page detected, stopping sync', { countryId, page, operationType: 'country-sync' });
            break;
          }
          
          allBundles.push(...response.bundles);
          
          // Stop if we got less than a full page (indicates last page)
          hasMore = response.bundles.length === 100;
          page++;
          
          // Safety limit to prevent infinite loops
          if (page > 10) {
            this.logger.warn('Reached page limit, stopping sync', { countryId, pageLimit: 10, operationType: 'country-sync' });
            break;
          }
          
        } catch (error) {
          this.logger.error('Error fetching country page', error as Error, { 
            countryId, 
            page,
            operationType: 'country-sync'
          });
          break;
        }
      }
      
      // Cache the country-specific catalog
      const cacheKey = `esim-go:country-catalog:${countryId}`;
      const cacheResult = await this.cacheHealth.retryOperation(
        () => this.cacheHealth.safeSet(
          cacheKey, 
          JSON.stringify({
            bundles: allBundles,
            totalCount: allBundles.length,
            countryId: countryId,
            syncedAt: new Date().toISOString(),
            pages: page - 1
          }), 
          { ttl: 86400 } // 1 day TTL
        ),
        3, // max retries
        1000 // base delay
      );
      
      if (!cacheResult.success) {
        this.logger.warn('Failed to cache country data', { 
          countryId, 
          error: cacheResult.error?.message,
          operationType: 'country-sync'
        });
      }
      
      const duration = Date.now() - startTime;
      const durations = [...new Set(allBundles.map(b => b.duration))];
      
      this.logger.info('Country sync completed', {
        countryId,
        duration,
        bundleCount: allBundles.length,
        pageCount: page - 1,
        durations: durations.sort((a, b) => a - b),
        operationType: 'country-sync'
      });
      
    } catch (error) {
      this.logger.error('Country sync failed', error as Error, { 
        countryId,
        operationType: 'country-sync'
      });
    }
  }

  /**
   * Get cached country catalog
   */
  async getCachedCountryBundles(countryId: string): Promise<{
    bundles: ESIMGoDataPlan[];
    totalCount: number;
    countryId: string;
    syncedAt: string;
    pages: number;
  } | null> {
    try {
      const cacheKey = `esim-go:country-catalog:${countryId}`;
      const cacheResult = await this.cacheHealth.safeGet(cacheKey);
      
      if (cacheResult.success && cacheResult.data) {
        return JSON.parse(cacheResult.data as string);
      }
      
      if (!cacheResult.success) {
        this.logger.warn('Cache get failed for country', { 
          countryId, 
          error: cacheResult.error?.message,
          operationType: 'cache-get'
        });
      }
      
      return null;
    } catch (error) {
      this.logger.error('Error getting cached catalog for country', error as Error, { 
        countryId,
        operationType: 'cache-get'
      });
      return null;
    }
  }

  /**
   * Acquire sync lock to prevent concurrent sync operations
   */
  async acquireSyncLock(): Promise<LockResult> {
    return await this.syncLock.acquire({
      timeout: 60 * 60 * 1000, // 1 hour
      retryAttempts: 3,
      retryDelay: 2000 // 2 seconds
    });
  }

  /**
   * Release sync lock
   */
  async releaseSyncLock(lockResult: LockResult): Promise<void> {
    if (lockResult.release) {
      await lockResult.release();
    }
  }

  /**
   * Sync the complete eSIM Go catalog by fetching bundle groups
   */
  async syncFullCatalog(): Promise<void> {
    return withPerformanceLogging(
      this.logger,
      'catalog-full-sync',
      async () => {
        this.logger.info('Starting optimized catalog sync by bundle groups', { operationType: 'full-catalog-sync' });
    
    // Acquire distributed lock to prevent race conditions
    const lockResult = await this.acquireSyncLock();
    if (!lockResult.acquired) {
      this.logger.warn('Catalog sync already in progress', { error: lockResult.error, operationType: 'full-catalog-sync' });
      return;
    }
    
    const startTime = Date.now();
    
    try {
      const metadata = {
        lastSynced: new Date().toISOString(),
        bundleGroups: [] as string[],
        totalBundles: 0,
        syncVersion: this.getCurrentMonthVersion()
      };
      
      // Track all bundles for data aggregation calculation
      const allSyncedBundles: ESIMGoDataPlan[] = [];
      
      // Get available bundle groups dynamically to prevent 401 errors
      const availableBundleGroups = await this.getBundleGroups();
      
      // Implement Jason's recommendation: fetch each bundle group separately
      this.logger.info('Implementing dynamic bundle group filtering strategy', { 
        bundleGroups: availableBundleGroups,
        groupCount: availableBundleGroups.length,
        operationType: 'full-catalog-sync'
      });
      
      // First, try the optimized bundle group approach
      let bundleGroupSuccess = false;
      
      for (const groupName of availableBundleGroups) {
        try {
          // Fetch all pages for this bundle group
          const allGroupBundles: ESIMGoDataPlan[] = [];
          let currentPage = 1;
          let totalPages = 1;
          
          // Fetch first page to get pagination info
          const firstPageResponse = await this.catalogueDataSource.getWithErrorHandling<{
            bundles: ESIMGoDataPlan[];
            totalCount: number;
            pageCount?: number;
            rows?: number;
            pageSize?: number;
          }>('/v2.5/catalogue', {
            group: groupName,
            perPage: 50, // Must be max of 50 otherwise returns 401
            page: currentPage
          });
          
          if (firstPageResponse.bundles && firstPageResponse.bundles.length > 0) {
            allGroupBundles.push(...firstPageResponse.bundles);
            totalPages = firstPageResponse.pageCount || 1;
            
            this.logger.info('Bundle group first page fetched', {
              groupName,
              page: currentPage,
              totalPages,
              totalRows: firstPageResponse.rows || firstPageResponse.totalCount,
              bundlesInPage: firstPageResponse.bundles.length,
              operationType: 'bundle-group-sync'
            });
            
            // Fetch remaining pages sequentially
            while (currentPage < totalPages) {
              currentPage++;
              
              // Small delay between requests to be nice to the API
              await new Promise(resolve => setTimeout(resolve, 200)); // 200ms delay
              
              try {
                const pageResponse = await this.catalogueDataSource.getWithErrorHandling<{
                  bundles: ESIMGoDataPlan[];
                  totalCount: number;
                }>('/v2.5/catalogue', {
                  group: groupName,
                  perPage: 50,
                  page: currentPage
                });
                
                if (pageResponse.bundles && pageResponse.bundles.length > 0) {
                  allGroupBundles.push(...pageResponse.bundles);
                  
                  // Log progress every 5 pages
                  if (currentPage % 5 === 0 || currentPage === totalPages) {
                    this.logger.info('Bundle group pagination progress', {
                      groupName,
                      currentPage,
                      totalPages,
                      totalBundlesSoFar: allGroupBundles.length,
                      operationType: 'bundle-group-sync'
                    });
                  }
                }
              } catch (pageError) {
                this.logger.error('Error fetching page for bundle group', pageError as Error, {
                  groupName,
                  page: currentPage,
                  operationType: 'bundle-group-sync'
                });
                // Continue with next page instead of failing entirely
              }
            }
          }
          
          if (allGroupBundles.length > 0) {
            
            // Store by group with 30-day TTL as Jason recommended
            const groupKey = this.getGroupKey(groupName);
            const groupCacheResult = await this.cacheHealth.retryOperation(
              () => this.cacheHealth.safeSet(groupKey, JSON.stringify(allGroupBundles), {
                ttl: 30 * 24 * 60 * 60 // 30 days (monthly update cycle)
              }),
              3, // max retries
              1000 // base delay
            );
            
            if (!groupCacheResult.success) {
              this.logger.warn('Failed to cache bundle group', { 
                groupName, 
                error: groupCacheResult.error?.message,
                operationType: 'bundle-group-sync'
              });
            }
            
            // Create indexes for this group
            await this.createIndexes(allGroupBundles, groupName);
            
            metadata.bundleGroups.push(groupName);
            metadata.totalBundles += allGroupBundles.length;
            
            // Add bundles to aggregation collection
            allSyncedBundles.push(...allGroupBundles);
            
            bundleGroupSuccess = true;
            
            const durations = [...new Set(allGroupBundles.map(b => b.duration))];
            this.logger.info('Bundle group sync completed', {
              groupName,
              bundleCount: allGroupBundles.length,
              totalPages: totalPages,
              durations: durations.sort((a, b) => a - b),
              operationType: 'bundle-group-sync'
            });
          } else {
            this.logger.warn('No bundles returned for group', { groupName, operationType: 'bundle-group-sync' });
          }
        } catch (error) {
          this.logger.error('Error syncing bundle group', error as Error, { 
            groupName,
            errorMessage: error.message,
            errorCode: error.code,
            httpStatus: error.response?.status,
            operationType: 'bundle-group-sync'
          });
        }
      }
      
      // If bundle group filtering failed, fall back to multi-page approach
      if (!bundleGroupSuccess) {
        this.logger.warn('Bundle group filtering failed, falling back to multi-page approach', { operationType: 'fallback-sync' });
        
        try {
          const allBundles: ESIMGoDataPlan[] = [];
          let page = 1;
          let hasMore = true;
          
          // Fetch multiple pages to get diverse bundles
          while (hasMore && page <= 5) {
            const response = await this.catalogueDataSource.getWithErrorHandling<{
              bundles: ESIMGoDataPlan[];
              totalCount: number;
            }>('/v2.5/catalogue', {
              perPage: 50,
              page: page
            });
            
            if (response.bundles.length === 0) {
              this.logger.info('Empty page detected, stopping fallback', { page, operationType: 'fallback-sync' });
              break;
            }
            
            allBundles.push(...response.bundles);
            const durations = [...new Set(response.bundles.map(b => b.duration))];
            
            hasMore = response.bundles.length === 50;
            page++;
          }
          
          if (allBundles.length > 0) {
            // Store with 30-day TTL
            const fallbackCacheResult = await this.cacheHealth.retryOperation(
              () => this.cacheHealth.safeSet('esim-go:catalog:fallback', JSON.stringify(allBundles), {
                ttl: 30 * 24 * 60 * 60 // 30 days
              }),
              3, // max retries
              1000 // base delay
            );
            
            if (!fallbackCacheResult.success) {
              this.logger.warn('Failed to cache fallback catalog', { 
                error: fallbackCacheResult.error?.message,
                operationType: 'fallback-sync'
              });
            }
            
            // Create indexes for fast lookups
            await this.createIndexes(allBundles, 'fallback');
            
            metadata.bundleGroups.push('fallback');
            metadata.totalBundles += allBundles.length;
            
            // Add fallback bundles to aggregation collection
            allSyncedBundles.push(...allBundles);
            
            const allDurations = [...new Set(allBundles.map(b => b.duration))];
            this.logger.info('Fallback sync completed', {
              bundleCount: allBundles.length,
              durations: allDurations.sort((a, b) => a - b),
              operationType: 'fallback-sync'
            });
          }
        } catch (error) {
          this.logger.error('Error with fallback sync', error as Error, { operationType: 'fallback-sync' });
        }
      }
      
      // Store metadata
      const metadataCacheResult = await this.cacheHealth.retryOperation(
        () => this.cacheHealth.safeSet('esim-go:catalog:metadata', JSON.stringify(metadata), {
          ttl: 30 * 24 * 60 * 60 // 30 days
        }),
        3, // max retries
        1000 // base delay
      );
      
      if (!metadataCacheResult.success) {
        this.logger.warn('Failed to cache catalog metadata', { 
          error: metadataCacheResult.error?.message,
          operationType: 'full-catalog-sync'
        });
      }
      
      const duration = Date.now() - startTime;
      this.logger.info('Optimized catalog sync completed', {
        duration,
        totalBundles: metadata.totalBundles,
        groupCount: metadata.bundleGroups.length,
        activeGroups: metadata.bundleGroups,
        operationType: 'full-catalog-sync'
      });
      
      // Calculate and cache bundle data aggregation
      if (allSyncedBundles.length > 0) {
        await this.calculateBundleDataAggregation(allSyncedBundles);
      } else {
        this.logger.warn('No bundles collected for data aggregation', {
          operationType: 'bundle-data-aggregation'
        });
      }
      
    } catch (error) {
      this.logger.error('Optimized catalog sync failed', error as Error, { operationType: 'full-catalog-sync' });
    } finally {
      // Always release the lock, even if sync failed
      await this.releaseSyncLock(lockResult);
    }
      },
      { bundleGroups: 'dynamic' }
    );
  }

  /**
   * Create Redis indexes for fast lookups
   */
  private async createIndexes(bundles: ESIMGoDataPlan[], groupName: string): Promise<void> {
    const countryIndex = new Map<string, Set<string>>();
    const durationIndex = new Map<number, Set<string>>();
    const combinedIndex = new Map<string, Set<string>>();
    
    for (const bundle of bundles) {
      const bundleId = bundle.name;
      
      // Store individual bundle for quick access
      const bundleCacheResult = await this.cacheHealth.retryOperation(
        () => this.cacheHealth.safeSet(
          `esim-go:catalog:bundle:${bundleId}`,
          JSON.stringify(bundle),
          { ttl: 30 * 24 * 60 * 60 }
        ),
        2, // max retries (fewer for individual bundles)
        500 // base delay
      );
      
      if (!bundleCacheResult.success) {
        this.logger.warn('Failed to cache bundle', { 
          bundleId, 
          error: bundleCacheResult.error?.message,
          operationType: 'index-creation'
        });
      }
      
      // Build country index
      for (const country of bundle.countries || []) {
        if (!countryIndex.has(country.iso)) {
          countryIndex.set(country.iso, new Set());
        }
        countryIndex.get(country.iso)!.add(bundleId);
        
        // Build combined country+duration index
        const combinedKey = `${country.iso}:${bundle.duration}`;
        if (!combinedIndex.has(combinedKey)) {
          combinedIndex.set(combinedKey, new Set());
        }
        combinedIndex.get(combinedKey)!.add(bundleId);
      }
      
      // Build duration index
      if (!durationIndex.has(bundle.duration)) {
        durationIndex.set(bundle.duration, new Set());
      }
      durationIndex.get(bundle.duration)!.add(bundleId);
    }
    
    // Store country indexes
    for (const [country, bundleIds] of countryIndex) {
      const countryIndexResult = await this.cacheHealth.retryOperation(
        () => this.cacheHealth.safeSet(
          `esim-go:catalog:index:country:${country}`,
          JSON.stringify([...bundleIds]),
          { ttl: 30 * 24 * 60 * 60 }
        ),
        2, // max retries
        500 // base delay
      );
      
      if (!countryIndexResult.success) {
        this.logger.warn('Failed to cache country index', { 
          country, 
          error: countryIndexResult.error?.message,
          operationType: 'index-creation'
        });
      }
    }
    
    // Store duration indexes
    for (const [duration, bundleIds] of durationIndex) {
      const durationIndexResult = await this.cacheHealth.retryOperation(
        () => this.cacheHealth.safeSet(
          `esim-go:catalog:index:duration:${duration}`,
          JSON.stringify([...bundleIds]),
          { ttl: 30 * 24 * 60 * 60 }
        ),
        2, // max retries
        500 // base delay
      );
      
      if (!durationIndexResult.success) {
        this.logger.warn('Failed to cache duration index', { 
          duration, 
          error: durationIndexResult.error?.message,
          operationType: 'index-creation'
        });
      }
    }
    
    // Store combined indexes
    for (const [key, bundleIds] of combinedIndex) {
      const [country, duration] = key.split(':');
      const combinedIndexResult = await this.cacheHealth.retryOperation(
        () => this.cacheHealth.safeSet(
          `esim-go:catalog:index:country:${country}:duration:${duration}`,
          JSON.stringify([...bundleIds]),
          { ttl: 30 * 24 * 60 * 60 }
        ),
        2, // max retries
        500 // base delay
      );
      
      if (!combinedIndexResult.success) {
        this.logger.warn('Failed to cache combined index', { 
          country, 
          duration: duration ? parseInt(duration) : undefined, 
          error: combinedIndexResult.error?.message,
          operationType: 'index-creation'
        });
      }
    }
  }

  /**
   * Get Redis key for bundle group
   */
  private getGroupKey(groupName: string): string {
    return `esim-go:catalog:group:${groupName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`;
  }

  /**
   * Get current month version for sync tracking
   */
  private getCurrentMonthVersion(): string {
    const now = new Date();
    return `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  /**
   * Get cached full catalog
   */
  async getCachedFullCatalog(): Promise<{
    bundles: ESIMGoDataPlan[];
    totalCount: number;
    syncedAt: string;
    pages: number;
  } | null> {
    try {
      const cacheResult = await this.cacheHealth.safeGet('esim-go:full-catalog');
      
      if (cacheResult.success && cacheResult.data) {
        return JSON.parse(cacheResult.data as string);
      }
      
      if (!cacheResult.success) {
        this.logger.warn('Cache get failed for full catalog', { 
          error: cacheResult.error?.message,
          operationType: 'cache-get'
        });
      }
      
      return null;
    } catch (error) {
      this.logger.error('Error getting cached catalog', error as Error, { operationType: 'cache-get' });
      return null;
    }
  }

  /**
   * Start periodic sync (monthly as recommended by eSIM Go)
   */
  startPeriodicSync(): void {
    this.logger.info('Starting periodic catalog sync', { 
      frequency: 'monthly',
      checkInterval: '24 hours',
      operationType: 'periodic-sync'
    });
    
    // Initial sync
    this.syncFullCatalog();
    
    // Schedule periodic sync every 24 hours to check for monthly updates
    this.syncInterval = setInterval(() => {
      this.checkAndSync();
    }, 24 * 60 * 60 * 1000); // 24 hours in milliseconds
  }

  /**
   * Check if sync is needed and perform it
   */
  private async checkAndSync(): Promise<void> {
    try {
      const cacheResult = await this.cacheHealth.safeGet('esim-go:catalog:metadata');
      
      if (!cacheResult.success) {
        this.logger.warn('Failed to get catalog metadata, performing full sync', { 
          error: cacheResult.error?.message,
          operationType: 'periodic-sync'
        });
        await this.syncFullCatalog();
        return;
      }
      
      if (!cacheResult.data) {
        this.logger.info('No catalog metadata found, performing full sync', { operationType: 'periodic-sync' });
        await this.syncFullCatalog();
        return;
      }

      const catalogMetadata = JSON.parse(cacheResult.data as string);
      const lastSynced = new Date(catalogMetadata.lastSynced);
      const daysSinceSync = (Date.now() - lastSynced.getTime()) / (1000 * 60 * 60 * 24);

      if (daysSinceSync >= 30) {
        this.logger.info('Catalog is stale, performing refresh', { 
          daysSinceSync: daysSinceSync.toFixed(1),
          operationType: 'periodic-sync'
        });
        await this.syncFullCatalog();
      } else {
      }
    } catch (error) {
      this.logger.error('Error checking catalog sync status', error as Error, { operationType: 'periodic-sync' });
    }
  }

  /**
   * Calculate and cache bundle data amount aggregation
   */
  private async calculateBundleDataAggregation(allBundles: ESIMGoDataPlan[]): Promise<void> {
    return withPerformanceLogging(
      this.logger,
      'bundle-data-aggregation',
      async () => {
        try {
          const startTime = Date.now();
          
          // Initialize counters
          const total = allBundles.length;
          let unlimited = 0;
          const dataAmountMap = new Map<number, number>();
          const durationMap = new Map<number, number>();
          const bundleGroupStatsMap = new Map<string, {
            total: number;
            unlimited: number;
            limited: number;
            totalDataAmount: number;
            limitedCount: number;
          }>();

          // Process each bundle
          for (const bundle of allBundles) {
            const isUnlimited = bundle.unlimited || bundle.dataAmount === -1 || bundle.dataAmount === 0;
            const bundleGroup = bundle.bundleGroup || 'Unknown';
            const dataAmount = bundle.dataAmount || 0;
            const duration = bundle.duration || 0;

            // Count unlimited bundles
            if (isUnlimited) {
              unlimited++;
            } else {
              // Count data amounts for limited bundles
              dataAmountMap.set(dataAmount, (dataAmountMap.get(dataAmount) || 0) + 1);
            }

            // Count durations for all bundles
            durationMap.set(duration, (durationMap.get(duration) || 0) + 1);

            // Update bundle group stats
            if (!bundleGroupStatsMap.has(bundleGroup)) {
              bundleGroupStatsMap.set(bundleGroup, {
                total: 0,
                unlimited: 0,
                limited: 0,
                totalDataAmount: 0,
                limitedCount: 0
              });
            }

            const stats = bundleGroupStatsMap.get(bundleGroup)!;
            stats.total++;
            if (isUnlimited) {
              stats.unlimited++;
            } else {
              stats.limited++;
              stats.totalDataAmount += dataAmount;
              stats.limitedCount++;
            }
          }

          // Create data amount groups (sorted by data amount)
          const byDataAmount = Array.from(dataAmountMap.entries())
            .sort(([a], [b]) => a - b)
            .map(([dataAmount, count]) => ({
              dataAmount,
              count,
              percentage: (count / total) * 100
            }));

          // Create duration groups with categories (sorted by duration)
          const byDuration = Array.from(durationMap.entries())
            .sort(([a], [b]) => a - b)
            .map(([duration, count]) => ({
              duration,
              count,
              percentage: (count / total) * 100,
              category: this.categorizeDuration(duration)
            }));

          // Create bundle group stats
          const byBundleGroup = Array.from(bundleGroupStatsMap.entries())
            .map(([bundleGroup, stats]) => ({
              bundleGroup,
              total: stats.total,
              unlimited: stats.unlimited,
              limited: stats.limited,
              averageDataAmount: stats.limitedCount > 0 ? stats.totalDataAmount / stats.limitedCount : 0
            }))
            .sort((a, b) => b.total - a.total); // Sort by total count descending

          // Create final aggregation object
          const aggregation = {
            total,
            unlimited,
            byDataAmount,
            byDuration,
            byBundleGroup,
            lastUpdated: new Date().toISOString()
          };

          // Cache the aggregation data
          const cacheKey = 'bundle-data-aggregation';
          const cacheResult = await this.cacheHealth.safeSet(
            cacheKey,
            JSON.stringify(aggregation),
            30 * 24 * 60 * 60 // 30 days TTL (aligned with catalog cache)
          );

          if (cacheResult.success) {
            const duration = Date.now() - startTime;
            this.logger.info('Bundle data aggregation calculated and cached', {
              total,
              unlimited,
              limited: total - unlimited,
              uniqueDataAmounts: byDataAmount.length,
              uniqueDurations: byDuration.length,
              bundleGroups: byBundleGroup.length,
              duration,
              operationType: 'bundle-data-aggregation'
            });
          } else {
            this.logger.error('Failed to cache bundle data aggregation', cacheResult.error, {
              operationType: 'bundle-data-aggregation'
            });
          }

        } catch (error) {
          this.logger.error('Error calculating bundle data aggregation', error as Error, {
            operationType: 'bundle-data-aggregation'
          });
          // Don't throw error to avoid failing the entire sync
        }
      }
    );
  }

  /**
   * Categorize duration into meaningful ranges for aggregation
   */
  private categorizeDuration(duration: number): string {
    if (duration <= 7) {
      return 'short';
    } else if (duration <= 30) {
      return 'medium';
    } else {
      return 'long';
    }
  }

  /**
   * Stop periodic sync
   */
  stopPeriodicSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      this.logger.info('Stopped periodic catalog sync', { operationType: 'periodic-sync' });
    }
  }

  /**
   * Cleanup resources including distributed lock
   */
  async cleanup(): Promise<void> {
    this.stopPeriodicSync();
    await this.syncLock.cleanup();
    this.cacheHealth.cleanup();
    this.logger.info('Catalog sync service cleanup completed', { operationType: 'cleanup' });
  }
}