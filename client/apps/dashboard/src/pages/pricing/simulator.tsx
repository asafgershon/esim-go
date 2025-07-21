import React from 'react';
import { useQuery } from '@apollo/client';
import { PricingSimulatorContent } from '../../components/pricing-simulator-content';
import { GET_COUNTRIES } from '../../lib/graphql/queries';

export const PricingSimulatorPage: React.FC = () => {
  const { data: countriesData, loading } = useQuery(GET_COUNTRIES);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading countries...</span>
      </div>
    );
  }

  return <PricingSimulatorContent countries={countriesData?.countries || []} />;
};