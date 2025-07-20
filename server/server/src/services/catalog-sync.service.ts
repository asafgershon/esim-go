import { CatalogueDataSource } from '../datasources/esim-go/catalogue-datasource';
import { ESIMGoDataPlan } from '../datasources/esim-go/types';
import { cleanEnv, str } from "envalid";
import { createDistributedLock, LockResult } from '../lib/distributed-lock';
import { CacheHealthService } from './cache-health.service';

const env = cleanEnv(process.env, {
  ESIM_GO_API_KEY: str({ desc: "The API key for the eSIM Go API" }),
});

export class CatalogSyncService {
  private catalogueDataSource: CatalogueDataSource;
  private syncInterval: NodeJS.Timeout | null = null;
  private syncLock = createDistributedLock('catalog-sync');
  private cacheHealth: CacheHealthService;
  
  // Bundle groups as recommended by Jason from eSIM Go support
  private readonly BUNDLE_GROUPS = [
    'Standard Fixed',
    'Standard - Unlimited Lite', 
    'Standard - Unlimited Essential',
    'Standard - Unlimited Plus',
    'Regional Bundles',
  ];

  constructor(catalogueDataSource: CatalogueDataSource) {
    this.catalogueDataSource = catalogueDataSource;
    this.cacheHealth = new CacheHealthService(catalogueDataSource.cache);
  }

  /**
   * Sync bundles for a specific country
   */
  async syncCountryBundles(countryId: string): Promise<void> {
    console.log(`🔄 Starting country sync for ${countryId}...`);
    const startTime = Date.now();
    
    try {
      const allBundles: ESIMGoDataPlan[] = [];
      let page = 1;
      let hasMore = true;
      
      while (hasMore) {
        try {
          console.log(`📄 Fetching ${countryId} page ${page}...`);
          
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
            console.log(`📄 ${countryId} page ${page} is empty, stopping sync`);
            break;
          }
          
          allBundles.push(...response.bundles);
          console.log(`📄 ${countryId} page ${page}: ${response.bundles.length} bundles, durations: ${[...new Set(response.bundles.map(b => b.duration))]}`);
          
          // Stop if we got less than a full page (indicates last page)
          hasMore = response.bundles.length === 100;
          page++;
          
          // Safety limit to prevent infinite loops
          if (page > 10) {
            console.log(`⚠️ ${countryId} reached page limit (10), stopping sync`);
            break;
          }
          
        } catch (error) {
          console.error(`❌ Error fetching ${countryId} page ${page}:`, error);
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
          { ttl: 3600 } // 1 hour TTL
        ),
        3, // max retries
        1000 // base delay
      );
      
      if (!cacheResult.success) {
        console.warn(`⚠️ Failed to cache country ${countryId} data:`, cacheResult.error?.message);
      }
      
      const duration = Date.now() - startTime;
      const durations = [...new Set(allBundles.map(b => b.duration))];
      
      console.log(`✅ Country ${countryId} sync completed in ${duration}ms`);
      console.log(`📊 Synced ${allBundles.length} bundles across ${page - 1} pages`);
      console.log(`📊 Available durations: ${durations.sort((a, b) => a - b)}`);
      
    } catch (error) {
      console.error(`❌ Country ${countryId} sync failed:`, error);
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
        return JSON.parse(cacheResult.data);
      }
      
      if (!cacheResult.success) {
        console.warn(`⚠️ Cache get failed for country ${countryId}:`, cacheResult.error?.message);
      }
      
