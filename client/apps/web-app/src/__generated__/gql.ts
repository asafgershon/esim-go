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
    "\nmutation CreateCheckoutSession($input: CreateCheckoutSessionInput!) {\n  createCheckoutSession(input: $input) {\n    success\n    session {\n      id\n      token\n      expiresAt\n      isComplete\n      timeRemaining\n      planSnapshot\n      pricing\n      steps\n      paymentStatus\n      metadata\n    }\n    error\n  }\n}": typeof types.CreateCheckoutSessionDocument,
    "\nmutation UpdateCheckoutStep($input: UpdateCheckoutStepInput!) {\n  updateCheckoutStep(input: $input) {\n    success\n    session {\n      id\n      isComplete\n      steps\n      timeRemaining\n    }\n    nextStep\n    error\n  }\n}": typeof types.UpdateCheckoutStepDocument,
    "\nmutation ProcessCheckoutPayment($input: ProcessCheckoutPaymentInput!) {\n  processCheckoutPayment(input: $input) {\n    success\n    orderId\n    session {\n      isComplete\n      paymentStatus\n    }\n    webhookProcessing\n    error\n  }\n}": typeof types.ProcessCheckoutPaymentDocument,
    "\nquery GetCheckoutSession($token: String!) {\n  getCheckoutSession(token: $token) {\n    success\n    session {\n      id\n      orderId\n      isComplete\n      paymentStatus\n      timeRemaining\n      steps\n      metadata\n      planSnapshot\n      pricing\n    }\n    error\n  }\n}": typeof types.GetCheckoutSessionDocument,
    "\nquery OrderDetails($id: ID!) {\n  orderDetails(id: $id) {\n    id\n    reference\n    status\n    totalPrice\n    esims {\n      id\n      iccid\n      qrCode\n      status\n    }\n  }\n}": typeof types.OrderDetailsDocument,
    "\nquery GetUserOrders {\n  myOrders {\n    id\n    reference\n    status\n    totalPrice\n    createdAt\n    esims {\n      id\n      status\n    }\n  }\n}": typeof types.GetUserOrdersDocument,
    "\nmutation ValidateOrder($input: ValidateOrderInput!) {\n  validateOrder(input: $input) {\n    success\n    isValid\n    bundleDetails\n    totalPrice\n    currency\n    error\n    errorCode\n  }\n}": typeof types.ValidateOrderDocument,
    "\n  mutation SignIn($input: SignInInput!) {\n    signIn(input: $input) {\n      success\n      error\n      user {\n        id\n        email\n        firstName\n        lastName\n        phoneNumber\n        createdAt\n        updatedAt\n      }\n      sessionToken\n      refreshToken\n    }\n  }\n": typeof types.SignInDocument,
    "\n  mutation SignUp($input: SignUpInput!) {\n    signUp(input: $input) {\n      success\n      error\n      user {\n        id\n        email\n        firstName\n        lastName\n        phoneNumber\n        createdAt\n        updatedAt\n      }\n      sessionToken\n      refreshToken\n    }\n  }\n": typeof types.SignUpDocument,
    "\n  mutation SignInWithApple($input: SocialSignInInput!) {\n    signInWithApple(input: $input) {\n      success\n      error\n      user {\n        id\n        email\n        firstName\n        lastName\n        phoneNumber\n        createdAt\n        updatedAt\n      }\n      sessionToken\n      refreshToken\n    }\n  }\n": typeof types.SignInWithAppleDocument,
    "\n  mutation SignInWithGoogle($input: SocialSignInInput!) {\n    signInWithGoogle(input: $input) {\n      success\n      error\n      user {\n        id\n        email\n        firstName\n        lastName\n        phoneNumber\n        createdAt\n        updatedAt\n      }\n      sessionToken\n      refreshToken\n    }\n  }\n": typeof types.SignInWithGoogleDocument,
    "\n  mutation SendPhoneOTP($phoneNumber: String!) {\n    sendPhoneOTP(phoneNumber: $phoneNumber) {\n      success\n      error\n      messageId\n    }\n  }\n": typeof types.SendPhoneOtpDocument,
    "\n  mutation VerifyPhoneOTP($input: VerifyOTPInput!) {\n    verifyPhoneOTP(input: $input) {\n      success\n      error\n      user {\n        id\n        email\n        firstName\n        lastName\n        phoneNumber\n        createdAt\n        updatedAt\n      }\n      sessionToken\n      refreshToken\n    }\n  }\n": typeof types.VerifyPhoneOtpDocument,
    "\n  query Me {\n    me {\n      id\n      email\n      firstName\n      lastName\n      phoneNumber\n      createdAt\n      updatedAt\n    }\n  }\n": typeof types.MeDocument,
    "\n  query GetCountries {\n    countries {\n      iso\n      name\n      nameHebrew\n      region\n      flag\n    }\n  }\n": typeof types.GetCountriesDocument,
    "\n  query GetCountriesWithBundles {\n    bundlesByCountry {\n      country {\n        iso\n        name\n        nameHebrew\n        region\n        flag\n      }\n    }\n  }\n": typeof types.GetCountriesWithBundlesDocument,
    "\n  query GetTrips {\n    trips {\n      name\n      description\n      region\n      countryIds\n    }\n  }\n": typeof types.GetTripsDocument,
    "\n  query CalculatePrice($numOfDays: Int!, $regionId: String!, $countryId: String!) {\n    calculatePrice(numOfDays: $numOfDays, regionId: $regionId, countryId: $countryId) {\n      bundle {\n        name\n      }\n      country {\n        name\n      }\n      duration\n      currency\n      totalCost\n      discountValue\n      priceAfterDiscount\n    }\n  }\n": typeof types.CalculatePriceDocument,
    "\n  query CalculatePricesBatch($inputs: [CalculatePriceInput!]!) {\n    calculatePrices(inputs: $inputs) {\n      bundle {\n        name\n      }\n      country {\n        name\n      }\n      duration\n      currency\n      totalCost\n      discountValue\n      priceAfterDiscount\n    }\n  }\n": typeof types.CalculatePricesBatchDocument,
    "\n  query GetMyESIMs {\n    myESIMs {\n      id\n      iccid\n      qrCode\n      status\n      assignedDate\n      lastAction\n      actionDate\n      bundleId\n      bundleName\n      usage {\n        totalUsed\n        totalRemaining\n        activeBundles {\n          name\n          state\n          dataUsed\n          dataRemaining\n          startDate\n          endDate\n        }\n      }\n      bundles {\n        name\n        state\n        dataUsed\n        dataRemaining\n        startDate\n        endDate\n      }\n      order {\n        id\n        reference\n        status\n        totalPrice\n        createdAt\n      }\n    }\n  }\n": typeof types.GetMyEsiMsDocument,
    "\n  query GetActiveESIMPlan {\n    myESIMs {\n      id\n      iccid\n      qrCode\n      status\n      assignedDate\n      bundleId\n      bundleName\n      usage {\n        totalUsed\n        totalRemaining\n        activeBundles {\n          name\n          state\n          dataUsed\n          dataRemaining\n          startDate\n          endDate\n        }\n      }\n      bundles {\n        name\n        state\n        dataUsed\n        dataRemaining\n        startDate\n        endDate\n      }\n    }\n  }\n": typeof types.GetActiveEsimPlanDocument,
};
const documents: Documents = {
    "\nmutation CreateCheckoutSession($input: CreateCheckoutSessionInput!) {\n  createCheckoutSession(input: $input) {\n    success\n    session {\n      id\n      token\n      expiresAt\n      isComplete\n      timeRemaining\n      planSnapshot\n      pricing\n      steps\n      paymentStatus\n      metadata\n    }\n    error\n  }\n}": types.CreateCheckoutSessionDocument,
    "\nmutation UpdateCheckoutStep($input: UpdateCheckoutStepInput!) {\n  updateCheckoutStep(input: $input) {\n    success\n    session {\n      id\n      isComplete\n      steps\n      timeRemaining\n    }\n    nextStep\n    error\n  }\n}": types.UpdateCheckoutStepDocument,
    "\nmutation ProcessCheckoutPayment($input: ProcessCheckoutPaymentInput!) {\n  processCheckoutPayment(input: $input) {\n    success\n    orderId\n    session {\n      isComplete\n      paymentStatus\n    }\n    webhookProcessing\n    error\n  }\n}": types.ProcessCheckoutPaymentDocument,
    "\nquery GetCheckoutSession($token: String!) {\n  getCheckoutSession(token: $token) {\n    success\n    session {\n      id\n      orderId\n      isComplete\n      paymentStatus\n      timeRemaining\n      steps\n      metadata\n      planSnapshot\n      pricing\n    }\n    error\n  }\n}": types.GetCheckoutSessionDocument,
    "\nquery OrderDetails($id: ID!) {\n  orderDetails(id: $id) {\n    id\n    reference\n    status\n    totalPrice\n    esims {\n      id\n      iccid\n      qrCode\n      status\n    }\n  }\n}": types.OrderDetailsDocument,
    "\nquery GetUserOrders {\n  myOrders {\n    id\n    reference\n    status\n    totalPrice\n    createdAt\n    esims {\n      id\n      status\n    }\n  }\n}": types.GetUserOrdersDocument,
    "\nmutation ValidateOrder($input: ValidateOrderInput!) {\n  validateOrder(input: $input) {\n    success\n    isValid\n    bundleDetails\n    totalPrice\n    currency\n    error\n    errorCode\n  }\n}": types.ValidateOrderDocument,
    "\n  mutation SignIn($input: SignInInput!) {\n    signIn(input: $input) {\n      success\n      error\n      user {\n        id\n        email\n        firstName\n        lastName\n        phoneNumber\n        createdAt\n        updatedAt\n      }\n      sessionToken\n      refreshToken\n    }\n  }\n": types.SignInDocument,
    "\n  mutation SignUp($input: SignUpInput!) {\n    signUp(input: $input) {\n      success\n      error\n      user {\n        id\n        email\n        firstName\n        lastName\n        phoneNumber\n        createdAt\n        updatedAt\n      }\n      sessionToken\n      refreshToken\n    }\n  }\n": types.SignUpDocument,
    "\n  mutation SignInWithApple($input: SocialSignInInput!) {\n    signInWithApple(input: $input) {\n      success\n      error\n      user {\n        id\n        email\n        firstName\n        lastName\n        phoneNumber\n        createdAt\n        updatedAt\n      }\n      sessionToken\n      refreshToken\n    }\n  }\n": types.SignInWithAppleDocument,
    "\n  mutation SignInWithGoogle($input: SocialSignInInput!) {\n    signInWithGoogle(input: $input) {\n      success\n      error\n      user {\n        id\n        email\n        firstName\n        lastName\n        phoneNumber\n        createdAt\n        updatedAt\n      }\n      sessionToken\n      refreshToken\n    }\n  }\n": types.SignInWithGoogleDocument,
    "\n  mutation SendPhoneOTP($phoneNumber: String!) {\n    sendPhoneOTP(phoneNumber: $phoneNumber) {\n      success\n      error\n      messageId\n    }\n  }\n": types.SendPhoneOtpDocument,
    "\n  mutation VerifyPhoneOTP($input: VerifyOTPInput!) {\n    verifyPhoneOTP(input: $input) {\n      success\n      error\n      user {\n        id\n        email\n        firstName\n        lastName\n        phoneNumber\n        createdAt\n        updatedAt\n      }\n      sessionToken\n      refreshToken\n    }\n  }\n": types.VerifyPhoneOtpDocument,
    "\n  query Me {\n    me {\n      id\n      email\n      firstName\n      lastName\n      phoneNumber\n      createdAt\n      updatedAt\n    }\n  }\n": types.MeDocument,
    "\n  query GetCountries {\n    countries {\n      iso\n      name\n      nameHebrew\n      region\n      flag\n    }\n  }\n": types.GetCountriesDocument,
    "\n  query GetCountriesWithBundles {\n    bundlesByCountry {\n      country {\n        iso\n        name\n        nameHebrew\n        region\n        flag\n      }\n    }\n  }\n": types.GetCountriesWithBundlesDocument,
    "\n  query GetTrips {\n    trips {\n      name\n      description\n      region\n      countryIds\n    }\n  }\n": types.GetTripsDocument,
    "\n  query CalculatePrice($numOfDays: Int!, $regionId: String!, $countryId: String!) {\n    calculatePrice(numOfDays: $numOfDays, regionId: $regionId, countryId: $countryId) {\n      bundle {\n        name\n      }\n      country {\n        name\n      }\n      duration\n      currency\n      totalCost\n      discountValue\n      priceAfterDiscount\n    }\n  }\n": types.CalculatePriceDocument,
    "\n  query CalculatePricesBatch($inputs: [CalculatePriceInput!]!) {\n    calculatePrices(inputs: $inputs) {\n      bundle {\n        name\n      }\n      country {\n        name\n      }\n      duration\n      currency\n      totalCost\n      discountValue\n      priceAfterDiscount\n    }\n  }\n": types.CalculatePricesBatchDocument,
    "\n  query GetMyESIMs {\n    myESIMs {\n      id\n      iccid\n      qrCode\n      status\n      assignedDate\n      lastAction\n      actionDate\n      bundleId\n      bundleName\n      usage {\n        totalUsed\n        totalRemaining\n        activeBundles {\n          name\n          state\n          dataUsed\n          dataRemaining\n          startDate\n          endDate\n        }\n      }\n      bundles {\n        name\n        state\n        dataUsed\n        dataRemaining\n        startDate\n        endDate\n      }\n      order {\n        id\n        reference\n        status\n        totalPrice\n        createdAt\n      }\n    }\n  }\n": types.GetMyEsiMsDocument,
    "\n  query GetActiveESIMPlan {\n    myESIMs {\n      id\n      iccid\n      qrCode\n      status\n      assignedDate\n      bundleId\n      bundleName\n      usage {\n        totalUsed\n        totalRemaining\n        activeBundles {\n          name\n          state\n          dataUsed\n          dataRemaining\n          startDate\n          endDate\n        }\n      }\n      bundles {\n        name\n        state\n        dataUsed\n        dataRemaining\n        startDate\n        endDate\n      }\n    }\n  }\n": types.GetActiveEsimPlanDocument,
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
export function gql(source: "\nmutation CreateCheckoutSession($input: CreateCheckoutSessionInput!) {\n  createCheckoutSession(input: $input) {\n    success\n    session {\n      id\n      token\n      expiresAt\n      isComplete\n      timeRemaining\n      planSnapshot\n      pricing\n      steps\n      paymentStatus\n      metadata\n    }\n    error\n  }\n}"): (typeof documents)["\nmutation CreateCheckoutSession($input: CreateCheckoutSessionInput!) {\n  createCheckoutSession(input: $input) {\n    success\n    session {\n      id\n      token\n      expiresAt\n      isComplete\n      timeRemaining\n      planSnapshot\n      pricing\n      steps\n      paymentStatus\n      metadata\n    }\n    error\n  }\n}"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\nmutation UpdateCheckoutStep($input: UpdateCheckoutStepInput!) {\n  updateCheckoutStep(input: $input) {\n    success\n    session {\n      id\n      isComplete\n      steps\n      timeRemaining\n    }\n    nextStep\n    error\n  }\n}"): (typeof documents)["\nmutation UpdateCheckoutStep($input: UpdateCheckoutStepInput!) {\n  updateCheckoutStep(input: $input) {\n    success\n    session {\n      id\n      isComplete\n      steps\n      timeRemaining\n    }\n    nextStep\n    error\n  }\n}"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\nmutation ProcessCheckoutPayment($input: ProcessCheckoutPaymentInput!) {\n  processCheckoutPayment(input: $input) {\n    success\n    orderId\n    session {\n      isComplete\n      paymentStatus\n    }\n    webhookProcessing\n    error\n  }\n}"): (typeof documents)["\nmutation ProcessCheckoutPayment($input: ProcessCheckoutPaymentInput!) {\n  processCheckoutPayment(input: $input) {\n    success\n    orderId\n    session {\n      isComplete\n      paymentStatus\n    }\n    webhookProcessing\n    error\n  }\n}"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\nquery GetCheckoutSession($token: String!) {\n  getCheckoutSession(token: $token) {\n    success\n    session {\n      id\n      orderId\n      isComplete\n      paymentStatus\n      timeRemaining\n      steps\n      metadata\n      planSnapshot\n      pricing\n    }\n    error\n  }\n}"): (typeof documents)["\nquery GetCheckoutSession($token: String!) {\n  getCheckoutSession(token: $token) {\n    success\n    session {\n      id\n      orderId\n      isComplete\n      paymentStatus\n      timeRemaining\n      steps\n      metadata\n      planSnapshot\n      pricing\n    }\n    error\n  }\n}"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\nquery OrderDetails($id: ID!) {\n  orderDetails(id: $id) {\n    id\n    reference\n    status\n    totalPrice\n    esims {\n      id\n      iccid\n      qrCode\n      status\n    }\n  }\n}"): (typeof documents)["\nquery OrderDetails($id: ID!) {\n  orderDetails(id: $id) {\n    id\n    reference\n    status\n    totalPrice\n    esims {\n      id\n      iccid\n      qrCode\n      status\n    }\n  }\n}"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\nquery GetUserOrders {\n  myOrders {\n    id\n    reference\n    status\n    totalPrice\n    createdAt\n    esims {\n      id\n      status\n    }\n  }\n}"): (typeof documents)["\nquery GetUserOrders {\n  myOrders {\n    id\n    reference\n    status\n    totalPrice\n    createdAt\n    esims {\n      id\n      status\n    }\n  }\n}"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\nmutation ValidateOrder($input: ValidateOrderInput!) {\n  validateOrder(input: $input) {\n    success\n    isValid\n    bundleDetails\n    totalPrice\n    currency\n    error\n    errorCode\n  }\n}"): (typeof documents)["\nmutation ValidateOrder($input: ValidateOrderInput!) {\n  validateOrder(input: $input) {\n    success\n    isValid\n    bundleDetails\n    totalPrice\n    currency\n    error\n    errorCode\n  }\n}"];
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
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query Me {\n    me {\n      id\n      email\n      firstName\n      lastName\n      phoneNumber\n      createdAt\n      updatedAt\n    }\n  }\n"): (typeof documents)["\n  query Me {\n    me {\n      id\n      email\n      firstName\n      lastName\n      phoneNumber\n      createdAt\n      updatedAt\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query GetCountries {\n    countries {\n      iso\n      name\n      nameHebrew\n      region\n      flag\n    }\n  }\n"): (typeof documents)["\n  query GetCountries {\n    countries {\n      iso\n      name\n      nameHebrew\n      region\n      flag\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query GetCountriesWithBundles {\n    bundlesByCountry {\n      country {\n        iso\n        name\n        nameHebrew\n        region\n        flag\n      }\n    }\n  }\n"): (typeof documents)["\n  query GetCountriesWithBundles {\n    bundlesByCountry {\n      country {\n        iso\n        name\n        nameHebrew\n        region\n        flag\n      }\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query GetTrips {\n    trips {\n      name\n      description\n      region\n      countryIds\n    }\n  }\n"): (typeof documents)["\n  query GetTrips {\n    trips {\n      name\n      description\n      region\n      countryIds\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query CalculatePrice($numOfDays: Int!, $regionId: String!, $countryId: String!) {\n    calculatePrice(numOfDays: $numOfDays, regionId: $regionId, countryId: $countryId) {\n      bundle {\n        name\n      }\n      country {\n        name\n      }\n      duration\n      currency\n      totalCost\n      discountValue\n      priceAfterDiscount\n    }\n  }\n"): (typeof documents)["\n  query CalculatePrice($numOfDays: Int!, $regionId: String!, $countryId: String!) {\n    calculatePrice(numOfDays: $numOfDays, regionId: $regionId, countryId: $countryId) {\n      bundle {\n        name\n      }\n      country {\n        name\n      }\n      duration\n      currency\n      totalCost\n      discountValue\n      priceAfterDiscount\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query CalculatePricesBatch($inputs: [CalculatePriceInput!]!) {\n    calculatePrices(inputs: $inputs) {\n      bundle {\n        name\n      }\n      country {\n        name\n      }\n      duration\n      currency\n      totalCost\n      discountValue\n      priceAfterDiscount\n    }\n  }\n"): (typeof documents)["\n  query CalculatePricesBatch($inputs: [CalculatePriceInput!]!) {\n    calculatePrices(inputs: $inputs) {\n      bundle {\n        name\n      }\n      country {\n        name\n      }\n      duration\n      currency\n      totalCost\n      discountValue\n      priceAfterDiscount\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query GetMyESIMs {\n    myESIMs {\n      id\n      iccid\n      qrCode\n      status\n      assignedDate\n      lastAction\n      actionDate\n      bundleId\n      bundleName\n      usage {\n        totalUsed\n        totalRemaining\n        activeBundles {\n          name\n          state\n          dataUsed\n          dataRemaining\n          startDate\n          endDate\n        }\n      }\n      bundles {\n        name\n        state\n        dataUsed\n        dataRemaining\n        startDate\n        endDate\n      }\n      order {\n        id\n        reference\n        status\n        totalPrice\n        createdAt\n      }\n    }\n  }\n"): (typeof documents)["\n  query GetMyESIMs {\n    myESIMs {\n      id\n      iccid\n      qrCode\n      status\n      assignedDate\n      lastAction\n      actionDate\n      bundleId\n      bundleName\n      usage {\n        totalUsed\n        totalRemaining\n        activeBundles {\n          name\n          state\n          dataUsed\n          dataRemaining\n          startDate\n          endDate\n        }\n      }\n      bundles {\n        name\n        state\n        dataUsed\n        dataRemaining\n        startDate\n        endDate\n      }\n      order {\n        id\n        reference\n        status\n        totalPrice\n        createdAt\n      }\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query GetActiveESIMPlan {\n    myESIMs {\n      id\n      iccid\n      qrCode\n      status\n      assignedDate\n      bundleId\n      bundleName\n      usage {\n        totalUsed\n        totalRemaining\n        activeBundles {\n          name\n          state\n          dataUsed\n          dataRemaining\n          startDate\n          endDate\n        }\n      }\n      bundles {\n        name\n        state\n        dataUsed\n        dataRemaining\n        startDate\n        endDate\n      }\n    }\n  }\n"): (typeof documents)["\n  query GetActiveESIMPlan {\n    myESIMs {\n      id\n      iccid\n      qrCode\n      status\n      assignedDate\n      bundleId\n      bundleName\n      usage {\n        totalUsed\n        totalRemaining\n        activeBundles {\n          name\n          state\n          dataUsed\n          dataRemaining\n          startDate\n          endDate\n        }\n      }\n      bundles {\n        name\n        state\n        dataUsed\n        dataRemaining\n        startDate\n        endDate\n      }\n    }\n  }\n"];

export function gql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> = TDocumentNode extends DocumentNode<  infer TType,  any>  ? TType  : never;