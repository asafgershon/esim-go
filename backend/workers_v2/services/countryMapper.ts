// src/utils/countryMapper.ts
import { createClient } from "@supabase/supabase-js";
import { config } from "../config/env.js";

const supabase = createClient(config.db.supabaseUrl, config.db.supabaseServiceKey);

let countryMap: Record<string, string> = {}; // key = iso2/iso3/name, value = iso2

export async function loadCountryMap() {
  const { data, error } = await supabase.from("catalog_countries").select("iso2, iso3, name");
  if (error) {
    console.error("[CountryMapper] Error loading countries:", error.message);
    return;
  }

  const map: Record<string, string> = {};
  data.forEach((c) => {
    if (c.iso2) {
      map[c.iso2.toUpperCase()] = c.iso2;
    }
    if (c.iso3) {
      map[c.iso3.toUpperCase()] = c.iso2;
    }
    if (c.name) {
      map[c.name.toLowerCase()] = c.iso2;
    }
  });

  countryMap = map;
}

export function resolveCountry(codeOrName: string): string | null {
  if (!countryMap) return null;
  const key = codeOrName.toUpperCase();
  if (countryMap[key]) return countryMap[key];
  const lower = codeOrName.toLowerCase();
  if (countryMap[lower]) return countryMap[lower];
  return null;
}
