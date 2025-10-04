// backend/packages/rules-engine-2/src/simple-pricer/simple-pricer.ts

import { getSupabaseClient } from '../supabase'; // ודא שהנתיב נכון

const supabase = getSupabaseClient();

// --- פונקציית עזר לשליפת ה-Markup המתאים ---
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


// --- פונקציית התמחור הראשית ---
export async function calculateSimplePrice(countryIso: string, requestedDays: number) {
  
  // --- שלב 1: בחירת ספק וחבילות מתאימות ---
  let providerName = 'maya';
  
  let { data: bundles, error } = await supabase
    .from('catalog_bundles')
    .select('*, catalog_providers!inner(id, name), catalog_bundle_countries!inner(country_iso2)')
    .eq('catalog_providers.name', providerName)
    .eq('catalog_bundle_countries.country_iso2', countryIso)
    .order('validity_days', { ascending: true });

  if (!bundles || bundles.length === 0) {
    providerName = 'esim-go';
    const { data: esimGoBundles, error: esimGoError } = await supabase
      .from('catalog_bundles')
      .select('*, catalog_providers!inner(id, name), catalog_bundle_countries!inner(country_iso2)')
      .eq('catalog_providers.name', providerName)
      .eq('catalog_bundle_countries.country_iso2', countryIso)
      .order('validity_days', { ascending: true });

    if (esimGoError || !esimGoBundles || esimGoBundles.length === 0) {
      throw new Error(`No bundles found for country ${countryIso} from any provider.`);
    }
    bundles = esimGoBundles;
  }

  // --- שלב 2: איתור חבילות ---
  const upperPackage = bundles.find(b => b.validity_days >= requestedDays);

  if (!upperPackage) {
    throw new Error(`No bundle covers ${requestedDays} days for country ${countryIso}.`);
  }
  
  const lowerPackage = bundles
    .filter(b => b.validity_days < upperPackage.validity_days)
    .pop();

  // --- חישוב ---
  const unusedDays = upperPackage.validity_days - requestedDays;

  if (upperPackage.validity_days === requestedDays || !lowerPackage) {
    const markup = await getMarkup(upperPackage.provider_id, upperPackage.plan_type, upperPackage.validity_days);
    const finalPrice = upperPackage.price_usd + markup;
    
    return {
      finalPrice: Math.ceil(finalPrice),
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

  const upperMarkup = await getMarkup(upperPackage.provider_id, upperPackage.plan_type, upperPackage.validity_days);
  const lowerMarkup = await getMarkup(lowerPackage.provider_id, lowerPackage.plan_type, lowerPackage.validity_days);
  const upperPackagePrice = upperPackage.price_usd + upperMarkup;

  const markupDifference = upperMarkup - lowerMarkup;
  const dayDifference = upperPackage.validity_days - lowerPackage.validity_days;

  const discountPerDay = dayDifference > 0 ? markupDifference / dayDifference : 0;
  const totalDiscount = unusedDays * discountPerDay;
  const finalPriceBeforeRounding = upperPackagePrice - totalDiscount;
  const finalPrice = Math.ceil(finalPriceBeforeRounding);

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

