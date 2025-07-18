import { readFileSync } from 'fs';
import path from 'path';
import { createLogger } from '../lib/logger';
import { ESIMGoDataPlan } from '../datasources/esim-go/types';
import type { KeyValueCache } from "@apollo/utils.keyvaluecache";

interface BackupBundle {
  country: string;
  countryCode: string;
  bundleGroup: string;
  region: string;
  plans: {
    dataAllowance: string;
    duration: number;
    price: number;
    esimRef: string;
  }[];
}

export class CatalogBackupService {
  private log = createLogger('CatalogBackupService');
  private cache?: KeyValueCache;
  private readonly BACKUP_CACHE_PREFIX = 'backup:catalog:';
  private readonly BACKUP_CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

  constructor(cache?: KeyValueCache) {
    this.cache = cache;
  }

  /**
   * Load all JSON backup files into cache at server startup
   */
  async loadBackupData(): Promise<void> {
    this.log.info('Loading catalog backup data from JSON files...');
    
    const backupFiles = [
      'standard-fixed-bundles.json',
      'standard-unlimited-lite-bundles.json',
      'standard-unlimited-essential-bundles.json'
    ];

    const scriptsDir = path.join(__dirname, '../scripts');
    let totalPlans = 0;
    
    for (const fileName of backupFiles) {
      try {
        const filePath = path.join(scriptsDir, fileName);
        const fileContent = readFileSync(filePath, 'utf-8');
        const backupData: BackupBundle[] = JSON.parse(fileContent);
        
        // Transform and store each bundle
        for (const bundle of backupData) {
          const transformedPlans = this.transformBackupBundle(bundle);
          totalPlans += transformedPlans.length;
          
          // Store plans by country code for easy retrieval
          const cacheKey = `${this.BACKUP_CACHE_PREFIX}country:${bundle.countryCode}`;
          await this.setCacheValue(cacheKey, transformedPlans);
          
          // Store plans by bundle group as well
          const groupKey = `${this.BACKUP_CACHE_PREFIX}group:${bundle.bundleGroup.replace(/\s+/g, '_')}`;
          const existingGroupPlans = await this.getCacheValue<ESIMGoDataPlan[]>(groupKey) || [];
          await this.setCacheValue(groupKey, [...existingGroupPlans, ...transformedPlans]);
        }
        
        this.log.info(`Loaded ${backupData.length} bundles from ${fileName}`);
      } catch (error) {
        this.log.error(`Failed to load backup file ${fileName}:`, error);
      }
    }
    
    // Store metadata about backup load
    await this.setCacheValue(`${this.BACKUP_CACHE_PREFIX}metadata`, {
      lastLoaded: new Date().toISOString(),
      totalPlans,
      source: 'json-backup',
      version: '2025.07'
    });
    
    this.log.info(`✅ Backup data loaded successfully: ${totalPlans} plans available`);
  }

  /**
   * Get backup plans for a specific country
   */
  async getBackupPlansForCountry(countryCode: string): Promise<ESIMGoDataPlan[]> {
    const cacheKey = `${this.BACKUP_CACHE_PREFIX}country:${countryCode}`;
    const plans = await this.getCacheValue<ESIMGoDataPlan[]>(cacheKey);
    return plans || [];
  }

  /**
   * Get backup plans for a specific bundle group
   */
  async getBackupPlansByGroup(bundleGroup: string): Promise<ESIMGoDataPlan[]> {
    const groupKey = `${this.BACKUP_CACHE_PREFIX}group:${bundleGroup.replace(/\s+/g, '_')}`;
    const plans = await this.getCacheValue<ESIMGoDataPlan[]>(groupKey);
    return plans || [];
  }

  /**
   * Check if backup data is available
   */
  async hasBackupData(): Promise<boolean> {
    const metadata = await this.getCacheValue(`${this.BACKUP_CACHE_PREFIX}metadata`);
    return !!metadata;
  }

  /**
   * Get backup metadata
   */
  async getBackupMetadata(): Promise<any> {
    return await this.getCacheValue(`${this.BACKUP_CACHE_PREFIX}metadata`);
  }

  /**
   * Transform backup bundle format to ESIMGoDataPlan format
   */
  private transformBackupBundle(bundle: BackupBundle): ESIMGoDataPlan[] {
    return bundle.plans.map(plan => ({
      id: plan.esimRef,
      name: `${plan.dataAllowance} - ${plan.duration} days`,
      description: `${plan.dataAllowance} data for ${plan.duration} days in ${bundle.country}`,
      price: plan.price,
      currency: 'USD',
      duration: plan.duration,
      bundleGroup: bundle.bundleGroup,
      region: bundle.region,
      dataAllowance: plan.dataAllowance,
      countries: bundle.countryCode.split(';').map(code => ({
        iso: code.trim(),
        name: code === bundle.countryCode ? bundle.country : code.trim(),
        region: bundle.region,
        flag: `https://flagcdn.com/w20/${code.trim().toLowerCase()}.png`
      })),
      features: [],
      isUnlimited: plan.dataAllowance.toLowerCase().includes('unlimited'),
      availableQuantity: 1000, // Default high quantity for backup data
      source: 'backup' // Mark as backup data
    }));
  }

  /**
   * Helper method to set cache value
   */
  private async setCacheValue(key: string, value: any): Promise<void> {
    if (this.cache) {
      await this.cache.set(key, JSON.stringify(value), { ttl: this.BACKUP_CACHE_TTL });
    }
  }

  /**
   * Helper method to get cache value
   */
  private async getCacheValue<T>(key: string): Promise<T | undefined> {
    if (this.cache) {
      const cached = await this.cache.get(key);
      return cached ? JSON.parse(cached) : undefined;
    }
    return undefined;
  }
}