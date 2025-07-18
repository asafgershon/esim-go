import { CatalogueDataSource } from '../datasources/esim-go/catalogue-datasource';
import { ESIMGoDataPlan } from '../datasources/esim-go/types';
import { cleanEnv, str } from "envalid";

const env = cleanEnv(process.env, {
  ESIM_GO_API_KEY: str({ desc: "The API key for the eSIM Go API" }),
});

export class CatalogSyncService {
  private catalogueDataSource: CatalogueDataSource;
  private syncInterval: NodeJS.Timeout | null = null;
  
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
      await this.catalogueDataSource.cache?.set(
        cacheKey, 
        JSON.stringify({
          bundles: allBundles,
          totalCount: allBundles.length,
          countryId: countryId,
          syncedAt: new Date().toISOString(),
          pages: page - 1
        }), 
        { ttl: 3600 } // 1 hour TTL
      );
      
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
      const cached = await this.catalogueDataSource.cache?.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
      return null;
    } catch (error) {
      console.error(`❌ Error getting cached catalog for ${countryId}:`, error);
      return null;
    }
  }

  /**
   * Sync the complete eSIM Go catalog by fetching bundle groups
   */
  async syncFullCatalog(): Promise<void> {
    console.log('🔄 Starting optimized catalog sync by bundle groups...');
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
            await this.catalogueDataSource.cache?.set(groupKey, JSON.stringify(response.bundles), {
              ttl: 30 * 24 * 60 * 60 // 30 days (monthly update cycle)
            });
            
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
            await this.catalogueDataSource.cache?.set('esim-go:catalog:fallback', JSON.stringify(allBundles), {
              ttl: 30 * 24 * 60 * 60 // 30 days
            });
            
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
      await this.catalogueDataSource.cache?.set('esim-go:catalog:metadata', JSON.stringify(metadata), {
        ttl: 30 * 24 * 60 * 60 // 30 days
      });
      
      const duration = Date.now() - startTime;
      console.log(`✅ Optimized catalog sync completed in ${duration}ms`);
      console.log(`📊 Synced ${metadata.totalBundles} bundles across ${metadata.bundleGroups.length} groups`);
      console.log(`📊 Active groups: ${metadata.bundleGroups.join(', ')}`);
      
    } catch (error) {
      console.error('❌ Optimized catalog sync failed:', error);
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
      await this.catalogueDataSource.cache?.set(
        `esim-go:catalog:bundle:${bundleId}`,
        JSON.stringify(bundle),
        { ttl: 30 * 24 * 60 * 60 }
      );
      
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
      await this.catalogueDataSource.cache?.set(
        `esim-go:catalog:index:country:${country}`,
        JSON.stringify([...bundleIds]),
        { ttl: 30 * 24 * 60 * 60 }
      );
    }
    
    // Store duration indexes
    for (const [duration, bundleIds] of durationIndex) {
      await this.catalogueDataSource.cache?.set(
        `esim-go:catalog:index:duration:${duration}`,
        JSON.stringify([...bundleIds]),
        { ttl: 30 * 24 * 60 * 60 }
      );
    }
    
    // Store combined indexes
    for (const [key, bundleIds] of combinedIndex) {
      const [country, duration] = key.split(':');
      await this.catalogueDataSource.cache?.set(
        `esim-go:catalog:index:country:${country}:duration:${duration}`,
        JSON.stringify([...bundleIds]),
        { ttl: 30 * 24 * 60 * 60 }
      );
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
      const cached = await this.catalogueDataSource.cache?.get('esim-go:full-catalog');
      if (cached) {
        return JSON.parse(cached);
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
      const metadata = await this.catalogueDataSource.cache?.get('esim-go:catalog:metadata');
      if (!metadata) {
        console.log('🔄 No catalog metadata found, performing full sync...');
        await this.syncFullCatalog();
        return;
      }

      const catalogMetadata = JSON.parse(metadata);
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
}