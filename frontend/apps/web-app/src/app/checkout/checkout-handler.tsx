import { CreateCheckoutSessionInput } from "@/__generated__/graphql";
// import { CheckoutContainer } from "@/components/checkout/container";
import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { WEB_APP_BUNDLE_GROUP } from "@/lib/constants/bundle-groups";
import { CheckoutContainerV2 } from "@/components/checkout-v2/container";

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

/**
 * פונקציית עזר ששולחת את ה-mutation ליצירת סשן
 * (שונתה לקבל אובייקט input יחיד)
 */
async function createCheckoutSession(input: CreateCheckoutSessionInput) {
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
    // הדפסה חדשה: מוודאת שה-input שהגיע לפונקציה תקין
    console.log("🚀 Creating checkout session with input:", input);

    const response = await fetch(GRAPHQL_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: mutation,
        variables: { input }, // האובייקט מועבר ישירות
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
    // זורק את השגיאה הלאה כדי שה-try/catch ברכיב הראשי יתפוס אותה
    throw error;
  }
}

/**
 * רכיב "הרמזור" הראשי של הצ'קאאוט
 */
export default async function CheckoutHandler({
  searchParams,
}: CheckoutHandlerProps) {
  const { token, numOfDays, countryId, regionId } = searchParams;

  // --- שלב 1: נטרול העצירה המוקדמת ---
  // return <CheckoutContainerV2 />;

  // --- זרימה תקינה ---

  // 1. אם כבר יש טוקן, הצג את הצ'קאאוט
  if (token) {
    console.log("Handler: Found existing token, rendering CheckoutContainer.");
    // כאן צריך לשים את הרכיב שמטפל בסשן קיים
    // אם CheckoutContainerV2 הוא הנכון, החזר אותו. אם לא, החזר את V1.
    return <CheckoutContainerV2 />; 
    // או: return <CheckoutContainer />;
  }

  // 2. אם אין טוקן אבל יש פרמטרים, נסה ליצור סשן חדש
  if ((countryId || regionId) && numOfDays) {
    try {
      // --- שלב 3: בונים את האובייקט input כאן, פעם אחת ---
      const parsedNumOfDays = parseInt(numOfDays ?? "7") || 7;
      const input: CreateCheckoutSessionInput = {
        numOfDays: parsedNumOfDays,
        group: WEB_APP_BUNDLE_GROUP,
        // הוסף פרמטרים רק אם הם קיימים
        ...(countryId && { countryId }),
        ...(regionId && { regionId }),
      };

      // קוראים לפונקציית העזר עם האובייקט המוכן
      const result = await createCheckoutSession(input);

      if (result.success && result.session?.token) {
        // הצלחה! נוצר סשן
        console.log("✅ Checkout session created successfully. Redirecting...", {
          token: result.session.token.substring(0, 10) + "...",
        });

        // בנה את ה-URL מחדש עם הטוקן שקיבלנו
        const params = new URLSearchParams({
          token: result.session.token,
          numOfDays: parsedNumOfDays.toString(),
          ...(countryId && { countryId }),
          ...(regionId && { regionId }),
        });

        // בצע הפנייה מחדש (Redirect) של השרת לעצמו, הפעם עם הטוקן
        // זה יגרום לקוד הזה לרוץ שוב, והפעם להיכנס ל- if (token)
        performRedirect(`/checkout?${params.toString()}`);

      } else {
        // ה-mutation החזיר success: false
        throw new Error(result.error || "Failed to create checkout session (API Error)");
      }
    } catch (error) {
      // תפיסת שגיאות: או מה-fetch או מה-redirect

      // אם זו שגיאת Redirect של Next.js, זה תקין, זרוק אותה הלאה
      if (isRedirectError(error)) {
        throw error;
      }

      // זו שגיאה אמיתית
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

  // 3. אם אין טוקן ואין פרמטרים - הצג שגיאה
  console.warn("Handler: No token and no valid params. Showing invalid params error.");
  return (
    <div className="p-8 text-center">
      <h2 className="text-2xl font-bold mb-4">Invalid Checkout Parameters</h2>
      <p>Please select a plan to continue with checkout.</p>
    </div>
  );
}