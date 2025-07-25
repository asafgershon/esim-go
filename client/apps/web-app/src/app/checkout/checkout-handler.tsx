import { CheckoutContainer } from "@/components/checkout/checkout-container";
import { CheckoutRedirect } from "@/components/checkout/checkout-redirect";

interface CheckoutHandlerProps {
  searchParams: {
    token?: string;
    numOfDays?: string;
    countryId?: string;
    regionId?: string;
  };
}

async function createCheckoutSession(numOfDays: number, regionId?: string, countryId?: string) {
  const GRAPHQL_ENDPOINT = process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || 'http://localhost:5001/graphql';
  
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
    const input: any = { numOfDays };
    if (regionId) {
      input.regionId = regionId;
    }
    if (countryId) {
      input.countryId = countryId;
    }

    const response = await fetch(GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: mutation,
        variables: { input },
      }),
    });

    const data = await response.json();
    
    if (data.errors) {
      throw new Error(data.errors[0]?.message || 'GraphQL error');
    }

    return data.data.createCheckoutSession;
  } catch (error) {
    console.error('Failed to create checkout session:', error);
    throw error;
  }
}

export default async function CheckoutHandler({ searchParams }: CheckoutHandlerProps) {
  const { token, numOfDays, countryId, regionId } = searchParams;
  
  // If we already have a token, render the checkout page
  if (token) {
    return <CheckoutContainer />;
  }
  
  // If we have checkout parameters but no token, create a session on the server
  if ((countryId || regionId) && numOfDays) {
    try {
      const result = await createCheckoutSession(
        parseInt(numOfDays) || 7,
        regionId,
        countryId
      );
      
      if (result.success && result.session?.token) {
        // Return the redirect component instead of using server-side redirect
        return (
          <CheckoutRedirect
            token={result.session.token}
            numOfDays={numOfDays || '7'}
            countryId={countryId}
            regionId={regionId}
          />
        );
      } else {
        throw new Error(result.error || 'Failed to create checkout session');
      }
    } catch (error) {
      console.error('Server-side session creation failed:', error);
      // Show error message instead of falling back to client-side
      return (
        <div className="p-8 text-center">
          <h2 className="text-2xl font-bold mb-4 text-red-600">Session Creation Failed</h2>
          <p className="text-red-500 mb-4">Unable to create checkout session. Please try again.</p>
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