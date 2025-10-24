"use client";

// 👇 ייבואים מעודכנים
import { gql, useMutation, type ApolloError, type FetchResult } from "@apollo/client"; 
import {
  Checkout,
  UpdateCheckoutDeliveryMutation,
  UpdateCheckoutDeliveryMutationVariables,
  TriggerCheckoutPaymentMutation, // 👈 ייבא גם את הטיפוסים של מוטציית התשלום
  TriggerCheckoutPaymentMutationVariables 
} from "@/__generated__/graphql";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Button,
  Card,
  CardContent,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Input,
  Label,
} from "@workspace/ui";
import { Package, Loader2 } from "lucide-react";
import { useCallback } from "react";
import { useForm } from "react-hook-form";
import z from "zod";
import { SectionHeader } from "./section-header";

// 👇 עדכון הטיפוסים של ה-Props
type DeliveryCardProps = {
  completed: boolean;
  sectionNumber?: number;
  // ⚠️ שים לב: עדיין משתמשים ב-Pick<Checkout,...>. 
  // אם Checkout לא מעודכן, ייתכנו שגיאות אחרות בהמשך. 
  // כדאי להשתמש בטיפוס המותאם מההוּק useCheckout אם ייצאת אותו.
  data: Pick<Checkout, "delivery" | "id"> | undefined; 
  onDeliveryUpdateAction: (delivery: { 
      email?: string | null; 
      firstName?: string | null; 
      lastName?: string | null; 
      phone?: string | null; 
      completed?: boolean | null 
  }) => void;
  loading: boolean; 
  // 👇 שימוש בטיפוסים המדויקים במקום any
  triggerPayment: (
      options: { variables: TriggerCheckoutPaymentMutationVariables }
  ) => Promise<FetchResult<TriggerCheckoutPaymentMutation>>; 
  isPaymentLoading: boolean; 
  paymentError?: ApolloError | undefined; // ApolloError יכול להיות גם undefined
};

const phoneRegex = /^(?:\+972|0)(?:-)?(?:5[0-9])(?:-)?(?:[0-9]{7})$/;
const DeliverySchema = z
  .object({
    firstName: z.string().min(2, { message: "שם פרטי חייב להכיל לפחות 2 תווים" }),
    lastName: z.string().min(2, { message: "שם משפחה חייב להכיל לפחות 2 תווים" }),
    phone: z.string().regex(phoneRegex, { message: "מספר טלפון לא תקין" }),
    email: z.string().email({ message: "אימייל לא תקין" }),
    confirmEmail: z.string().email({ message: "אימייל לא תקין" }),
  })
  .refine((data) => data.email === data.confirmEmail, {
    message: "האימיילים אינם תואמים",
    path: ["confirmEmail"],
  });
type DeliveryFormData = z.infer<typeof DeliverySchema>;

const UPDATE_CHECKOUT_DELIVERY_MUTATION = gql(`
  mutation UpdateCheckoutDelivery(
      $sessionId: String!,
      $email: String,
      $firstName: String,
      $lastName: String,
      $phone: String
    ) {
    updateCheckoutDelivery(
        sessionId: $sessionId,
        email: $email,
        firstName: $firstName,
        lastName: $lastName,
        phone: $phone
      ) {
      email
      firstName
      lastName
      phone
      completed
    }
  }
`);