      return null;
    } catch (error) {
      console.error(`❌ Error getting cached catalog for ${countryId}:`, error);
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
    console.log('🔄 Starting optimized catalog sync by bundle groups...');
    
    // Acquire distributed lock to prevent race conditions
    const lockResult = await this.acquireSyncLock();
    if (!lockResult.acquired) {
      console.log(`🔒 Catalog sync already in progress: ${lockResult.error}`);
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
      
      // Implement Jason's recommendation: fetch each bundle group separately
      console.log(`📦 Implementing Jason's bundle group filtering strategy...`);
      
      // First, try the optimized bundle group approach
      let bundleGroupSuccess = false;
      
      for (const groupName of this.BUNDLE_GROUPS) {
        try {
          console.log(`📦 Syncing bundle group: ${groupName}`);
          
          const response = await this.catalogueDataSource.getWithErrorHandling<{
            bundles: ESIMGoDataPlan[];
            totalCount: number;
          }>('/v2.5/catalogue', {
            group: groupName,
            perPage: 200 // Increase to reduce API calls
          });
          
          if (response.bundles && response.bundles.length > 0) {
            console.log(`📦 ${groupName}: ${response.bundles.length} bundles`);
            
            // Store by group with 30-day TTL as Jason recommended
            const groupKey = this.getGroupKey(groupName);
            const groupCacheResult = await this.cacheHealth.retryOperation(
              () => this.cacheHealth.safeSet(groupKey, JSON.stringify(response.bundles), {
                ttl: 30 * 24 * 60 * 60 // 30 days (monthly update cycle)
              }),
              3, // max retries
              1000 // base delay
            );
            
            if (!groupCacheResult.success) {
              console.warn(`⚠️ Failed to cache bundle group ${groupName}:`, groupCacheResult.error?.message);
            }
            
            // Create indexes for this group
            await this.createIndexes(response.bundles, groupName);
            
            metadata.bundleGroups.push(groupName);
            metadata.totalBundles += response.bundles.length;
            
            bundleGroupSuccess = true;
            
            const durations = [...new Set(response.bundles.map(b => b.duration))];
            console.log(`📦 ${groupName} complete: ${response.bundles.length} bundles, durations: ${durations.sort((a, b) => a - b)}`);
          } else {
            console.log(`⚠️ ${groupName}: No bundles returned`);
          }
        } catch (error) {
          console.error(`❌ Error syncing group ${groupName}:`, error);
        }
      }
      
      // If bundle group filtering failed, fall back to multi-page approach
      if (!bundleGroupSuccess) {
        console.log(`📦 Bundle group filtering failed, falling back to multi-page approach...`);
        
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
              console.log(`📄 Page ${page} is empty, stopping`);
              break;
            }
            
            allBundles.push(...response.bundles);
            const durations = [...new Set(response.bundles.map(b => b.duration))];
            console.log(`📄 Page ${page}: ${response.bundles.length} bundles, durations: ${durations.sort((a, b) => a - b)}`);
            
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
              console.warn(`⚠️ Failed to cache fallback catalog:`, fallbackCacheResult.error?.message);
            }
            
            // Create indexes for fast lookups
            await this.createIndexes(allBundles, 'fallback');
            
            metadata.bundleGroups.push('fallback');
            metadata.totalBundles += allBundles.length;
            
            const allDurations = [...new Set(allBundles.map(b => b.duration))];
            console.log(`📦 Fallback complete: ${allBundles.length} bundles, durations: ${allDurations.sort((a, b) => a - b)}`);
          }
        } catch (error) {
          console.error(`❌ Error with fallback sync:`, error);
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
        console.warn(`⚠️ Failed to cache catalog metadata:`, metadataCacheResult.error?.message);
      }
      
      const duration = Date.now() - startTime;
      console.log(`✅ Optimized catalog sync completed in ${duration}ms`);
      console.log(`📊 Synced ${metadata.totalBundles} bundles across ${metadata.bundleGroups.length} groups`);
      console.log(`📊 Active groups: ${metadata.bundleGroups.join(', ')}`);
      
    } catch (error) {
      console.error('❌ Optimized catalog sync failed:', error);
    } finally {
      // Always release the lock, even if sync failed
      await this.releaseSyncLock(lockResult);
    }
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
        console.warn(`⚠️ Failed to cache bundle ${bundleId}:`, bundleCacheResult.error?.message);
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
        console.warn(`⚠️ Failed to cache country index for ${country}:`, countryIndexResult.error?.message);
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
        console.warn(`⚠️ Failed to cache duration index for ${duration}:`, durationIndexResult.error?.message);
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
        console.warn(`⚠️ Failed to cache combined index ${country}:${duration}:`, combinedIndexResult.error?.message);
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
        return JSON.parse(cacheResult.data);
      }
      
      if (!cacheResult.success) {
        console.warn(`⚠️ Cache get failed for full catalog:`, cacheResult.error?.message);
      }
      
      return null;
    } catch (error) {
      console.error('❌ Error getting cached catalog:', error);
      return null;
    }
  }

  /**
   * Start periodic sync (monthly as recommended by eSIM Go)
   */
  startPeriodicSync(): void {
    console.log('🔄 Starting periodic catalog sync (monthly as per eSIM Go recommendations)...');
    
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
        console.warn(`⚠️ Failed to get catalog metadata:`, cacheResult.error?.message);
        console.log('🔄 Cache metadata unavailable, performing full sync...');
        await this.syncFullCatalog();
        return;
      }
      
      if (!cacheResult.data) {
        console.log('🔄 No catalog metadata found, performing full sync...');
        await this.syncFullCatalog();
        return;
      }

      const catalogMetadata = JSON.parse(cacheResult.data);
      const lastSynced = new Date(catalogMetadata.lastSynced);
      const daysSinceSync = (Date.now() - lastSynced.getTime()) / (1000 * 60 * 60 * 24);

      if (daysSinceSync >= 30) {
        console.log(`🔄 Catalog is ${daysSinceSync.toFixed(1)} days old, performing refresh...`);
        await this.syncFullCatalog();
      } else {
        console.log(`✅ Catalog is fresh (${daysSinceSync.toFixed(1)} days old), skipping sync`);
      }
    } catch (error) {
      console.error('❌ Error checking catalog sync status:', error);
    }
  }

  /**
   * Stop periodic sync
   */
  stopPeriodicSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      console.log('🛑 Stopped periodic catalog sync');
    }
  }

  /**
   * Cleanup resources including distributed lock
   */
  async cleanup(): Promise<void> {
    this.stopPeriodicSync();
    await this.syncLock.cleanup();
    this.cacheHealth.cleanup();
    console.log('🧹 Catalog sync service cleanup completed');
  }
}