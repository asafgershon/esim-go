import { useMutation } from "@apollo/client";
import { ValidateOrderMutation, ValidateOrderMutationVariables } from "@/__generated__/graphql";
import { ValidateOrder } from "@/lib/graphql/checkout";

export const useOrderValidation = () => {
  const [validateOrderMutation, { loading, error, data }] = useMutation<
    ValidateOrderMutation,
    ValidateOrderMutationVariables
  >(ValidateOrder);

  const validateOrder = async (bundleName: string, quantity: number, customerReference?: string) => {
    try {
      const result = await validateOrderMutation({
        variables: {
          input: {
            bundleName,
            quantity,
            customerReference,
          },
        },
      });

      return result.data?.validateOrder;
    } catch (err) {
      console.error("Order validation error:", err);
      return null;
    }
  };

  return {
    validateOrder,
    loading,
    error,
    validationResult: data?.validateOrder,
  };
};