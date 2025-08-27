import { gql } from "@/__generated__";
import {
    CheckoutSubscription,
    CheckoutSubscriptionVariables,
    CreateCheckoutMutation
} from "@/__generated__/graphql";
import { useMutation, useSubscription } from "@apollo/client";
import { useEffect } from "react";

const CHECKOUT_SUBSCRIPTION = gql(`subscription Checkout($id: ID!) {
  checkout(id: $id) {
    id
    bundle {
        completed
        id
        numOfDays
        country {
            iso
            name
        }
        dataAmount
        price
        pricePerDay
        currency
        speed
        discounts
        validated
    }

    auth {
        completed
        userId
        email
        phone
        firstName
        lastName
        method
        otpSent
        otpVerified
    }

    delivery {
        completed
        email
        phone
    }

    payment {
        completed
        email
        phone
        nameForBilling
        intent {
            id
            url
            applePayJavaScriptUrl
        }
        redirectUrl
    }
  }
}`);

const CREATE_CHECKOUT_MUTATION = gql(`
    mutation CreateCheckout($numOfDays: Int!, $countryId: String!) {
        createCheckout(numOfDays: $numOfDays, countryId: $countryId)
    }
    `);

export const useCheckout = ({
  numOfDays,
  countryId,
}: {
  numOfDays: number;
  countryId: string;
}) => {
  const [createCheckout, { data: checkoutData, called }] =
    useMutation<CreateCheckoutMutation>(CREATE_CHECKOUT_MUTATION);

  const checkoutId = checkoutData?.createCheckout || "";

  const { data, loading, error } = useSubscription<
    CheckoutSubscription,
    CheckoutSubscriptionVariables
  >(CHECKOUT_SUBSCRIPTION, {
    variables: { id: checkoutId },
    skip: !called || !checkoutId,
  });

  useEffect(() => {
    if (called || checkoutId) return;
    createCheckout({ variables: { numOfDays, countryId } });
  }, [called, createCheckout, numOfDays, countryId, checkoutId]);

  const refreshCheckout = () => {
    createCheckout({ variables: { numOfDays, countryId } });
  };

  return {
    data,
    loading,
    error,
    checkout: { id: checkoutId, ...(data?.checkout || {}) },
    refreshCheckout,
  };
};
