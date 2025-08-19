import { gql } from "@apollo/client";

export const GET_PRICING_BLOCKS = gql`
  query GetPricingBlocks($filter: PricingBlockFilter) {
    pricingBlocks(filter: $filter) {
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
`;

export const GET_PRICING_BLOCK = gql`
  query GetPricingBlock($id: ID!) {
    pricingBlock(id: $id) {
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
`;