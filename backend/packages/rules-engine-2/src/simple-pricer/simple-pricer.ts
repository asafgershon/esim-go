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

// --- Helper function to fetch the corresponding Markup ---
async function getMarkup(providerId: number, planType: string, duration: number): Promise<number> {
    const { data, error } = await supabase
        .from('markups')
        .select('markup_amount')
        .eq('provider_id', providerId)
        .eq('plan_type', planType)
        .eq('duration_days', duration)
        .single();
    if (error || !data) {
        console.log(`[DEBUG] Markup not found for provider ${providerId}, plan ${planType}, duration ${duration}. Returning 0.`);
        return 0;
    }
    return data.markup_amount;
}


// --- Main pricing function with YOUR specified logic ---
export async function calculateSimplePrice(countryIso: string, requestedDays: number) {
    console.log(`\n\n--- 🚀 STARTING NEW CALCULATION 🚀 ---`);
    console.log(`[INPUT] Country: ${countryIso}, Requested Days: ${requestedDays}`);

    async function getBundlesForProvider(providerName: string, country: string): Promise<Bundle[]> {
        console.log(`[DB] Fetching bundles for Provider: ${providerName}, Country: ${country}`);
        const { data, error } = await supabase.rpc('get_bundles_for_country_and_provider', {
            p_country_iso: country,
            p_provider_name: providerName
        });
        if (error) {
            console.error(`[DB ERROR] RPC failed for provider ${providerName} and country ${country}:`, error);
            return [];
        }
        
        let bundles = data as Bundle[];
        console.log(`[DB] Found ${bundles.length} bundles from ${providerName} before filtering.`);

        if (providerName === 'maya') {
            bundles = bundles.filter(b => b.plan_type === 'STANDARD');
            console.log(`[FILTER] After filtering for STANDARD plan, ${bundles.length} bundles remain from Maya.`);
        }

        return bundles;
    }
    
    let bundles: Bundle[] = await getBundlesForProvider('maya', countryIso);
    let providerName = 'maya';
    
    if (!bundles || bundles.length === 0) {
        console.log(`[LOGIC] No STANDARD bundles from Maya, switching to esim-go...`);
        bundles = await getBundlesForProvider('esim-go', countryIso);
        providerName = 'esim-go';
    }

    if (!bundles || bundles.length === 0) {
        console.error(`[FAIL] No bundles found for country ${countryIso} from any provider that match the criteria.`);
        throw new Error(`No bundles found for country ${countryIso} from any provider that match the criteria.`);
    }

    console.log(`[LOGIC] Using provider: ${providerName}`);

    const upperPackage = bundles.find(b => b.validity_days >= requestedDays);
    if (!upperPackage) {
        console.error(`[FAIL] No bundle covers ${requestedDays} days.`);
        throw new Error(`No bundle covers ${requestedDays} days for country ${countryIso}.`);
    }
    
    const lowerPackage = bundles
        .filter(b => b.validity_days < upperPackage.validity_days)
        .pop();

    console.log(`[LOGIC] Upper Package: ${upperPackage.name} (${upperPackage.validity_days} days) | Cost: $${upperPackage.price_usd}`);
    if (lowerPackage) {
        console.log(`[LOGIC] Lower Package: ${lowerPackage.name} (${lowerPackage.validity_days} days) | Cost: $${lowerPackage.price_usd}`);
    } else {
        console.log(`[LOGIC] No Lower Package found.`);
    }

    const unusedDays = upperPackage.validity_days - requestedDays;
    console.log(`[CALC] Unused Days: ${unusedDays}`);

    if (upperPackage.validity_days === requestedDays || !lowerPackage) {
        console.log(`[LOGIC] Exact match or no lower package. Calculating simple price.`);
        const markup = await getMarkup(upperPackage.provider_id, upperPackage.plan_type, upperPackage.validity_days);
        console.log(`[CALC] Markup for Upper Package: $${markup}`);
        const finalPrice = upperPackage.price_usd + markup;
        console.log(`[RESULT] Final Price: $${finalPrice}`);
        console.log(`--- ✅ CALCULATION COMPLETE ✅ ---\n`);
        return { finalPrice, provider: providerName, bundleName: upperPackage.name, requestedDays, calculation: { upperPackagePrice: finalPrice, totalDiscount: 0, unusedDays: 0, finalPriceBeforeRounding: finalPrice }, calculationDetails: 'Exact match or single available package.'};
    }

    // --- Interpolation calculation with YOUR FORMULA ---
    console.log(`[LOGIC] Interpolation needed. Calculating discount...`);
    const upperMarkup = await getMarkup(upperPackage.provider_id, upperPackage.plan_type, upperPackage.validity_days);
    // We don't need lowerMarkup for the discount calculation itself per your formula, but it's good for logging
    const lowerMarkup = await getMarkup(lowerPackage.provider_id, lowerPackage.plan_type, lowerPackage.validity_days);
    console.log(`[CALC] Upper Markup: $${upperMarkup}`);
    console.log(`[CALC] Lower Markup: $${lowerMarkup}`);

    const upperPackagePrice = upperPackage.price_usd + upperMarkup;
    console.log(`[CALC] Upper Package Selling Price: $${upperPackagePrice}`);

    const dayDifference = upperPackage.validity_days - lowerPackage.validity_days;
    console.log(`[CALC] Day Difference: ${dayDifference}`);

    // YOUR FORMULA IMPLEMENTED HERE:
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