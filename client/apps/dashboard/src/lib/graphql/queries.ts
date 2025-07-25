import { gql } from "@apollo/client";

// Payment Methods Query
export const GET_PAYMENT_METHODS = gql(`
  query GetPaymentMethods {
    paymentMethods {
      value
      label
      description
      processingRate
      icon
      isActive
    }
  }
`);

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

// Admin Pricing Queries - Full access to all pricing data
export const CALCULATE_ADMIN_PRICE = gql(`
  query CalculateAdminPrice($numOfDays: Int!, $countryId: String!, $paymentMethod: PaymentMethod, $regionId: String) {
    calculatePrice(numOfDays: $numOfDays, countryId: $countryId, paymentMethod: $paymentMethod, regionId: $regionId) {
      bundle {
        id
        name
        country {
          iso
          name
        }
        duration
        isUnlimited
        data
        group
        appliedRules {
          name
          type
          impact
        }
      }
      country {
        iso
        name
        nameHebrew
        region
        flag
      }
      duration
      currency
      # Public pricing fields
      totalCost
      discountValue
      priceAfterDiscount
      # Admin-only business sensitive fields
      cost
      costPlus
      discountRate
      processingRate
      processingCost
      finalRevenue
      netProfit
      discountPerDay
      # Rule-based pricing breakdown
      appliedRules {
        name
        type
        impact
      }
      discounts {
        type
        amount
      }
      # Pipeline metadata
      unusedDays
      selectedReason
      # Additional pricing engine fields
      totalCostBeforeProcessing
    }
  }
`);

export const CALCULATE_BATCH_ADMIN_PRICING = gql(`
  query CalculateBatchAdminPricing($requests: [CalculatePriceInput!]!) {
    calculateBatchPricing(requests: $requests) {
      bundle {
        id
        name
        country {
          iso
          name
        }
        duration
        isUnlimited
        data
        group
        appliedRules {
          name
          type
          impact
        }
      }
      country {
        iso
        name
        nameHebrew
        region
        flag
      }
      duration
      currency
      # Public pricing fields
      totalCost
      discountValue
      priceAfterDiscount
      # Admin-only business sensitive fields
      cost
      costPlus
      discountRate
      processingRate
      processingCost
      finalRevenue
      netProfit
      discountPerDay
      # Rule-based pricing breakdown
      appliedRules {
        name
        type
        impact
      }
      discounts {
        type
        amount
      }
      # Pipeline metadata
      unusedDays
      selectedReason
      # Additional pricing engine fields
      totalCostBeforeProcessing
    }
  }
`);

export const SIMULATE_PRICING = gql(`
  query SimulatePricing($numOfDays: Int!, $countryId: String!, $paymentMethod: PaymentMethod) {
    calculatePrice(numOfDays: $numOfDays, countryId: $countryId, paymentMethod: $paymentMethod) {
      bundle {
        id
        name
        duration
        isUnlimited
        data
        group
      }
      country {
        iso
        name
        region
      }
      duration
      currency
      # Full pricing breakdown for simulation
      totalCost
      discountValue
      priceAfterDiscount
      cost
      costPlus
      discountRate
      processingRate
      processingCost
      finalRevenue
      netProfit
      discountPerDay
      appliedRules {
        name
        type
        impact
      }
      discounts {
        type
        amount
      }
      unusedDays
      selectedReason
      totalCostBeforeProcessing
    }
  }
`);

// WebSocket subscription for pricing pipeline progress
export const PRICING_PIPELINE_PROGRESS = gql(`
  subscription PricingPipelineProgress($correlationId: String!) {
    pricingPipelineProgress(correlationId: $correlationId) {
      correlationId
      name
      timestamp
      state
      appliedRules
      debug
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
