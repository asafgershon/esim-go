import { useState, useCallback } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { toast } from 'sonner';
import { GET_HIGH_DEMAND_COUNTRIES, TOGGLE_HIGH_DEMAND_COUNTRY } from '../lib/graphql/queries';

export function useHighDemandCountries() {
  const [optimisticUpdates, setOptimisticUpdates] = useState<Record<string, boolean>>({});
  const [loadingCountries, setLoadingCountries] = useState<Set<string>>(new Set());

  // Query to get high demand countries
  const { data, loading, error, refetch } = useQuery(GET_HIGH_DEMAND_COUNTRIES, {
    errorPolicy: 'all'
  });

  // Mutation to toggle high demand status
  const [toggleHighDemandCountry] = useMutation(TOGGLE_HIGH_DEMAND_COUNTRY);

  // Get set of high demand country IDs for quick lookup
  const highDemandCountryIds = new Set(data?.highDemandCountries || []);

  // Check if a country is high demand (including optimistic updates)
  const isHighDemandCountry = useCallback((countryId: string): boolean => {
    // Check optimistic updates first
    if (countryId in optimisticUpdates) {
      return optimisticUpdates[countryId];
    }
    
    // Fallback to server data
    return highDemandCountryIds.has(countryId);
  }, [optimisticUpdates, highDemandCountryIds]);

  // Toggle high demand status with optimistic updates
  const toggleCountryHighDemand = useCallback(async (countryId: string) => {
    const currentStatus = isHighDemandCountry(countryId);
    const newStatus = !currentStatus;

    // Set loading state for this specific country
    setLoadingCountries(prev => new Set(prev).add(countryId));

    // Optimistic update
    setOptimisticUpdates(prev => ({
      ...prev,
      [countryId]: newStatus
    }));

    try {
      const result = await toggleHighDemandCountry({
        variables: { countryId },
      });

      if (result.data?.toggleHighDemandCountry?.success) {
        // Success - clear optimistic update and refetch
        setOptimisticUpdates(prev => {
          const newUpdates = { ...prev };
          delete newUpdates[countryId];
          return newUpdates;
        });

        // Refetch to get updated data
        await refetch();

        toast.success(
          newStatus
            ? 'Country marked as high demand'
            : 'Country removed from high demand'
        );
      } else {
        throw new Error(
          result.data?.toggleHighDemandCountry?.error || 'Failed to toggle high demand status'
        );
      }
    } catch (error) {
      // Revert optimistic update on error
      setOptimisticUpdates(prev => {
        const newUpdates = { ...prev };
        delete newUpdates[countryId];
        return newUpdates;
      });

      console.error('Error toggling high demand country:', error);
      toast.error(
        error instanceof Error 
          ? error.message 
          : 'Failed to toggle high demand status'
      );
    } finally {
      // Remove loading state for this country
      setLoadingCountries(prev => {
        const next = new Set(prev);
        next.delete(countryId);
        return next;
      });
    }
  }, [isHighDemandCountry, toggleHighDemandCountry, refetch]);

  // Check if a specific country is loading
  const isCountryLoading = useCallback((countryId: string): boolean => {
    return loadingCountries.has(countryId);
  }, [loadingCountries]);

  return {
    highDemandCountries: data?.highDemandCountries || [],
    loading,
    error,
    toggleLoading: loadingCountries.size > 0, // Keep for backward compatibility
    isHighDemandCountry,
    toggleCountryHighDemand,
    isCountryLoading,
  };
}