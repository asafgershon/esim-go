import {
  GetCheckoutSessionQuery,
  GetCheckoutSessionQueryVariables,
} from "@/__generated__/graphql";
import {
  GetCheckoutSession,
} from "@/lib/graphql/checkout";
import { useQuery } from "@apollo/client";

export const useCheckoutSession = (token?: string, isProcessing?: boolean) => {
  const { data, loading, error, refetch } = useQuery<
    GetCheckoutSessionQuery,
    GetCheckoutSessionQueryVariables
  >(GetCheckoutSession, {
    variables: { token: token! },
    skip: !token,
    pollInterval: isProcessing ? 2000 : 0,
  });

  return {
    session: data?.getCheckoutSession?.session,
    refetch,
    loading,
    error,
  };
};
