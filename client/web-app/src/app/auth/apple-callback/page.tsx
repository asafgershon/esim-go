"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation } from "@apollo/client";
import { SIGN_IN_WITH_APPLE } from "@/lib/graphql/mutations";
import { SignInResponse, SocialSignInInput } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

export const dynamic = "force-dynamic";

function AppleCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [error, setError] = useState<string>("");

  const [signInWithAppleMutation] = useMutation<
    { signInWithApple: SignInResponse },
    { input: SocialSignInInput }
  >(SIGN_IN_WITH_APPLE);

  useEffect(() => {
    const processAppleCallback = async () => {
      try {
        // Get the authorization code from URL parameters
        const code = searchParams.get("code");
        const state = searchParams.get("state");
        const idToken = searchParams.get("id_token");
        const user = searchParams.get("user");

        if (!code && !idToken) {
          throw new Error(
            "No authorization code or ID token received from Apple"
          );
        }

        // Parse user data if available (only on first sign-in)
        let firstName = "";
        let lastName = "";

        if (user) {
          try {
            const userData = JSON.parse(user);
            firstName = userData.name?.firstName || "";
            lastName = userData.name?.lastName || "";
          } catch (e) {
            console.log("Could not parse user data:", e);
          }
        }

        // If we have an ID token, use it directly
        if (idToken) {
          const result = await signInWithAppleMutation({
            variables: {
              input: {
                idToken,
                firstName,
                lastName,
              },
            },
          });

          if (
            result.data?.signInWithApple.success &&
            result.data.signInWithApple.sessionToken
          ) {
            localStorage.setItem(
              "authToken",
              result.data.signInWithApple.sessionToken
            );
            setStatus("success");

            // Redirect based on the state parameter
            const redirectTo = state === "auto-signin" ? "/" : "/";
            setTimeout(() => {
              router.push(redirectTo);
            }, 1500);
          } else {
            throw new Error(
              result.data?.signInWithApple.error || "Sign in failed"
            );
          }
        } else {
          // If we only have a code, we need to exchange it for tokens on the backend
          // This would require a backend endpoint to handle the code exchange
          throw new Error("Authorization code flow not implemented yet");
        }
      } catch (error) {
        console.error("Apple callback error:", error);
        setError(
          error instanceof Error ? error.message : "Authentication failed"
        );
        setStatus("error");
      }
    };

    processAppleCallback();
  }, [searchParams, signInWithAppleMutation, router]);

  const handleRetry = () => {
    router.push("/login");
  };

  const handleGoHome = () => {
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
      <Card className="p-8 max-w-md w-full text-center">
        {status === "loading" && (
          <>
            <div className="flex justify-center mb-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
            <h2 className="text-xl font-semibold mb-2">
              Processing Apple Sign In
            </h2>
            <p className="text-muted-foreground">
              Please wait while we complete your authentication...
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="flex justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Sign In Successful!</h2>
            <p className="text-muted-foreground mb-4">
              You have been successfully signed in with Apple. Redirecting...
            </p>
            <Button onClick={handleGoHome} className="w-full">
              Continue to Dashboard
            </Button>
          </>
        )}

        {status === "error" && (
          <>
            <div className="flex justify-center mb-4">
              <XCircle className="h-8 w-8 text-destructive" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Sign In Failed</h2>
            <p className="text-muted-foreground mb-4">
              {error || "An error occurred during authentication."}
            </p>
            <div className="space-y-2">
              <Button onClick={handleRetry} className="w-full">
                Try Again
              </Button>
              <Button
                onClick={handleGoHome}
                variant="outline"
                className="w-full"
              >
                Go Home
              </Button>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}

export default function AppleCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
          <Card className="p-8 max-w-md w-full text-center">
            <div className="flex justify-center mb-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Loading...</h2>
            <p className="text-muted-foreground">Preparing Apple Sign In...</p>
          </Card>
        </div>
      }
    >
      <Suspense fallback={<div>Loading...</div>}>
        <AppleCallbackContent />
      </Suspense>
    </Suspense>
  );
}
