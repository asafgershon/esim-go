// backend/packages/rules-engine-2/src/simple-pricer/simple-pricer.ts

import { getSupabaseClient } from '../supabase';

const supabase = getSupabaseClient();

type Bundle = {
    id: number;
    name: string;
    validity_days: number;
    price_usd: number;
    provider_id: number;
    plan_type: string;
};

// --- FIX #1: Rewritten getMarkup function to find nearest lower duration ---
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


// --- Main pricing function with STANDARD & lowest-price priority ---
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

        // Keep only STANDARD for Maya (for consistency)
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

    // --- Filter STANDARD only and sort by validity_days ---
    let standardBundles = bundles.filter(b => b.plan_type?.toUpperCase() === 'STANDARD');
    if (standardBundles.length === 0) {
        console.warn(`[WARN] No STANDARD bundles found for ${countryIso}, using all bundles.`);
        standardBundles = bundles;
    }

    // Sort ascending by validity days (e.g. 7, 15, 30, 60...)
    standardBundles.sort((a, b) => a.validity_days - b.validity_days);

    // --- Select the cheapest eligible bundle ---
    const eligibleBundles = standardBundles.filter(b => b.validity_days >= requestedDays);
    if (eligibleBundles.length === 0) {
        throw new Error(`No bundle covers ${requestedDays} days for ${countryIso}.`);
    }

    const upperPackage = eligibleBundles.sort((a, b) => a.price_usd - b.price_usd)[0];
    const lowerPackage = standardBundles
        .filter(b => b.validity_days < upperPackage.validity_days)
        .sort((a, b) => b.validity_days - a.validity_days)[0];

    // --- FIX #2: Corrected unusedDays calculation ---
    const upperPackageCleanDays = upperPackage.validity_days - 1;
    const unusedDays = upperPackageCleanDays - requestedDays;

    console.log(`[LOGIC] Upper Package: ${upperPackage.name} (${upperPackageCleanDays} clean days) | Cost: $${upperPackage.price_usd}`);
    if (lowerPackage) {
        console.log(`[LOGIC] Lower Package: ${lowerPackage.name} (${lowerPackage.validity_days - 1} clean days) | Cost: $${lowerPackage.price_usd}`);
    }
    console.log(`[CALC] Unused Days (Corrected): ${unusedDays}`);

    // --- Exact match or no lower package ---
    if (upperPackage.validity_days === requestedDays || !lowerPackage) {
        const markup = await getMarkup(upperPackage.provider_id, upperPackage.plan_type, upperPackageCleanDays);
        const finalPrice = upperPackage.price_usd + markup;
        console.log(`[RESULT] Final Price (Exact Match): $${finalPrice}`);
        console.log(`--- ✅ CALCULATION COMPLETE ✅ ---\n`);

        return {
            finalPrice,
            provider: providerName,
            bundleName: upperPackage.name,
            requestedDays,
            calculation: {
                upperPackagePrice: finalPrice,
                totalDiscount: 0,
                unusedDays: 0,
                finalPriceBeforeRounding: finalPrice
            },
            calculationDetails: 'Exact match or single available package.'
        };
    }

    // --- Interpolation calculation ---
    const lowerPackageCleanDays = lowerPackage.validity_days - 1;

    const upperMarkup = await getMarkup(upperPackage.provider_id, upperPackage.plan_type, upperPackageCleanDays);
    const lowerMarkup = await getMarkup(lowerPackage.provider_id, lowerPackage.plan_type, lowerPackageCleanDays);
    console.log(`[CALC] Upper Markup (for ${upperPackageCleanDays} days): $${upperMarkup}`);
    console.log(`[CALC] Lower Markup (for ${lowerPackageCleanDays} days): $${lowerMarkup}`);

    const upperPackagePrice = upperPackage.price_usd + upperMarkup;
    console.log(`[CALC] Upper Package Selling Price: $${upperPackagePrice}`);

    const dayDifference = upperPackageCleanDays - lowerPackageCleanDays;
    console.log(`[CALC] Day Difference (Clean): ${dayDifference}`);

    const markupValuePerDay = dayDifference > 0 ? upperMarkup / dayDifference : 0;
    console.log(`[CALC] Markup Value Per Day (for discount): $${markupValuePerDay}`);

    const totalDiscount = unusedDays * markupValuePerDay;
    console.log(`[CALC] Total Discount for ${unusedDays} unused days: $${totalDiscount}`);

    const finalPrice = upperPackagePrice - totalDiscount;
    console.log(`[RESULT] Final Price: $${finalPrice}`);
    console.log(`--- ✅ CALCULATION COMPLETE ✅ ---\n`);

    return {
        finalPrice,
        provider: providerName,
        bundleName: upperPackage.name,
        requestedDays,
        calculation: {
            upperPackagePrice,
            totalDiscount,
            unusedDays,
            finalPriceBeforeRounding: finalPrice
        }
    };
}
