import { z } from "zod";
import { default as byteSize } from "byte-size";
import countries from "i18n-iso-countries";
import { MayaBundle } from "@/services/maya-sync.service";
import { CatalogBundleSchema } from "./esimgo-bundle.transformer";

// Transformation function with validation and filtering
export function transformAndValidateMayaBundle(
  apiBundle: MayaBundle,
  organizationCurrency: string = "USD"
): z.infer<typeof CatalogBundleSchema> | null {
  try {
    // Check required fields for valid bundles
    if (
      !apiBundle.uid ||
      !apiBundle.name ||
      !apiBundle.validity_days ||
      apiBundle.wholesale_price_usd === undefined
    ) {
      console.warn("Skipping bundle: missing required fields", {
        uid: apiBundle.uid,
        name: apiBundle.name,
        validity_days: apiBundle.validity_days,
        wholesale_price_usd: apiBundle.wholesale_price_usd,
      });
      return null;
    }

    const price = parseFloat(apiBundle.wholesale_price_usd);

    // Skip bundles with zero or negative price
    if (price <= 0) {
      console.warn("Skipping bundle: invalid price", {
        uid: apiBundle.uid,
        name: apiBundle.name,
        wholesale_price_usd: apiBundle.wholesale_price_usd,
      });
      return null;
    }

    // Skip bundles with invalid duration
    if (apiBundle.validity_days <= 0) {
      console.warn("Skipping bundle: invalid duration", {
        uid: apiBundle.uid,
        name: apiBundle.name,
        validity_days: apiBundle.validity_days,
      });
      return null;
    }

    // Extract and validate country ISO codes
    const countryCodes =
      apiBundle.countries_enabled
        ?.filter((country) => {
          if (!country) return false;
          // Validate ISO code using i18n-iso-countries
          const isValid = countries.isValid(country);
          if (!isValid) {
            console.warn(
              `Invalid ISO code: ${country} for country: ${country}`
            );
          }
          return isValid;
        })
        .map((country) => country.toUpperCase())// Ensure uppercase ISO codes
        .map((country) => countries.toAlpha2(country) || country) 
        // Replace ISO Alpha 3 with ISO Alpha 2
      || [];

    // Skip bundles without any valid countries
    if (countryCodes.length === 0) {
      console.warn("Skipping bundle: no valid countries", {
        uid: apiBundle.uid,
        name: apiBundle.name,
      });
      return null;
    }

    const isUnlimited = apiBundle.name.toLowerCase().includes("unlimited");

    // Determine primary region (from first country or most common region)
    const regions = apiBundle.countries_enabled
      ?.map((c) => c)
      .filter((r): r is string => r !== undefined);

    const primaryRegion =
      regions && regions.length > 0 ? getMostCommonElement(regions) : null;

    // Create human-readable data amount using byte-size
    const dataAmountReadable = createDataAmountReadable(
      isUnlimited,
      apiBundle.data_quota_bytes / 1024 / 1024
    );

    // Transform to catalog bundle format
    const transformed: CatalogBundleSchema = {
      provider: "MAYA",
      esim_go_name: apiBundle.uid,
      groups: [],
      description: apiBundle.name || null,
      validity_in_days: apiBundle.validity_days,
      data_amount_mb: isUnlimited ? null : apiBundle.data_quota_bytes / 1024 / 1024 || null,
      data_amount_readable: dataAmountReadable,
      is_unlimited: isUnlimited,
      price: price,
      currency: organizationCurrency,
      countries: countryCodes,
      region: primaryRegion,
      speed: ["4G", "5G"],
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
  apiBundles: MayaBundle[],
  organizationCurrency: string = "USD"
): Promise<CatalogBundleSchema[]> {
  const transformed = apiBundles
    .map((bundle) =>
      transformAndValidateMayaBundle(bundle, organizationCurrency)
    )
    .filter((bundle): bundle is CatalogBundleSchema => bundle !== null);

  console.log(
    `Transformed ${transformed.length} valid bundles out of ${apiBundles.length} total`
  );

  return transformed;
}
