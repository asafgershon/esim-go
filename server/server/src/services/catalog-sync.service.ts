import { CatalogueDataSource } from '../datasources/esim-go/catalogue-datasource';
import { ESIMGoDataPlan } from '../datasources/esim-go/types';

export class CatalogSyncService {
  private catalogueDataSource: CatalogueDataSource;
  private syncInterval: NodeJS.Timeout | null = null;

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
            perPage: 200,
            page: page,
            countries: countryId.toUpperCase()
          });
          
          if (response.bundles.length === 0) {
            console.log(`📄 ${countryId} page ${page} is empty, stopping sync`);
            break;
          }
          
          allBundles.push(...response.bundles);
          console.log(`📄 ${countryId} page ${page}: ${response.bundles.length} bundles, durations: ${[...new Set(response.bundles.map(b => b.duration))]}`);
          
          // Stop if we got less than a full page (indicates last page)
          hasMore = response.bundles.length === 200;
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
   * Sync the complete eSIM Go catalog by fetching all pages
   */
  async syncFullCatalog(): Promise<void> {
    console.log('🔄 Starting full catalog sync...');
    const startTime = Date.now();
    
    try {
      const allBundles: ESIMGoDataPlan[] = [];
      let page = 1;
      let hasMore = true;
      
      while (hasMore) {
        try {
          console.log(`📄 Fetching catalog page ${page}...`);
          
          const response = await this.catalogueDataSource.getWithErrorHandling<{
            bundles: ESIMGoDataPlan[];
            totalCount: number;
          }>('/v2.5/catalogue', {
            perPage: 200,
            page: page
          });
          
          if (response.bundles.length === 0) {
            console.log(`📄 Page ${page} is empty, stopping sync`);
            break;
          }
          
          allBundles.push(...response.bundles);
          console.log(`📄 Page ${page}: ${response.bundles.length} bundles, durations: ${[...new Set(response.bundles.map(b => b.duration))]}`);
          
          // Stop if we got less than a full page (indicates last page)
          hasMore = response.bundles.length === 200;
          page++;
          
          // Safety limit to prevent infinite loops
          if (page > 50) {
            console.log('⚠️ Reached page limit (50), stopping sync');
            break;
          }
          
        } catch (error) {
          console.error(`❌ Error fetching page ${page}:`, error);
          break;
        }
      }
      
      // Cache the complete catalog
      const cacheKey = 'esim-go:full-catalog';
      await this.catalogueDataSource.cache?.set(
        cacheKey, 
        JSON.stringify({
          bundles: allBundles,
          totalCount: allBundles.length,
          syncedAt: new Date().toISOString(),
          pages: page - 1
        }), 
        { ttl: 7200 } // 2 hours TTL
      );
      
      const duration = Date.now() - startTime;
      const durations = [...new Set(allBundles.map(b => b.duration))];
      
      console.log(`✅ Full catalog sync completed in ${duration}ms`);
      console.log(`📊 Synced ${allBundles.length} bundles across ${page - 1} pages`);
      console.log(`📊 Available durations: ${durations.sort((a, b) => a - b)}`);
      
    } catch (error) {
      console.error('❌ Full catalog sync failed:', error);
    }
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
   * Start periodic sync (every 2 hours)
   */
  startPeriodicSync(): void {
    console.log('🔄 Starting periodic catalog sync (every 2 hours)...');
    
    // Initial sync
    this.syncFullCatalog();
    
    // Schedule periodic sync every 2 hours
    this.syncInterval = setInterval(() => {
      this.syncFullCatalog();
    }, 2 * 60 * 60 * 1000); // 2 hours in milliseconds
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