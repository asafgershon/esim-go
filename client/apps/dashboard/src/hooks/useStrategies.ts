import { useQuery } from "@apollo/client";
import { GET_PRICING_STRATEGIES } from "../graphql/queries/strategies";
import {
  StrategyFilter,
  UseStrategiesResult,
  DatabasePricingStrategy,
} from "../types/strategies";

/**
 * Hook to fetch all pricing strategies from the database with optional filtering
 * 
 * @param filter Optional filtering criteria for strategies
 * @returns Object containing strategies array, loading state, error, and refetch function
 */
export const useStrategies = (filter?: StrategyFilter): UseStrategiesResult => {
  const { data, loading, error, refetch } = useQuery(GET_PRICING_STRATEGIES, {
    variables: { filter },
    errorPolicy: "all", // Return partial data on errors
    notifyOnNetworkStatusChange: true,
    fetchPolicy: "cache-and-network", // Always fetch fresh data but show cache first
  });

  return {
    strategies: (data?.pricingStrategies as DatabasePricingStrategy[]) || [],
    loading,
    error,
    refetch,
  };
};

/**
 * Hook to fetch only active (non-archived) strategies
 */
export const useActiveStrategies = (): UseStrategiesResult => {
  return useStrategies({ archived: false });
};

/**
 * Hook to fetch only archived strategies
 */
export const useArchivedStrategies = (): UseStrategiesResult => {
  return useStrategies({ archived: true });
};

/**
 * Hook to fetch the default strategy (if any)
 */
export const useDefaultStrategy = (): UseStrategiesResult => {
  return useStrategies({ isDefault: true });
};

/**
 * Hook to search strategies by name or code
 */
export const useSearchStrategies = (searchTerm: string): UseStrategiesResult => {
  return useStrategies({ search: searchTerm, archived: false });
};

export type { StrategyFilter };