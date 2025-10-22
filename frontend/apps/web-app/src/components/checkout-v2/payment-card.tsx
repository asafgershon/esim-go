"use client";
// 👇 Import gql from @apollo/client
import { gql, useMutation } from "@apollo/client"; 
import {
  Checkout, 
  TriggerCheckoutPaymentMutation,
  TriggerCheckoutPaymentMutationVariables,
} from "@/__generated__/graphql";
import { SelectorButton, Card } from "@workspace/ui";
import { Loader2 } from "lucide-react"; 

// ✅ Mutation definition remains the same
const UPDATE_CHECKOUT_PAYMENT_MUTATION = gql(`
  mutation TriggerCheckoutPayment($sessionId: String!, $nameForBilling: String, $redirectUrl: String!) {
    triggerCheckoutPayment(sessionId: $sessionId, nameForBilling: $nameForBilling, redirectUrl: $redirectUrl) {
      intent {
        id
        url
        applePayJavaScriptUrl
      }
    }
  }
`);

type PaymentCardProps = {
  completed: boolean; 
  data: Pick<Checkout, "payment" | "id" | "auth" | "delivery"> | undefined; 
  loading: boolean; 
};

export const PaymentCard = ({
  data,
  loading,
}: PaymentCardProps) => {

  // 👇 Removed 'paymentData' from destructuring
  const [triggerCheckoutPayment, { loading: triggerLoading, error: triggerError }] =
    useMutation<TriggerCheckoutPaymentMutation, TriggerCheckoutPaymentMutationVariables>(
      UPDATE_CHECKOUT_PAYMENT_MUTATION
    );

  const isDeliveryComplete = Boolean(data?.delivery?.completed);

  const handlePaymentClick = async () => {
    if (!data?.id || !isDeliveryComplete || triggerLoading) return; 

    console.log("[DEBUG] Triggering checkout payment manually for session:", data.id);
    try {
      // We use 'res' here directly
      const res = await triggerCheckoutPayment({
        variables: {
          sessionId: data.id,
          nameForBilling: data.delivery?.firstName && data.delivery?.lastName 
              ? `${data.delivery.firstName} ${data.delivery.lastName}`
              : "Test User",
          redirectUrl: window.location.origin + "/payment/callback", 
        },
      });

      console.log("[DEBUG] Manual Payment mutation result:", res.data);
      const intentUrl = res.data?.triggerCheckoutPayment?.intent?.url;

      if (intentUrl) {
        window.open(intentUrl, "_blank"); 
      } else {
        console.error("[DEBUG] No payment URL received after mutation.");
      }
    } catch (err) {
      console.error("[DEBUG] Manual Payment mutation error:", err);
    }
  };

  const getButtonLabel = () => {
    if (loading && !data) return "טוען..."; // Initial load only
    if (triggerLoading) return (<><Loader2 className="h-4 w-4 animate-spin mr-2" /> מעביר לתשלום...</>); 
    if (!isDeliveryComplete) return "יש למלא פרטי משלוח";
    return "המשך לתשלום";
  };

  if (loading && !data) return <PaymentCardSkeleton />; 

  return (
    <Card dir="rtl" className="flex flex-col gap-4 shadow-xl h-fit p-4"> 
      <SelectorButton
        type="button"
        onClick={handlePaymentClick}
        disabled={loading || triggerLoading || !isDeliveryComplete} 
        variant={isDeliveryComplete ? "brand-success" : undefined} 
        emphasized={isDeliveryComplete}
      >
        {getButtonLabel()}
      </SelectorButton>

      {triggerError && (
        <p className="text-sm text-red-500 text-center mt-2">
            אירעה שגיאה ביצירת קישור התשלום. נסה שוב.
        </p>
      )}
    </Card>
  );
};

// Skeleton remains the same
const PaymentCardSkeleton = () => { 
  return (
    <Card className="p-6">
       <div className="h-12 w-full bg-gray-200 rounded animate-pulse" />
    </Card>
  );
};