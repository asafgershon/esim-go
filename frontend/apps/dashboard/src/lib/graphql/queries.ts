import { gql } from "@apollo/client";

// Tenants Queries
export const GET_USER_TENANTS = gql(`
  query GetUserTenants {
    tenants {
      slug
      name
      imgUrl
    }
  }
`);

export const GET_ALL_TENANTS = gql(`
  query GetAllTenants {
    allTenants {
      nodes {
        slug
        name
        imgUrl
        tenantType
        userCount
      }
      totalCount
    }
  }
`);

// Tenant Mutations
export const CREATE_TENANT = gql(`
  mutation CreateTenant($input: CreateTenantInput!) {
    createTenant(input: $input) {
      slug
      name
      imgUrl
      tenantType
    }
  }
`);

export const UPDATE_TENANT = gql(`
  mutation UpdateTenant($slug: ID!, $input: UpdateTenantInput!) {
    updateTenant(slug: $slug, input: $input) {
      slug
      name
      imgUrl
      tenantType
    }
  }
`);

export const DELETE_TENANT = gql(`
  mutation DeleteTenant($slug: ID!) {
    deleteTenant(slug: $slug) {
      success
    }
  }
`);

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

export const GET_TRIPS = gql(`
  query GetTrips {
    trips {
      id
      name
      title
      description
      bundleName
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
        title
        description
        bundleName
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
        title
        description
        bundleName
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
  query CalculateAdminPrice($input: CalculatePriceInput!) {
    calculatePrice(input: $input) {
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
          category
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
      markup
      discountRate
      processingRate
      processingCost
      finalRevenue
      netProfit
      discountPerDay
      # Rule-based pricing breakdown
      appliedRules {
        name
        category
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
  query CalculateBatchAdminPricing($inputs: [CalculatePriceInput!]!) {
    calculatePrices(inputs: $inputs) {
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
          category
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
      markup
      discountRate
      processingRate
      processingCost
      finalRevenue
      netProfit
      discountPerDay
      # Rule-based pricing breakdown
      appliedRules {
        name
        category
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
  query SimulatePricing($input: CalculatePriceInput!) {
    calculatePrice(input: $input) {
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
      markup
      discountRate
      processingRate
      processingCost
      finalRevenue
      netProfit
      discountPerDay
      appliedRules {
        name
        category
        impact
      }
      discounts {
        type
        amount
      }
      unusedDays
      selectedReason
      totalCostBeforeProcessing
      # Enhanced fields for step-by-step tracking
      pricingSteps {
        order
        name
        priceBefore
        priceAfter
        impact
        ruleId
        metadata
        timestamp
      }
      customerDiscounts {
        name
        amount
        percentage
        reason
      }
      savingsAmount
      savingsPercentage
      calculationTimeMs
      rulesEvaluated
    }
  }
`);

// WebSocket subscription for real-time pricing calculation steps
export const PRICING_CALCULATION_STEPS = gql(`
  subscription PricingCalculationSteps($input: CalculatePriceInput!) {
    pricingCalculationSteps(input: $input) {
      correlationId
      step {
        order
        name
        priceBefore
        priceAfter
        impact
        ruleId
        metadata
        timestamp
      }
      isComplete
      totalSteps
      completedSteps
      error
      finalBreakdown {
        totalCost
        discountValue
        priceAfterDiscount
        cost
        markup
        discountRate
        processingRate
        processingCost
        finalRevenue
        netProfit
        discountPerDay
        appliedRules {
          name
          category
          impact
        }
        unusedDays
        selectedReason
        totalCostBeforeProcessing
        pricingSteps {
          order
          name
          priceBefore
          priceAfter
          impact
          ruleId
          metadata
          timestamp
        }
        customerDiscounts {
          name
          amount
          percentage
          reason
        }
        savingsAmount
        savingsPercentage
        calculationTimeMs
        rulesEvaluated
      }
    }
  }
`);

// Legacy subscription (can be removed once migration is complete)
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
          provider
        }
      }
    }
  }
