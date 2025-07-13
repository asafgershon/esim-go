import { useQuery } from '@apollo/client';
import { useEffect, useState } from 'react';
import { ME } from '@/lib/graphql/mutations';
import type { User } from '@/lib/types';

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

  const { data, loading, error, refetch } = useQuery(ME, {
    errorPolicy: 'all',
    fetchPolicy: 'cache-and-network',
  });

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    
    if (!token) {
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
      return;
    }

    if (loading) {
      setAuthState(prev => ({ ...prev, isLoading: true }));
      return;
    }

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

    if (data?.me) {
      setAuthState({
        user: data.me,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } else {
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    }
  }, [data, loading, error]);

  const signOut = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    setAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  };

  const refreshAuth = () => {
    refetch();
  };

  return {
    ...authState,
    signOut,
    refreshAuth,
  };
}; 