import { useQuery } from '@apollo/client';
import { GET_PRICING_FILTERS } from '../../../lib/graphql/queries';
import type { PricingFilters } from './types';

export interface UsePricingFiltersResult {
  filters: PricingFilters | null;
  loading: boolean;
  error: string | null;
}

export const usePricingFilters = (): UsePricingFiltersResult => {
  const { data, loading, error } = useQuery(GET_PRICING_FILTERS, {
    errorPolicy: 'all'
  });

  return {
    filters: data?.pricingFilters || null,
    loading,
    error: error?.message || null
  };
};