`);

export const GET_BUNDLE_GROUPS = gql(`
  query GetBundleGroups {
    pricingFilters {
      groups
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

// Dedicated query for markup configuration modal
export const GET_MARKUP_CONFIG_DATA = gql(`
  query GetMarkupConfigData {
    pricingFilters {
      groups
      durations {
        label
        value
        minDays
        maxDays
      }
    }
    # We can also fetch existing markup configurations if needed
    # markupConfigurations {
    #   group
    #   duration
    #   markupValue
    #   markupType
    # }
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

// AirHalo Queries
export const GET_AIRHALO_PACKAGES = gql(`
  query GetAirHaloPackages($filter: AirHaloPackageFilter) {
    airHaloPackages(filter: $filter) {
      data {
        id
        title
        slug
        image {
          url
          width
          height
        }
        operators {
          id
          title
          type
          countries {
            id
            title
            slug
          }
          packages {
            id
            type
            title
            shortInfo
            data
            amount
            day
            isUnlimited
            voice
            text
            price {
              value
              currency
            }
            netPrice {
              value
              currency
            }
            prices {
              netPrice {
                value
                currency
              }
              recommendedRetailPrice {
                value
                currency
              }
            }
            qrInstallation
            manualInstallation
            isFairUsagePolicy
            fairUsagePolicy
          }
          coverages {
            networks {
              name
              type
            }
          }
          apn {
            name
            username
            password
            ios {
              name
              username
              password
            }
          }
        }
      }
      links {
        first
        last
        prev
        next
      }
      meta {
        currentPage
        from
        lastPage
        path
        perPage
        to
        total
      }
    }
  }
`);

export const GET_AIRHALO_COMPATIBLE_DEVICES = gql(`
  query GetAirHaloCompatibleDevices {
    airHaloCompatibleDevices {
      data {
        manufacturer
        model
        esimSupport
      }
    }
  }
`);

export const COMPARE_AIRHALO_PACKAGES = gql(`
  query CompareAirHaloPackages($countryCode: String!) {
    compareAirHaloPackages(countryCode: $countryCode) {
      id
      title
      slug
      image {
        url
        width
        height
      }
      operators {
        id
        title
        type
        countries {
          id
          title
          slug
        }
        packages {
          id
          type
          title
          shortInfo
          data
          amount
          day
          isUnlimited
          voice
          text
          price {
            value
            currency
          }
          netPrice {
            value
            currency
          }
          prices {
            netPrice {
              value
              currency
            }
            recommendedRetailPrice {
              value
              currency
            }
          }
          qrInstallation
          manualInstallation
          isFairUsagePolicy
          fairUsagePolicy
        }
        coverages {
          networks {
            name
            type
          }
        }
      }
    }
  }
`);

export const GET_AIRHALO_PRICING_DATA = gql(`
  query GetAirHaloPricingData($packageIds: [String!]!) {
    airHaloPricingData(packageIds: $packageIds) {
      id
      type
      title
      shortInfo
      data
      amount
      day
      isUnlimited
      voice
      text
      price {
        value
        currency
      }
      netPrice {
        value
        currency
      }
      prices {
        netPrice {
          value
          currency
        }
        recommendedRetailPrice {
          value
          currency
        }
      }
      qrInstallation
      manualInstallation
      isFairUsagePolicy
      fairUsagePolicy
    }
  }
`);

// Coupon Management Queries
export const GET_COUPONS = gql(`
  query GetCoupons($filter: CouponFilter) {
    coupons(filter: $filter) {
      id
      code
      description
      couponType
      value
      validFrom
      validUntil
      maxTotalUsage
      maxPerUser
      minSpend
      maxDiscount
      applicability
      allowedRegions
      allowedBundleIds
      corporateDomain
      isActive
      createdAt
      updatedAt
      usageCount
      usageStats {
        totalUsages
        totalDiscountAmount
        uniqueUsers
      }
    }
  }
`);

export const GET_COUPON = gql(`
  query GetCoupon($id: ID!) {
    coupon(id: $id) {
      id
      code
      description
      couponType
      value
      validFrom
      validUntil
      maxTotalUsage
      maxPerUser
      minSpend
      maxDiscount
      applicability
      allowedRegions
      allowedBundleIds
      corporateDomain
      isActive
      createdAt
      updatedAt
      usageCount
      usageStats {
        totalUsages
        totalDiscountAmount
        uniqueUsers
      }
    }
  }
`);

export const CREATE_COUPON = gql(`
  mutation CreateCoupon($input: CreateCouponInput!) {
    createCoupon(input: $input) {
      id
      code
      description
      couponType
      value
      validFrom
      validUntil
      maxTotalUsage
      maxPerUser
      minSpend
      maxDiscount
      applicability
      allowedRegions
      allowedBundleIds
      corporateDomain
      isActive
      createdAt
      updatedAt
    }
  }
`);

export const UPDATE_COUPON = gql(`
  mutation UpdateCoupon($id: ID!, $input: UpdateCouponInput!) {
    updateCoupon(id: $id, input: $input) {
      id
      code
      description
      couponType
      value
      validFrom
      validUntil
      maxTotalUsage
      maxPerUser
      minSpend
      maxDiscount
      applicability
      allowedRegions
      allowedBundleIds
      corporateDomain
      isActive
      createdAt
      updatedAt
    }
  }
`);

export const DELETE_COUPON = gql(`
  mutation DeleteCoupon($id: ID!) {
    deleteCoupon(id: $id) {
      success
      error
    }
  }
`);

export const TOGGLE_COUPON = gql(`
  mutation ToggleCoupon($id: ID!) {
    toggleCoupon(id: $id) {
      id
      isActive
    }
  }
`);

export const GET_COUPON_USAGE_LOGS = gql(`
  query GetCouponUsageLogs($couponId: ID, $userId: ID, $pagination: PaginationInput) {
    couponUsageLogs(couponId: $couponId, userId: $userId, pagination: $pagination) {
      logs {
        id
        couponId
        userId
        orderId
        originalAmount
        discountedAmount
        discountAmount
        usedAt
        coupon {
          code
          description
        }
        user {
          email
          firstName
          lastName
        }
      }
      totalCount
    }
  }
`);

// Corporate Email Domains Queries
export const GET_CORPORATE_EMAIL_DOMAINS = gql(`
  query GetCorporateEmailDomains {
    corporateEmailDomains {
      id
      domain
      discountPercentage
      maxDiscount
      minSpend
      isActive
      createdAt
      updatedAt
      usageStats {
        totalUsages
        totalDiscountAmount
        uniqueUsers
      }
    }
  }
`);

export const CREATE_CORPORATE_EMAIL_DOMAIN = gql(`
  mutation CreateCorporateEmailDomain($input: CreateCorporateEmailDomainInput!) {
    createCorporateEmailDomain(input: $input) {
      id
      domain
      discountPercentage
      maxDiscount
      minSpend
      isActive
      createdAt
      updatedAt
    }
  }
`);

export const UPDATE_CORPORATE_EMAIL_DOMAIN = gql(`
  mutation UpdateCorporateEmailDomain($id: ID!, $input: UpdateCorporateEmailDomainInput!) {
    updateCorporateEmailDomain(id: $id, input: $input) {
      id
      domain
      discountPercentage
      maxDiscount
      minSpend
      isActive
      createdAt
      updatedAt
    }
  }
`);

export const DELETE_CORPORATE_EMAIL_DOMAIN = gql(`
  mutation DeleteCorporateEmailDomain($id: ID!) {
    deleteCorporateEmailDomain(id: $id) {
      success
      error
    }
  }
`);

export const TOGGLE_CORPORATE_EMAIL_DOMAIN = gql(`
  mutation ToggleCorporateEmailDomain($id: ID!) {
    toggleCorporateEmailDomain(id: $id) {
      id
      isActive
    }
  }
`);
