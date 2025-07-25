import { useMutation } from "@apollo/client";
import { ValidateOrderMutation, ValidateOrderMutationVariables } from "@/__generated__/graphql";
import { ValidateOrder } from "@/lib/graphql/checkout";
import { parseGraphQLError, AppError, ErrorType } from "@/lib/error-types";

export const useOrderValidation = () => {
  const [validateOrderMutation, { loading, error, data }] = useMutation<
    ValidateOrderMutation,
    ValidateOrderMutationVariables
  >(ValidateOrder);

  const validateOrder = async (bundleName: string, quantity: number, customerReference?: string) => {
    try {
      console.log("validateOrder called with:", { bundleName, quantity, customerReference });
      
      if (!bundleName) {
        const validationError: AppError = {
          type: ErrorType.VALIDATION_FAILED,
          message: "שם החבילה לא סופק",
          details: "bundleName is required but was not provided",
          retryable: false,
        };
        return {
          success: false,
          isValid: false,
          error: validationError.message,
          errorCode: 'BUNDLE_NAME_MISSING',
          appError: validationError,
        };
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

      if (result.data?.validateOrder) {
        return {
          ...result.data.validateOrder,
          appError: null,
        };
      }

      // If no data returned, treat as validation failure
      const noDataError: AppError = {
        type: ErrorType.VALIDATION_FAILED,
        message: "לא התקבלה תגובה מהשרת",
        retryable: true,
      };

      return {
        success: false,
        isValid: false,
        error: noDataError.message,
        errorCode: 'NO_DATA_RETURNED',
        appError: noDataError,
      };
    } catch (err) {
      console.error("Order validation error:", err);
      
      const appError = parseGraphQLError(err);
      
      return {
        success: false,
        isValid: false,
        error: appError.message,
        errorCode: appError.code || 'VALIDATION_ERROR',
        appError,
      };
    }
  };

  return {
    validateOrder,
    loading,
    error,
    validationResult: data?.validateOrder,
  };
};