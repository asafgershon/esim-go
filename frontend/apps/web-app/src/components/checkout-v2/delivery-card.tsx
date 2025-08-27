import { gql } from "@/__generated__";
import {
  Checkout,
  UpdateCheckoutDeliveryMutation,
  UpdateCheckoutDeliveryMutationVariables,
} from "@/__generated__/graphql";
import { useMutation } from "@apollo/client";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Button,
  Card,
  CardContent,
  CollapsibleContent,
  CollapsibleTrigger,
  Input,
  Label,
  PhoneInputV2 as PhoneInput,
} from "@workspace/ui";
import { Package } from "lucide-react";
import { useCallback, useEffect } from "react";
import { useForm } from "react-hook-form";
import z from "zod";
import { SectionHeader } from "./section-header";
import { Collapsible } from "@workspace/ui";

type DeliveryCardProps = {
  completed: boolean;
  sectionNumber?: number;
  data: Pick<Checkout, "delivery" | "id" | "auth"> | undefined;
  onDeliveryUpdate: (delivery: Checkout["delivery"]) => void;
  loading: boolean;
};

const DeliverySchema = z
  .object({
    email: z.email({ message: "אימייל לא תקין" }).optional().or(z.literal("")),
    phone: z
      .e164({ message: "מספר טלפון לא תקין" })
      .optional()
  })
  .refine(
    (data) => {
      const hasValidEmail = data.email && data.email.trim() !== "";
      const hasValidPhone = data.phone && data.phone.trim() !== "";
      return hasValidEmail || hasValidPhone;
    },
    {
      message: "חובה למלא לפחות אימייל או טלפון",
      path: ["email"],
    }
  );

type DeliveryFormData = z.infer<typeof DeliverySchema>;

const UPDATE_CHECKOUT_DELIVERY_MUTATION = gql(`
  mutation UpdateCheckoutDelivery($sessionId: String!, $email: String, $phone: String) {
    updateCheckoutDelivery(sessionId: $sessionId, email: $email, phone: $phone) {
     
        phone
        completed
      email
    }
  }
`);

export const DeliveryCard = ({
  sectionNumber,
  data,
  completed,
  loading,
  onDeliveryUpdate,
}: DeliveryCardProps) => {
  const { delivery, auth } = data || {};

  const [updateCheckoutDelivery] = useMutation<
    UpdateCheckoutDeliveryMutation,
    UpdateCheckoutDeliveryMutationVariables
  >(UPDATE_CHECKOUT_DELIVERY_MUTATION);

  const {
    register,
    watch,
    handleSubmit,
    reset,
    formState: { errors, isDirty, isSubmitSuccessful },
  } = useForm<DeliveryFormData>({
    resolver: zodResolver(DeliverySchema),
    defaultValues: {
      email: auth?.email || delivery?.email || "",
      phone: auth?.phone || delivery?.phone || "",
    },
    mode: "onChange",
    resetOptions: {
      keepIsSubmitSuccessful: false,
      keepDirty: true,
      keepDefaultValues: false,
    },
  });

  const isAuthCompleted = auth?.completed;


  const onSubmit = useCallback(
    async (formData: DeliveryFormData) => {
      if (!data?.id) return;

      const defaultValues = {
        email: auth?.email,
        phone: auth?.phone,
      };

      const cleanedData = {
        email: formData.email?.trim() || defaultValues.email || null,
        phone: formData.phone?.trim() || defaultValues.phone || null,
      };

      // Only send fields that have actual values
      const variables: UpdateCheckoutDeliveryMutationVariables = {
        sessionId: data.id,
      };

      if (cleanedData.email) variables.email = cleanedData.email;
      if (cleanedData.phone) variables.phone = cleanedData.phone;

      const { data: result } = await updateCheckoutDelivery({
        variables,
      });

      if (result?.updateCheckoutDelivery) {
        onDeliveryUpdate(result.updateCheckoutDelivery);
        reset();
      }
    },
    [data?.id, updateCheckoutDelivery, onDeliveryUpdate, reset, auth?.email, auth?.phone]
  );

  useEffect(() => {
    if (auth?.completed && data?.id) {
      updateCheckoutDelivery({
        variables: {
          sessionId: data?.id,
          email: auth?.email,
          phone: auth?.phone,
        },
      });
    }
  }, [
    auth?.completed,
    auth?.email,
    auth?.phone,
    data?.id,
    updateCheckoutDelivery,
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
      <Collapsible open={auth?.completed || delivery?.completed}>
        <CollapsibleTrigger>
          <SectionHeader
            className="mb-4"
            sectionNumber={sectionNumber || 3}
            title="פרטי משלוח"
            icon={<Package className="h-5 w-5 text-primary" />}
            isCompleted={completed}
          />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">אימייל</Label>
                <Input
                  autoComplete="email"
                  id="email"
                  className="placeholder:opacity-50"
                  type="email"
                  placeholder={auth?.email || `${isEnglish(auth?.firstName || "") ? auth?.firstName : "israel"}@hiiloworld.com`}
                  {...register("email")}
                  disabled={loading || Boolean(!isAuthCompleted)}
                />
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">טלפון</Label>
                <PhoneInput
                  id="phone"
                  value={watch("phone")}
                  defaultCountry="IL"
                  placeholder="הכנס מספר טלפון"
                  {...register("phone")}
                  disabled={loading || Boolean(!isAuthCompleted)}
                />
                {errors.phone && (
                  <p className="text-sm text-red-500">{errors.phone.message}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={loading || !isDirty}
              >
                {getButtonLabel()}
              </Button>
            </form>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
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

const isEnglish = (name: string) => {
  return name.match(/[a-zA-Z]/);
}