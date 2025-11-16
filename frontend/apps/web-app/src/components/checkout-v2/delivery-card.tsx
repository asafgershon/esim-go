"use client";

import { gql, useMutation, type ApolloError, type FetchResult } from "@apollo/client";
import {
  Checkout,
  UpdateCheckoutDeliveryMutation,
  UpdateCheckoutDeliveryMutationVariables,
  TriggerCheckoutPaymentMutation,
  TriggerCheckoutPaymentMutationVariables,
} from "@/__generated__/graphql";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import z from "zod";
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
    completed?: boolean | null;
  }) => void;
  loading: boolean;
  triggerPayment: (
    options: { variables: TriggerCheckoutPaymentMutationVariables }
  ) => Promise<FetchResult<TriggerCheckoutPaymentMutation>>;
  isPaymentLoading: boolean;
  paymentError?: ApolloError | undefined;
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
.refine(
  (data) => data.email.toLowerCase() === data.confirmEmail.toLowerCase(),
  {
    message: "האימיילים אינם תואמים",
    path: ["confirmEmail"],
  }
);  
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
  const [showTerms, setShowTerms] = useState(false);

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
      const cleanedEmail = formData.email.trim().toLowerCase();
      const cleanedFirstName = formData.firstName.trim();
      const cleanedLastName = formData.lastName.trim();
      const cleanedPhone = formData.phone.trim();

      try {
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
            phone: cleanedPhone,
          });

          const paymentRes = await triggerPayment({
            variables: {
              sessionId: data.id,
              nameForBilling: `${cleanedFirstName} ${cleanedLastName}`,
              redirectUrl: "https://hiiloworld.com/",
            },
          });

          const intentUrl = paymentRes.data?.triggerCheckoutPayment?.intent?.url;
          if (intentUrl) window.location.href = intentUrl;
        }
      } catch (err) {
        console.error("[DeliveryCard] Error:", err);
      }
    },
    [data?.id, updateCheckoutDelivery, onDeliveryUpdateAction, reset, triggerPayment]
  );

  const getButtonLabel = () => {
    if (loading) return "טוען נתונים...";
    if (isSavingDelivery)
      return (
        <>
          <Loader2 className="h-4 w-4 animate-spin mr-2" /> שומר פרטים...
        </>
      );
    if (isPaymentLoading)
      return (
        <>
          <Loader2 className="h-4 w-4 animate-spin mr-2" /> מעביר לתשלום...
        </>
      );
    return "שמור והמשך לתשלום";
  };

  const isButtonDisabled =
    loading ||
    isSavingDelivery ||
    isPaymentLoading ||
    (!isDirty && !completed) ||
    (isDirty && !isFormValid);

  if (loading && !data) return <DeliveryCardSkeleton />;

