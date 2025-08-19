/**
 * This file demonstrates how to use the new strategy hooks
 * Remove this file after implementation is complete
 */

import {
  useStrategies,
  useActiveStrategies,
  useSearchStrategies,
  useLoadStrategy,
  useLoadDefaultStrategy,
} from "../hooks";

// Example: Strategy Selection Modal
export const StrategySelectionExample = () => {
  // Get all active strategies for selection
  const { strategies, loading, error, refetch } = useActiveStrategies();

  // Search functionality
  const { strategies: searchResults } = useSearchStrategies("pricing");

  // Example usage:
  // - strategies: Array of DatabasePricingStrategy objects
  // - loading: boolean indicating fetch status
  // - error: any GraphQL errors
  // - refetch: function to refresh the data
};

// Example: Load Strategy into Builder
export const LoadStrategyExample = () => {
  const strategyId = "strategy-123";
  
  // Load a specific strategy with blocks
  const {
    strategy,
    loading,
    error,
    loadStrategyIntoBuilder,
  } = useLoadStrategy(strategyId);

  // Convert strategy blocks to UI format for drag-and-drop
  const handleLoadStrategy = () => {
    const uiBlocks = loadStrategyIntoBuilder();
    // uiBlocks is an array of StrategyStep objects ready for the builder
    // Each block has: id, uniqueId, type, name, description, icon, color, params, config
  };

  // Load default strategy
  const {
    strategy: defaultStrategy,
    loadStrategyIntoBuilder: loadDefaultIntoBuilder,
  } = useLoadDefaultStrategy();
};

// Example: Advanced Filtering
export const AdvancedFilteringExample = () => {
  // Custom filtering
  const { strategies } = useStrategies({
    archived: false,
    isDefault: false,
    search: "markup",
  });

  // Get only default strategies
  const { strategies: defaultStrategies } = useStrategies({
    isDefault: true,
  });

  // Get archived strategies
  const { strategies: archivedStrategies } = useStrategies({
    archived: true,
  });
};