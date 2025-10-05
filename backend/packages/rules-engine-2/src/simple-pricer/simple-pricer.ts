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
        .lte('duration_days', duration) // Find all durations less than or equal to the requested one
        .order('duration_days', { ascending: false }) // Order them from highest to lowest
        .limit(1) // Take only the highest one
        .single();

    if (error || !data) {
        console.log(`[DEBUG] Markup not found for provider ${providerId}, plan ${planType}, duration <= ${duration}. Returning 0.`);
        return 0;
    }
    console.log(`[DEBUG] Markup FOUND for nearest duration <= ${duration}: $${data.markup_amount}`);
    return data.markup_amount;
}


// --- Main pricing function with all fixes ---
export async function calculateSimplePrice(countryIso: string, requestedDays: number) {
    console.log(`\n\n--- 🚀 STARTING NEW CALCULATION 🚀 ---`);
    console.log(`[INPUT] Country: ${countryIso}, Requested Days: ${requestedDays}`);

    async function getBundlesForProvider(providerName: string, country: string): Promise<Bundle[]> {
        // ... (this function is correct and remains the same)
        const { data, error } = await supabase.rpc('get_bundles_for_country_and_provider', {
            p_country_iso: country,
            p_provider_name: providerName
        });
        if (error) { console.error(`[DB ERROR] RPC failed...`); return []; }
        
        let bundles = data as Bundle[];
        if (providerName === 'maya') {
            bundles = bundles.filter(b => b.plan_type === 'STANDARD');
        }
        return bundles;
    }
    
    let bundles: Bundle[] = await getBundlesForProvider('maya', countryIso);
    let providerName = 'maya';
    if (!bundles || bundles.length === 0) {
        bundles = await getBundlesForProvider('esim-go', countryIso);
        providerName = 'esim-go';
    }

    if (!bundles || bundles.length === 0) {
        throw new Error(`No bundles found...`);
    }

    const upperPackage = bundles.find(b => b.validity_days >= requestedDays);
    if (!upperPackage) {
        throw new Error(`No bundle covers ${requestedDays} days...`);
    }
    
    const lowerPackage = bundles.filter(b => b.validity_days < upperPackage.validity_days).pop();

    // --- FIX #2: Corrected unusedDays calculation ---
    const upperPackageCleanDays = upperPackage.validity_days - 1;
    const unusedDays = upperPackageCleanDays - requestedDays;
    
    console.log(`[LOGIC] Upper Package: ${upperPackage.name} (${upperPackageCleanDays} clean days) | Cost: $${upperPackage.price_usd}`);
    if (lowerPackage) {
        console.log(`[LOGIC] Lower Package: ${lowerPackage.name} (${lowerPackage.validity_days - 1} clean days) | Cost: $${lowerPackage.price_usd}`);
    }
    console.log(`[CALC] Unused Days (Corrected): ${unusedDays}`);


    if (upperPackage.validity_days === requestedDays || !lowerPackage) {
        const markup = await getMarkup(upperPackage.provider_id, upperPackage.plan_type, upperPackageCleanDays);
        const finalPrice = upperPackage.price_usd + markup;
        console.log(`[RESULT] Final Price (Exact Match): $${finalPrice}`);
        return { finalPrice, provider: providerName, bundleName: upperPackage.name, requestedDays, calculation: { upperPackagePrice: finalPrice, totalDiscount: 0, unusedDays: 0, finalPriceBeforeRounding: finalPrice }, calculationDetails: 'Exact match or single available package.'};
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