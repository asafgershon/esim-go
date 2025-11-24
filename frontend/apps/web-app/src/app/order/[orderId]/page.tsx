"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@apollo/client";
import { CheckCircle, Mail, MessageCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@workspace/ui";
import { Card } from "@workspace/ui";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { ErrorDisplay } from "@/components/error-display";
import { parseGraphQLError } from "@/lib/error-types";
import { OrderDetails } from "@/lib/graphql/checkout";
import type { OrderDetailsQuery } from "@/__generated__/graphql";

export default function OrderPage() {
  const { orderId } = useParams();
  const router = useRouter();

  const { data, loading, error, refetch } = useQuery<OrderDetailsQuery>(
    OrderDetails,
    {
      variables: { id: orderId as string },
      skip: !orderId,
      fetchPolicy: "network-only",
    }
  );

  const whatsappNumber = "972559965794";
  const email = "office@hiiloworld.com";

  // ---------------------------------------------
  // LOADING STATE
  // ---------------------------------------------
  if (loading) {
    return (
      <div className="min-h-screen bg-secondary/30 p-6" dir="rtl">
        <Card className="w-full max-w-lg mx-auto p-8">
          <Skeleton className="h-8 w-48 mb-6 mx-auto" />
          <Skeleton className="h-4 w-64 mb-3 mx-auto" />
          <Skeleton className="h-4 w-56 mb-8 mx-auto" />
          <Skeleton className="h-12 w-full mb-4" />
          <Skeleton className="h-12 w-full mb-4" />
          <Skeleton className="h-12 w-full" />
        </Card>
      </div>
    );
  }

  // ---------------------------------------------
  // ERROR STATE
  // ---------------------------------------------
  if (error || !data?.orderDetails) {
    return (
      <div className="min-h-screen bg-secondary/30 p-6" dir="rtl">
        <main className="max-w-lg mx-auto py-10">
          <ErrorDisplay
            error={parseGraphQLError(error)}
            onRetry={() => refetch()}
            onGoHome={() => router.push("/profile")}
          />
        </main>
      </div>
    );
  }

  const order = data.orderDetails;

  // ---------------------------------------------
  // PAGE UI (NEW DESIGN)
  // ---------------------------------------------

  return (
    <div
      className="flex min-h-screen items-center justify-center bg-secondary/30 p-4"
      dir="rtl"
    >
      <Card className="w-full max-w-lg p-8 shadow-lg">
        <div className="text-center">
          {/* Success Icon */}
          <div className="mb-6 flex justify-center">
            <div className="rounded-full bg-success/10 p-4">
              <CheckCircle className="h-16 w-16 text-success" />
            </div>
          </div>

          {/* Title */}
          <h1 className="mb-3 text-3xl font-bold text-foreground">
            ההזמנה הושלמה בהצלחה!
          </h1>

          {/* Description */}
          <div className="mb-8 space-y-2 text-muted-foreground">
            <p className="text-lg">
              האי-סים נשלח אליך למייל עם פרטי הפעלה מפורטים.
            </p>
            <p className="text-sm">
              אם לא קיבלת את המייל — בדוק את הספאם או צור קשר איתנו.
            </p>
            <p className="text-sm mt-2 text-primary font-semibold">
              מספר הזמנה: {order.reference}
            </p>
          </div>

          {/* Buttons */}
          <div className="space-y-3">
            {/* WhatsApp */}
            <Button
              className="w-full gap-2"
              size="lg"
              onClick={() =>
                window.open(`https://wa.me/${whatsappNumber}`, "_blank")
              }
            >
              <MessageCircle className="h-5 w-5 text-green-500" />
              צור קשר בוואטסאפ
            </Button>

            {/* Email */}
            <Button
              variant="outline"
              className="w-full gap-2"
              size="lg"
              onClick={() => (window.location.href = `mailto:${email}`)}
            >
              <Mail className="h-5 w-5 text-blue-500" />
              שלח מייל
            </Button>

            {/* Back Home */}
            <Button
              variant="secondary"
              className="w-full"
              size="lg"
              onClick={() => (window.location.href = "/")}
            >
              חזרה לעמוד הבית
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
