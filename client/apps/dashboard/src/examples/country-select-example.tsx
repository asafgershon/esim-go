// Example usage of the new CountrySelect and MultiCountrySelect components
// This file demonstrates how to use the unified country selectors

import { CountrySelect, MultiCountrySelect } from '@workspace/ui';
import { useQuery } from '@apollo/client';
import { GET_COUNTRIES } from '@/lib/graphql/queries';

// Example 1: Basic CountrySelect with static data
export function BasicCountrySelectExample() {
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  
  const staticCountries = [
    { id: 'us', name: 'United States', iso: 'US', flag: '🇺🇸' },
    { id: 'gb', name: 'United Kingdom', iso: 'GB', flag: '🇬🇧' },
    { id: 'fr', name: 'France', iso: 'FR', flag: '🇫🇷' },
  ];

  return (
    <CountrySelect
      countries={staticCountries}
      value={selectedCountry}
      onValueChange={setSelectedCountry}
      placeholder="Select a country"
    />
  );
}

// Example 2: CountrySelect with GraphQL data
export function GraphQLCountrySelectExample() {
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const { data, loading } = useQuery(GET_COUNTRIES);

  const countries = data?.countries?.map(c => ({
    id: c.iso,
    name: c.name,
    iso: c.iso,
    flag: c.flag || '',
    keywords: [c.nameHebrew]
  })) || [];

  return (
    <CountrySelect
      countries={countries}
      value={selectedCountry}
      onValueChange={setSelectedCountry}
      placeholder="Select a country"
      loading={loading}
    />
  );
}

// Example 3: CountrySelect with async loader
export function AsyncCountrySelectExample() {
  const [selectedCountry, setSelectedCountry] = useState<string>('');

  const loadCountries = async () => {
    // Simulate API call
    const response = await fetch('/api/countries');
    const data = await response.json();
    return data.countries;
  };

  return (
    <CountrySelect
      value={selectedCountry}
      onValueChange={setSelectedCountry}
      placeholder="Select a country"
      onLoadCountries={loadCountries}
    />
  );
}

// Example 4: MultiCountrySelect for multiple selection
export function MultiCountrySelectExample() {
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const { data, loading } = useQuery(GET_COUNTRIES);

  const countries = data?.countries?.map(c => ({
    id: c.iso,
    name: c.name,
    iso: c.iso,
    flag: c.flag || '',
    keywords: [c.nameHebrew]
  })) || [];

  return (
    <MultiCountrySelect
      countries={countries}
      value={selectedCountries}
      onValueChange={setSelectedCountries}
      placeholder="Select countries..."
      loading={loading}
      maxSelection={5} // Optional: limit selection
    />
  );
}

// Example 5: Using the shared useCountries hook
import { useCountries } from '@workspace/ui';

export function UseCountriesHookExample() {
  const { countries, loading, error, refetch } = useCountries({
    fetcher: async () => {
      const response = await fetch('/api/countries');
      const data = await response.json();
      return data.countries;
    },
    sort: true,
    sortBy: 'name',
    sortLocale: 'en'
  });

  if (loading) return <div>Loading countries...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <button onClick={refetch}>Refresh Countries</button>
      <ul>
        {countries.map(country => (
          <li key={country.id}>
            {country.flag} {country.name}
          </li>
        ))}
      </ul>
    </div>
  );
}