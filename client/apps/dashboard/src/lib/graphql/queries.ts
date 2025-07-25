import { gql } from "@apollo/client";

// Pricing Rules Queries
export const GET_PRICING_RULES = gql(`
  query GetPricingRules($filter: PricingRuleFilter) {
    pricingRules(filter: $filter) {
      id
      type
      name
      description
      conditions {
        field
        operator
        value
        type
      }
      actions {
        type
        value
        metadata
      }
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
`);

export const CREATE_PRICING_RULE = gql(`
  mutation CreatePricingRule($input: CreatePricingRuleInput!) {
    createPricingRule(input: $input) {
      id
      type
      name
      description
      conditions {
        field
        operator
        value
        type
      }
      actions {
        type
        value
        metadata
      }
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
`);

export const UPDATE_PRICING_RULE = gql(`
  mutation UpdatePricingRule($id: ID!, $input: UpdatePricingRuleInput!) {
    updatePricingRule(id: $id, input: $input) {
      id
      type
      name
      description
      conditions {
        field
        operator
        value
        type
      }
      actions {
        type
        value
        metadata
      }
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
`);

export const DELETE_PRICING_RULE = gql(`
  mutation DeletePricingRule($id: ID!) {
    deletePricingRule(id: $id)
  }
`);

export const TOGGLE_PRICING_RULE = gql(`
  mutation TogglePricingRule($id: ID!) {
    togglePricingRule(id: $id) {
      id
      isActive
    }
  }
`);

export const CLONE_PRICING_RULE = gql(`
  mutation ClonePricingRule($id: ID!, $newName: String!) {
    clonePricingRule(id: $id, newName: $newName) {
      id
      name
      type
      description
      conditions {
        field
        operator
        value
        type
      }
      actions {
        type
        value
        metadata
      }
      priority
      isActive
      isEditable
    }
  }
`);

export const GET_TRIPS = gql(`
  query GetTrips {
    trips {
      id
      name
      description
      region
      countries {
        iso
        name
      }
      createdAt
      updatedAt
      createdBy
      countries {
        iso
        name
        nameHebrew
        region
        flag
      }
    }
  }
`);

export const CREATE_TRIP = gql(`
  mutation CreateTrip($input: CreateTripInput!) {
    createTrip(input: $input) {
      success
      error
      trip {
        id
        name
        description
        region
        countries {
          iso
          name
        }
        createdAt
        updatedAt
        createdBy
        countries {
          iso
          name
          nameHebrew
          region
          flag
        }
      }
    }
  }
`);

export const UPDATE_TRIP = gql(`
  mutation UpdateTrip($input: UpdateTripInput!) {
    updateTrip(input: $input) {
      success
      error
      trip {
        id
        name
        description
        region
        countries {
          iso
          name
          nameHebrew
          region
          flag
        }
        createdAt
        updatedAt
        createdBy
        countries {
          iso
          name
          nameHebrew
          region
          flag
        }
      }
    }
  }
`);

export const DELETE_TRIP = gql(`
  mutation DeleteTrip($id: ID!) {
    deleteTrip(id: $id) {
      success
      error
    }
  }
`);

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
      orderCount
    }
  }
`);

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
      bundleId
      bundleName
      user {
        id
        email
        firstName
        lastName
        phoneNumber
        role
      }
    }
  }
`);

export const GET_USER_ORDERS = gql(`
  query GetUserOrders($userId: ID!) {
    getUserOrders(userId: $userId) {
      id
      reference
      status
      quantity
      totalPrice
      createdAt
      updatedAt
      bundleId
      bundleName
    }
  }
`);

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
`);

export const INVITE_ADMIN_USER = gql(`
  mutation InviteAdminUser($input: InviteAdminUserInput!) {
    inviteAdminUser(input: $input) {
      success
      error
      invitedEmail
    }
  }
`);

export const GET_CATALOG_BUNDLES = gql(`
  query GetCatalogBundles($criteria: SearchCatalogCriteria) {
    catalogBundles(criteria: $criteria) {
      bundles {
        esimGoName
        description
        region
        validityInDays
        basePrice
        currency
        isUnlimited
      }
      totalCount
    }
  }
`);

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
        assignedAt
      }
    }
  }
`);

export const CALCULATE_PRICING = gql(`
  query CalculatePricing($numOfDays: Int!, $countryId: String!, $paymentMethod: PaymentMethod) {
    calculatePrice(numOfDays: $numOfDays, countryId: $countryId, paymentMethod: $paymentMethod) {
      duration
      cost
      costPlus
      totalCost
      discountRate
      discountValue
      priceAfterDiscount
      processingCost
      finalRevenue
      currency
      discountPerDay
    }
  }
`);

export const CALCULATE_BATCH_PRICING = gql(`
  query CalculateBatchPricing($inputs: [CalculatePriceInput!]!) {
    calculatePrices(inputs: $inputs) {
      duration
      cost
      costPlus
      totalCost
      discountRate
      discountValue
      priceAfterDiscount
      processingRate
      processingCost
      finalRevenue
      currency
      discountPerDay
    }
  }
`);

// Enhanced rule-based pricing queries
export const CALCULATE_PRICE_WITH_RULES = gql(`
  query CalculatePriceWithRules($input: CalculatePriceInput!) {
    calculatePriceWithRules(input: $input) {
      baseCost
      markup
      subtotal
      discounts {
        ruleName
        amount
        type
      }
      totalDiscount
      priceAfterDiscount
      processingFee
      processingRate
      finalPrice
      finalRevenue
      revenueAfterProcessing
      profit
      maxRecommendedPrice
      maxDiscountPercentage
      appliedRules {
        id
        name
        type
        impact
      }
    }
  }
`);

