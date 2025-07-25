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
      console.log("validateOrder called with:", { bundleName, quantity, customerReference });
      console.log("bundleName type:", typeof bundleName, "value:", bundleName);
      
      if (!bundleName) {
        throw new Error("bundleName is required but was not provided");
      }
      
      const variables = {
        input: {
          bundleName,
          quantity,
          customerReference,
        },
      };
      
      console.log("GraphQL variables:", variables);
      
      const result = await validateOrderMutation({
        variables,
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