export const DeliveryCard = ({
  sectionNumber,
  data,
  completed,
  loading,
  onDeliveryUpdateAction,
  triggerPayment,
  isPaymentLoading,
  paymentError,
}: DeliveryCardProps) => {
  const { delivery } = data || {};

  const [updateCheckoutDelivery, { loading: isSavingDelivery }] = useMutation<
    UpdateCheckoutDeliveryMutation,
    UpdateCheckoutDeliveryMutationVariables
  >(UPDATE_CHECKOUT_DELIVERY_MUTATION);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty, isValid: isFormValid },
  } = useForm<DeliveryFormData>({
    resolver: zodResolver(DeliverySchema),
    defaultValues: {
      firstName: delivery?.firstName || "",
      lastName: delivery?.lastName || "",
      phone: delivery?.phone || "",
      email: delivery?.email || "",
      confirmEmail: delivery?.email || "",
    },
    mode: "onChange",
  });

  const onSubmit = useCallback(
    async (formData: DeliveryFormData) => {
      if (!data?.id) return;

      const cleanedEmail = formData.email.trim();
      const cleanedFirstName = formData.firstName.trim();
      const cleanedLastName = formData.lastName.trim();
      const cleanedPhone = formData.phone.trim();

      try {
        console.log("[DEBUG] Sending Session ID to updateDelivery:", data.id);
        console.log("[DEBUG] Saving delivery details...");
        const { data: result } = await updateCheckoutDelivery({
          variables: {
            sessionId: data.id,
            email: cleanedEmail,
            firstName: cleanedFirstName,
            lastName: cleanedLastName,
            phone: cleanedPhone,
          },
        });

        if (result?.updateCheckoutDelivery) {
          onDeliveryUpdateAction(result.updateCheckoutDelivery);
          reset({
            email: cleanedEmail,
            confirmEmail: cleanedEmail,
            firstName: cleanedFirstName,
            lastName: cleanedLastName,
            phone: cleanedPhone
          });
          console.log("[DEBUG] Delivery details saved. Triggering payment...");

          const paymentRes = await triggerPayment({
            variables: {
              sessionId: data.id,
              nameForBilling: `${cleanedFirstName} ${cleanedLastName}`,
              redirectUrl: window.location.origin + "/payment/callback",
            },
          });

          console.log("[DEBUG] Payment trigger result:", paymentRes.data);
          const intentUrl = paymentRes.data?.triggerCheckoutPayment?.intent?.url;

          if (intentUrl) {
            window.open(intentUrl, "_blank");
          } else {
            console.error("[DEBUG] No payment URL received after triggering payment.");
          }

        } else {
            console.error("[DEBUG] Failed to save delivery details.");
        }
      } catch (err) {
          console.error("[DEBUG] Error during submit (delivery or payment):", err);
      }
    },
    [data?.id, updateCheckoutDelivery, onDeliveryUpdateAction, reset, triggerPayment]
  );

  const getButtonLabel = () => {
    if (loading) return "טוען נתונים...";
    if (isSavingDelivery) return (<><Loader2 className="h-4 w-4 animate-spin mr-2" /> שומר פרטים...</>);
    if (isPaymentLoading) return (<><Loader2 className="h-4 w-4 animate-spin mr-2" /> מעביר לתשלום...</>);
    return "שמור והמשך לתשלום";
  };

  const isButtonDisabled = loading || isSavingDelivery || isPaymentLoading || (!isDirty && !completed) || (isDirty && !isFormValid);

  if (loading && !data) return <DeliveryCardSkeleton />;

  return (
    <Card dir="rtl" className="flex flex-col gap-4 shadow-xl">
      <Collapsible defaultOpen>
        <CollapsibleTrigger className="w-full text-right">
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">שם פרטי</Label>
                  <Input
                    id="firstName"
                    autoComplete="given-name"
                    placeholder="ישראל"
                    {...register("firstName")}
                    disabled={loading || isSavingDelivery || isPaymentLoading}
                  />
                  {errors.firstName && (
                    <p className="text-sm text-red-500">{errors.firstName.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">שם משפחה</Label>
                  <Input
                    id="lastName"
                    autoComplete="family-name"
                    placeholder="ישראלי"
                    {...register("lastName")}
                    disabled={loading || isSavingDelivery || isPaymentLoading}
                  />
                  {errors.lastName && (
                    <p className="text-sm text-red-500">{errors.lastName.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                  <Label htmlFor="phone">טלפון נייד</Label>
                  <Input
                    id="phone"
                    type="tel"
                    autoComplete="tel"
                    placeholder="05X-XXXXXXX"
                    {...register("phone")}
                    disabled={loading || isSavingDelivery || isPaymentLoading}
                    dir="ltr"
                  />
                  {errors.phone && (
                    <p className="text-sm text-red-500">{errors.phone.message}</p>
                  )}
                </div>

              <div className="space-y-2">
                <Label htmlFor="email">אימייל</Label>
                <Input
                  autoComplete="email"
                  id="email"
                  className="placeholder:opacity-50"
                  type="email"
                  placeholder="israel@hiiloworld.com"
                  {...register("email")}
                  disabled={loading || isSavingDelivery || isPaymentLoading}
                />
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmEmail">אישור אימייל</Label>
                <Input
                  id="confirmEmail"
                  type="email"
                  placeholder="הקלד שוב את האימייל"
                  {...register("confirmEmail")}
                  autoComplete="off"
                  onPaste={(e) => e.preventDefault()}
                  onCopy={(e) => e.preventDefault()}
                  onCut={(e) => e.preventDefault()}
                  disabled={loading || isSavingDelivery || isPaymentLoading}
                />
                {errors.confirmEmail && (
                  <p className="text-sm text-red-500">
                    {errors.confirmEmail.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full bg-green-500 hover:bg-green-600 text-white" // עיצוב דומה לכפתור התשלום
                size="lg"
                disabled={isButtonDisabled}
              >
                {getButtonLabel()}
              </Button>

              {paymentError && (
                  <p className="text-sm text-red-500 text-center mt-2">
                      אירעה שגיאה ביצירת קישור התשלום: {paymentError.message}
                  </p>
              )}
            </form>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

// שלד טעינה
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           <div className="space-y-2">
             <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
             <div className="h-10 w-full bg-gray-200 rounded animate-pulse" />
           </div>
           <div className="space-y-2">
             <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
             <div className="h-10 w-full bg-gray-200 rounded animate-pulse" />
           </div>
        </div>
        <div className="space-y-2">
          <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
          <div className="h-10 w-full bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="space-y-2">
          <div className="h-4 w-12 bg-gray-200 rounded animate-pulse" />
          <div className="h-10 w-full bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="space-y-2">
          <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
          <div className="h-10 w-full bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="h-12 w-full bg-gray-200 rounded animate-pulse mt-4" />
      </div>
    </Card>
  );
};