"use client";

import { gql, useMutation } from "@apollo/client";
import {
  Checkout,
  UpdateCheckoutDeliveryMutation,
  UpdateCheckoutDeliveryMutationVariables,
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
import { Package } from "lucide-react";
import { useCallback } from "react";
import { useForm } from "react-hook-form";
import z from "zod";
import { SectionHeader } from "./section-header";

type DeliveryCardProps = {
  completed: boolean;
  sectionNumber?: number;
  data: Pick<Checkout, "delivery" | "id"> | undefined;
  onDeliveryUpdateAction: (delivery: { 
      email?: string | null; 
      firstName?: string | null; 
      lastName?: string | null; 
      phone?: string | null; 
      completed?: boolean | null 
  }) => void;
  loading: boolean;
};

// סכמה מעודכנת עם השדות החדשים והולידציה
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

// מוטציה מעודכנת לקבל את השדות החדשים
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
}: DeliveryCardProps) => {
  const { delivery } = data || {};

  const [updateCheckoutDelivery] = useMutation<
    UpdateCheckoutDeliveryMutation,
    UpdateCheckoutDeliveryMutationVariables
  >(UPDATE_CHECKOUT_DELIVERY_MUTATION);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty, isSubmitSuccessful },
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
      }
    },
    [data?.id, updateCheckoutDelivery, onDeliveryUpdateAction, reset]
  );

  const getButtonLabel = () => {
    if (loading) return "שומר...";
    if (isSubmitSuccessful && !isDirty) return "פרטי משלוח נשמרו";
    if (isSubmitSuccessful && isDirty) return "עדכון פרטי משלוח";
    return "שמירת פרטי משלוח";
  };

  if (loading) return <DeliveryCardSkeleton />;

  return (
    <Card dir="rtl" className="flex flex-col gap-4 shadow-xl">
      <Collapsible defaultOpen>
        <CollapsibleTrigger className="w-full text-right"> {/* Added width and text alignment */}
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
                    disabled={loading}
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
                    disabled={loading}
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
                    disabled={loading}
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
                  disabled={loading}
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
                  disabled={loading}
                />
                {errors.confirmEmail && (
                  <p className="text-sm text-red-500">
                    {errors.confirmEmail.message}
                  </p>
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
        {/* Skeleton for Name Fields */}
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
        {/* Skeleton for Phone */}
        <div className="space-y-2">
          <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
          <div className="h-10 w-full bg-gray-200 rounded animate-pulse" />
        </div>
        {/* Skeleton for Emails */}
        <div className="space-y-2">
          <div className="h-4 w-12 bg-gray-200 rounded animate-pulse" />
          <div className="h-10 w-full bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="space-y-2">
          <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
          <div className="h-10 w-full bg-gray-200 rounded animate-pulse" />
        </div>
        {/* Skeleton for Button */}
        <div className="h-12 w-full bg-gray-200 rounded animate-pulse mt-4" />
      </div>
    </Card>
  );
};