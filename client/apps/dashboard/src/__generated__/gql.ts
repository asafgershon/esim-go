/* eslint-disable */
import * as types from './graphql';
import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';

/**
 * Map of all GraphQL operations in the project.
 *
 * This map has several performance disadvantages:
 * 1. It is not tree-shakeable, so it will include all operations in the project.
 * 2. It is not minifiable, so the string of a GraphQL query will be multiple times inside the bundle.
 * 3. It does not support dead code elimination, so it will add unused operations.
 *
 * Therefore it is highly recommended to use the babel or swc plugin for production.
 * Learn more about it here: https://the-guild.dev/graphql/codegen/plugins/presets/preset-client#reducing-bundle-size
 */
type Documents = {
    "\n  query GetTrips {\n    trips {\n      name\n      description\n      regionId\n      countryIds\n    }\n  }\n": typeof types.GetTripsDocument,
    "\n  query GetUsers {\n    users {\n      id\n      email\n      firstName\n      lastName\n      phoneNumber\n      role\n      createdAt\n      updatedAt\n    }\n  }\n": typeof types.GetUsersDocument,
    "\n  query GetOrders {\n    orders {\n      id\n      reference\n      status\n      quantity\n      totalPrice\n      createdAt\n      updatedAt\n      dataPlan {\n        id\n        name\n        description\n        region\n        duration\n        price\n        currency\n      }\n    }\n  }\n": typeof types.GetOrdersDocument,
    "\n  mutation UpdateUserRole($userId: ID!, $role: String!) {\n    updateUserRole(userId: $userId, role: $role) {\n      id\n      email\n      firstName\n      lastName\n      phoneNumber\n      role\n      createdAt\n      updatedAt\n    }\n  }\n": typeof types.UpdateUserRoleDocument,
    "\n  mutation InviteAdminUser($input: InviteAdminUserInput!) {\n    inviteAdminUser(input: $input) {\n      success\n      error\n      invitedEmail\n    }\n  }\n": typeof types.InviteAdminUserDocument,
    "\n  query GetDataPlans($filter: DataPlanFilter) {\n    dataPlans(filter: $filter) {\n      items {\n        id\n        name\n        description\n        region\n        duration\n        price\n        currency\n        isUnlimited\n        bundleGroup\n        features\n        availableQuantity\n        countries {\n          iso\n          name\n          nameHebrew\n          region\n          flag\n        }\n      }\n      totalCount\n      hasNextPage\n      hasPreviousPage\n      pageInfo {\n        limit\n        offset\n        total\n        pages\n        currentPage\n      }\n    }\n  }\n": typeof types.GetDataPlansDocument,
    "\n  mutation AssignPackageToUser($userId: ID!, $planId: ID!) {\n    assignPackageToUser(userId: $userId, planId: $planId) {\n      success\n      error\n      assignment {\n        id\n        user {\n          id\n          email\n          firstName\n          lastName\n        }\n        dataPlan {\n          id\n          name\n          description\n          region\n          duration\n          price\n          currency\n        }\n        assignedAt\n      }\n    }\n  }\n": typeof types.AssignPackageToUserDocument,
    "\n  query CalculatePricing($numOfDays: Int!, $regionId: String!, $countryId: String!) {\n    calculatePrice(numOfDays: $numOfDays, regionId: $regionId, countryId: $countryId) {\n      bundleName\n      countryName\n      duration\n      cost\n      costPlus\n      totalCost\n      discountRate\n      discountValue\n      priceAfterDiscount\n      processingRate\n      processingCost\n      revenueAfterProcessing\n      finalRevenue\n      currency\n    }\n  }\n": typeof types.CalculatePricingDocument,
    "\n  query CalculateBatchPricing($inputs: [CalculatePriceInput!]!) {\n    calculatePrices(inputs: $inputs) {\n      bundleName\n      countryName\n      duration\n      cost\n      costPlus\n      totalCost\n      discountRate\n      discountValue\n      priceAfterDiscount\n      processingRate\n      processingCost\n      revenueAfterProcessing\n      finalRevenue\n      currency\n    }\n  }\n": typeof types.CalculateBatchPricingDocument,
    "\n  mutation DeleteUser($userId: ID!) {\n    deleteUser(userId: $userId) {\n      success\n      error\n    }\n  }\n": typeof types.DeleteUserDocument,
    "\n  query GetCountries {\n    countries {\n      iso\n      name\n      nameHebrew\n      region\n      flag\n    }\n  }\n": typeof types.GetCountriesDocument,
    "\n  query GetPricingConfigurations {\n    pricingConfigurations {\n      id\n      name\n      description\n      countryId\n      regionId\n      duration\n      bundleGroup\n      costSplitPercent\n      discountRate\n      processingRate\n      isActive\n      priority\n      createdBy\n      createdAt\n      updatedAt\n    }\n  }\n": typeof types.GetPricingConfigurationsDocument,
    "\n  mutation UpdatePricingConfiguration($input: UpdatePricingConfigurationInput!) {\n    updatePricingConfiguration(input: $input) {\n      success\n      error\n      configuration {\n        id\n        name\n        description\n        countryId\n        regionId\n        duration\n        bundleGroup\n        costSplitPercent\n        discountRate\n        processingRate\n        isActive\n        priority\n        createdBy\n        createdAt\n        updatedAt\n      }\n    }\n  }\n": typeof types.UpdatePricingConfigurationDocument,
};
const documents: Documents = {
    "\n  query GetTrips {\n    trips {\n      name\n      description\n      regionId\n      countryIds\n    }\n  }\n": types.GetTripsDocument,
    "\n  query GetUsers {\n    users {\n      id\n      email\n      firstName\n      lastName\n      phoneNumber\n      role\n      createdAt\n      updatedAt\n    }\n  }\n": types.GetUsersDocument,
    "\n  query GetOrders {\n    orders {\n      id\n      reference\n      status\n      quantity\n      totalPrice\n      createdAt\n      updatedAt\n      dataPlan {\n        id\n        name\n        description\n        region\n        duration\n        price\n        currency\n      }\n    }\n  }\n": types.GetOrdersDocument,
    "\n  mutation UpdateUserRole($userId: ID!, $role: String!) {\n    updateUserRole(userId: $userId, role: $role) {\n      id\n      email\n      firstName\n      lastName\n      phoneNumber\n      role\n      createdAt\n      updatedAt\n    }\n  }\n": types.UpdateUserRoleDocument,
    "\n  mutation InviteAdminUser($input: InviteAdminUserInput!) {\n    inviteAdminUser(input: $input) {\n      success\n      error\n      invitedEmail\n    }\n  }\n": types.InviteAdminUserDocument,
    "\n  query GetDataPlans($filter: DataPlanFilter) {\n    dataPlans(filter: $filter) {\n      items {\n        id\n        name\n        description\n        region\n        duration\n        price\n        currency\n        isUnlimited\n        bundleGroup\n        features\n        availableQuantity\n        countries {\n          iso\n          name\n          nameHebrew\n          region\n          flag\n        }\n      }\n      totalCount\n      hasNextPage\n      hasPreviousPage\n      pageInfo {\n        limit\n        offset\n        total\n        pages\n        currentPage\n      }\n    }\n  }\n": types.GetDataPlansDocument,
    "\n  mutation AssignPackageToUser($userId: ID!, $planId: ID!) {\n    assignPackageToUser(userId: $userId, planId: $planId) {\n      success\n      error\n      assignment {\n        id\n        user {\n          id\n          email\n          firstName\n          lastName\n        }\n        dataPlan {\n          id\n          name\n          description\n          region\n          duration\n          price\n          currency\n        }\n        assignedAt\n      }\n    }\n  }\n": types.AssignPackageToUserDocument,
    "\n  query CalculatePricing($numOfDays: Int!, $regionId: String!, $countryId: String!) {\n    calculatePrice(numOfDays: $numOfDays, regionId: $regionId, countryId: $countryId) {\n      bundleName\n      countryName\n      duration\n      cost\n      costPlus\n      totalCost\n      discountRate\n      discountValue\n      priceAfterDiscount\n      processingRate\n      processingCost\n      revenueAfterProcessing\n      finalRevenue\n      currency\n    }\n  }\n": types.CalculatePricingDocument,
    "\n  query CalculateBatchPricing($inputs: [CalculatePriceInput!]!) {\n    calculatePrices(inputs: $inputs) {\n      bundleName\n      countryName\n      duration\n      cost\n      costPlus\n      totalCost\n      discountRate\n      discountValue\n      priceAfterDiscount\n      processingRate\n      processingCost\n      revenueAfterProcessing\n      finalRevenue\n      currency\n    }\n  }\n": types.CalculateBatchPricingDocument,
    "\n  mutation DeleteUser($userId: ID!) {\n    deleteUser(userId: $userId) {\n      success\n      error\n    }\n  }\n": types.DeleteUserDocument,
    "\n  query GetCountries {\n    countries {\n      iso\n      name\n      nameHebrew\n      region\n      flag\n    }\n  }\n": types.GetCountriesDocument,
    "\n  query GetPricingConfigurations {\n    pricingConfigurations {\n      id\n      name\n      description\n      countryId\n      regionId\n      duration\n      bundleGroup\n      costSplitPercent\n      discountRate\n      processingRate\n      isActive\n      priority\n      createdBy\n      createdAt\n      updatedAt\n    }\n  }\n": types.GetPricingConfigurationsDocument,
    "\n  mutation UpdatePricingConfiguration($input: UpdatePricingConfigurationInput!) {\n    updatePricingConfiguration(input: $input) {\n      success\n      error\n      configuration {\n        id\n        name\n        description\n        countryId\n        regionId\n        duration\n        bundleGroup\n        costSplitPercent\n        discountRate\n        processingRate\n        isActive\n        priority\n        createdBy\n        createdAt\n        updatedAt\n      }\n    }\n  }\n": types.UpdatePricingConfigurationDocument,
};

