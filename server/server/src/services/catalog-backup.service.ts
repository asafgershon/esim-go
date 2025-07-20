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
  private log = createLogger({ component: 'CatalogBackupService' });
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
    this.log.info('Loading catalog backup data from JSON files', { operationType: 'backup-load' });
    
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
        
        this.log.info('Loaded backup file', { 
          fileName, 
          bundleCount: backupData.length,
          operationType: 'backup-load'
        });
      } catch (error) {
        this.log.error('Failed to load backup file', error as Error, { 
          fileName,
          operationType: 'backup-load'
        });
      }
    }
    
    // Store metadata about backup load
    await this.setCacheValue(`${this.BACKUP_CACHE_PREFIX}metadata`, {
      lastLoaded: new Date().toISOString(),
      totalPlans,
      source: 'json-backup',
      version: '2025.07'
    });
    
    this.log.info('Backup data loaded successfully', { 
      totalPlans, 
      operationType: 'backup-load' 
    });
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
      // Add required fields for schema validation
      dataAmount: this.parseDataAmount(plan.dataAllowance),
      billingType: 'FixedCost',
      speed: ['2G', '3G', '4G', '5G'],
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
   * Parse data allowance string to number (in MB)
   */
  private parseDataAmount(dataAllowance: string): number {
    const cleaned = dataAllowance.toLowerCase().trim();
    
    if (cleaned.includes('unlimited')) {
      return 999999; // Large number to represent unlimited
    }
    
    // Extract number from string like "1GB", "500MB", etc.
    const match = cleaned.match(/(\d+(?:\.\d+)?)\s*(gb|mb|tb)?/);
    if (match) {
      const amount = parseFloat(match[1]);
      const unit = match[2] || 'gb'; // Default to GB if no unit specified
      
      switch (unit) {
        case 'tb':
          return amount * 1024 * 1024; // TB to MB
        case 'gb':
          return amount * 1024; // GB to MB
        case 'mb':
          return amount; // Already in MB
        default:
          return amount * 1024; // Default to GB
      }
    }
    
    return 1024; // Default to 1GB if parsing fails
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