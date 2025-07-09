import { useQuery } from '@apollo/client';
import { GET_TRIPS } from '@/lib/graphql/mutations';
import type { Trip as GraphQLTrip } from '@/__generated__/types';

// Enhanced trip interface that matches what the component expects
export interface EnhancedTrip {
  id: string;
  name: string;
  nameHebrew: string;
  icon: string;
  countries: string[];
  description: string;
  countryCount: number;
  basePrice: number;
}

// Trip icons mapping based on region names
const tripIcons: Record<string, string> = {
  'south-america': '🌍',
  'africa': '🦁',
  'african-safari': '🦁',
  'europe': '🏰',
  'east-asia': '🍜',
  'asia': '🍜',
  'caribbean': '🏖️',
  'middle-east': '🏛️',
  'north-america': '🗽',
  'oceania': '🌊',
  'default': '🌍'
};

// Base prices for different regions
const basePrices: Record<string, number> = {
  'south-america': 5.04,
  'africa': 5.04,
  'african-safari': 5.04,
  'europe': 2.5,
  'east-asia': 3.0,
  'asia': 3.0,
  'caribbean': 5.4,
  'middle-east': 4.0,
  'north-america': 4.5,
  'oceania': 6.0,
  'default': 3.0
};

export function useTrips() {
  const { data, loading, error, refetch } = useQuery(GET_TRIPS, {
    errorPolicy: 'all',
    notifyOnNetworkStatusChange: true,
  });

  // Transform GraphQL trips to enhanced trips
  const trips: EnhancedTrip[] = data?.trips?.map((trip: GraphQLTrip) => {
    const regionKey = trip.regionId.toLowerCase();
    const icon = tripIcons[regionKey] || tripIcons.default;
    const basePrice = basePrices[regionKey] || basePrices.default;
    
    return {
      id: trip.regionId,
      name: trip.name,
      nameHebrew: trip.description.split(' - ')[0] || trip.name, // Extract Hebrew name from description
      icon,
      countries: [], // No longer loading individual country names to prevent N+1 queries
      description: trip.description,
      countryCount: trip.countryIds.length,
      basePrice
    };
  }) || [];

  return {
    trips,
    loading,
    error,
    refetch
  };
} 