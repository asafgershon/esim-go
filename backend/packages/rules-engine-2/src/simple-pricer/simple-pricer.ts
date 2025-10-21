// backend/packages/rules-engine-2/src/simple-pricer/simple-pricer.ts

import { getSupabaseClient } from '../supabase';
const supabase = getSupabaseClient();

// (הגדרת הטיפוס עבור האובייקט הפנימי 'calculation')
export interface SimplePricingCalculation {
  upperPackagePrice: number;
  totalDiscount: number;
  unusedDays: number;
  finalPriceBeforeRounding: number;
}

export interface SimplePricingDiscount {
  code: string;
  amount: number;
  originalPrice: number;
}

// (הגדרת הטיפוס עבור התוצאה הראשית של הפונקציה)
export interface SimplePricingResult {
  finalPrice: number;
  provider: string;
  bundleName: string;
  requestedDays: number;
  calculation: SimplePricingCalculation;
  discount? : SimplePricingDiscount;
}

type Bundle = {
    id: number;
    name: string;
    validity_days: number;
    price_usd: number;
    provider_id: number;
    plan_type: string;
};

// ✅ פונקציה לעיגול למעלה לספרה אחת אחרי הנקודה
function roundUpToOneDecimal(value: number): number {
    return Math.ceil(value * 10) / 10;
}

async function getMarkup(providerId: number, planType: string, duration: number): Promise<number> {
    const { data, error } = await supabase
        .from('markups')
        .select('markup_amount')
        .eq('provider_id', providerId)
        .eq('plan_type', planType)
        .lte('duration_days', duration)
        .order('duration_days', { ascending: false })
        .limit(1)
        .single();

    if (error || !data) {
        console.log(`[DEBUG] Markup not found for provider ${providerId}, plan ${planType}, duration <= ${duration}. Returning 0.`);
        return 0;
    }

    console.log(`[DEBUG] Markup FOUND for nearest duration <= ${duration}: $${data.markup_amount}`);
    return data.markup_amount;
}

export async function calculateSimplePrice(countryIso: string, requestedDays: number) {
    console.log(`\n\n--- 🚀 STARTING NEW CALCULATION 🚀 ---`);
    console.log(`[INPUT] Country: ${countryIso}, Requested Days: ${requestedDays}`);

    async function getBundlesForProvider(providerName: string, country: string): Promise<Bundle[]> {
        const { data, error } = await supabase.rpc('get_bundles_for_country_and_provider', {
            p_country_iso: country,
            p_provider_name: providerName
        });

        if (error) {
            console.error(`[DB ERROR] RPC failed for provider ${providerName}:`, error);
            return [];
        }

        let bundles = data as Bundle[];
        if (providerName === 'maya') {
            bundles = bundles.filter(b => b.plan_type?.toUpperCase() === 'STANDARD');
        }
        return bundles;
    }

    // --- Load bundles ---
    let bundles: Bundle[] = await getBundlesForProvider('maya', countryIso);
    let providerName = 'maya';

    if (!bundles || bundles.length === 0) {
        bundles = await getBundlesForProvider('esim-go', countryIso);
        providerName = 'esim-go';
    }

    if (!bundles || bundles.length === 0) {
        throw new Error(`No bundles found for country ${countryIso}.`);
    }

    // --- Convert validity_days to clean days (supplier offset fix) ---
    bundles = bundles.map(b => ({
        ...b,
        validity_days: b.validity_days - 1 // ✅ FIX: suppliers store +1 day artificially
    }));

    // --- Filter STANDARD only and sort ---
    let standardBundles = bundles.filter(b => b.plan_type?.toUpperCase() === 'STANDARD');
    if (standardBundles.length === 0) {
        console.warn(`[WARN] No STANDARD bundles found for ${countryIso}, using all bundles.`);
        standardBundles = bundles;
    }

    standardBundles.sort((a, b) => a.validity_days - b.validity_days);

    // --- Select eligible bundles based on clean days ---
    const eligibleBundles = standardBundles.filter(b => b.validity_days >= requestedDays);
    if (eligibleBundles.length === 0) {
        throw new Error(`No bundle covers ${requestedDays} days for ${countryIso}.`);
    }

    const upperPackage = eligibleBundles.sort((a, b) => a.price_usd - b.price_usd)[0];

    // ✅ FIX 1: Handle case where no lowerPackage exists
    const lowerPackage = standardBundles
        .filter(b => b.validity_days < upperPackage.validity_days)
        .sort((a, b) => b.validity_days - a.validity_days)[0] || null;

    const upperPackageCleanDays = upperPackage.validity_days;
    const lowerPackageCleanDays = lowerPackage ? lowerPackage.validity_days : 0; // ✅ fallback = 0
    const unusedDays = upperPackageCleanDays - requestedDays;

    console.log(`[LOGIC] Upper Package: ${upperPackage.name} (${upperPackageCleanDays} clean days) | Cost: $${upperPackage.price_usd}`);
    if (lowerPackage) {
        console.log(`[LOGIC] Lower Package: ${lowerPackage.name} (${lowerPackageCleanDays} clean days) | Cost: $${lowerPackage.price_usd}`);
    } else {
        console.log(`[LOGIC] No lower package found — assuming 0 days.`);
    }
    console.log(`[CALC] Unused Days (Corrected): ${unusedDays}`);

    // --- Calculate markups ---
    const upperMarkup = await getMarkup(upperPackage.provider_id, upperPackage.plan_type, upperPackageCleanDays);
    const lowerMarkup = await getMarkup(upperPackage.provider_id, upperPackage.plan_type, lowerPackageCleanDays);
    console.log(`[CALC] Upper Markup (for ${upperPackageCleanDays} days): $${upperMarkup}`);
    console.log(`[CALC] Lower Markup (for ${lowerPackageCleanDays} days): $${lowerMarkup}`);

    const upperPackagePrice = upperPackage.price_usd + upperMarkup;
    console.log(`[CALC] Upper Package Selling Price: $${upperPackagePrice}`);

    const dayDifference = Math.max(upperPackageCleanDays - lowerPackageCleanDays, 1);
    console.log(`[CALC] Day Difference (Clean): ${dayDifference}`);

    const markupValuePerDay = (upperMarkup - lowerMarkup) / dayDifference;
    console.log(`[CALC] Markup Value Per Day (for discount): $${markupValuePerDay}`);

    const totalDiscount = Math.max(unusedDays, 0) * markupValuePerDay;
    console.log(`[CALC] Total Discount for ${unusedDays} unused days: $${totalDiscount}`);

    const finalPrice = upperPackagePrice - totalDiscount;

    // ✅ עיגול למעלה לספרה אחת אחרי הנקודה
    const rounded = {
        finalPrice: roundUpToOneDecimal(finalPrice),
        upperPackagePrice: roundUpToOneDecimal(upperPackagePrice),
        totalDiscount: roundUpToOneDecimal(totalDiscount),
    };

    console.log(`[RESULT] Final Price (rounded): $${rounded.finalPrice}`);
    console.log(`--- ✅ CALCULATION COMPLETE ✅ ---\n`);

    return {
        finalPrice: rounded.finalPrice,
        provider: providerName,
        bundleName: upperPackage.name,
        requestedDays,
        calculation: {
            upperPackagePrice: rounded.upperPackagePrice,
            totalDiscount: rounded.totalDiscount,
            unusedDays,
            finalPriceBeforeRounding: finalPrice,
        }
    };
}
