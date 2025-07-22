import { gql } from '@apollo/client'

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
`)

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
`)

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
`)

export const DELETE_PRICING_RULE = gql(`
  mutation DeletePricingRule($id: ID!) {
    deletePricingRule(id: $id)
  }
`)

export const TOGGLE_PRICING_RULE = gql(`
  mutation TogglePricingRule($id: ID!) {
    togglePricingRule(id: $id) {
      id
      isActive
    }
  }
`)

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
`)

// Markup Configuration Queries
export const GET_MARKUP_CONFIG = gql(`
  query GetMarkupConfig {
    markupConfig {
      id
      bundleGroup
      durationDays
      markupAmount
      createdAt
      updatedAt
    }
  }
`)

export const CREATE_MARKUP_CONFIG = gql(`
  mutation CreateMarkupConfig($input: CreateMarkupConfigInput!) {
    createMarkupConfig(input: $input) {
      id
      bundleGroup
      durationDays
      markupAmount
      createdAt
      updatedAt
    }
  }
`)

export const UPDATE_MARKUP_CONFIG = gql(`
  mutation UpdateMarkupConfig($id: ID!, $input: UpdateMarkupConfigInput!) {
    updateMarkupConfig(id: $id, input: $input) {
      id
      bundleGroup
      durationDays
      markupAmount
      createdAt
      updatedAt
    }
  }
`)

export const DELETE_MARKUP_CONFIG = gql(`
  mutation DeleteMarkupConfig($id: ID!) {
    deleteMarkupConfig(id: $id) {
      success
      message
    }
  }
`)

export const GET_TRIPS = gql(`
  query GetTrips {
    trips {
      id
      name
      description
      regionId
      countryIds
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
`)

export const CREATE_TRIP = gql(`
  mutation CreateTrip($input: CreateTripInput!) {
    createTrip(input: $input) {
      success
      error
      trip {
        id
        name
        description
        regionId
        countryIds
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
`)

export const UPDATE_TRIP = gql(`
  mutation UpdateTrip($input: UpdateTripInput!) {
    updateTrip(input: $input) {
      success
      error
      trip {
        id
        name
        description
        regionId
        countryIds
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
`)

export const DELETE_TRIP = gql(`
  mutation DeleteTrip($id: ID!) {
    deleteTrip(id: $id) {
      success
      error
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
      orderCount
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
      user {
        id
        email
        firstName
        lastName
        phoneNumber
        role
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
    }
  }
`)

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
        dataAmount
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
      lastFetched
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
  query CalculatePricing($numOfDays: Int!, $regionId: String!, $countryId: String!, $paymentMethod: PaymentMethod) {
    calculatePrice(numOfDays: $numOfDays, regionId: $regionId, countryId: $countryId, paymentMethod: $paymentMethod) {
      bundleName
      countryName
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
      finalRevenue
      currency
      discountPerDay
    }
  }
`)

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
`)

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
`)

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
`)

export const DELETE_USER = gql(`
  mutation DeleteUser($userId: ID!) {
    deleteUser(userId: $userId) {
      success
      error
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
      discountRate
      discountPerDay
      markupAmount
      isActive
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
        discountRate
        discountPerDay
        markupAmount
        isActive
        createdBy
        createdAt
        updatedAt
      }
    }
  }
`)

export const GET_CURRENT_PROCESSING_FEE_CONFIGURATION = gql(`
  query GetCurrentProcessingFeeConfiguration {
    currentProcessingFeeConfiguration {
      id
      israeliCardsRate
      foreignCardsRate
      premiumDinersRate
      premiumAmexRate
      bitPaymentRate
      fixedFeeNIS
      fixedFeeForeign
      monthlyFixedCost
      bankWithdrawalFee
      monthlyMinimumFee
      setupCost
      threeDSecureFee
      chargebackFee
      cancellationFee
      invoiceServiceFee
      appleGooglePayFee
      isActive
      effectiveFrom
      effectiveTo
      createdAt
      updatedAt
      createdBy
      notes
    }
  }
`)

export const GET_PROCESSING_FEE_CONFIGURATIONS = gql(`
  query GetProcessingFeeConfigurations($limit: Int = 10, $offset: Int = 0, $includeInactive: Boolean = false) {
    processingFeeConfigurations(limit: $limit, offset: $offset, includeInactive: $includeInactive) {
      id
      israeliCardsRate
      foreignCardsRate
      premiumDinersRate
      premiumAmexRate
      bitPaymentRate
      fixedFeeNIS
      fixedFeeForeign
      monthlyFixedCost
      bankWithdrawalFee
      monthlyMinimumFee
      setupCost
      threeDSecureFee
      chargebackFee
      cancellationFee
      invoiceServiceFee
      appleGooglePayFee
      isActive
      effectiveFrom
      effectiveTo
      createdAt
      updatedAt
      createdBy
      notes
    }
  }
`)

