import { useQuery } from '@apollo/client';
import { GET_PRICING_FILTERS } from '../../../lib/graphql/queries';
import { GetPricingFiltersQuery, GetPricingFiltersQueryVariables } from '@/__generated__/graphql';


export const usePricingFilters = () => {
  const { data, loading, error } = useQuery<GetPricingFiltersQuery, GetPricingFiltersQueryVariables>(GET_PRICING_FILTERS, {
    errorPolicy: 'all'
  });

  return {
    filters: data?.pricingFilters || null,
    loading,
    error: error?.message || null
  };
};