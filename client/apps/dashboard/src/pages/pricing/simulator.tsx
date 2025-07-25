import React from 'react';
import { useQuery } from '@apollo/client';
import { PricingSimulatorSplitView } from '../../components/pricing-simulator-split-view';
import { GET_COUNTRIES } from '../../lib/graphql/queries';
import { GetCountriesQuery } from '@/__generated__/graphql';

export const PricingSimulatorPage: React.FC = () => {
  const { data: countriesData, loading } = useQuery<GetCountriesQuery>(GET_COUNTRIES);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading countries...</span>
      </div>
    );
  }

  return (
    <div className="h-full">
      <PricingSimulatorSplitView countries={countriesData?.countries || []} />
    </div>
  );
};