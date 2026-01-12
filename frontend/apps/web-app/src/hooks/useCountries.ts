import { useQuery } from '@apollo/client';
// FIX: Import the new, simpler query
import { GET_COUNTRIES } from '@/lib/graphql/queries/queries'; 
import type { Country, GetCountriesQuery } from '@/__generated__/types';

// Enhanced country interface that includes computed properties
export interface EnhancedCountry extends Country {
  id: string;
  tagline: string;
  basePrice: number;
}

// Taglines for countries - this logic remains the same, as you liked it.
const taglines: string[] = [
  'חיבור מושלם',
  'נתונים ללא סוף', 
  'חיבור רצוף',
  'בלי גבולות',
  'חופש מלא',
  'תמיד מחובר',
  'רשת אמינה',
  'כיסוי מלא',
  'מהירות גבוהה',
  'חיבור יציב'
];

export function useCountries() {
  // FIX: Call the new GET_COUNTRIES query
  const { data, loading, error, refetch } = useQuery<GetCountriesQuery>(GET_COUNTRIES, {
    errorPolicy: 'all',
  });

  const europe: EnhancedCountry = {
  iso: "EU",
  name: "Europe",
  nameHebrew: "אירופה",
  // אם יש לך שדות נוספים ב-Country 타입 (כמו flag, dialCode וכו') תן להם ערכים ברירת מחדל
  id: "eu",
  tagline: "אירופה", // או מה שבא לך
  basePrice: 2.5,
};

  // FIX: Process the data from the new, simpler structure (data.countries instead of data.bundlesByCountry)
  const countries: EnhancedCountry[] = data?.countries?.map((country, index: number) => ({
    ...country,
    id: country.iso.toLowerCase(),
    tagline: taglines[index % taglines.length],
    basePrice: 2.5, // Default base price
  })) || [];

  if (!countries.some(c => c.id === "eu")) {
  countries.unshift(europe); // או push אם אתה רוצה בסוף
}

  // Sort by Hebrew name - this logic also remains the same.
  const sortedCountries = countries.sort((a, b) => 
    (a.nameHebrew || '').localeCompare(b.nameHebrew || '', 'he')
  );

  return {
    countries: sortedCountries,
    loading,
    error,
    refetch
  };
}
