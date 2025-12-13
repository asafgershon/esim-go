import {
  UpdateCheckoutStepMutation,
  UpdateCheckoutStepMutationVariables,
  ProcessCheckoutPaymentMutation,
  ProcessCheckoutPaymentMutationVariables,
  CheckoutStepType,
} from "@/__generated__/graphql";
import { UpdateCheckoutStep, ProcessCheckoutPayment } from "@/lib/graphql/checkout";
import { useMutation } from "@apollo/client";

// Step progression hook
export const useCheckoutSteps = (token: string) => {
  const [updateStep,{error}] = useMutation<
    UpdateCheckoutStepMutation,
    UpdateCheckoutStepMutationVariables
  >(UpdateCheckoutStep);

  const updateStepWithData = async (stepType: CheckoutStepType, data: Record<string, unknown>) => {
    return updateStep({
      variables: {
        input: { token, stepType, data },
      },
    });
  };

  return { updateStepWithData, updateStepError: error };
};

export const useCheckoutPayment = () => {
  const [processPayment] = useMutation<
    ProcessCheckoutPaymentMutation,
    ProcessCheckoutPaymentMutationVariables
  >(ProcessCheckoutPayment);

  const handlePayment = async (token: string, paymentMethodId: string) => {
    return processPayment({
      variables: {
        input: { token, paymentMethodId, savePaymentMethod: false },
      } as any,
    });
  };

  return { handlePayment };
};
