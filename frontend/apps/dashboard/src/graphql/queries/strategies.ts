import { gql } from "@apollo/client";

export const GET_PRICING_STRATEGIES = gql`
  query GetPricingStrategies($filter: StrategyFilter) {
    pricingStrategies(filter: $filter) {
      id
      name
      code
      description
      version
      isDefault
      activationCount
      lastActivatedAt
      validatedAt
      validationErrors
      archivedAt
      createdAt
      createdBy
      updatedAt
      updatedBy
      parentStrategyId
    }
  }
`;

export const GET_PRICING_STRATEGY = gql`
  query GetPricingStrategy($id: ID!) {
    pricingStrategy(id: $id) {
      id
      name
      code
      description
      version
      isDefault
      activationCount
      lastActivatedAt
      validatedAt
      validationErrors
      archivedAt
      createdAt
      createdBy
      updatedAt
      updatedBy
      parentStrategyId
      blocks {
        priority
        isEnabled
        configOverrides
        pricingBlock {
          id
          name
          description
          category
          conditions
          action
          priority
          isActive
          isEditable
          validFrom
          validUntil
          createdBy
          createdAt
          updatedAt
        }
      }
    }
  }
`;

export const GET_DEFAULT_PRICING_STRATEGY = gql`
  query GetDefaultPricingStrategy {
    defaultPricingStrategy {
      id
      name
      code
      description
      version
      isDefault
      activationCount
      lastActivatedAt
      validatedAt
      validationErrors
      archivedAt
      createdAt
      createdBy
      updatedAt
      updatedBy
      parentStrategyId
      blocks {
        priority
        isEnabled
        configOverrides
        pricingBlock {
          id
          name
          description
          category
          conditions
          action
          priority
          isActive
          isEditable
          validFrom
          validUntil
          createdBy
          createdAt
          updatedAt
        }
      }
    }
  }
`;