export const CREATE_PROCESSING_FEE_CONFIGURATION = gql(`
  mutation CreateProcessingFeeConfiguration($input: ProcessingFeeConfigurationInput!) {
    createProcessingFeeConfiguration(input: $input) {
      id
      israeliCardsRate
      foreignCardsRate
      premiumDinersRate
      premiumAmexRate
      bitPaymentRate
      fixedFeeNIS
      fixedFeeForeign
      monthlyFixedCost
      bankWithdrawalFee
      monthlyMinimumFee
      setupCost
      threeDSecureFee
      chargebackFee
      cancellationFee
      invoiceServiceFee
      appleGooglePayFee
      isActive
      effectiveFrom
      effectiveTo
      createdAt
      updatedAt
      createdBy
      notes
    }
  }
`)

export const UPDATE_PROCESSING_FEE_CONFIGURATION = gql(`
  mutation UpdateProcessingFeeConfiguration($id: ID!, $input: ProcessingFeeConfigurationInput!) {
    updateProcessingFeeConfiguration(id: $id, input: $input) {
      id
      israeliCardsRate
      foreignCardsRate
      premiumDinersRate
      premiumAmexRate
      bitPaymentRate
      fixedFeeNIS
      fixedFeeForeign
      monthlyFixedCost
      bankWithdrawalFee
      monthlyMinimumFee
      setupCost
      threeDSecureFee
      chargebackFee
      cancellationFee
      invoiceServiceFee
      appleGooglePayFee
      isActive
      effectiveFrom
      effectiveTo
      createdAt
      updatedAt
      createdBy
      notes
    }
  }
`)

export const DEACTIVATE_PROCESSING_FEE_CONFIGURATION = gql(`
  mutation DeactivateProcessingFeeConfiguration($id: ID!) {
    deactivateProcessingFeeConfiguration(id: $id) {
      id
      israeliCardsRate
      foreignCardsRate
      premiumDinersRate
      premiumAmexRate
      bitPaymentRate
      fixedFeeNIS
      fixedFeeForeign
      monthlyFixedCost
      bankWithdrawalFee
      monthlyMinimumFee
      setupCost
      threeDSecureFee
      chargebackFee
      cancellationFee
      invoiceServiceFee
      appleGooglePayFee
      isActive
      effectiveFrom
      effectiveTo
      createdAt
      updatedAt
      createdBy
      notes
    }
  }
`)

export const GET_BUNDLES_BY_COUNTRY = gql(`
  query GetBundlesByCountry {
    bundlesByCountry {
      countryName
      countryId
    }
  }
`)

export const GET_COUNTRY_BUNDLES = gql(`
  query GetCountryBundles($countryId: String!) {
    countryBundles(countryId: $countryId) {
      bundleName
      countryName
      countryId
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
      pricePerDay
      hasCustomDiscount
      configurationLevel
      discountPerDay
      planId
      isUnlimited
      dataAmount
      bundleGroup
    }
  }
`)

export const SYNC_CATALOG = gql(`
  mutation SyncCatalog($force: Boolean = false) {
    syncCatalog(force: $force) {
      success
      message
      error
      syncedBundles
      syncDuration
      syncedAt
    }
  }
`)

export const GET_BUNDLE_GROUPS = gql(`
  query GetBundleGroups {
    bundleGroups
  }
`)

export const GET_PRICING_FILTERS = gql(`
  query GetPricingFilters {
    pricingFilters {
      bundleGroups
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
`)

// High Demand Countries Queries
export const GET_HIGH_DEMAND_COUNTRIES = gql(`
  query GetHighDemandCountries {
    highDemandCountries
  }
`)

export const TOGGLE_HIGH_DEMAND_COUNTRY = gql(`
  mutation ToggleHighDemandCountry($countryId: String!) {
    toggleHighDemandCountry(countryId: $countryId) {
      success
      countryId
      isHighDemand
      error
    }
  }
`)

// Pricing Configuration Mutations
export const CREATE_PRICING_CONFIGURATION = gql(`
  mutation CreatePricingConfiguration($input: UpdatePricingConfigurationInput!) {
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
        discountRate
        discountPerDay
        markupAmount
        isActive
        createdBy
        createdAt
        updatedAt
      }
    }
  }
`)

export const GET_BUNDLE_DATA_AGGREGATION = gql(`
  query GetBundleDataAggregation {
    bundleDataAggregation {
      total
      unlimited
      byDataAmount {
        dataAmount
        count
        percentage
      }
      byDuration {
        duration
        count
        percentage
        category
      }
      byBundleGroup {
        bundleGroup
        total
        unlimited
        limited
        averageDataAmount
      }
      lastUpdated
    }
  }
`)
