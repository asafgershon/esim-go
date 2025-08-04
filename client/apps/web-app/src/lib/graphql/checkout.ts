import { gql } from "@apollo/client";

export const CreateCheckoutSession = gql`
mutation CreateCheckoutSession($input: CreateCheckoutSessionInput!) {
  createCheckoutSession(input: $input) {
    success
    session {
      id
      token
      expiresAt
      isComplete
      timeRemaining
      planSnapshot
      pricing
      steps
      paymentStatus
      metadata
    }
    error
  }
}`



export const UpdateCheckoutStep = gql`
mutation UpdateCheckoutStep($input: UpdateCheckoutStepInput!) {
  updateCheckoutStep(input: $input) {
    success
    session {
      id
      isComplete
      steps
      timeRemaining
    }
    nextStep
    error
  }
}`

export const ProcessCheckoutPayment = gql`
mutation ProcessCheckoutPayment($input: ProcessCheckoutPaymentInput!) {
  processCheckoutPayment(input: $input) {
    success
    orderId
    session {
      isComplete
      paymentStatus
    }
    webhookProcessing
    error
  }
}`

export const GetCheckoutSession = gql`
query GetCheckoutSession($token: String!) {
  getCheckoutSession(token: $token) {
    success
    session {
      id
      orderId
      isComplete
      paymentStatus
      timeRemaining
      steps
      metadata
      planSnapshot
      pricing
    }
    error
  }
}`

export const OrderDetails = gql`
query OrderDetails($id: ID!) {
  orderDetails(id: $id) {
    id
    reference
    status
    totalPrice
    esims {
      id
      iccid
      qrCode
      status
      smdpAddress
      matchingId
      installationLinks {
        universalLink
        lpaScheme
        qrCodeData
        manual {
          smDpAddress
          activationCode
          confirmationCode
        }
      }
    }
  }
}`

export const GetUserOrders = gql`
query GetUserOrders {
  myOrders {
    id
    reference
    status
    totalPrice
    currency
    createdAt
    esims {
      id
      status
    }
  }
}`

export const ValidateOrder = gql`
mutation ValidateOrder($input: ValidateOrderInput!) {
  validateOrder(input: $input) {
    success
    isValid
    bundleDetails
    totalPrice
    currency
    error
    errorCode
  }
}`