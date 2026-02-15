import { CreateCheckoutSessionInput } from "@/__generated__/graphql";
// import { CheckoutContainer } from "@/components/checkout/container";
import { redirect } from "next/navigation";
import { WEB_APP_BUNDLE_GROUP } from "@/lib/constants/bundle-groups";
import { CheckoutContainerV2 } from "@/components/checkout-v2/container";

interface CheckoutHandlerProps {
  searchParams: {
    token?: string;
    numOfDays?: string;
    countryId?: string;
    regionId?: string;
    numOfEsims?: string;
  };
}

// Helper function to handle server-side redirects cleanly
function performRedirect(url: string): never {
  console.log(`Redirecting to: ${url}`);
  redirect(url);
}

/**
 * פונקציית עזר ששולחת את ה-mutation ליצירת סשן
 * (שונתה לקבל אובייקט input יחיד)
 */
async function createCheckoutSession(input: CreateCheckoutSessionInput) {
  const GRAPHQL_ENDPOINT =
    process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || "http://localhost:5001/graphql";

  console.log("[SERVER] createCheckoutSession function called", {
    operationType: "graphql-mutation-start",
    input,
    endpoint: GRAPHQL_ENDPOINT,
  });

  const mutation = `
    mutation CreateCheckoutSession($input: CreateCheckoutSessionInput!) {
      createCheckoutSession(input: $input) {
        success
        session {
          token
        }
        error
      }
    }
  `;

  try {
    console.log("[SERVER] Sending GraphQL mutation to backend", {
      operationType: "graphql-fetch-start",
      variables: { input },
    });

    const response = await fetch(GRAPHQL_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: mutation,
        variables: { input },
      }),
    });

    console.log("[SERVER] GraphQL response received", {
      operationType: "graphql-fetch-complete",
      status: response.status,
      ok: response.ok,
    });

    const data = await response.json();

    if (data.errors) {
      console.error("[SERVER] GraphQL errors returned", {
        operationType: "graphql-errors",
        errors: data.errors,
      });
      throw new Error(data.errors[0]?.message || "GraphQL error");
    }

    console.log("[SERVER] Checkout session created successfully", {
      operationType: "session-created",
      success: data.data.createCheckoutSession.success,
      hasToken: !!data.data.createCheckoutSession.session?.token,
      error: data.data.createCheckoutSession.error,
    });

    return data.data.createCheckoutSession;
  } catch (error) {
    console.error("[SERVER] Failed to create checkout session", {
      operationType: "session-creation-error",
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw error;
  }
}

function validateCheckoutToken(token: string): boolean {
  try {
    const [, payload] = token.split(".");
    if (!payload) return false;

    const decoded = JSON.parse(atob(payload));
    if (!decoded.exp) return false;

    const expiresAt = decoded.exp * 1000; // convert seconds → ms
    const isValid = Date.now() < expiresAt;

    return isValid;
  } catch {
    return false; // token is malformed or not a JWT
  }
}

/**
 * רכיב "הרמזור" הראשי של הצ'קאאוט
 */
export default async function CheckoutHandler({
  searchParams,
}: CheckoutHandlerProps) {
  console.log("[SERVER] CheckoutHandler invoked", {
    operationType: "checkout-handler-entry",
    searchParams,
  });

  const { token, numOfDays, countryId, regionId } = searchParams;

  const hasBusinessParams = Boolean(countryId || regionId || numOfDays);
  console.log("[SERVER] Parsed search params", {
    operationType: "params-parsed",
    hasToken: !!token,
    hasBusinessParams,
    countryId,
    regionId,
    numOfDays,
    numOfEsims: searchParams.numOfEsims,
  });

  // 1. If token exists, show checkout
  if (token && validateCheckoutToken(token)) {
    console.log("[SERVER] Valid token found - rendering checkout", {
      operationType: "token-valid",
    });
    return <CheckoutContainerV2 />;
  }

  if (token && !validateCheckoutToken(token)) {
    console.warn("[SERVER] Invalid or expired token found", {
      operationType: "token-invalid",
    });
  }

  // 2. If no token but has params, create session
  if ((countryId || regionId) && numOfDays) {
    console.log("[SERVER] No valid token but has params - creating session", {
      operationType: "session-creation-required",
      countryId,
      regionId,
      numOfDays,
    });
    const parsedNumOfEsims = searchParams.numOfEsims ? Number(searchParams.numOfEsims) : 1;
    const parsedNumOfDays = parseInt(numOfDays ?? "7") || 7;

    const input: CreateCheckoutSessionInput = {
      numOfDays: parsedNumOfDays,
      group: WEB_APP_BUNDLE_GROUP,
      ...(countryId && { countryId }),
      ...(regionId && { regionId }),
      numOfEsims: parsedNumOfEsims,
    } as CreateCheckoutSessionInput;

    console.log("[SERVER] Prepared session input", {
      operationType: "session-input-prepared",
      input,
    });

    // Call the session creation (this is safe, won't throw redirect)
    const result = await createCheckoutSession(input);

    if (result.success && result.session?.token) {
      console.log("[SERVER] Session created - preparing redirect", {
        operationType: "session-created-success",
        hasToken: !!result.session.token,
        tokenPreview: result.session.token.substring(0, 10) + "...",
      });

      const params = new URLSearchParams({
        token: result.session.token,
        numOfDays: parsedNumOfDays.toString(),
        ...(countryId && { countryId }),
        ...(regionId && { regionId }),
      });

      const redirectUrl = `/checkout?${params.toString()}`;
      console.log("[SERVER] Redirecting with token", {
        operationType: "checkout-redirect",
        url: redirectUrl,
        params: Object.fromEntries(params.entries()),
      });

      // 🔥 This throws NEXT_REDIRECT - let it propagate (no try/catch)
      performRedirect(redirectUrl);

      // This line never executes (redirect throws)
      return null;
    } else {
      // Session creation failed (API error)
      console.error("[SERVER] Session creation failed", {
        operationType: "session-creation-failed",
        error: result.error,
        success: result.success,
      });
      return (
        <div className="p-8 text-center">
          <h2 className="text-2xl font-bold mb-4 text-red-600">
            Session Creation Failed
          </h2>
          <p className="text-red-500 mb-4">
            Unable to create checkout session. Please try again.
          </p>
          <p className="text-sm text-gray-600 mb-2">
            Error: {result.error || "Unknown error"}
          </p>
          <p className="text-sm text-gray-600">Refresh the page to retry.</p>
        </div>
      );
    }
  }

  // 3. No token and no params
  console.warn("[SERVER] Missing required checkout parameters", {
    operationType: "invalid-params",
    hasToken: !!token,
    hasBusinessParams,
    searchParams,
  });
  return (
    <div className="p-8 text-center">
      <h2 className="text-2xl font-bold mb-4">Invalid Checkout Parameters</h2>
      <p>Please select a plan to continue with checkout.</p>
    </div>
  );
}