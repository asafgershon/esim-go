import { useMutation } from '@apollo/client';
import { SIGN_IN_WITH_GOOGLE } from '@/lib/graphql/mutations';
import { SignInResponse, SocialSignInInput } from '@/lib/types';

interface GoogleSignInConfig {
  client_id: string;
  callback: (response: GoogleCredentialResponse) => void;
  auto_select?: boolean;
  cancel_on_tap_outside?: boolean;
}

interface GoogleCredentialResponse {
  credential: string;
  select_by: string;
}

interface GoogleNotification {
  isNotDisplayed: () => boolean;
  isSkippedMoment: () => boolean;
}

interface GoogleButtonConfig {
  theme: 'outline' | 'filled_blue' | 'filled_black';
  size: 'large' | 'medium' | 'small';
  width?: number;
  text: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
}

export const useGoogleSignIn = () => {
  const [signInWithGoogleMutation, { loading }] = useMutation<
    { signInWithGoogle: SignInResponse },
    { input: SocialSignInInput }
  >(SIGN_IN_WITH_GOOGLE);

  const signInWithGoogle = async () => {
    try {
      if (!window.google) {
        await waitForGoogleScript();
      }

      return new Promise<SignInResponse>((resolve, reject) => {
        const handleCredentialResponse = async (response: GoogleCredentialResponse) => {
          try {
            if (!response.credential) {
              throw new Error('No credential received from Google');
            }

            // Decode the JWT to get user information
            const payload = parseJwt(response.credential);
            const firstName = payload.given_name || '';
            const lastName = payload.family_name || '';

            const result = await signInWithGoogleMutation({
              variables: {
                input: {
                  idToken: response.credential,
                  firstName,
                  lastName,
                },
              },
            });

            if (result.data?.signInWithGoogle.success && result.data.signInWithGoogle.sessionToken) {
              localStorage.setItem('authToken', result.data.signInWithGoogle.sessionToken);
              resolve(result.data.signInWithGoogle);
            } else {
              reject(new Error(result.data?.signInWithGoogle.error || 'Sign in failed'));
            }
          } catch (err) {
            reject(err);
          }
        };

        window.google.accounts.id.initialize({
          client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
          callback: handleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        window.google.accounts.id.prompt((notification: GoogleNotification) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            // Fallback to popup if one-tap is not available
            window.google.accounts.id.renderButton(
              document.getElementById('google-signin-button'),
              {
                theme: 'outline',
                size: 'large',
                width: 400,
                text: 'continue_with',
              }
            );
          }
        });
      });
    } catch (error) {
      throw error;
    }
  };

  const renderGoogleButton = (elementId: string) => {
    if (!window.google) {
      return;
    }

    const handleCredentialResponse = async (response: GoogleCredentialResponse) => {
      try {
        if (!response.credential) {
          throw new Error('No credential received from Google');
        }

        const payload = parseJwt(response.credential);
        const firstName = payload.given_name || '';
        const lastName = payload.family_name || '';

        const result = await signInWithGoogleMutation({
          variables: {
            input: {
              idToken: response.credential,
              firstName,
              lastName,
            },
          },
        });

        if (result.data?.signInWithGoogle.success && result.data.signInWithGoogle.sessionToken) {
          localStorage.setItem('authToken', result.data.signInWithGoogle.sessionToken);
          window.location.href = '/dashboard';
        } else {
          alert('Sign-in failed: ' + result.data?.signInWithGoogle.error);
        }
      } catch (err) {
        alert('Google Sign-In failed: ' + (err as Error).message);
      }
    };

    window.google.accounts.id.initialize({
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
      callback: handleCredentialResponse,
    });

    window.google.accounts.id.renderButton(
      document.getElementById(elementId),
      {
        theme: 'outline',
        size: 'large',
        width: 400,
        text: 'continue_with',
      }
    );
  };

  return { signInWithGoogle, renderGoogleButton, loading };
};

const waitForGoogleScript = (): Promise<void> => {
  return new Promise((resolve) => {
    if (window.google) {
      resolve();
      return;
    }
    
    const checkGoogle = () => {
      if (window.google) {
        resolve();
      } else {
        setTimeout(checkGoogle, 100);
      }
    };
    
    checkGoogle();
  });
};

const parseJwt = (token: string) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    throw new Error('Invalid JWT token');
  }
};

declare global {
  interface Window {
    google: {
      accounts: {
        id: {
          initialize: (config: GoogleSignInConfig) => void;
          prompt: (callback?: (notification: GoogleNotification) => void) => void;
          renderButton: (element: HTMLElement | null, config: GoogleButtonConfig) => void;
        };
      };
    };
  }
} 