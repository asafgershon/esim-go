import {
  CreateCheckoutSessionMutation,
  CreateCheckoutSessionMutationVariables,
  GetCheckoutSessionQuery,
  GetCheckoutSessionQueryVariables,
} from "@/__generated__/graphql";
import {
  CreateCheckoutSession,
  GetCheckoutSession,
} from "@/lib/graphql/checkout";
import { useMutation, useQuery } from "@apollo/client";

export const useCheckoutSession = (token?: string, isProcessing?: boolean) => {
  const [createSession] = useMutation<CreateCheckoutSessionMutation, CreateCheckoutSessionMutationVariables>(
    CreateCheckoutSession
  );
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
    createSession,
    refetch,
    loading,
    error,
  };
};
