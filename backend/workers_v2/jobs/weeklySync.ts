import { fetchMayaProducts } from "../services/maya.service.js";
import { fetchEsimGoBundles } from "../services/esimgo.service.js";
import { upsertBundles } from "../db/bundles.repo.js";
import { loadCountryMap } from "../services/countryMapper.js";

export async function runWeeklySync() {
  console.log("[WeeklySync] Starting weekly sync job...");
  
  try {
    console.log("[WeeklySync] Loading country map...");
    await loadCountryMap();

    console.log("[WeeklySync] Fetching from all providers in parallel...");
    
    const results = await Promise.allSettled([
      fetchMayaProducts(),
      fetchEsimGoBundles()
    ]);

    const allBundles = [];
    
    const [mayaResult, esimGoResult] = results;

    if (mayaResult.status === 'fulfilled' && mayaResult.value.length > 0) {
      console.log(`[WeeklySync] Successfully fetched ${mayaResult.value.length} bundles from Maya.`);
      allBundles.push(...mayaResult.value);
    } else if (mayaResult.status === 'rejected') {
      console.error("[WeeklySync] Failed to fetch from Maya:", mayaResult.reason);
    }

    if (esimGoResult.status === 'fulfilled' && esimGoResult.value.length > 0) {
      console.log(`[WeeklySync] Successfully fetched ${esimGoResult.value.length} bundles from eSIM-Go.`);
      allBundles.push(...esimGoResult.value);
    } else if (esimGoResult.status === 'rejected') {
      console.error("[WeeklySync] Failed to fetch from eSIM-Go:", esimGoResult.reason);
    }
    
    console.log(`[WeeklySync] Total bundles to process: ${allBundles.length}`);

    if (allBundles.length > 0) {
      await upsertBundles(allBundles);
    } else {
      console.log("[WeeklySync] No bundles fetched from any provider. Nothing to upsert.");
    }

    console.log("[WeeklySync] Sync finished successfully ✅");

  } catch (error) {
    console.error("[WeeklySync] A critical error occurred during the sync process:", error);
  }
}