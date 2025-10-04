import axios from "axios";
import { config } from "../config/env.js";
import { resolveCountry } from "./countryMapper.js";

export async function fetchMayaProducts() {
  try {
    const response = await axios.get(config.maya.baseUrl, {
      auth: {
        username: config.maya.apiKey,
        password: config.maya.apiSecret,
      },
    });

    if (!response.data?.products) {
      console.warn("[Maya] No products found in response");
      return [];
    }

    const mapped = response.data.products
      .flatMap((p: any) => {
        if (!p?.uid || !p?.name) {
          return []; // דילוג על רשומות לא תקינות
        }

        const nameLc = p.name?.toLowerCase() || "";
        const policyLc = p.policy_name?.toLowerCase() || "";

        const isUnlimited =
          nameLc.includes("unlimited") || policyLc.includes("unlimited");

        if (!isUnlimited) return [];

        const planType =
          nameLc.includes("lite") ? "LITE" :
          nameLc.includes("standard") ? "STANDARD" :
          nameLc.includes("max") ? "MAX" :
          null;

        const iso2List = (p.countries_enabled ?? [])
          .map((code: string) => resolveCountry(code))
          .filter((code: string | null): code is string => !!code);

        return [{
          provider: "Maya",
          external_id: String(p.uid),
          name: p.name,
          description: p.policy_name ?? null,
          data_amount_mb: p.data_quota_mb ?? null,
          validity_days: p.validity_days ?? null,
          price_usd: Number(p.wholesale_price_usd) || null,
          unlimited: true,
          plan_type: planType,
          group_name: null,
          policy_id: String(p.policy_id ?? ""),
          policy_name: p.policy_name ?? null,
          countries: iso2List,
        }];
      });

    return mapped;
  } catch (error: any) {
    console.error("[Maya] Error fetching products:", error.message);
    return [];
  }
}
