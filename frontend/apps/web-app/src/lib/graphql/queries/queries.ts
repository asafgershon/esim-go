import { gql } from '@apollo/client';

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
