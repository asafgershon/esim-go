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
  Input,
  Label,
  PhoneInput,
} from "@workspace/ui";
import { Package } from "lucide-react";
import { useCallback, useEffect } from "react";
import { useForm } from "react-hook-form";
import z from "zod";
import { SectionHeader } from "./section-header";

type DeliveryCardProps = {
  completed: boolean;
  sectionNumber?: number;
  data: Pick<Checkout, "delivery" | "id" | "auth"> | undefined;
  onDeliveryUpdate: (delivery: Checkout["delivery"]) => void;
};

const DeliverySchema = z.object({
  email: z.string().email({ message: "אימייל לא תקין" }),
  phone: z.string().min(1, { message: "מספר טלפון נדרש" }),
});

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
  onDeliveryUpdate,
}: DeliveryCardProps) => {
  const { delivery, auth } = data || {};

  const [updateCheckoutDelivery, { loading: isLoading }] = useMutation<
    UpdateCheckoutDeliveryMutation,
    UpdateCheckoutDeliveryMutationVariables
  >(UPDATE_CHECKOUT_DELIVERY_MUTATION);

  const {
    register,
    setValue,
    watch,
    handleSubmit,
    formState: { errors, isValid, isDirty },
  } = useForm<DeliveryFormData>({
    resolver: zodResolver(DeliverySchema),
    defaultValues: {
      email: delivery?.email || "",
      phone: delivery?.phone || "",
    },
    mode: "onChange",
  });

  const isReadOnly = delivery?.completed;

  useEffect(() => {
    if (auth?.completed) {
      setValue("email", auth?.email || "");
      setValue("phone", auth?.phone || "");
    }
  }, [auth?.completed, auth?.email, auth?.phone, setValue]);

  const onSubmit = useCallback(
    async (formData: DeliveryFormData) => {
      if (!data?.id) return;

      const { data: result } = await updateCheckoutDelivery({
        variables: {
          sessionId: data.id,
          email: formData.email,
          phone: formData.phone,
        },
      });

      if (result?.updateCheckoutDelivery) {
        onDeliveryUpdate(result.updateCheckoutDelivery);
      }
    },
    [data?.id, updateCheckoutDelivery, onDeliveryUpdate]
  );

  const removeCountryCode = (phone: string) => {
    if (!phone) return "";

    // Remove leading + if present
    let cleanedPhone = phone.replace(/^\+/, "");

    // Remove common country codes for Israel (972) and other common ones
    // Handle cases like: 972501234567, 972-50-123-4567, +972501234567
    if (cleanedPhone.startsWith("972")) {
      cleanedPhone = cleanedPhone.substring(3);
    }

    // Remove any remaining non-digit characters except for common separators
    cleanedPhone = cleanedPhone.replace(/[^\d\-\s\(\)]/g, "");

    return cleanedPhone;
  };

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

  //   if (!authCompleted) return <DeliveryCardSkeleton />;

  return (
    <Card dir="rtl" className="flex flex-col gap-4 shadow-xl">
      <SectionHeader
        sectionNumber={sectionNumber || 3}
        title="פרטי משלוח"
        icon={<Package className="h-5 w-5 text-primary" />}
        isCompleted={completed}
      />

      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">אימייל למשלוח</Label>
            <Input
              id="email"
              type="email"
              placeholder="הכנס כתובת אימייל"
              {...register("email")}
              disabled={isLoading || isReadOnly}
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">טלפון לעדכונים</Label>
            <PhoneInput
              id="phone"
              defaultCountry="IL"
              placeholder="הכנס מספר טלפון"
              {...register("phone")}
              value={removeCountryCode(watch("phone"))}
              disabled={isLoading || isReadOnly}
            />
            {errors.phone && (
              <p className="text-sm text-red-500">{errors.phone.message}</p>
            )}
          </div>

          {isDirty && (
            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={isLoading || !isValid}
            >
              {isLoading ? "שומר..." : "שמור פרטי משלוח"}
            </Button>
          )}
        </form>
      </CardContent>
    </Card>
  );
};

// const DeliveryCardSkeleton = () => {
//   return (
//     <Card className="p-6">
//       <div className="flex items-center gap-3 mb-4">
//         <div className="w-6 h-6 md:w-8 md:h-8 bg-gray-200 rounded-full animate-pulse" />
//         <div>
//           <div className="h-4 md:h-5 w-20 bg-gray-200 rounded animate-pulse mb-1" />
//           <div className="h-3 md:h-4 w-16 bg-gray-100 rounded animate-pulse" />
//         </div>
//       </div>

//       <div className="space-y-4">
//         <div className="space-y-2">
//           <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
//           <div className="h-10 w-full bg-gray-200 rounded animate-pulse" />
//         </div>
//         <div className="space-y-2">
//           <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
//           <div className="h-10 w-full bg-gray-200 rounded animate-pulse" />
//         </div>
//       </div>
//     </Card>
//   );
// };
