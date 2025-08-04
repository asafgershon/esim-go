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

export const ME = gql`
  query Me {
    me {
      id
      email
      firstName
      lastName
      phoneNumber
      createdAt
      updatedAt
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

export const GET_COUNTRIES_WITH_BUNDLES = gql`
  query GetCountriesWithBundles {
    bundlesByCountry {
      country {
        iso
        name
        nameHebrew
        region
        flag
      }
    }
  }
`;

export const GET_TRIPS = gql`
  query GetTrips {
    trips {
      name
      description
      region
      countryIds
    }
  }
`;

export const CALCULATE_PRICE = gql`
  query CalculatePrice($numOfDays: Int!, $countryId: String!, $paymentMethod: PaymentMethod, $regionId: String, $groups: [String!]) {
    calculatePrice(numOfDays: $numOfDays, countryId: $countryId, paymentMethod: $paymentMethod, regionId: $regionId, groups: $groups) {
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
      # Public pricing fields (what users pay)
      totalCost
      discountValue
      priceAfterDiscount
    }
  }
`;

export const CALCULATE_PRICES_BATCH = gql`
  query CalculatePricesBatch($inputs: [CalculatePriceInput!]!) {
    calculatePrices2(inputs: $inputs) {
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
      # Public pricing fields (what users pay)
      totalCost
      discountValue
      priceAfterDiscount
    }
  }
`;

export const GET_MY_ESIMS = gql`
  query GetMyESIMs {
    myESIMs {
      id
      iccid
      qrCode
      status
      assignedDate
      lastAction
      actionDate
      bundleId
      bundleName
      usage {
        totalUsed
        totalRemaining
        activeBundles {
          name
          state
          dataUsed
          dataRemaining
          startDate
          endDate
        }
      }
      bundles {
        name
        state
        dataUsed
        dataRemaining
        startDate
        endDate
      }
      order {
        id
        reference
        status
        totalPrice
        createdAt
      }
    }
  }
`;

export const GET_ACTIVE_ESIM_PLAN = gql`
  query GetActiveESIMPlan {
    myESIMs {
      id
      iccid
      qrCode
      status
      assignedDate
      bundleId
      bundleName
      usage {
        totalUsed
        totalRemaining
        activeBundles {
          name
          state
          dataUsed
          dataRemaining
          startDate
          endDate
        }
      }
      bundles {
        name
        state
        dataUsed
        dataRemaining
        startDate
        endDate
      }
    }
  }
`;

export const UPDATE_PROFILE = gql`
  mutation UpdateProfile($input: UpdateProfileInput!) {
    updateProfile(input: $input) {
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
    }
  }
`;

