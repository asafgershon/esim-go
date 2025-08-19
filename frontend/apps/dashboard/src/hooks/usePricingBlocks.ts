import { useQuery } from "@apollo/client";
import { GET_PRICING_BLOCKS } from "../graphql/queries/pricing-blocks";

interface PricingBlockFilter {
  category?: string;
  isActive?: boolean;
  isEditable?: boolean;
  searchTerm?: string;
}

interface DatabasePricingBlock {
  id: string;
  name: string;
  description?: string;
  category: string;
  conditions: any;
  action: any;
  priority: number;
  isActive: boolean;
  isEditable: boolean;
  validFrom?: string;
  validUntil?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

interface UsePricingBlocksResult {
  blocks: DatabasePricingBlock[];
  loading: boolean;
  error: any;
  refetch: () => void;
}

/**
 * Hook to fetch pricing blocks from the database
 */
export const usePricingBlocks = (filter?: PricingBlockFilter): UsePricingBlocksResult => {
  const { data, loading, error, refetch } = useQuery(GET_PRICING_BLOCKS, {
    variables: { filter },
    errorPolicy: "all", // Return partial data on errors
    notifyOnNetworkStatusChange: true,
  });

  return {
    blocks: data?.pricingBlocks || [],
    loading,
    error,
    refetch,
  };
};

export type { DatabasePricingBlock, PricingBlockFilter };