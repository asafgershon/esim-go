import { gql } from "@apollo/client"

export const GET_TRIPS = gql(`
  query GetTrips {
    trips {
      name
      description
      regionId
      countryIds
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