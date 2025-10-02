import axios from "axios";
import { config } from "../config/env.js";
import { resolveCountry } from "./countryMapper.js";

export async function fetchEsimGoBundles() {
  try {
    let page = 1;
    const perPage = 1000;
    const allBundles: any[] = [];

    while (true) {
      const url = `${config.esimgo.baseUrl}/catalogue?perPage=${perPage}&page=${page}`;

      const response = await axios.get(url, {
        headers: {
          "x-api-key": config.esimgo.apiKey,
          "Content-Type": "application/json",
        },
      });

      const bundles: any[] = response.data?.bundles ?? [];
      if (bundles.length === 0) break;

      allBundles.push(...bundles);
      if (bundles.length < perPage) break;

      page++;
    }

    const mapped = allBundles
      .filter(
        (b: any) =>
          b &&
          b.unlimited === true &&
          Array.isArray(b.groups) &&
          b.groups.includes("Standard Unlimited Essential")
      )
      .flatMap((b: any) => {
        if (!b.name || typeof b.name !== "string") {
          console.warn("[eSIM-Go] Skipping bundle without valid name:", b);
          return [];
        }

        const iso2List = (b.countries ?? [])
          .map((c: { iso?: string; name?: string }) =>
            c?.iso
              ? resolveCountry(c.iso)
              : c?.name
              ? resolveCountry(c.name)
              : null
          )
          .filter((code: string | null): code is string => !!code);

        return [{
          provider: "eSIM-Go",
          external_id: b.name,
          name: b.description || b.name,
          description: b.description ?? null,
          data_amount_mb: b.unlimited ? null : (b.dataAmount ?? null),
          validity_days: b.duration ?? null,
          price_usd: Number(b.price) || null,
          unlimited: b.unlimited ?? false,
          plan_type: "STANDARD",
          group_name: b.groups?.[0] ?? null,
          policy_id: null,
          policy_name: null,
          countries: iso2List,
        }];
      });

    return mapped;
  } catch (error: any) {
    console.error("[eSIM-Go] Error fetching bundles:", error.message);
    return [];
  }
}