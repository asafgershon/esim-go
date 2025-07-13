import { gql } from '@apollo/client'

export const GET_TRIPS = gql`
  query GetTrips {
    trips {
      name
      description
      regionId
      countryIds
    }
  }
`