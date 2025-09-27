import { createClient } from "@supabase/supabase-js";
import { config } from "../config/env.js";
import countries from "i18n-iso-countries";
import enLocale from "i18n-iso-countries/langs/en.json";

countries.registerLocale(enLocale);

const supabase = createClient(
  config.db.supabaseUrl,
  config.db.supabaseServiceKey
);

// פונקציית עזר לנרמול שמות provider
function normalizeProvider(name?: string): string {
  return name?.trim().toLowerCase() ?? "";
}

// פונקציה שמריצה upsert אחד-אחד
async function safeUpsert(
  table: string,
  row: any,
  onConflict?: string
) {
  const { error } = await supabase
    .from(table)
    .upsert([row], onConflict ? { onConflict } : {});

  if (error) {
    console.error(`[Supabase] Error upserting row into ${table}:`, {
      row,
      message: error.message,
      details: (error as any).details,
      hint: (error as any).hint,
      code: (error as any).code,
    });
    return false;
  }
  return true;
}

export async function upsertBundles(bundles: any[]) {
  try {
    if (!bundles.length) {
      console.info("[UpsertBundles] No bundles to upsert, skipping.");
      return;
    }

    // --- Providers ---
    const providerNames = [...new Set(
      bundles
        .map((b) => normalizeProvider(b.provider))
        .filter((name) => !!name)
    )];
    for (const name of providerNames) {
      await safeUpsert("catalog_providers", { name }, "name");
    }

    // שליפת IDs כדי למפות ל־bundles
    const { data: allProviders } = await supabase
      .from("catalog_providers")
      .select("id, name");

    const providerMap: Record<string, number> = {};
    allProviders?.forEach((p) => {
      providerMap[normalizeProvider(p.name)] = p.id;
    });

    console.log("ProviderMap keys:", Object.keys(providerMap));

    const errors: any[] = [];

    // --- Bundles (כולם inactive עד שנבדוק מדינות) ---
    for (const b of bundles) {
      if (!b.provider || !b.external_id) {
        errors.push({
          reason: "INVALID_BUNDLE",
          provider: b.provider,
          external_id: b.external_id,
        });
        continue;
      }

      const providerId = providerMap[normalizeProvider(b.provider)];
      if (!providerId) {
        errors.push({
          reason: "MISSING_PROVIDER",
          provider: b.provider,
          external_id: b.external_id,
        });
        continue;
      }

      await safeUpsert("catalog_bundles", {
        provider_id: providerId,
        external_id: b.external_id,
        name: b.name ?? null,
        description: b.description ?? null,
        data_amount_mb: b.data_amount_mb ?? null,
        validity_days: b.validity_days ?? null,
        price_usd: b.price_usd ?? null,
        unlimited: b.unlimited ?? false,
        plan_type: b.plan_type ?? null,
        group_name: b.group_name ?? null,
        policy_id: b.policy_id ?? null,
        policy_name: b.policy_name ?? null,
        is_active: false,
      }, "provider_id,external_id");
    }

    // שליפת IDs של bundles אחרי upsert
    const { data: allBundles, error: fetchError } = await supabase
      .from("catalog_bundles")
      .select("id, provider_id, external_id");

    if (fetchError) {
      console.error(
        "[Supabase] Error fetching catalog_bundles:",
        fetchError.message
      );
      return;
    }

    const bundleMap: Record<string, number> = {};
    allBundles?.forEach((b) => {
      bundleMap[`${b.provider_id}_${b.external_id}`] = b.id;
    });

    // --- Bundle-Countries ---
    for (const b of bundles) {
      const providerId = providerMap[normalizeProvider(b.provider)];
      const key = `${providerId}_${b.external_id}`;
      const bundleId = bundleMap[key];

      if (!bundleId) {
        errors.push({
          reason: "MISSING_BUNDLE",
          provider: b.provider,
          external_id: b.external_id,
        });
        continue;
      }

      const uniqueCountries = [...new Set<string>(b.countries ?? [])];
      for (const iso2 of uniqueCountries) {
        if (!iso2 || !countries.isValid(iso2)) {
          errors.push({
            reason: "INVALID_ISO2",
            bundle_id: bundleId,
            iso2,
            external_id: b.external_id,
          });
          continue;
        }

        await safeUpsert("catalog_bundle_countries", {
          bundle_id: bundleId,
          country_iso2: iso2,
        }, "bundle_id,country_iso2");
      }

      // אם יש מדינות תקינות → נעדכן is_active
      if (uniqueCountries.length > 0) {
        await safeUpsert("catalog_bundles", {
          id: bundleId,
          is_active: true,
        }, "id");
      }
    }

    // שומר שגיאות בטבלה ייעודית
    for (const e of errors) {
      await safeUpsert("catalog_bundle_country_errors", e);
    }

    if (errors.length > 0) {
      console.warn(
        `[UpsertBundles] ${errors.length} rows skipped (saved to catalog_bundle_country_errors)`
      );
    }

    console.info("[UpsertBundles] Upsert finished ✅ (row by row)");
  } catch (err: any) {
    console.error("[Supabase] General error in upsertBundles:", err.message);
  }
}
