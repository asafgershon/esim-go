import { gql } from '@apollo/client';

export const CALCULATE_DESTINATION_PRICES = gql`
  query CalculateDestinationPrices($inputs: [CalculatePriceInput!]!) {
    calculatePrices(inputs: $inputs) {
      finalPrice
      currency
      country {
        iso
      }
    }
  }
`;