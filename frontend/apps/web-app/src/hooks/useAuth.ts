import { parseGraphQLError } from '@/lib/error-types';
import { ME } from '@/lib/graphql/mutations';
import type { User } from '@/lib/types';
import { useQuery } from '@apollo/client';
import { useCallback, useEffect, useState } from 'react';

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });
  
  // Track auth token in state to trigger re-evaluation
  const [hasToken, setHasToken] = useState(false);

  // Check for auth token on mount and when it changes
  useEffect(() => {
    const checkToken = () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      setHasToken(!!token);
    };
    
    checkToken();
    
    // Only add event listener if we're in the browser
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', checkToken);
      return () => window.removeEventListener('storage', checkToken);
    }
  }, []);
  
  const { data, loading, error, refetch } = useQuery(ME, {
    errorPolicy: 'all',
    fetchPolicy: 'cache-and-network',
    skip: !hasToken, // Skip the query if no auth token
  });

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
    
    // If no token, set unauthenticated state immediately
    if (!token) {
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
      return;
    }

    // If we have a token but query is loading, show loading state
    if (loading) {
      setAuthState(prev => ({ ...prev, isLoading: true }));
      return;
    }

    // If there's an error with the ME query
    if (error) {
      // If there's an auth error, clear the token
      if (error.graphQLErrors.some(e => e.extensions?.code === 'UNAUTHORIZED')) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('authToken');
          localStorage.removeItem('refreshToken');
        }
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: 'Session expired. Please sign in again.',
        });
      } else {
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: error.message,
        });
      }
      return;
    }

    // If we have token and query succeeded
    if (data?.me) {
      setAuthState({
        user: data.me,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } else if (hasToken) {
      // We have a token but no user data - this shouldn't happen
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    }
  }, [data, loading, error, hasToken]);

  const signOut = useCallback((redirect: boolean = true) => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('rememberLogin');
      localStorage.removeItem('lastPhoneNumber');
    }
    setAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
    
    // Reload the page to clear any cached data
    if (typeof window !== 'undefined' && redirect) {
      window.location.href = '/';
    }
  }, []);

  const refreshAuth = useCallback(() => {
    // Re-check if we have a token
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
    setHasToken(!!token);
    
    // If we have a token, refetch the user data
    if (token) {
      refetch();
    }
  }, [refetch]);

  const clearError = useCallback(() => {
    setAuthState(prev => ({ ...prev, error: null }));
  }, []);

  // Helper to check if current session is valid
  const isSessionValid = useCallback(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
    return !!(token && authState.isAuthenticated && !authState.error);
  }, [authState.isAuthenticated, authState.error]);

  // Helper to get parsed auth error
  const getAuthError = useCallback(() => {
    if (!authState.error) return null;
    
    return parseGraphQLError({
      cause: new Error(authState.error),
      clientErrors: [],
      extraInfo: {},
      name: 'ApolloError',
      protocolErrors: [],
      message: authState.error,
      graphQLErrors: error?.graphQLErrors || [],
      networkError: error?.networkError || null,
    });
  }, [authState.error, error]);

  return {
    ...authState,
    signOut,
    refreshAuth,
    clearError,
    isSessionValid,
    getAuthError,
  };
}; 