/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 *
 *
 * @example
 * ```ts
 * const query = gql(`query GetUser($id: ID!) { user(id: $id) { name } }`);
 * ```
 *
 * The query argument is unknown!
 * Please regenerate the types.
 */
export function gql(source: string): unknown;

/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query GetTrips {\n    trips {\n      name\n      description\n      regionId\n      countryIds\n    }\n  }\n"): (typeof documents)["\n  query GetTrips {\n    trips {\n      name\n      description\n      regionId\n      countryIds\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query GetUsers {\n    users {\n      id\n      email\n      firstName\n      lastName\n      phoneNumber\n      role\n      createdAt\n      updatedAt\n    }\n  }\n"): (typeof documents)["\n  query GetUsers {\n    users {\n      id\n      email\n      firstName\n      lastName\n      phoneNumber\n      role\n      createdAt\n      updatedAt\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query GetOrders {\n    orders {\n      id\n      reference\n      status\n      quantity\n      totalPrice\n      createdAt\n      updatedAt\n      dataPlan {\n        id\n        name\n        description\n        region\n        duration\n        price\n        currency\n      }\n    }\n  }\n"): (typeof documents)["\n  query GetOrders {\n    orders {\n      id\n      reference\n      status\n      quantity\n      totalPrice\n      createdAt\n      updatedAt\n      dataPlan {\n        id\n        name\n        description\n        region\n        duration\n        price\n        currency\n      }\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation UpdateUserRole($userId: ID!, $role: String!) {\n    updateUserRole(userId: $userId, role: $role) {\n      id\n      email\n      firstName\n      lastName\n      phoneNumber\n      role\n      createdAt\n      updatedAt\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateUserRole($userId: ID!, $role: String!) {\n    updateUserRole(userId: $userId, role: $role) {\n      id\n      email\n      firstName\n      lastName\n      phoneNumber\n      role\n      createdAt\n      updatedAt\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation InviteAdminUser($input: InviteAdminUserInput!) {\n    inviteAdminUser(input: $input) {\n      success\n      error\n      invitedEmail\n    }\n  }\n"): (typeof documents)["\n  mutation InviteAdminUser($input: InviteAdminUserInput!) {\n    inviteAdminUser(input: $input) {\n      success\n      error\n      invitedEmail\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query GetDataPlans($filter: DataPlanFilter) {\n    dataPlans(filter: $filter) {\n      items {\n        id\n        name\n        description\n        region\n        duration\n        price\n        currency\n        isUnlimited\n        bundleGroup\n        features\n        availableQuantity\n        countries {\n          iso\n          name\n          nameHebrew\n          region\n          flag\n        }\n      }\n      totalCount\n      hasNextPage\n      hasPreviousPage\n      pageInfo {\n        limit\n        offset\n        total\n        pages\n        currentPage\n      }\n    }\n  }\n"): (typeof documents)["\n  query GetDataPlans($filter: DataPlanFilter) {\n    dataPlans(filter: $filter) {\n      items {\n        id\n        name\n        description\n        region\n        duration\n        price\n        currency\n        isUnlimited\n        bundleGroup\n        features\n        availableQuantity\n        countries {\n          iso\n          name\n          nameHebrew\n          region\n          flag\n        }\n      }\n      totalCount\n      hasNextPage\n      hasPreviousPage\n      pageInfo {\n        limit\n        offset\n        total\n        pages\n        currentPage\n      }\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation AssignPackageToUser($userId: ID!, $planId: ID!) {\n    assignPackageToUser(userId: $userId, planId: $planId) {\n      success\n      error\n      assignment {\n        id\n        user {\n          id\n          email\n          firstName\n          lastName\n        }\n        dataPlan {\n          id\n          name\n          description\n          region\n          duration\n          price\n          currency\n        }\n        assignedAt\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation AssignPackageToUser($userId: ID!, $planId: ID!) {\n    assignPackageToUser(userId: $userId, planId: $planId) {\n      success\n      error\n      assignment {\n        id\n        user {\n          id\n          email\n          firstName\n          lastName\n        }\n        dataPlan {\n          id\n          name\n          description\n          region\n          duration\n          price\n          currency\n        }\n        assignedAt\n      }\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query CalculatePricing($numOfDays: Int!, $regionId: String!, $countryId: String!) {\n    calculatePrice(numOfDays: $numOfDays, regionId: $regionId, countryId: $countryId) {\n      bundleName\n      countryName\n      duration\n      cost\n      costPlus\n      totalCost\n      discountRate\n      discountValue\n      priceAfterDiscount\n      processingRate\n      processingCost\n      revenueAfterProcessing\n      finalRevenue\n      currency\n    }\n  }\n"): (typeof documents)["\n  query CalculatePricing($numOfDays: Int!, $regionId: String!, $countryId: String!) {\n    calculatePrice(numOfDays: $numOfDays, regionId: $regionId, countryId: $countryId) {\n      bundleName\n      countryName\n      duration\n      cost\n      costPlus\n      totalCost\n      discountRate\n      discountValue\n      priceAfterDiscount\n      processingRate\n      processingCost\n      revenueAfterProcessing\n      finalRevenue\n      currency\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query CalculateBatchPricing($inputs: [CalculatePriceInput!]!) {\n    calculatePrices(inputs: $inputs) {\n      bundleName\n      countryName\n      duration\n      cost\n      costPlus\n      totalCost\n      discountRate\n      discountValue\n      priceAfterDiscount\n      processingRate\n      processingCost\n      revenueAfterProcessing\n      finalRevenue\n      currency\n    }\n  }\n"): (typeof documents)["\n  query CalculateBatchPricing($inputs: [CalculatePriceInput!]!) {\n    calculatePrices(inputs: $inputs) {\n      bundleName\n      countryName\n      duration\n      cost\n      costPlus\n      totalCost\n      discountRate\n      discountValue\n      priceAfterDiscount\n      processingRate\n      processingCost\n      revenueAfterProcessing\n      finalRevenue\n      currency\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation DeleteUser($userId: ID!) {\n    deleteUser(userId: $userId) {\n      success\n      error\n    }\n  }\n"): (typeof documents)["\n  mutation DeleteUser($userId: ID!) {\n    deleteUser(userId: $userId) {\n      success\n      error\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query GetCountries {\n    countries {\n      iso\n      name\n      nameHebrew\n      region\n      flag\n    }\n  }\n"): (typeof documents)["\n  query GetCountries {\n    countries {\n      iso\n      name\n      nameHebrew\n      region\n      flag\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query GetPricingConfigurations {\n    pricingConfigurations {\n      id\n      name\n      description\n      countryId\n      regionId\n      duration\n      bundleGroup\n      costSplitPercent\n      discountRate\n      processingRate\n      isActive\n      priority\n      createdBy\n      createdAt\n      updatedAt\n    }\n  }\n"): (typeof documents)["\n  query GetPricingConfigurations {\n    pricingConfigurations {\n      id\n      name\n      description\n      countryId\n      regionId\n      duration\n      bundleGroup\n      costSplitPercent\n      discountRate\n      processingRate\n      isActive\n      priority\n      createdBy\n      createdAt\n      updatedAt\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation UpdatePricingConfiguration($input: UpdatePricingConfigurationInput!) {\n    updatePricingConfiguration(input: $input) {\n      success\n      error\n      configuration {\n        id\n        name\n        description\n        countryId\n        regionId\n        duration\n        bundleGroup\n        costSplitPercent\n        discountRate\n        processingRate\n        isActive\n        priority\n        createdBy\n        createdAt\n        updatedAt\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation UpdatePricingConfiguration($input: UpdatePricingConfigurationInput!) {\n    updatePricingConfiguration(input: $input) {\n      success\n      error\n      configuration {\n        id\n        name\n        description\n        countryId\n        regionId\n        duration\n        bundleGroup\n        costSplitPercent\n        discountRate\n        processingRate\n        isActive\n        priority\n        createdBy\n        createdAt\n        updatedAt\n      }\n    }\n  }\n"];

export function gql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> = TDocumentNode extends DocumentNode<  infer TType,  any>  ? TType  : never;