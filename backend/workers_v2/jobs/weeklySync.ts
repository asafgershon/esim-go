import { fetchMayaProducts } from "../services/maya.service.js";
import { fetchEsimGoBundles } from "../services/esimgo.service.js";
import { upsertBundles } from "../db/bundles.repo.js";
import { loadCountryMap } from "../services/countryMapper.js";

export async function runWeeklySync() {
  console.log("[WeeklySync] Loading country map...");
  await loadCountryMap();

  console.log("[WeeklySync] Fetching from Maya...");
  const mayaBundles = await fetchMayaProducts();
  console.log(`[WeeklySync] maya bundles fetched: ${mayaBundles.length}`);

  console.log("[WeeklySync] Fetching from eSIM-Go...");
  const esimGoBundles = await fetchEsimGoBundles();
  console.log(`[WeeklySync] esim bundles fetched: ${esimGoBundles.length}`);

  const allBundles = [...mayaBundles, ...esimGoBundles];
  console.log(`[WeeklySync] Total bundles fetched: ${allBundles.length}`);

  await upsertBundles(allBundles);

  console.log("[WeeklySync] Sync finished ✅");
}
