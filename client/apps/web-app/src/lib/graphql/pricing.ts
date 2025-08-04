import { gql } from '@apollo/client';

export const CALCULATE_DESTINATION_PRICES = gql`
  query CalculateDestinationPrices($inputs: [CalculatePriceInput!]!) {
    calculatePrices2(inputs: $inputs) {
      finalPrice
      currency
      country {
        iso
      }
    }
  }
`;