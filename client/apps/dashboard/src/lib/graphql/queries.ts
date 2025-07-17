import { gql } from '@apollo/client'

export const GET_TRIPS = gql(`
  query GetTrips {
    trips {
      name
      description
      regionId
      countryIds
    }
  }
`)

export const GET_USERS = gql(`
  query GetUsers {
    users {
      id
      email
      firstName
      lastName
      phoneNumber
      role
      createdAt
      updatedAt
    }
  }
`)

export const GET_ORDERS = gql(`
  query GetOrders {
    orders {
      id
      reference
      status
      quantity
      totalPrice
      createdAt
      updatedAt
      dataPlan {
        id
        name
        description
        region
        duration
        price
        currency
      }
    }
  }
`)

export const UPDATE_USER_ROLE = gql(`
  mutation UpdateUserRole($userId: ID!, $role: String!) {
    updateUserRole(userId: $userId, role: $role) {
      id
      email
      firstName
      lastName
      phoneNumber
      role
      createdAt
      updatedAt
    }
  }
`)

export const INVITE_ADMIN_USER = gql(`
  mutation InviteAdminUser($input: InviteAdminUserInput!) {
    inviteAdminUser(input: $input) {
      success
      error
      invitedEmail
    }
  }
`)

export const GET_DATA_PLANS = gql(`
  query GetDataPlans($filter: DataPlanFilter) {
    dataPlans(filter: $filter) {
      items {
        id
        name
        description
        region
        duration
        price
        currency
        isUnlimited
        bundleGroup
        features
        availableQuantity
        countries {
          iso
          name
          nameHebrew
          region
          flag
        }
      }
      totalCount
      hasNextPage
      hasPreviousPage
      pageInfo {
        limit
        offset
        total
        pages
        currentPage
      }
    }
  }
`)

export const ASSIGN_PACKAGE_TO_USER = gql(`
  mutation AssignPackageToUser($userId: ID!, $planId: ID!) {
    assignPackageToUser(userId: $userId, planId: $planId) {
      success
      error
      assignment {
        id
        user {
          id
          email
          firstName
          lastName
        }
        dataPlan {
          id
          name
          description
          region
          duration
          price
          currency
        }
        assignedAt
      }
    }
  }
`)

export const CALCULATE_PRICING = gql(`
  query CalculatePricing($numOfDays: Int!, $regionId: String!, $countryId: String!) {
    calculatePrice(numOfDays: $numOfDays, regionId: $regionId, countryId: $countryId) {
      bundleName
      countryName
      duration
      cost
      costPlus
      totalCost
      discountRate
      discountValue
      priceAfterDiscount
      processingRate
      processingCost
      revenueAfterProcessing
      finalRevenue
      currency
    }
  }
`)

export const CALCULATE_BATCH_PRICING = gql(`
  query CalculateBatchPricing($inputs: [CalculatePriceInput!]!) {
    calculatePrices(inputs: $inputs) {
      bundleName
      countryName
      duration
      cost
      costPlus
      totalCost
      discountRate
      discountValue
      priceAfterDiscount
      processingRate
      processingCost
      revenueAfterProcessing
      finalRevenue
      currency
    }
  }
`)

export const GET_COUNTRIES = gql(`
  query GetCountries {
    countries {
      iso
      name
      nameHebrew
      region
      flag
    }
  }
`)

export const GET_PRICING_CONFIGURATIONS = gql(`
  query GetPricingConfigurations {
    pricingConfigurations {
      id
      name
      description
      countryId
      regionId
      duration
      bundleGroup
      costSplitPercent
      discountRate
      processingRate
      isActive
      priority
      createdBy
      createdAt
      updatedAt
    }
  }
`)

export const UPDATE_PRICING_CONFIGURATION = gql(`
  mutation UpdatePricingConfiguration($input: UpdatePricingConfigurationInput!) {
    updatePricingConfiguration(input: $input) {
      success
      error
      configuration {
        id
        name
        description
        countryId
        regionId
        duration
        bundleGroup
        costSplitPercent
        discountRate
        processingRate
        isActive
        priority
        createdBy
        createdAt
        updatedAt
      }
    }
  }
`)