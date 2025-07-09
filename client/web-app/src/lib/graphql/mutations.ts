import { gql } from '@apollo/client';

export const SIGN_IN = gql`
  mutation SignIn($input: SignInInput!) {
    signIn(input: $input) {
      success
      error
      user {
        id
        email
        firstName
        lastName
        phoneNumber
        createdAt
        updatedAt
      }
      sessionToken
      refreshToken
    }
  }
`;

export const SIGN_UP = gql`
  mutation SignUp($input: SignUpInput!) {
    signUp(input: $input) {
      success
      error
      user {
        id
        email
        firstName
        lastName
        phoneNumber
        createdAt
        updatedAt
      }
      sessionToken
      refreshToken
    }
  }
`;

export const SIGN_IN_WITH_APPLE = gql`
  mutation SignInWithApple($input: SocialSignInInput!) {
    signInWithApple(input: $input) {
      success
      error
      user {
        id
        email
        firstName
        lastName
        phoneNumber
        createdAt
        updatedAt
      }
      sessionToken
      refreshToken
    }
  }
`;

export const SIGN_IN_WITH_GOOGLE = gql`
  mutation SignInWithGoogle($input: SocialSignInInput!) {
    signInWithGoogle(input: $input) {
      success
      error
      user {
        id
        email
        firstName
        lastName
        phoneNumber
        createdAt
        updatedAt
      }
      sessionToken
      refreshToken
    }
  }
`;

export const SEND_PHONE_OTP = gql`
  mutation SendPhoneOTP($phoneNumber: String!) {
    sendPhoneOTP(phoneNumber: $phoneNumber) {
      success
      error
      messageId
    }
  }
`;

export const VERIFY_PHONE_OTP = gql`
  mutation VerifyPhoneOTP($input: VerifyOTPInput!) {
    verifyPhoneOTP(input: $input) {
      success
      error
      user {
        id
        email
        firstName
        lastName
        phoneNumber
        createdAt
        updatedAt
      }
      sessionToken
      refreshToken
    }
  }
`;

export const GET_COUNTRIES = gql`
  query GetCountries {
    countries {
      iso
      name
      nameHebrew
      region
      flag
    }
  }
`;

export const GET_TRIPS = gql`
  query GetTrips {
    trips {
      name
      description
      regionId
      countryIds
      countries {
        iso
        name
        nameHebrew
        region
        flag
      }
    }
  }
`;

export const CALCULATE_PRICE = gql`
  query CalculatePrice($numOfDays: Int!, $regionId: String!, $countryId: String!) {
    calculatePrice(numOfDays: $numOfDays, regionId: $regionId, countryId: $countryId)
  }
`;