return (
  <Card dir="rtl" className="flex flex-col gap-4 shadow-xl">
    <SectionHeader
      className="mb-4"
      sectionNumber={sectionNumber || 3}
      title="פרטי משלוח"
      icon={<Package className="h-5 w-5 text-primary" />}
      isCompleted={completed}
    />

    <CardContent>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">שם פרטי</Label>
            <Input
              id="firstName"
              placeholder="ישראל"
              {...register("firstName")}
              disabled={loading || isSavingDelivery || isPaymentLoading}
              className="text-[16px]"
            />
            {errors.firstName && (
              <p className="text-sm text-red-500">{errors.firstName.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">שם משפחה</Label>
            <Input
              id="lastName"
              placeholder="ישראלי"
              {...register("lastName")}
              disabled={loading || isSavingDelivery || isPaymentLoading}
              className="text-[16px]"
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
            placeholder="05X-XXXXXXX"
            {...register("phone")}
            disabled={loading || isSavingDelivery || isPaymentLoading}
            className="text-[16px]"
            dir="ltr"
          />
          {errors.phone && (
            <p className="text-sm text-red-500">{errors.phone.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">אימייל</Label>
          <Input
            id="email"
            type="email"
            placeholder="israel@hiiloworld.com"
            {...register("email")}
            disabled={loading || isSavingDelivery || isPaymentLoading}
            className="text-[16px]"
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
            className="text-[16px]"
          />
          {errors.confirmEmail && (
            <p className="text-sm text-red-500">
              {errors.confirmEmail.message}
            </p>
          )}
        </div>

        {/* 💬 כפתור תנאי שימוש */}
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-600 leading-relaxed">
            בלחיצה על <strong>שמור והמשך לתשלום</strong> אתה מאשר את{" "}
            <button
              type="button"
              className="font-bold underline text-gray-800 hover:text-gray-900"
              onClick={() => setShowTerms((prev) => !prev)}
            >
              תנאי השימוש והרכישה באתר
            </button>
          </p>

          {showTerms && (
            <div
              dir="rtl"
              className="p-4 mt-4 border rounded-md bg-gray-50 text-sm text-gray-800 max-h-[60vh] overflow-y-auto space-y-3 leading-relaxed"
            >
              <h3 className="text-xl font-semibold mb-2">תנאי שימוש</h3>
              <p>
                ברוכים הבאים לאתר Hiiloworld. האתר מספק שירותים המיועדים לתמוך
                בצורכי תקשורת של תיירים במהלך שהותם בחו&quot;ל. השימוש באתר
                ובשירותים הניתנים בו כפוף לתנאים המפורטים להלן.
              </p>
              <p>
                תנאים אלה מהווים הסכם מחייב בינך לבין מפעילת האתר, קבוצת
                Hiiloworld, ויחולו על כל שימוש שתעשה באתר ובשירותים המוצעים בו.
                אם אינך מסכים לתנאים אלה – אל תשתמש באתר. תנאים אלו מנוסחים
                בלשון זכר מטעמי נוחות בלבד, אך מתייחסים באופן שווה לכל
                המגדרים.
              </p>
              <p>
                זהות הספק ושירותי האתר – האתר מופעל על-ידי קבוצת Hiiloworld,
                אשר פועלת כמשווק מורשה וכספק משנה לרכישת חבילות eSIM מספקים
                בחו&quot;ל. החברה מספקת שירותי רכישת והפצת חבילות תקשורת סלולרית
                (Data Only) במדינות שונות, לרבות חבילות בעלות נפח גלישה מוגדת
                מראש בתצורת Fixed או חבילות הכוללת נפח גלישה בלתי מוגבל אלא
                מוגבלות בכמות ימי הגלישהUnlimited וזאת בהתאם למגבלות ספק
                השירות.
              </p>
              {/* (שאר הטקסטים נשארים בדיוק כמו אצלך, ללא שינוי) */}
              <button
                onClick={() => setShowTerms((prev) => !prev)}
                className="mt-4 w-full py-2 text-center text-white bg-green-500 rounded-md hover:bg-green-600"
              >
                סגור
              </button>
            </div>
          )}
        </div>

        <Button
          type="submit"
          className="w-full bg-green-500 hover:bg-green-600 text-white"
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
  </Card>
);

};

const DeliveryCardSkeleton = () => (
  <Card className="p-6">
    <div className="flex items-center gap-3 mb-4">
      <div className="w-6 h-6 md:w-8 md:h-8 bg-gray-200 rounded-full animate-pulse" />
      <div>
        <div className="h-4 md:h-5 w-20 bg-gray-200 rounded animate-pulse mb-1" />
        <div className="h-3 md:h-4 w-16 bg-gray-100 rounded animate-pulse" />
      </div>
    </div>
    <div className="space-y-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="space-y-2">
          <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
          <div className="h-10 w-full bg-gray-200 rounded animate-pulse" />
        </div>
      ))}
      <div className="h-12 w-full bg-gray-200 rounded animate-pulse mt-4" />
    </div>
  </Card>
);
