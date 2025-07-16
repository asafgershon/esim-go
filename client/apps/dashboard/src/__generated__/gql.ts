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
};
const documents: Documents = {
    "\n  query GetTrips {\n    trips {\n      name\n      description\n      regionId\n      countryIds\n    }\n  }\n": types.GetTripsDocument,
    "\n  query GetUsers {\n    users {\n      id\n      email\n      firstName\n      lastName\n      phoneNumber\n      role\n      createdAt\n      updatedAt\n    }\n  }\n": types.GetUsersDocument,
    "\n  query GetOrders {\n    orders {\n      id\n      reference\n      status\n      quantity\n      totalPrice\n      createdAt\n      updatedAt\n      dataPlan {\n        id\n        name\n        description\n        region\n        duration\n        price\n        currency\n      }\n    }\n  }\n": types.GetOrdersDocument,
    "\n  mutation UpdateUserRole($userId: ID!, $role: String!) {\n    updateUserRole(userId: $userId, role: $role) {\n      id\n      email\n      firstName\n      lastName\n      phoneNumber\n      role\n      createdAt\n      updatedAt\n    }\n  }\n": types.UpdateUserRoleDocument,
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

export function gql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> = TDocumentNode extends DocumentNode<  infer TType,  any>  ? TType  : never;