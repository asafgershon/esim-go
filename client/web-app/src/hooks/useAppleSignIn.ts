import { useMutation } from '@apollo/client';
import { SIGN_IN_WITH_APPLE } from '@/lib/graphql/mutations';
import { SignInResponse, SocialSignInInput, AppleSignInResponse } from '@/lib/types';

// Apple Sign-In event type
interface AppleSignInEvent extends CustomEvent {
  detail: AppleSignInResponse;
}

interface AppleSignInConfig {
  clientId: string;
  scope: string;
  redirectURI: string;
  state: string;
  usePopup: boolean;
}

export const useAppleSignIn = () => {
  const [signInWithAppleMutation, { loading, error }] = useMutation<
    { signInWithApple: SignInResponse },
    { input: SocialSignInInput }
  >(SIGN_IN_WITH_APPLE);

  const signInWithApple = async () => {
    try {
      if (!window.AppleID) {
        await waitForAppleScript();
      }

      const config: AppleSignInConfig = {
        clientId: process.env.NEXT_PUBLIC_APPLE_CLIENT_ID!,
        scope: 'name email',
        redirectURI: process.env.NEXT_PUBLIC_APPLE_REDIRECT_URI!,
        state: 'web-signin',
        usePopup: true,
      };

      window.AppleID.auth.init(config);
      
      return new Promise<SignInResponse>((resolve, reject) => {
        document.addEventListener('AppleIDSignInOnSuccess', async (event: Event) => {
          try {
            const { authorization, user } = (event as AppleSignInEvent).detail;
            
            if (!authorization?.id_token) {
              throw new Error('No ID token received from Apple');
            }

            const firstName = user?.name?.firstName || '';
            const lastName = user?.name?.lastName || '';

            const result = await signInWithAppleMutation({
              variables: {
                input: {
                  idToken: authorization.id_token,
                  firstName,
                  lastName,
                },
              },
            });

            if (result.data?.signInWithApple.success && result.data.signInWithApple.sessionToken) {
              localStorage.setItem('authToken', result.data.signInWithApple.sessionToken);
              resolve(result.data.signInWithApple);
            } else {
              reject(new Error(result.data?.signInWithApple.error || 'Sign in failed'));
            }
          } catch (err) {
            reject(err);
          }
        });

        document.addEventListener('AppleIDSignInOnFailure', (event: Event) => {
          reject(new Error((event as CustomEvent).detail?.error || 'Apple Sign-In failed'));
        });

        window.AppleID.auth.signIn();
      });
    } catch (error) {
      throw error;
    }
  };

  return { signInWithApple, loading, error };
};

// Helper function to wait for Apple script to load
const waitForAppleScript = (): Promise<void> => {
  return new Promise((resolve) => {
    if (window.AppleID) {
      resolve();
      return;
    }
    
    const checkAppleID = () => {
      if (window.AppleID) {
        resolve();
      } else {
        setTimeout(checkAppleID, 100);
      }
    };
    
    checkAppleID();
  });
};

// Extend Window interface for TypeScript
declare global {
  interface Window {
    AppleID: {
      auth: {
        init: (config: AppleSignInConfig) => void;
        signIn: () => void; // Note: This doesn't return a Promise in event-driven approach
      };
    };
  }
}
