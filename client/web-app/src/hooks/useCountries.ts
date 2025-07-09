import { useQuery } from '@apollo/client';
import { GET_COUNTRIES } from '@/lib/graphql/mutations';
import type { Country } from '@/__generated__/types';

// Enhanced country interface that includes computed properties
export interface EnhancedCountry extends Country {
  id: string;
  tagline: string;
  basePrice: number;
}

// Taglines for countries
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
  const { data, loading, error, refetch } = useQuery(GET_COUNTRIES, {
    errorPolicy: 'all',
    notifyOnNetworkStatusChange: true,
  });

  // Transform GraphQL countries to enhanced countries
  const countries: EnhancedCountry[] = data?.countries?.map((country: Country, index: number) => ({
    ...country,
    id: country.iso.toLowerCase(),
    tagline: taglines[index % taglines.length],
    basePrice: 2.5, // Default base price
  })) || [];

  // Sort by Hebrew name
  const sortedCountries = countries.sort((a, b) => 
    a.nameHebrew.localeCompare(b.nameHebrew, 'he')
  );

  return {
    countries: sortedCountries,
    loading,
    error,
    refetch
  };
} 