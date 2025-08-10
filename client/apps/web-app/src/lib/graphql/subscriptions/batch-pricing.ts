import { gql } from '@apollo/client';

export const CALCULATE_PRICES_BATCH_STREAM = gql`
  subscription CalculatePricesBatchStream(
    $inputs: [CalculatePriceInput!]!
    $requestedDays: Int
  ) {
    calculatePricesBatchStream(inputs: $inputs, requestedDays: $requestedDays) {
      finalPrice
      currency
      totalCost
      discountValue
      duration
      
      # Bundle information
      bundle {
        id
        name
        duration
        isUnlimited
        data
        group
        country {
          iso
          name
        }
      }
      
      # Country information  
      country {
        iso
        name
        nameHebrew
        region
        flag
      }
      
      # Customer-friendly fields
      savingsAmount
      savingsPercentage
      customerDiscounts {
        name
        amount
        percentage
        reason
      }
    }
  }
`;