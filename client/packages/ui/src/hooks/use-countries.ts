'use client';
import { useState, useEffect } from 'react';

export interface Country {
  id: string;
  name: string;
  nameHebrew?: string;
  iso: string;
  flag: string;
  region?: string;
  keywords?: string[];
}

export interface UseCountriesOptions {
  // Optional fetcher function that returns countries
  fetcher?: () => Promise<Country[]>;
  // Initial countries data
  initialData?: Country[];
  // Whether to sort countries
  sort?: boolean;
  // Sort locale (default: 'en')
  sortLocale?: string;
  // Sort by field (default: 'name')
  sortBy?: 'name' | 'nameHebrew' | 'iso';
}

export interface UseCountriesReturn {
  countries: Country[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useCountries({
  fetcher,
  initialData = [],
  sort = true,
  sortLocale = 'en',
  sortBy = 'name'
}: UseCountriesOptions = {}): UseCountriesReturn {
  const [countries, setCountries] = useState<Country[]>(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchCountries = async () => {
    if (!fetcher) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await fetcher();
      setCountries(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch countries'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (fetcher && countries.length === 0) {
      fetchCountries();
    }
  }, [fetcher]);

  // Sort countries if requested
  const sortedCountries = sort
    ? [...countries].sort((a, b) => {
        const aValue = a[sortBy] || '';
        const bValue = b[sortBy] || '';
        return aValue.localeCompare(bValue, sortLocale);
      })
    : countries;

  return {
    countries: sortedCountries,
    loading,
    error,
    refetch: fetchCountries
  };
}

// Utility function to transform countries for combobox components
export function countriesToComboboxOptions(countries: Country[]) {
  return countries.map(country => ({
    value: country.id,
    label: country.name,
    icon: country.flag,
    keywords: [
      country.nameHebrew,
      country.iso,
      ...(country.keywords || [])
    ].filter(Boolean) as string[]
  }));
}