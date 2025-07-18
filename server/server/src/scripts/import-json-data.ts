import { cleanEnv, str } from 'envalid';
import Keyv from 'keyv';
import KeyvRedis from '@keyv/redis';
import * as fs from 'fs';
import * as path from 'path';

const env = cleanEnv(process.env, {
  REDIS_URL: str({ default: 'redis://localhost:6379' }),
});

interface PlanData {
  dataAllowance: string;
  duration: number;
  price: number;
  esimRef: string;
}

interface CountryBundle {
  country: string;
  countryCode: string;
  bundleGroup: string;
  region: string;
  plans: PlanData[];
}

class JSONDataImporter {
  private redis: Keyv;

  constructor() {
    this.redis = new Keyv({
      store: new KeyvRedis(env.REDIS_URL),
      namespace: false,
    });
  }

  async connect() {
    console.log('✅ Connected to Redis');
  }

  async disconnect() {
    console.log('👋 Disconnected from Redis');
  }

  async importJSONData(filePath: string) {
    console.log(`📊 Reading JSON file: ${filePath}`);
    
    try {
      const jsonData = JSON.parse(fs.readFileSync(filePath, 'utf8')) as CountryBundle[];
      console.log(`📋 Found ${jsonData.length} countries with bundles`);
      
      const allBundles = this.transformToESIMGoBundles(jsonData);
      console.log(`📦 Generated ${allBundles.length} individual bundles`);
      
      await this.storeBundles(allBundles, jsonData[0]?.bundleGroup || 'Standard - Fixed');
      
      console.log(`✅ Successfully imported ${allBundles.length} bundles`);
      
    } catch (error) {
      console.error('❌ Error importing JSON data:', error);
      throw error;
    }
  }

  private transformToESIMGoBundles(countryBundles: CountryBundle[]): any[] {
    const bundles: any[] = [];
    
    for (const countryBundle of countryBundles) {
      for (const plan of countryBundle.plans) {
        const countries = this.parseCountryCodes(countryBundle.countryCode).map(code => ({
          iso: code,
          name: this.getCountryName(code, countryBundle.country),
          region: countryBundle.region,
          flag: `https://flagcdn.com/w20/${code.toLowerCase()}.png`
        }));

        const bundle = {
          name: plan.esimRef,
          description: `${plan.dataAllowance} data for ${plan.duration} days in ${countryBundle.country}`,
          price: plan.price,
          currency: 'USD',
          duration: plan.duration,
          bundleGroup: countryBundle.bundleGroup,
          region: countryBundle.region,
          dataAllowance: plan.dataAllowance,
          countries: countries,
          features: [],
          isUnlimited: plan.dataAllowance.toLowerCase().includes('unlimited'),
          availableQuantity: 1000,
          esimRef: plan.esimRef
        };

        bundles.push(bundle);
      }
    }
    
    return bundles;
  }

  private parseCountryCodes(countryCode: string): string[] {
    return countryCode.split(';').map(code => code.trim());
  }

  private getCountryName(code: string, fallback: string): string {
    const countryNames: { [key: string]: string } = {
      'US': 'United States',
      'CA': 'Canada',
      'GB': 'United Kingdom',
      'DE': 'Germany',
      'FR': 'France',
      'IT': 'Italy',
      'ES': 'Spain',
      'AU': 'Australia',
      'JP': 'Japan',
      'CN': 'China',
      'IN': 'India',
      'BR': 'Brazil',
      'MX': 'Mexico',
      'AR': 'Argentina',
      'CL': 'Chile',
      'CO': 'Colombia',
      'PE': 'Peru',
      'UY': 'Uruguay',
      'EC': 'Ecuador',
      'CR': 'Costa Rica',
      'SV': 'El Salvador',
      'GF': 'French Guiana',
      'AL': 'Albania',
      'DZ': 'Algeria',
      'AX': 'Aaland Islands',
      'EG': 'Egypt',
      'MA': 'Morocco',
      'TZ': 'Tanzania',
      'UG': 'Uganda',
      'TN': 'Tunisia',
      'ZA': 'South Africa',
      'ZM': 'Zambia',
      'MG': 'Madagascar',
      'NG': 'Nigeria',
      'KE': 'Kenya',
      'MU': 'Mauritius',
      'RE': 'Reunion'
    };
    
    return countryNames[code] || fallback;
  }

  private async storeBundles(bundles: any[], bundleGroup: string) {
    console.log(`💾 Storing ${bundles.length} bundles in Redis...`);
    
    // Store metadata
    const metadata = {
      lastSynced: new Date().toISOString(),
      bundleGroups: [bundleGroup.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')],
      totalBundles: bundles.length,
      syncVersion: 'json-import-2025.06',
      source: 'json-import'
    };
    
    await this.redis.set('esim-go:catalog:metadata', JSON.stringify(metadata), 30 * 24 * 60 * 60 * 1000);
    
    // Store bundles by group
    const groupKey = `esim-go:catalog:group:${bundleGroup.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`;
    await this.redis.set(groupKey, JSON.stringify(bundles), 30 * 24 * 60 * 60 * 1000);
    
    // Create indexes
    await this.createIndexes(bundles);
    
    console.log('✅ Bundles stored in Redis');
  }

  private async createIndexes(bundles: any[]) {
    console.log('🔍 Creating indexes...');
    
    const countryIndex = new Map<string, Set<string>>();
    const durationIndex = new Map<number, Set<string>>();
    const combinedIndex = new Map<string, Set<string>>();
    
    for (const bundle of bundles) {
      const bundleId = bundle.name;
      
      // Store individual bundle
      await this.redis.set(
        `esim-go:catalog:bundle:${bundleId}`,
        JSON.stringify(bundle),
        30 * 24 * 60 * 60 * 1000
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
      await this.redis.set(
        `esim-go:catalog:index:country:${country}`,
        JSON.stringify([...bundleIds]),
        30 * 24 * 60 * 60 * 1000
      );
    }
    
    // Store duration indexes
    for (const [duration, bundleIds] of durationIndex) {
      await this.redis.set(
        `esim-go:catalog:index:duration:${duration}`,
        JSON.stringify([...bundleIds]),
        30 * 24 * 60 * 60 * 1000
      );
    }
    
    // Store combined indexes
    for (const [key, bundleIds] of combinedIndex) {
      const [country, duration] = key.split(':');
      await this.redis.set(
        `esim-go:catalog:index:country:${country}:duration:${duration}`,
        JSON.stringify([...bundleIds]),
        30 * 24 * 60 * 60 * 1000
      );
    }
    
    console.log('✅ Indexes created');
  }
}

// CLI execution
async function main() {
  const filePath = process.argv[2];
  
  if (!filePath) {
    console.error('❌ Please provide JSON file path');
    console.log('Usage: bun run src/scripts/import-json-data.ts <path-to-json-file>');
    process.exit(1);
  }
  
  const importer = new JSONDataImporter();
  
  try {
    await importer.connect();
    await importer.importJSONData(filePath);
  } catch (error) {
    console.error('❌ Import failed:', error);
    process.exit(1);
  } finally {
    await importer.disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

export { JSONDataImporter };