export const CALCULATE_BATCH_PRICING_WITH_RULES = gql(`
  query CalculateBatchPricingWithRules($requests: [CalculatePriceInput!]!) {
    calculateBatchPricing(requests: $requests) {
      baseCost
      markup
      subtotal
      discounts {
        ruleName
        amount
        type
      }
      totalDiscount
      priceAfterDiscount
      processingFee
      processingRate
      finalPrice
      finalRevenue
      revenueAfterProcessing
      profit
      maxRecommendedPrice
      maxDiscountPercentage
      appliedRules {
        id
        name
        type
        impact
      }
    }
  }
`);

export const SIMULATE_PRICING_RULE = gql(`
  query SimulatePricingRule($rule: CreatePricingRuleInput!, $testContext: TestPricingContext!) {
    simulatePricingRule(rule: $rule, testContext: $testContext) {
      baseCost
      markup
      subtotal
      discounts {
        ruleName
        amount
        type
      }
      totalDiscount
      priceAfterDiscount
      processingFee
      processingRate
      finalPrice
      finalRevenue
      revenueAfterProcessing
      profit
      maxRecommendedPrice
      maxDiscountPercentage
      appliedRules {
        id
        name
        type
        impact
      }
    }
  }
`);

export const DELETE_USER = gql(`
  mutation DeleteUser($userId: ID!) {
    deleteUser(userId: $userId) {
      success
      error
    }
  }
`);

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
`);

export const GET_BUNDLES_BY_COUNTRY = gql(`
  query GetBundlesByCountry {
    bundlesByCountry {
      country {
        iso
        name
        nameHebrew
        region
        flag
      }
      bundleCount
      pricingRange {
        min
        max
      }
    }
  }
`);

export const GET_COUNTRIES_WITH_BUNDLES = gql(`
  query GetCountriesWithBundles {
    bundlesByCountry {
      country {
        iso
        name
      }
      bundleCount
      pricingRange {
        min
        max
      }
      bundles(limit: 5) {
        ... on CatalogBundle {
          esimGoName
          name
          groups
          validityInDays
          dataAmountReadable
          isUnlimited
          countries
          basePrice
          currency
        }
      }
    }
  }
`);

export const GET_BUNDLES_BY_REGION = gql(`
  query GetBundlesByRegion {
    bundlesByRegion {
      region
      bundleCount
    }
  }
`);

export const GET_BUNDLES_BY_GROUP = gql(`
  query GetBundlesByGroup {
    bundlesByGroup {
      group
      bundleCount
    }
  }
`);

export const GET_REGION_BUNDLES = gql(`
  query GetRegionBundles($region: String!) {
    bundlesForRegion(region: $region) {
      region
      bundleCount
      bundles {
        ... on CatalogBundle {
          esimGoName
          name
          description
          groups
          validityInDays
          dataAmountMB
          dataAmountReadable
          isUnlimited
          countries
          region
          basePrice
          currency
        }
      }
    }
  }
`);

export const GET_COUNTRY_BUNDLES = gql(`
  query GetCountryBundles($countryId: String!) {
    bundlesForCountry(countryCode: $countryId) {
      country {
        iso
        name
      }
      bundleCount
      bundles {
        ... on CatalogBundle {
          esimGoName
          name
          description
          groups
          validityInDays
          dataAmountMB
          dataAmountReadable
          isUnlimited
          countries
          region
          basePrice
          currency
        }
      }
    }
  }
`);


export const GET_BUNDLE_GROUPS = gql(`
  query GetBundleGroups {
    bundlesByGroup {
      group
    }
  }
`);

export const GET_PRICING_FILTERS = gql(`
  query GetPricingFilters {
    pricingFilters {
      groups
      durations {
        label
        value
        minDays
        maxDays
      }
      dataTypes {
        label
        value
        isUnlimited
      }
    }
  }
`);

// High Demand Countries Queries
export const GET_HIGH_DEMAND_COUNTRIES = gql(`
  query GetHighDemandCountries {
    highDemandCountries
  }
`);

export const TOGGLE_HIGH_DEMAND_COUNTRY = gql(`
  mutation ToggleHighDemandCountry($countryId: String!) {
    toggleHighDemandCountry(countryId: $countryId) {
      success
      countryId
      isHighDemand
      error
    }
  }
`);

export const GET_BUNDLE_DATA_AGGREGATION = ``;

export const GET_CATALOG_SYNC_HISTORY = gql(`
  query GetCatalogSyncHistory($params: SyncHistoryParams) {
    catalogSyncHistory(params: $params) {
      jobs {
        id
        jobType
        status
        priority
        group
        countryId
        bundlesProcessed
        bundlesAdded
        bundlesUpdated
        errorMessage
        metadata
        createdAt
        startedAt
        completedAt
        updatedAt
      }
      totalCount
    }
  }
`);

export const TRIGGER_CATALOG_SYNC = gql(`
  mutation TriggerCatalogSync($params: TriggerSyncParams!) {
    triggerCatalogSync(params: $params) {
      success
      jobId
      message
      error
      conflictingJob {
        id
        jobType
        status
        createdAt
        startedAt
      }
    }
  }
`);
