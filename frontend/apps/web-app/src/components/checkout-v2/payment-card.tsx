import { gql } from "@/__generated__";
import {
  Checkout,
  CheckoutPayment,
  TriggerCheckoutPaymentMutation,
  TriggerCheckoutPaymentMutationVariables,
} from "@/__generated__/graphql";
import { useMutation } from "@apollo/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Card, CardContent } from "@workspace/ui";
import { Package } from "lucide-react";
import { useCallback, useEffect } from "react";
import { useForm } from "react-hook-form";
import z from "zod";
import { SectionHeader } from "./section-header";

type PaymentCardProps = {
  completed: boolean;
  sectionNumber?: number;
  data: Pick<Checkout, "payment" | "id" | "auth" | "delivery"> | undefined;
  onPaymentUpdate: (payment: Checkout["payment"]) => void;
  loading: boolean;
};

const PaymentSchema = z.object({
  email: z.email({ message: "אימייל לא תקין" }).optional().or(z.literal("")),
  phone: z.e164({ message: "מספר טלפון לא תקין" }).optional().or(z.literal("")),
  nameForBilling: z.string().optional().or(z.literal("")),
});

type PaymentFormData = z.infer<typeof PaymentSchema>;

const UPDATE_CHECKOUT_PAYMENT_MUTATION = gql(`
  mutation TriggerCheckoutPayment($sessionId: String!, $nameForBilling: String) {
    triggerCheckoutPayment(sessionId: $sessionId, nameForBilling: $nameForBilling) {
      intent {
        id
        url
        applePayJavaScriptUrl
      }
      phone
      email
      nameForBilling
    }
  }
`);

export const PaymentCard = ({
  sectionNumber,
  data,
  completed,
  loading,
  onPaymentUpdate,
}: PaymentCardProps) => {
  const { payment, auth, delivery } = data || {};

  const [triggerCheckoutPayment] = useMutation<
    TriggerCheckoutPaymentMutation,
    TriggerCheckoutPaymentMutationVariables
  >(UPDATE_CHECKOUT_PAYMENT_MUTATION);

  const {
    setValue,
    handleSubmit,
    formState: { isDirty, isSubmitSuccessful },
  } = useForm<PaymentFormData>({
    resolver: zodResolver(PaymentSchema),
    defaultValues: {
      email: payment?.email || "",
      phone: payment?.phone || "",
      nameForBilling: payment?.nameForBilling || "",
    },
    mode: "onChange",
    resetOptions: {
      keepIsSubmitSuccessful: false,
      keepDirty: true,
      keepDefaultValues: false,
    },
  });

  useEffect(() => {
    if (delivery?.completed) {
      setValue("email", delivery?.email || "");
      setValue("phone", delivery?.phone || "");
    } else if (auth?.completed) {
      setValue("email", auth?.email || "");
      setValue("phone", auth?.phone || "");
    }
  }, [
    delivery?.completed,
    delivery?.email,
    delivery?.phone,
    auth?.completed,
    auth?.email,
    auth?.phone,
    setValue,
  ]);

  const onSubmit = useCallback(
    async (formData: PaymentFormData) => {
      if (!data?.id) return;

      const cleanedData = {
        email: formData.email?.trim() || null,
        phone: formData.phone?.trim() || null,
        nameForBilling: formData.nameForBilling?.trim() || null,
      };

      // Only send fields that have actual values
      const variables: TriggerCheckoutPaymentMutationVariables = {
        sessionId: data.id,
      };

      if (cleanedData.nameForBilling)
        variables.nameForBilling = cleanedData.nameForBilling;

      const { data: result } = await triggerCheckoutPayment({
        variables,
      });

      if (result?.triggerCheckoutPayment) {
        onPaymentUpdate(result.triggerCheckoutPayment as CheckoutPayment);
      }
    },
    [data?.id, triggerCheckoutPayment, onPaymentUpdate]
  );

  useEffect(() => {
    if (auth?.completed && data?.id) {
      triggerCheckoutPayment({
        variables: {
          sessionId: data?.id,
          nameForBilling: payment?.nameForBilling,
        },
      });
    }
  }, [
    auth?.completed,
    payment?.nameForBilling,
    auth?.phone,
    data?.id,
    triggerCheckoutPayment,
  ]);

  const getButtonLabel = () => {
    if (loading) return "שומר...";
    if (isSubmitSuccessful && !isDirty) return "פרטי משלוח נשמרו";
    if (isSubmitSuccessful && isDirty) return "עדכון פרטי משלוח";
    return "שמירת פרטי משלוח";
  };

  if (loading) return <DeliveryCardSkeleton />;

  return (
    <Card dir="rtl" className="flex flex-col gap-4 shadow-xl">
      <SectionHeader
        sectionNumber={sectionNumber || 3}
        title="פרטי תשלום"
        icon={<Package className="h-5 w-5 text-primary" />}
        isCompleted={completed}
      />

      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Button type="submit" className="w-full">
            {getButtonLabel()}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

const DeliveryCardSkeleton = () => {
  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-6 h-6 md:w-8 md:h-8 bg-gray-200 rounded-full animate-pulse" />
        <div>
          <div className="h-4 md:h-5 w-20 bg-gray-200 rounded animate-pulse mb-1" />
          <div className="h-3 md:h-4 w-16 bg-gray-100 rounded animate-pulse" />
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
          <div className="h-10 w-full bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="space-y-2">
          <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
          <div className="h-10 w-full bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
    </Card>
  );
};
