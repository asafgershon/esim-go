import { z } from 'zod';
import type { CatalogueResponseInner, CatalogueResponseInnerCountriesInner } from '@esim-go/client';
import type { Database } from '../../database.types';

type CatalogBundleInsert = Database['public']['Tables']['catalog_bundles']['Insert'];

// Schema for country object from API
const CountrySchema = z.object({
  name: z.string().optional(),
  region: z.string().optional(),
  iso: z.string().optional(),
});

// Schema for transforming eSIM Go API bundles to database format
export const ESimGoBundleSchema = z.object({
  name: z.string().optional().nullable(),
  groups: z.array(z.string()).optional().nullable(),
  description: z.string().optional().nullable(),
  duration: z.number().int().min(0).optional().nullable(),
  dataAmount: z.number().optional().nullable(),
  unlimited: z.boolean().optional().nullable(),
  price: z.number().min(0).optional().nullable(),
  countries: z.array(CountrySchema).optional().nullable(),
  roamingEnabled: z.array(CountrySchema).optional().nullable(),
  speed: z.array(z.string()).optional().nullable(),
  autostart: z.boolean().optional().nullable(),
  billingType: z.string().optional().nullable(),
});

// Schema for the transformed database bundle
export const DatabaseBundleInsertSchema = z.object({
  esim_go_name: z.string().min(1),
  bundle_group: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  duration: z.number().int().min(0).optional().nullable(),
  data_amount: z.number().int().optional().nullable(),
  unlimited: z.boolean().optional().nullable(),
  price_cents: z.number().int().min(0).optional().nullable(),
  currency: z.string().length(3).optional().nullable(),
  countries: z.array(z.string()).optional().nullable(),
  regions: z.array(z.string()).optional().nullable(),
  metadata: z.record(z.unknown()).optional().nullable(),
  synced_at: z.string().optional().nullable(),
});

/**
 * Transform eSIM Go API bundle to database format with validation
 */
export function transformBundleToDatabase(bundle: CatalogueResponseInner): CatalogBundleInsert {
  // Validate input bundle
  const validatedBundle = ESimGoBundleSchema.parse(bundle);
  
  // Extract country names and regions from country objects
  const countryNames = validatedBundle.countries?.map(country => country.name).filter(Boolean) || [];
  const regions = [...new Set(validatedBundle.countries?.map(country => country.region).filter(Boolean) || [])];
  
  // Transform to database format
  const transformed = {
    esim_go_name: validatedBundle.name || `bundle-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    bundle_group: validatedBundle.groups?.[0] || null, // Take first group if multiple
    description: validatedBundle.description || null,
    duration: validatedBundle.duration || null,
    data_amount: normalizeDataAmount(validatedBundle.dataAmount),
    unlimited: validatedBundle.unlimited || false,
    price_cents: normalizePriceToCents(validatedBundle.price),
    currency: 'USD',
    countries: countryNames,
    regions: regions,
    metadata: {
      originalBundle: bundle,
      groups: validatedBundle.groups || [],
      speed: validatedBundle.speed || [],
      autostart: validatedBundle.autostart || false,
      billingType: validatedBundle.billingType || null,
      roamingEnabled: validatedBundle.roamingEnabled || [],
      lastSyncedAt: new Date().toISOString(),
      transformedAt: new Date().toISOString(),
    },
    synced_at: new Date().toISOString(),
  };
  
  // Validate output format
  return DatabaseBundleInsertSchema.parse(transformed);
}

/**
 * Transform batch of bundles with error handling
 */
export function transformBundlesToDatabase(bundles: CatalogueResponseInner[]): {
  validBundles: CatalogBundleInsert[];
  errors: Array<{ bundle: CatalogueResponseInner; error: string; index: number }>;
} {
  const validBundles: CatalogBundleInsert[] = [];
  const errors: Array<{ bundle: CatalogueResponseInner; error: string; index: number }> = [];
  
  bundles.forEach((bundle, index) => {
    try {
      const transformed = transformBundleToDatabase(bundle);
      validBundles.push(transformed);
    } catch (error) {
      errors.push({
        bundle,
        error: error instanceof Error ? error.message : 'Unknown transformation error',
        index,
      });
    }
  });
  
  return { validBundles, errors };
}

/**
 * Normalize data amount to appropriate format
 * API returns MB as number, we store as bytes (integer)
 * -1 represents unlimited
 */
function normalizeDataAmount(dataAmount?: number | null): number | null {
  if (!dataAmount || dataAmount === 0) {
    return -1; // Unlimited
  }
  // Convert MB to bytes (multiply by 1024 * 1024)
  return Math.round(dataAmount * 1024 * 1024);
}

/**
 * Normalize price to cents (integer)
 */
function normalizePriceToCents(price?: number | null): number | null {
  if (!price || price === 0) {
    return null;
  }
  return Math.round(price * 100);
}

/**
 * Convert price from cents back to dollars for display
 */
export function convertCentsToDollars(priceInCents?: number | null): number {
  if (!priceInCents) return 0;
  return priceInCents / 100;
}

/**
 * Convert bytes back to MB for display
 */
export function convertBytesToMB(bytes?: number | null): number | null {
  if (!bytes || bytes === -1) return null; // Unlimited
  return Math.round(bytes / (1024 * 1024));
}