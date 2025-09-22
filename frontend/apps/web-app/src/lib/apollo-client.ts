import { ApolloClient, InMemoryCache, createHttpLink, from, split } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { createClient } from 'graphql-ws';
import { getMainDefinition } from '@apollo/client/utilities';

const httpLink = createHttpLink({
  uri: process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || 'http://localhost:8080/graphql',
  // Add timeout configuration
  fetchOptions: {
    timeout: 30000, // 30 seconds
  },
});

const authLink = setContext((_, { headers }) => {
  // Get the authentication token from localStorage if it exists
  const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;

  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : "",
    }
  }
});

// WebSocket link for subscriptions (only on client-side)
const wsLink = typeof window !== 'undefined' ? new GraphQLWsLink(createClient({
  url: process.env.NEXT_PUBLIC_WS_ENDPOINT || 'ws://localhost:5001/graphql',
  connectionParams: () => {
    const token = localStorage.getItem('authToken');
    return {
      Authorization: token ? `Bearer ${token}` : '',
    };
  },
})) : null;

// Split link to route queries/mutations to HTTP and subscriptions to WebSocket
const splitLink = wsLink ? split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return (
      definition.kind === 'OperationDefinition' &&
      definition.operation === 'subscription'
    );
  },
  wsLink,
  from([authLink, httpLink]),
) : from([authLink, httpLink]);

export const apolloClient = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      errorPolicy: 'all',
    },
    query: {
      errorPolicy: 'all',
    },
  },
});
