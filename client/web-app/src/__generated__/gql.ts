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
    "\n  mutation SignIn($input: SignInInput!) {\n    signIn(input: $input) {\n      success\n      error\n      user {\n        id\n        email\n        firstName\n        lastName\n        phoneNumber\n        createdAt\n        updatedAt\n      }\n      sessionToken\n      refreshToken\n    }\n  }\n": typeof types.SignInDocument,
    "\n  mutation SignUp($input: SignUpInput!) {\n    signUp(input: $input) {\n      success\n      error\n      user {\n        id\n        email\n        firstName\n        lastName\n        phoneNumber\n        createdAt\n        updatedAt\n      }\n      sessionToken\n      refreshToken\n    }\n  }\n": typeof types.SignUpDocument,
    "\n  mutation SignInWithApple($input: SocialSignInInput!) {\n    signInWithApple(input: $input) {\n      success\n      error\n      user {\n        id\n        email\n        firstName\n        lastName\n        phoneNumber\n        createdAt\n        updatedAt\n      }\n      sessionToken\n      refreshToken\n    }\n  }\n": typeof types.SignInWithAppleDocument,
    "\n  mutation SignInWithGoogle($input: SocialSignInInput!) {\n    signInWithGoogle(input: $input) {\n      success\n      error\n      user {\n        id\n        email\n        firstName\n        lastName\n        phoneNumber\n        createdAt\n        updatedAt\n      }\n      sessionToken\n      refreshToken\n    }\n  }\n": typeof types.SignInWithGoogleDocument,
    "\n  mutation SendPhoneOTP($phoneNumber: String!) {\n    sendPhoneOTP(phoneNumber: $phoneNumber) {\n      success\n      error\n      messageId\n    }\n  }\n": typeof types.SendPhoneOtpDocument,
    "\n  mutation VerifyPhoneOTP($input: VerifyOTPInput!) {\n    verifyPhoneOTP(input: $input) {\n      success\n      error\n      user {\n        id\n        email\n        firstName\n        lastName\n        phoneNumber\n        createdAt\n        updatedAt\n      }\n      sessionToken\n      refreshToken\n    }\n  }\n": typeof types.VerifyPhoneOtpDocument,
};
const documents: Documents = {
    "\n  mutation SignIn($input: SignInInput!) {\n    signIn(input: $input) {\n      success\n      error\n      user {\n        id\n        email\n        firstName\n        lastName\n        phoneNumber\n        createdAt\n        updatedAt\n      }\n      sessionToken\n      refreshToken\n    }\n  }\n": types.SignInDocument,
    "\n  mutation SignUp($input: SignUpInput!) {\n    signUp(input: $input) {\n      success\n      error\n      user {\n        id\n        email\n        firstName\n        lastName\n        phoneNumber\n        createdAt\n        updatedAt\n      }\n      sessionToken\n      refreshToken\n    }\n  }\n": types.SignUpDocument,
    "\n  mutation SignInWithApple($input: SocialSignInInput!) {\n    signInWithApple(input: $input) {\n      success\n      error\n      user {\n        id\n        email\n        firstName\n        lastName\n        phoneNumber\n        createdAt\n        updatedAt\n      }\n      sessionToken\n      refreshToken\n    }\n  }\n": types.SignInWithAppleDocument,
    "\n  mutation SignInWithGoogle($input: SocialSignInInput!) {\n    signInWithGoogle(input: $input) {\n      success\n      error\n      user {\n        id\n        email\n        firstName\n        lastName\n        phoneNumber\n        createdAt\n        updatedAt\n      }\n      sessionToken\n      refreshToken\n    }\n  }\n": types.SignInWithGoogleDocument,
    "\n  mutation SendPhoneOTP($phoneNumber: String!) {\n    sendPhoneOTP(phoneNumber: $phoneNumber) {\n      success\n      error\n      messageId\n    }\n  }\n": types.SendPhoneOtpDocument,
    "\n  mutation VerifyPhoneOTP($input: VerifyOTPInput!) {\n    verifyPhoneOTP(input: $input) {\n      success\n      error\n      user {\n        id\n        email\n        firstName\n        lastName\n        phoneNumber\n        createdAt\n        updatedAt\n      }\n      sessionToken\n      refreshToken\n    }\n  }\n": types.VerifyPhoneOtpDocument,
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
export function gql(source: "\n  mutation SignIn($input: SignInInput!) {\n    signIn(input: $input) {\n      success\n      error\n      user {\n        id\n        email\n        firstName\n        lastName\n        phoneNumber\n        createdAt\n        updatedAt\n      }\n      sessionToken\n      refreshToken\n    }\n  }\n"): (typeof documents)["\n  mutation SignIn($input: SignInInput!) {\n    signIn(input: $input) {\n      success\n      error\n      user {\n        id\n        email\n        firstName\n        lastName\n        phoneNumber\n        createdAt\n        updatedAt\n      }\n      sessionToken\n      refreshToken\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation SignUp($input: SignUpInput!) {\n    signUp(input: $input) {\n      success\n      error\n      user {\n        id\n        email\n        firstName\n        lastName\n        phoneNumber\n        createdAt\n        updatedAt\n      }\n      sessionToken\n      refreshToken\n    }\n  }\n"): (typeof documents)["\n  mutation SignUp($input: SignUpInput!) {\n    signUp(input: $input) {\n      success\n      error\n      user {\n        id\n        email\n        firstName\n        lastName\n        phoneNumber\n        createdAt\n        updatedAt\n      }\n      sessionToken\n      refreshToken\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation SignInWithApple($input: SocialSignInInput!) {\n    signInWithApple(input: $input) {\n      success\n      error\n      user {\n        id\n        email\n        firstName\n        lastName\n        phoneNumber\n        createdAt\n        updatedAt\n      }\n      sessionToken\n      refreshToken\n    }\n  }\n"): (typeof documents)["\n  mutation SignInWithApple($input: SocialSignInInput!) {\n    signInWithApple(input: $input) {\n      success\n      error\n      user {\n        id\n        email\n        firstName\n        lastName\n        phoneNumber\n        createdAt\n        updatedAt\n      }\n      sessionToken\n      refreshToken\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation SignInWithGoogle($input: SocialSignInInput!) {\n    signInWithGoogle(input: $input) {\n      success\n      error\n      user {\n        id\n        email\n        firstName\n        lastName\n        phoneNumber\n        createdAt\n        updatedAt\n      }\n      sessionToken\n      refreshToken\n    }\n  }\n"): (typeof documents)["\n  mutation SignInWithGoogle($input: SocialSignInInput!) {\n    signInWithGoogle(input: $input) {\n      success\n      error\n      user {\n        id\n        email\n        firstName\n        lastName\n        phoneNumber\n        createdAt\n        updatedAt\n      }\n      sessionToken\n      refreshToken\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation SendPhoneOTP($phoneNumber: String!) {\n    sendPhoneOTP(phoneNumber: $phoneNumber) {\n      success\n      error\n      messageId\n    }\n  }\n"): (typeof documents)["\n  mutation SendPhoneOTP($phoneNumber: String!) {\n    sendPhoneOTP(phoneNumber: $phoneNumber) {\n      success\n      error\n      messageId\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation VerifyPhoneOTP($input: VerifyOTPInput!) {\n    verifyPhoneOTP(input: $input) {\n      success\n      error\n      user {\n        id\n        email\n        firstName\n        lastName\n        phoneNumber\n        createdAt\n        updatedAt\n      }\n      sessionToken\n      refreshToken\n    }\n  }\n"): (typeof documents)["\n  mutation VerifyPhoneOTP($input: VerifyOTPInput!) {\n    verifyPhoneOTP(input: $input) {\n      success\n      error\n      user {\n        id\n        email\n        firstName\n        lastName\n        phoneNumber\n        createdAt\n        updatedAt\n      }\n      sessionToken\n      refreshToken\n    }\n  }\n"];

export function gql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> = TDocumentNode extends DocumentNode<  infer TType,  any>  ? TType  : never;