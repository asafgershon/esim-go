import { useQuery } from '@apollo/client';
import { useEffect, useState, useCallback } from 'react';
import { ME } from '@/lib/graphql/mutations';
import type { User } from '@/lib/types';
import { parseGraphQLError, ErrorType } from '@/lib/error-types';

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

  // Only run the ME query if there's an auth token
  const hasAuthToken = typeof window !== 'undefined' && localStorage.getItem('authToken');
  
  const { data, loading, error, refetch } = useQuery(ME, {
    errorPolicy: 'all',
    fetchPolicy: 'cache-and-network',
    skip: !hasAuthToken, // Skip the query if no auth token
  });

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    
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
        localStorage.removeItem('authToken');
        localStorage.removeItem('refreshToken');
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
    } else if (hasAuthToken) {
      // We have a token but no user data - this shouldn't happen
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    }
  }, [data, loading, error, hasAuthToken]);

  const signOut = useCallback(() => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('rememberLogin');
    localStorage.removeItem('lastPhoneNumber');
    setAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
    
    // Reload the page to clear any cached data
    window.location.href = '/';
  }, []);

  const refreshAuth = useCallback(() => {
    refetch();
  }, [refetch]);

  const clearError = useCallback(() => {
    setAuthState(prev => ({ ...prev, error: null }));
  }, []);

  // Helper to check if current session is valid
  const isSessionValid = useCallback(() => {
    const token = localStorage.getItem('authToken');
    return !!(token && authState.isAuthenticated && !authState.error);
  }, [authState.isAuthenticated, authState.error]);

  // Helper to get parsed auth error
  const getAuthError = useCallback(() => {
    if (!authState.error) return null;
    
    return parseGraphQLError({
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