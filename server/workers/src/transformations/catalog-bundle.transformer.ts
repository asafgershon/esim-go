import { z } from "zod";
import { default as byteSize } from "byte-size";
import countries from "i18n-iso-countries";

// Input schemas matching the eSIM Go API response
const CountrySchema = z.object({
  name: z.string().optional(),
  region: z.string().optional(),
  iso: z.string().optional(),
});

const BillingTypeEnum = z.enum(["FixedCost"]);

const CatalogueResponseInnerSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  groups: z.array(z.string()).optional(),
  countries: z.array(CountrySchema).optional(),
  dataAmount: z.number().optional(),
  duration: z.number().optional(),
  speed: z.array(z.string()).nullable().optional().default([]),
  autostart: z.boolean().optional(),
  unlimited: z.boolean().optional(),
  roamingEnabled: z.array(CountrySchema).optional(),
  price: z.number().optional(),
  billingType: BillingTypeEnum.optional(),
});

// Output schema matching the catalog_bundles table
const CatalogBundleSchema = z.object({
  esim_go_name: z.string(),
  groups: z.array(z.string()).default([]),
  description: z.string().nullable(),
  validity_in_days: z.number().positive(),
  data_amount_mb: z.number().nullable(),
  data_amount_readable: z.string(),
  is_unlimited: z.boolean(),
  price: z.number().nonnegative(),
  currency: z.string().length(3),
  countries: z.array(z.string()).default([]), // ISO codes
  region: z.string().nullable(),
  speed: z.array(z.string()).default([]),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  synced_at: z.string().datetime(),
});

type CatalogBundleSchema = z.infer<typeof CatalogBundleSchema>;

// Transformation function with validation and filtering
export function transformAndValidateCatalogBundle(
  apiBundle: unknown,
  organizationCurrency: string = "USD"
): z.infer<typeof CatalogBundleSchema> | null {
  try {
    // First, validate the input
    const validated = CatalogueResponseInnerSchema.parse(apiBundle);

    // Check required fields for valid bundles
    if (
      !validated.name ||
      !validated.duration ||
      validated.price === undefined
    ) {
      console.warn("Skipping bundle: missing required fields", {
        name: validated.name,
        duration: validated.duration,
        price: validated.price,
      });
      return null;
    }

    // Skip bundles with zero or negative price
    if (validated.price <= 0) {
      console.warn("Skipping bundle: invalid price", {
        name: validated.name,
        price: validated.price,
      });
      return null;
    }

    // Skip bundles with invalid duration
    if (validated.duration <= 0) {
      console.warn("Skipping bundle: invalid duration", {
        name: validated.name,
        duration: validated.duration,
      });
      return null;
    }

    // Extract and validate country ISO codes
    const countryCodes =
      validated.countries
        ?.filter((country) => {
          if (!country.iso) return false;
          // Validate ISO code using i18n-iso-countries
          const isValid = countries.isValid(country.iso);
          if (!isValid) {
            console.warn(
              `Invalid ISO code: ${country.iso} for country: ${country.name}`
            );
          }
          return isValid;
        })
        .map((country) => country.iso!.toUpperCase()) || // Ensure uppercase ISO codes
      [];

    // Skip bundles without any valid countries
    if (countryCodes.length === 0) {
      console.warn("Skipping bundle: no valid countries", {
        name: validated.name,
      });
      return null;
    }

    // Determine if bundle is unlimited based on dataAmount being -1
    const isUnlimited =
      validated.dataAmount === -1 || validated.unlimited === true;

    // Determine primary region (from first country or most common region)
    const regions = validated.countries
      ?.map((c) => c.region)
      .filter((r): r is string => r !== undefined);

    const primaryRegion =
      regions && regions.length > 0 ? getMostCommonElement(regions) : null;

    // Create human-readable data amount using byte-size
    const dataAmountReadable = createDataAmountReadable(
      isUnlimited,
      validated.dataAmount
    );

    // Transform to catalog bundle format
    const transformed: CatalogBundleSchema = {
      esim_go_name: validated.name,
      groups: (validated.groups || []).map(g => g.replace(/-/g, '')), // Remove hyphens from group names
      description: validated.description || null,
      validity_in_days: validated.duration,
      data_amount_mb: isUnlimited ? null : validated.dataAmount || null,
      data_amount_readable: dataAmountReadable,
      is_unlimited: isUnlimited,
      price: validated.price,
      currency: organizationCurrency,
      countries: countryCodes,
      region: primaryRegion,
      speed: validated.speed ?? [], // Use nullish coalescing to handle null values
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      synced_at: new Date().toISOString(),
    };

    // Final validation of transformed data
    return CatalogBundleSchema.parse(transformed);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("Validation error for bundle:", error.errors);
    } else {
      console.error("Unexpected error transforming bundle:", error);
    }
    return null;
  }
}

// Helper function to create human-readable data amount using byte-size
function createDataAmountReadable(
  isUnlimited: boolean,
  dataAmountMB?: number
): string {
  if (isUnlimited || dataAmountMB === -1) {
    return "Unlimited";
  }

  if (!dataAmountMB || dataAmountMB <= 0) {
    return "Unknown";
  }

  // Use byte-size for formatting
  const formatted = (byteSize as any)(dataAmountMB * 1024 * 1024, {
    units: "iec", // Use binary units (MiB, GiB)
    precision: 1, // One decimal place
  });

  // Convert IEC units to common units (MiB -> MB, GiB -> GB)
  let { value, unit } = formatted;
  unit = unit.replace("iB", "B"); // Remove the 'i' from IEC notation

  return `${value}${unit}`;
}

// Helper function to get most common element in array
function getMostCommonElement(arr: string[]): string | null {
  if (arr.length === 0) return null;

  const counts = arr.reduce((acc, val) => {
    acc[val] = (acc[val] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  let maxCount = 0;
  let mostCommon: string | null = null;

  for (const [val, count] of Object.entries(counts)) {
    if (count > maxCount) {
      maxCount = count;
      mostCommon = val;
    }
  }

  return mostCommon;
}

// Batch transformation function with filtering
export async function transformCatalogBundles(
  apiBundles: unknown[],
  organizationCurrency: string = "USD"
): Promise<CatalogBundleSchema[]> {
  const transformed = apiBundles
    .map((bundle) =>
      transformAndValidateCatalogBundle(bundle, organizationCurrency)
    )
    .filter((bundle): bundle is CatalogBundleSchema => bundle !== null);

  console.log(
    `Transformed ${transformed.length} valid bundles out of ${apiBundles.length} total`
  );

  return transformed;
}

// Type exports
export type CatalogBundle = z.infer<typeof CatalogBundleSchema>;
export type CatalogueResponseInner = z.infer<
  typeof CatalogueResponseInnerSchema
>;
