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
        console.error(`Markup not found for provider ${providerId}, plan ${planType}, duration ${duration}`, error);
        return 0;
    }
    return data.markup_amount;
}


// --- Main pricing function (Final corrected version) ---
export async function calculateSimplePrice(countryIso: string, requestedDays: number) {

    async function getBundlesForProvider(providerName: string, country: string): Promise<Bundle[]> {
        const { data, error } = await supabase.rpc('get_bundles_for_country_and_provider', {
            p_country_iso: country,
            p_provider_name: providerName
        });

        if (error) {
            console.error(`RPC failed for provider ${providerName} and country ${country}:`, error);
            return [];
        }
        return data as Bundle[];
    }
    
    let bundles: Bundle[] = await getBundlesForProvider('maya', countryIso);
    let providerName = 'maya';
    
    if (!bundles || bundles.length === 0) {
        console.log(`No bundles from Maya for ${countryIso}, trying esim-go...`);
        bundles = await getBundlesForProvider('esim-go', countryIso);
        providerName = 'esim-go';
    }

    if (!bundles || bundles.length === 0) {
        throw new Error(`No bundles found for country ${countryIso} from any provider.`);
    }

    const upperPackage = bundles.find(b => b.validity_days >= requestedDays);
    if (!upperPackage) {
        throw new Error(`No bundle covers ${requestedDays} days for country ${countryIso}.`);
    }
    
    const lowerPackage = bundles
        .filter(b => b.validity_days < upperPackage.validity_days)
        .pop();

    const unusedDays = upperPackage.validity_days - requestedDays;

    // --- Calculation for exact match or single available package ---
    if (upperPackage.validity_days === requestedDays || !lowerPackage) {
        const markup = await getMarkup(upperPackage.provider_id, upperPackage.plan_type, upperPackage.validity_days);
        const finalPrice = upperPackage.price_usd + markup;
        
        return {
            finalPrice: finalPrice, // FIX #1: Removed Math.ceil()
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

    // --- Interpolation calculation for other cases ---
    const upperMarkup = await getMarkup(upperPackage.provider_id, upperPackage.plan_type, upperPackage.validity_days);
    const lowerMarkup = await getMarkup(lowerPackage.provider_id, lowerPackage.plan_type, lowerPackage.validity_days);
    const upperPackagePrice = upperPackage.price_usd + upperMarkup;

    const markupDifference = upperMarkup - lowerMarkup;
    const dayDifference = upperPackage.validity_days - lowerPackage.validity_days;

    const discountPerDay = dayDifference > 0 ? markupDifference / dayDifference : 0;
    const totalDiscount = unusedDays * discountPerDay;
    const finalPriceBeforeRounding = upperPackagePrice - totalDiscount;
    const finalPrice = finalPriceBeforeRounding; // FIX #2: Removed Math.ceil()

    return {
        finalPrice,
        provider: providerName,
        bundleName: upperPackage.name,
        requestedDays,
        calculation: {
            upperPackagePrice,
            totalDiscount,
            unusedDays,
            finalPriceBeforeRounding
        }
    };
}