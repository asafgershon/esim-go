import { useQuery } from "@apollo/client";
import { GET_PRICING_STRATEGY, GET_DEFAULT_PRICING_STRATEGY } from "../graphql/queries/strategies";
import {
  UseLoadStrategyResult,
  DatabasePricingStrategyWithBlocks,
  mapStrategyToUIFormat,
} from "../types/strategies";
import { StrategyStep } from "../pages/pricing/types";

/**
 * Hook to load a specific pricing strategy by ID with its blocks
 * 
 * @param strategyId The ID of the strategy to load
 * @returns Object containing strategy data, loading state, error, refetch function, and helper to load into builder
 */
export const useLoadStrategy = (strategyId: string | null): UseLoadStrategyResult => {
  const { data, loading, error, refetch } = useQuery(GET_PRICING_STRATEGY, {
    variables: { id: strategyId },
    skip: !strategyId, // Skip query if no ID provided
    errorPolicy: "all", // Return partial data on errors
    notifyOnNetworkStatusChange: true,
    fetchPolicy: "cache-and-network", // Always fetch fresh data but show cache first
  });

  const strategy = data?.pricingStrategy as DatabasePricingStrategyWithBlocks | null;

  /**
   * Converts the loaded strategy into the format needed by the drag-and-drop builder
   * Returns strategy blocks sorted by priority and mapped to UI format
   */
  const loadStrategyIntoBuilder = (): StrategyStep[] => {
    if (!strategy) return [];
    return mapStrategyToUIFormat(strategy);
  };

  return {
    strategy,
    loading,
    error,
    refetch,
    loadStrategyIntoBuilder,
  };
};

/**
 * Hook to load the default pricing strategy
 * 
 * @returns Object containing default strategy data, loading state, error, refetch function, and helper to load into builder
 */
export const useLoadDefaultStrategy = (): UseLoadStrategyResult => {
  const { data, loading, error, refetch } = useQuery(GET_DEFAULT_PRICING_STRATEGY, {
    errorPolicy: "all", // Return partial data on errors
    notifyOnNetworkStatusChange: true,
    fetchPolicy: "cache-and-network", // Always fetch fresh data but show cache first
  });

  const strategy = data?.defaultPricingStrategy as DatabasePricingStrategyWithBlocks | null;

  /**
   * Converts the loaded default strategy into the format needed by the drag-and-drop builder
   * Returns strategy blocks sorted by priority and mapped to UI format
   */
  const loadStrategyIntoBuilder = (): StrategyStep[] => {
    if (!strategy) return [];
    return mapStrategyToUIFormat(strategy);
  };

  return {
    strategy,
    loading,
    error,
    refetch,
    loadStrategyIntoBuilder,
  };
};

/**
 * Hook that provides a function to load any strategy into the current builder state
 * This is useful when you want to load a strategy on-demand rather than automatically
 * 
 * @returns Function that takes a strategy ID and returns the UI-formatted blocks
 */
export const useStrategyLoader = () => {
  const loadStrategy = async (strategyId: string): Promise<StrategyStep[]> => {
    // This would typically use Apollo Client's query method to fetch the strategy
    // For now, we'll return an empty array - this can be enhanced based on specific needs
    return [];
  };

  return { loadStrategy };
};