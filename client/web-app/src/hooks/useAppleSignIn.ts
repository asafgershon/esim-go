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

  const signInWithApple = async (autoPrompt: boolean = false) => {
    try {
      if (!window.AppleID) {
        await waitForAppleScript();
      }

      // Use native redirect flow instead of popup to avoid Safari blocking
      const config: AppleSignInConfig = {
        clientId: process.env.NEXT_PUBLIC_APPLE_CLIENT_ID!,
        scope: 'name email',
        redirectURI: process.env.NEXT_PUBLIC_APPLE_REDIRECT_URI!,
        state: autoPrompt ? 'auto-signin' : 'manual-signin',
        usePopup: false, // Changed to false to use native redirect flow
      };

      window.AppleID.auth.init(config);
      
      return new Promise<SignInResponse>((resolve, reject) => {
        const handleSuccess = async (event: Event) => {
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
          } finally {
            // Clean up event listeners
            document.removeEventListener('AppleIDSignInOnSuccess', handleSuccess);
            document.removeEventListener('AppleIDSignInOnFailure', handleFailure);
          }
        };

        const handleFailure = (event: Event) => {
          const error = (event as CustomEvent).detail?.error || 'Apple Sign-In failed';
          reject(new Error(error));
          
          // Clean up event listeners
          document.removeEventListener('AppleIDSignInOnSuccess', handleSuccess);
          document.removeEventListener('AppleIDSignInOnFailure', handleFailure);
        };

        document.addEventListener('AppleIDSignInOnSuccess', handleSuccess);
        document.addEventListener('AppleIDSignInOnFailure', handleFailure);

        // For auto prompts, add a shorter timeout since native flow is faster
        if (autoPrompt) {
          setTimeout(() => {
            document.removeEventListener('AppleIDSignInOnSuccess', handleSuccess);
            document.removeEventListener('AppleIDSignInOnFailure', handleFailure);
            reject(new Error('Apple Sign-In auto prompt timeout'));
          }, 3000); // Reduced timeout for native flow
        }

        try {
          // Use native sign-in flow - this will open the native Apple Sign In window
          window.AppleID.auth.signIn();
        } catch (signInError) {
          document.removeEventListener('AppleIDSignInOnSuccess', handleSuccess);
          document.removeEventListener('AppleIDSignInOnFailure', handleFailure);
          reject(signInError);
        }
      });
    } catch (error) {
      throw error;
    }
  };

  const renderAppleButton = (elementId: string) => {
    if (!window.AppleID) {
      return;
    }

    // Use native redirect flow for button as well
    const config: AppleSignInConfig = {
      clientId: process.env.NEXT_PUBLIC_APPLE_CLIENT_ID!,
      scope: 'name email',
      redirectURI: process.env.NEXT_PUBLIC_APPLE_REDIRECT_URI!,
      state: 'button-signin',
      usePopup: false, // Changed to false for native flow
    };

    window.AppleID.auth.init(config);

    const handleSuccess = async (event: Event) => {
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
          window.location.href = '/';
        } else {
          alert('Apple Sign-in failed: ' + result.data?.signInWithApple.error);
        }
      } catch (err) {
        alert('Apple Sign-In failed: ' + (err as Error).message);
      }
    };

    document.addEventListener('AppleIDSignInOnSuccess', handleSuccess);
    document.addEventListener('AppleIDSignInOnFailure', (event: Event) => {
      alert('Apple Sign-In failed: ' + (event as CustomEvent).detail?.error);
    });

    // Create and configure the Apple Sign-In button
    const buttonElement = document.getElementById(elementId);
    if (buttonElement) {
      buttonElement.innerHTML = `
        <div id="appleid-signin" 
             data-color="black" 
             data-border="true" 
             data-type="sign-in"
             data-width="400"
             data-height="50">
        </div>
      `;
      
      // Initialize the button with native flow
      window.AppleID.auth.init(config);
    }
  };

  return { signInWithApple, renderAppleButton, loading, error };
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
        signIn: () => void;
      };
    };
  }
}
