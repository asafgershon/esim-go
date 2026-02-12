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
    discount?: SimplePricingDiscount;
}

type Bundle = {
    id: number;
    name: string;
    validity_days: number;
    price_usd: number;
    provider_id: number;
    plan_type: string;
    external_id: String; //i had this!!!!1
};

// ✅ פונקציה לעיגול למעלה לספרה אחת אחרי הנקודה
function roundUpToOneDecimal(value: number): number {
    return Math.ceil(value * 4) / 4;
}

async function getMarkup(providerId: number, planType: string, duration: number): Promise<number> {
    console.log(`[SIMPLE_PRICER] getMarkup() called — providerId=${providerId}, planType=${planType}, duration=${duration}`);

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
        console.log(`[SIMPLE_PRICER] getMarkup() — no markup found (error=${error?.message || 'no data'}), returning 0`);
        return 0;
    }

    console.log(`[SIMPLE_PRICER] getMarkup() — found markup_amount=${data.markup_amount}`);
    return data.markup_amount;
}

export async function calculateSimplePrice(countryIso: string, requestedDays: number) {
    console.log(`[SIMPLE_PRICER] ========== calculateSimplePrice START ==========`);
    console.log(`[SIMPLE_PRICER] Input: countryIso=${countryIso}, requestedDays=${requestedDays}`);

    async function getBundlesForProvider(providerName: string, country: string): Promise<Bundle[]> {
        console.log(`[SIMPLE_PRICER] getBundlesForProvider() — provider=${providerName}, country=${country}`);

        const { data, error } = await supabase.rpc('get_bundles_for_country_and_provider', {
            p_country_iso: country,
            p_provider_name: providerName
        });

        if (error) {
            console.log(`[SIMPLE_PRICER] getBundlesForProvider() — ERROR from Supabase RPC: ${error.message}`);
            return [];
        }

        let bundles = data as Bundle[];
        console.log(`[SIMPLE_PRICER] getBundlesForProvider() — loaded ${bundles.length} raw bundles`);

        if (providerName === "maya") {
            // בסיסיים: רק STANDARD
            const base = bundles.filter(
                (b) => b.plan_type?.toUpperCase() === "STANDARD"
            );
            console.log(`[SIMPLE_PRICER] Maya STANDARD filter — ${base.length} bundles`);

            // 🔹 קבוצה בלי +
            const noPlus = base.filter((b) => !b.name.includes("+"));

            // 🔸 קבוצה עם +
            const withPlus = base.filter((b) => b.name.includes("+"));

            console.log(`[SIMPLE_PRICER] Maya split — noPlus=${noPlus.length}, withPlus=${withPlus.length}`);
            bundles = noPlus.length > 0 ? noPlus : withPlus;
        }

        console.log(`[SIMPLE_PRICER] getBundlesForProvider() — returning ${bundles.length} bundles: ${bundles.map(b => `${b.name}(${b.validity_days}d/$${b.price_usd})`).join(', ')}`);
        return bundles;
    }

    // --- Load bundles ---
    let bundles: Bundle[] = await getBundlesForProvider('maya', countryIso);
    let providerName = 'maya';

    if (!bundles || bundles.length === 0) {
        console.log(`[SIMPLE_PRICER] ❌ No bundles found for country ${countryIso} — throwing error`);
        throw new Error(`No bundles found for country ${countryIso}.`);
    }

    // --- Convert validity_days to clean days (supplier offset fix) ---
    console.log(`[SIMPLE_PRICER] Applying -1 day offset (supplier fix)...`);
    bundles = bundles.map(b => ({
        ...b,
        validity_days: b.validity_days - 1 // ✅ FIX: suppliers store +1 day artificially
    }));
    console.log(`[SIMPLE_PRICER] After offset: ${bundles.map(b => `${b.name}(${b.validity_days}d)`).join(', ')}`);

    // --- Filter STANDARD only and sort ---
    let standardBundles = bundles.filter(b => b.plan_type?.toUpperCase() === 'STANDARD');
    console.log(`[SIMPLE_PRICER] STANDARD filter — ${standardBundles.length} bundles`);
    if (standardBundles.length === 0) {
        console.log(`[SIMPLE_PRICER] No STANDARD bundles, falling back to all ${bundles.length} bundles`);
        standardBundles = bundles;
    }

    standardBundles.sort((a, b) => a.validity_days - b.validity_days);
    console.log(`[SIMPLE_PRICER] Sorted standard bundles: ${standardBundles.map(b => `${b.name}(${b.validity_days}d/$${b.price_usd})`).join(', ')}`);

    // --- Select eligible bundles based on clean days ---
    const eligibleBundles = standardBundles.filter(b => b.validity_days >= requestedDays);
    console.log(`[SIMPLE_PRICER] Eligible bundles (validity >= ${requestedDays}d): ${eligibleBundles.length} bundles — ${eligibleBundles.map(b => `${b.name}(${b.validity_days}d/$${b.price_usd})`).join(', ') || 'NONE'}`);

    if (eligibleBundles.length === 0) {
        console.log(`[SIMPLE_PRICER] ❌ No bundle covers ${requestedDays} days for ${countryIso} — throwing error`);
        throw new Error(`No bundle covers ${requestedDays} days for ${countryIso}.`);
    }

    const upperPackage = eligibleBundles.sort((a, b) => a.price_usd - b.price_usd)[0];
    console.log(`[SIMPLE_PRICER] Upper package selected: ${upperPackage.name} — ${upperPackage.validity_days}d, $${upperPackage.price_usd}, provider_id=${upperPackage.provider_id}`);

    // ✅ FIX 1: Handle case where no lowerPackage exists
    const lowerPackage = standardBundles
        .filter(b => b.validity_days < upperPackage.validity_days)
        .sort((a, b) => b.validity_days - a.validity_days)[0] || null;

    console.log(`[SIMPLE_PRICER] Lower package: ${lowerPackage ? `${lowerPackage.name}(${lowerPackage.validity_days}d/$${lowerPackage.price_usd})` : 'NONE (null)'}`);

    const upperPackageCleanDays = upperPackage.validity_days;
    const lowerPackageCleanDays = lowerPackage ? lowerPackage.validity_days : 0; // ✅ fallback = 0
    const unusedDays = upperPackageCleanDays - requestedDays;

    console.log(`[SIMPLE_PRICER] Days calculation: upperClean=${upperPackageCleanDays}, lowerClean=${lowerPackageCleanDays}, unusedDays=${unusedDays}`);

    // --- Calculate markups ---
    const upperMarkup = await getMarkup(upperPackage.provider_id, upperPackage.plan_type, upperPackageCleanDays);
    const lowerMarkup = await getMarkup(upperPackage.provider_id, upperPackage.plan_type, lowerPackageCleanDays);

    console.log(`[SIMPLE_PRICER] Markups: upper=${upperMarkup}, lower=${lowerMarkup}`);

    const upperPackagePrice = upperPackage.price_usd + upperMarkup;

    const dayDifference = Math.max(upperPackageCleanDays - lowerPackageCleanDays, 1);

    const markupValuePerDay = (upperMarkup - lowerMarkup) / dayDifference;

    console.log(`[SIMPLE_PRICER] Discount calc: upperPackagePrice=$${upperPackagePrice}, dayDifference=${dayDifference}, markupValuePerDay=$${markupValuePerDay}`);

    const totalDiscount = Math.max(unusedDays, 0) * markupValuePerDay;

    const finalPrice = upperPackagePrice - totalDiscount;

    console.log(`[SIMPLE_PRICER] Pre-rounding: totalDiscount=$${totalDiscount}, finalPrice=$${finalPrice}`);

    // ✅ עיגול למעלה לספרה אחת אחרי הנקודה
    const rounded = {
        finalPrice: roundUpToOneDecimal(finalPrice),
        upperPackagePrice: roundUpToOneDecimal(upperPackagePrice),
        totalDiscount: roundUpToOneDecimal(totalDiscount),
    };

    console.log(`[SIMPLE_PRICER] Rounded result: finalPrice=$${rounded.finalPrice}, upperPackagePrice=$${rounded.upperPackagePrice}, totalDiscount=$${rounded.totalDiscount}`);
    console.log(`[SIMPLE_PRICER] ========== calculateSimplePrice END — returning $${rounded.finalPrice} for ${requestedDays}d ==========`);

    return {
        finalPrice: rounded.finalPrice,
        provider: providerName,
        bundleName: upperPackage.name,
        requestedDays,
        externalId: upperPackage.external_id,
        calculation: {
            upperPackagePrice: rounded.upperPackagePrice,
            totalDiscount: rounded.totalDiscount,
            unusedDays,
            finalPriceBeforeRounding: finalPrice,
        },
    };
}
