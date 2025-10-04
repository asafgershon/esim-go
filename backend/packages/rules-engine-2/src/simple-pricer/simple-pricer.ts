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
    return 0; // החזרת ערך ברירת מחדל בטוח
  }

  return data.markup_amount;
}


// --- פונקציית התמחור הראשית (גרסה מתוקנת סופית) ---
export async function calculateSimplePrice(countryIso: string, requestedDays: number) {

  // --- שלב 1: פונקציית עזר לשליפת חבילות לפי ספק (בצורה נכונה) ---
  async function getBundlesForProvider(providerName: string, country: string) {
    // שלב 1.1: מצא את כל מזהי החבילות למדינה הנתונה מהטבלה המקשרת
    const { data: countryLinks, error: linkError } = await supabase
      .from('catalog_bundle_countries')
      .select('bundle_id')
      .eq('country_iso2', country);
    
    if (linkError || !countryLinks || countryLinks.length === 0) {
      console.log(`No bundle links found for country ${country}`);
      return [];
    }
    const bundleIds = countryLinks.map(link => link.bundle_id);

    // שלב 1.2: שלוף את פרטי החבילות, וסנן גם לפי הספק
    const { data: bundles, error: bundlesError } = await supabase
      .from('catalog_bundles')
      .select('*, provider:catalog_providers!inner(id, name)')
      .in('id', bundleIds)
      .eq('provider.name', providerName)
      .order('validity_days', { ascending: true });
      
    if (bundlesError) {
        console.error(`Failed to fetch bundles for provider ${providerName}`, bundlesError);
        return [];
    }
    
    return bundles;
  }
  
  // --- שלב 2: נסה למצוא חבילות לפי סדר העדיפויות ---
  let bundles = await getBundlesForProvider('maya', countryIso);
  let providerName = 'maya';
  
  if (!bundles || bundles.length === 0) {
    console.log(`No bundles from Maya for ${countryIso}, trying esim-go...`);
    bundles = await getBundlesForProvider('esim-go', countryIso);
    providerName = 'esim-go';
  }

  if (!bundles || bundles.length === 0) {
    throw new Error(`No bundles found for country ${countryIso} from any provider.`);
  }

  // --- שלב 3: איתור חבילות (הלוגיקה מכאן נשארת זהה) ---
  const upperPackage = bundles.find(b => b.validity_days >= requestedDays);

  if (!upperPackage) {
    throw new Error(`No bundle covers ${requestedDays} days for country ${countryIso}.`);
  }
  
  const lowerPackage = bundles
    .filter(b => b.validity_days < upperPackage.validity_days)
    .pop();

  const unusedDays = upperPackage.validity_days - requestedDays;

  // --- חישוב ---
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