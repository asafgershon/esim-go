import { createClient } from "@supabase/supabase-js";
import { config } from "../config/env.js";
import countries from "i18n-iso-countries";
import enLocale from "i18n-iso-countries/langs/en.json";

countries.registerLocale(enLocale);

const supabase = createClient(
  config.db.supabaseUrl,
  config.db.supabaseServiceKey
);

const BATCH_SIZE = 100;

async function batchUpsert(table: string, records: any[], onConflict?: string) {
  if (records.length === 0) return;

  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const chunk = records.slice(i, i + BATCH_SIZE);
    
    const { error } = await supabase
      .from(table)
      .upsert(chunk, onConflict ? { onConflict } : {});

    if (error) {
      console.warn(`[Supabase] Batch upsert failed for table ${table}. Retrying rows individually...`, error.message);
      for (const record of chunk) {
        const { error: singleError } = await supabase
          .from(table)
          .upsert([record], onConflict ? { onConflict } : {});
        
        if (singleError) {
          console.error(`[Supabase] Failed to upsert single row in table ${table}:`, {
             record,
             message: singleError.message,
          });
        }
      }
    }
  }
}


export async function upsertBundles(bundles: any[]) {
  try {
    if (!bundles.length) {
      console.info("[UpsertBundles] No bundles to upsert, skipping.");
      return;
    }

    // --- 1. Providers ---
    const providerNames = [...new Set(bundles.map((b) => b.provider?.trim().toLowerCase()).filter(Boolean))];
    const providerRecords = providerNames.map(name => ({ name }));
    await batchUpsert("catalog_providers", providerRecords, "name");

    const { data: allProviders } = await supabase.from("catalog_providers").select("id, name");
    const providerMap = new Map((allProviders || []).map((p: {name: string, id: number}) => [p.name.toLowerCase(), p.id]));

    // --- 2. Bundles (כולם inactive בהתחלה) ---
    const bundleRecords = bundles
        .map(b => {
            const providerId = providerMap.get(b.provider?.trim().toLowerCase());
            if (!providerId || !b.external_id) return null;
            return {
                provider_id: providerId,
                // FIX: Normalize the external_id before saving to the DB
                external_id: String(b.external_id).trim(),
                name: b.name ?? null,
                description: b.description ?? null,
                data_amount_mb: b.data_amount_mb ?? null,
                validity_days: b.validity_days ?? null,
                price_usd: b.price_usd ?? null,
                unlimited: b.unlimited ?? false,
                plan_type: b.plan_type ?? null,
                is_active: false,
            };
        })
        .filter(Boolean);

    await batchUpsert("catalog_bundles", bundleRecords, "provider_id,external_id");
    
    // --- 3. Bundle-Countries ---
    const { data: allBundles } = await supabase.from("catalog_bundles").select("id, provider_id, external_id");
    // The external_id from the DB is now clean, so no need to normalize it here.
    const bundleMap = new Map((allBundles || []).map((b: {provider_id: number, external_id: string, id: number}) => [`${b.provider_id}_${b.external_id}`, b.id]));

    const countryLinks: {bundle_id: number, country_iso2: string}[] = [];
    const bundlesToActivate = new Set<number>();

    for (const b of bundles) {
        const providerId = providerMap.get(b.provider?.trim().toLowerCase());
        // FIX: Use the same normalization for the lookup key
        const normalizedExternalId = String(b.external_id).trim();
        const bundleId = bundleMap.get(`${providerId}_${normalizedExternalId}`);

        if (!bundleId || !Array.isArray(b.countries)) continue;
        
        const uniqueCountries = [...new Set<string>(b.countries)];
        if (uniqueCountries.length > 0) {
            if(bundleId !== undefined) {
                bundlesToActivate.add(bundleId);
            }
        }

        for (const iso2 of uniqueCountries) {
            if (iso2 && countries.isValid(iso2)) {
                countryLinks.push({
                    bundle_id: bundleId,
                    country_iso2: iso2,
                });
            }
        }
    }

    await batchUpsert("catalog_bundle_countries", countryLinks, "bundle_id,country_iso2");

    // --- 4. Activate Bundles ---
    if (bundlesToActivate.size > 0) {
        const idsToActivate = [...bundlesToActivate];
        const { error } = await supabase
            .from("catalog_bundles")
            .update({ is_active: true })
            .in('id', idsToActivate);

        if (error) {
            console.error('[Supabase] Failed to activate bundles:', error.message);
        }
    }
    
    console.info(`[UpsertBundles] Upsert finished. Processed ${bundles.length} bundles. Activated ${bundlesToActivate.size} bundles.`);

  } catch (err: any) {
    console.error("[Supabase] General error in upsertBundles:", err.message);
  }
}