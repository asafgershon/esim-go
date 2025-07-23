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

// Base prices for different regions - TODO: These should come from the database/rules engine
// For now using 0 to force proper pricing calculation through rules engine
const basePrices: Record<string, number> = {
  'south-america': 0,
  'africa': 0,
  'african-safari': 0,
  'europe': 0,
  'east-asia': 0,
  'asia': 0,
  'caribbean': 0,
  'middle-east': 0,
  'north-america': 0,
  'oceania': 0,
  'default': 0
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