import { CreateCheckoutSessionInput } from "@/__generated__/graphql";
import { CheckoutContainer } from "@/components/checkout/container";
import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { WEB_APP_BUNDLE_GROUP } from "@/lib/constants/bundle-groups";
//import { CheckoutContainerV2 } from "@/components/checkout-v2/container";

interface CheckoutHandlerProps {
  searchParams: {
    token?: string;
    numOfDays?: string;
    countryId?: string;
    regionId?: string;
  };
}

// Helper function to handle server-side redirects cleanly
function performRedirect(url: string): never {
  console.log(`Redirecting to: ${url}`);
  redirect(url);
}

async function createCheckoutSession(
  numOfDays: number,
  regionId?: string,
  countryId?: string
) {
  const GRAPHQL_ENDPOINT =
    process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || "http://localhost:5001/graphql";

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
    // Build input object with only defined values
    const input: CreateCheckoutSessionInput = {
      numOfDays,
      group: WEB_APP_BUNDLE_GROUP,
    };
    if (regionId) {
      input.regionId = regionId;
    }
    if (countryId) {
      input.countryId = countryId;
    }
    console.log("🚀 Creating checkout session", { numOfDays, regionId, countryId, input });
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

    const data = await response.json();

    if (data.errors) {
      console.error("GraphQL errors:", data.errors);
      throw new Error(data.errors[0]?.message || "GraphQL error");
    }

    return data.data.createCheckoutSession;
  } catch (error) {
    console.error("Failed to create checkout session:", error);
    throw error;
  }
}

export default async function CheckoutHandler({
  searchParams,
}: CheckoutHandlerProps) {
  const { token, numOfDays, countryId, regionId } = searchParams;

  //return <CheckoutContainerV2 />;

  // If we already have a token, render the checkout page
  if (token) {
    return <CheckoutContainer />;
  }

  // If we have checkout parameters but no token, create a session on the server
  if ((countryId || regionId) && numOfDays) {
    try {
      const result = await createCheckoutSession(
        parseInt(numOfDays ?? "7") || 7,
        regionId,
        countryId
      );

      if (result.success && result.session?.token) {
        // Log successful session creation
        console.log("Checkout session created successfully:", {
          token: result.session.token.substring(0, 20) + "...",
          numOfDays,
          countryId,
          regionId,
        });

        // Use server-side redirect instead of client component
        const params = new URLSearchParams({
          token: result.session.token,
          numOfDays: numOfDays || "7",
          ...(countryId && { countryId }),
          ...(regionId && { regionId }),
        });

        // This will throw a NEXT_REDIRECT error internally, which is expected
        performRedirect(`/checkout?${params.toString()}`);
      } else {
        throw new Error(result.error || "Failed to create checkout session");
      }
    } catch (error) {
      // Check if this is a Next.js redirect (which is expected and successful)
      if (isRedirectError(error)) {
        // This is a successful redirect, re-throw it to let Next.js handle it
        throw error;
      }

      // This is a real error, handle it
      console.error("Server-side session creation failed:", error);
      return (
        <div className="p-8 text-center">
          <h2 className="text-2xl font-bold mb-4 text-red-600">
            Session Creation Failed
          </h2>
          <p className="text-red-500 mb-4">
            Unable to create checkout session. Please try again.
          </p>
          <p className="text-sm text-gray-600 mb-2">
            Error: {error instanceof Error ? error.message : "Unknown error"}
          </p>
          <p className="text-sm text-gray-600">Refresh the page to retry.</p>
        </div>
      );
    }
  }

  // If no valid parameters, show error or redirect
  return (
    <div className="p-8 text-center">
      <h2 className="text-2xl font-bold mb-4">Invalid Checkout Parameters</h2>
      <p>Please select a plan to continue with checkout.</p>
    </div>
  );
}
