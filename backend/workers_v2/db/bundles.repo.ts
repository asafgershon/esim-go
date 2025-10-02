import { createClient } from "@supabase/supabase-js";
import { config } from "../config/env.js";
import countries from "i18n-iso-countries";
import enLocale from "i18n-iso-countries/langs/en.json";

countries.registerLocale(enLocale);

const supabase = createClient(config.db.supabaseUrl, config.db.supabaseServiceKey);
const BATCH_SIZE = 100;

async function batchUpsert(table: string, records: any[], onConflict?: string) {
  if (records.length === 0) return { data: [], error: null };
  const allUpsertedData = [];
  let finalError = null;

  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const chunk = records.slice(i, i + BATCH_SIZE);
    const { data, error } = await supabase.from(table).upsert(chunk, { onConflict }).select();
    
    if (error) {
      console.warn(`[Supabase] Batch upsert failed for ${table}. Error:`, { message: error.message });
      finalError = error;
    }
    if (data) {
      allUpsertedData.push(...data);
    }
  }
  return { data: allUpsertedData, error: finalError };
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
    const { data: upsertedProviders, error: providerError } = await supabase.from("catalog_providers").upsert(providerRecords, { onConflict: 'name' }).select('id, name');

    if (providerError) {
      console.error("[Supabase] Fatal error: Could not upsert providers.", providerError);
      return;
    }
    const providerMap = new Map((upsertedProviders || []).map((p: {name: string, id: number}) => [p.name.toLowerCase(), p.id]));

    // --- 2. Bundles ---
    const bundleRecords = bundles.map(b => {
      const providerId = providerMap.get(b.provider?.trim().toLowerCase());
      if (!providerId || !b.external_id) return null;
      return {
          provider_id: providerId,
          external_id: String(b.external_id).trim(),
          name: b.name ?? null,
          description: b.description ?? null,
          data_amount_mb: b.data_amount_mb ?? null,
          validity_days: b.validity_days ?? null,
          price_usd: b.price_usd ?? null,
          unlimited: b.unlimited ?? false,
          plan_type: b.plan_type ?? null,
          group_name: b.group_name ?? null,
          is_active: false,
      };
    }).filter(Boolean);
    
    // --- 3. Save Bundles AND Get Them Back Immediately ---
    const { data: allBundles, error: bundlesError } = await batchUpsert("catalog_bundles", bundleRecords, "provider_id,external_id");
    
    if (bundlesError) {
      console.error("[Supabase] An error occurred during bundle upsert.", bundlesError);
    }
    if (!allBundles) {
        console.error("[Supabase] Fatal error: Upserted bundles were not returned from DB.");
        return;
    }
    console.log(`[UpsertBundles] Successfully upserted ${allBundles.length} bundles into the database.`);

    const bundleMap = new Map(allBundles.map((b: {provider_id: number, external_id: string, id: number}) => [`${b.provider_id}_${b.external_id}`, b.id]));
    const countryLinks: {bundle_id: number, country_iso2: string}[] = [];
    const bundlesToActivate = new Set<number>();
    
    for (const b of bundles) {
      const providerId = providerMap.get(b.provider?.trim().toLowerCase());
      const normalizedExternalId = String(b.external_id ?? '').trim();
      const key = `${providerId}_${normalizedExternalId}`;
      const bundleId = bundleMap.get(key);

      if (!bundleId || !Array.isArray(b.countries)) continue;
      
      const uniqueCountries = [...new Set<string>(b.countries)];
      if (uniqueCountries.length > 0 && bundleId !== undefined) {
          bundlesToActivate.add(bundleId);
      }
      for (const iso2 of uniqueCountries) {
          if (iso2 && countries.isValid(iso2)) {
              countryLinks.push({ bundle_id: bundleId, country_iso2: iso2 });
          }
      }
    }

    await batchUpsert("catalog_bundle_countries", countryLinks, "bundle_id,country_iso2");
    
    // --- 4. Activate Bundles ---
    if (bundlesToActivate.size > 0) {
      const idsToActivate = [...bundlesToActivate];
      const { error } = await supabase.from("catalog_bundles").update({ is_active: true }).in('id', idsToActivate);
      if (error) {
          console.error('[Supabase] Failed to activate bundles:', error.message);
      }
    }
    
    // --- FINAL VERIFICATION QUERIES ---
    console.log("\n--- VERIFYING DATABASE STATE ---");
    const { count: providerCount } = await supabase.from("catalog_providers").select('*', { count: 'exact', head: true });
    const { count: bundleCount } = await supabase.from("catalog_bundles").select('*', { count: 'exact', head: true });
    const { count: activeBundleCount } = await supabase.from("catalog_bundles").select('*', { count: 'exact', head: true }).eq('is_active', true);
    const { count: countryLinkCount } = await supabase.from("catalog_bundle_countries").select('*', { count: 'exact', head: true });
    console.log(`Total providers in DB: ${providerCount}`);
    console.log(`Total bundles in DB: ${bundleCount}`);
    console.log(`>>> ACTIVE bundles in DB: ${activeBundleCount}`);
    console.log(`Total country links in DB: ${countryLinkCount}`);
    console.log("--- END VERIFICATION ---\n");
    
    console.info(`[UpsertBundles] Upsert finished. Processed ${bundles.length} bundles. Activated ${bundlesToActivate.size} bundles.`);

  } catch (err: any) {
    console.error("[Supabase] General error in upsertBundles:", err.message);
  }
}