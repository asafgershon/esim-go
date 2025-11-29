"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@apollo/client";
import { ArrowLeft, Download, RefreshCw, CheckCircle, Smartphone } from "lucide-react";
import Link from "next/link";
import { Button } from "@workspace/ui";
import { Card } from "@workspace/ui";
import { Badge } from "@workspace/ui/components/badge";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { OrderDetails } from "@/lib/graphql/checkout";
import { OrderDetailsQuery } from "@/__generated__/graphql";
import Image from "next/image";
import { useEffect, useState } from "react";
import { ErrorDisplay } from "@/components/error-display";
import { parseGraphQLError } from "@/lib/error-types";
import { ActivationMethodSelector } from "@/components/esim/ActivationMethodSelector";
export default function OrderPage() {
  const { orderId } = useParams();
  const router = useRouter();
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(true);
  
  const { data, loading, error, refetch } = useQuery<OrderDetailsQuery>(OrderDetails, {
    variables: { id: orderId as string },
    skip: !orderId,
    fetchPolicy: 'network-only', // Force fresh data from server
  });

  // Hide success animation after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSuccessAnimation(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background" dir="rtl">
        <header className="bg-card border-b px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/profile">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-xl font-semibold">פרטי הזמנה</h1>
            <div className="w-10" />
          </div>
        </header>

        <div className="container mx-auto px-4 py-6 max-w-2xl">
          <Card className="p-6 mb-6">
            <Skeleton className="h-6 w-32 mb-4" />
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-4 w-16 mb-6" />
            <Skeleton className="h-64 w-full mb-6" />
            <Skeleton className="h-10 w-full" />
          </Card>
        </div>
      </div>
    );
  }

  if (error || !data?.orderDetails) {
    return (
      <div className="min-h-screen bg-background" dir="rtl">
        <header className="bg-card border-b px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/profile">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-xl font-semibold">פרטי הזמנה</h1>
            <div className="w-10" />
          </div>
        </header>

        <main className="flex flex-col gap-8 max-w-7xl mx-auto px-4 py-6">
          <ErrorDisplay
            error={parseGraphQLError(error)}
            onRetry={() => refetch()}
            onGoHome={() => router.push('/profile')}
          />
        </main>
      </div>
    );
  }

  const order = data.orderDetails;
  const primaryEsim = order.esims[0]; // Assuming first eSIM is primary

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
      case 'delivered':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'failed':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getStatusText = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'פעיל';
      case 'delivered':
        return 'נמסר';
      case 'pending':
        return 'ממתין';
      case 'failed':
        return 'נכשל';
      default:
        return status;
    }
  };

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <header className="bg-card border-b px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/profile">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-xl font-semibold">פרטי הזמנה</h1>
          <div className="w-10" />
        </div>
      </header>

      <main className="flex flex-col gap-8 max-w-7xl mx-auto px-4 py-6">
        {/* Success Banner */}
        {showSuccessAnimation && (
          <Card className="flex flex-col gap-4 shadow-xl bg-gradient-to-r from-green-50 to-emerald-50 border-green-200" dir="rtl">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <h2 className="text-xl font-semibold">הזמנה הושלמה</h2>
            </div>
            <div className="text-center">
              <h2 className="text-xl font-bold text-green-800 mb-2">🎉 ההזמנה הושלמה בהצלחה!</h2>
              <p className="text-green-700">
                כרטיס ה-eSIM שלך מוכן לשימוש. סרוק את קוד ה-QR להתחיל.
              </p>
            </div>
          </Card>
        )}

        {/* Order Info */}
        <Card className="flex flex-col gap-4 shadow-xl" dir="rtl">
          <div className="flex items-center gap-3">
            <Smartphone className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">פרטי הזמנה</h2>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">הזמנה #{order.reference}</h3>
              <p className="text-sm text-muted-foreground">מזהה: {order.id}</p>
            </div>
            <div className="text-left">
              <Badge className="" variant={getStatusColor(order.status)}>
                {getStatusText(order.status)}
              </Badge>
              <p className="text-lg font-semibold mt-1">${order.totalPrice}</p>
            </div>
          </div>
        </Card>

        {/* Smart eSIM Activation */}
        {primaryEsim && primaryEsim.installationLinks && (
          <Card className="flex flex-col gap-4 shadow-xl" dir="rtl">
            <div className="flex items-center gap-3">
              <Smartphone className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold">הפעלה חכמה</h2>
            </div>
            <ActivationMethodSelector
              installationLinks={primaryEsim.installationLinks}
              qrCode={primaryEsim.qrCode}
              iccid={primaryEsim.iccid}
            />
          </Card>
        )}

        {/* Fallback for old data without installationLinks */}
        {primaryEsim && !primaryEsim.installationLinks && (
          <Card className="flex flex-col gap-4 shadow-xl" dir="rtl">
            <div className="flex items-center gap-3">
              <Smartphone className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold">קוד QR להפעלה</h2>
            </div>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                סרוק את הקוד להתקנת כרטיס ה-eSIM במכשיר שלך
              </p>
              
              <div className="flex justify-center">
                <div className="p-4 rounded-lg border shadow-sm">
                  <Image 
                    src={primaryEsim.qrCode || ''} 
                    alt="QR Code for eSIM activation"
                    width={256}
                    height={256}
                    className="w-64 h-64"
                  />
                </div>
              </div>
              
              <div className="text-center space-y-2 text-sm text-muted-foreground">
                <p>ICCID: {primaryEsim.iccid}</p>
                <p>סטטוס eSIM: {getStatusText(primaryEsim.status)}</p>
                
                {/* LPA Link for manual installation */}
                {primaryEsim.smdpAddress && primaryEsim.matchingId && (
                  <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="text-xs font-medium mb-1">להתקנה ידנית או בלחיצה:</p>
                    <a 
                      href={`LPA:1$${primaryEsim.smdpAddress}$${primaryEsim.matchingId}`}
                      className="text-primary hover:underline break-all text-xs"
                    >
                      LPA:1${primaryEsim.smdpAddress}${primaryEsim.matchingId}
                    </a>
                  </div>
                )}
              </div>
            </div>
          </Card>
        )}

        {/* eSIM Details */}
        {order.esims.length > 1 && (
          <Card className="flex flex-col gap-4 shadow-xl" dir="rtl">
            <div className="flex items-center gap-3">
              <Smartphone className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold">כרטיסי eSIM</h2>
            </div>
            <div className="space-y-4">
              {order.esims.map((esim, index) => (
                <div key={esim.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">eSIM #{index + 1}</p>
                      <p className="text-sm text-muted-foreground">
                        ICCID: {esim.iccid}
                      </p>
                    </div>
                    <Badge className="" variant={getStatusColor(esim.status)}>
                      {getStatusText(esim.status)}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Actions */}
        <Card className="flex flex-col gap-4 shadow-xl" dir="rtl">
          <div className="flex items-center gap-3">
            <Download className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">פעולות נוספות</h2>
          </div>
          <div className="space-y-3">
            {primaryEsim && (
              <Button 
                className="w-full" 
                onClick={() => {
                  // Create a downloadable link for the QR code
                  if (primaryEsim.qrCode) {
                    const link = document.createElement('a');
                    link.href = primaryEsim.qrCode;
                    link.download = `eSIM-QR-${order.reference}.png`;
                    link.click();
                  }
                }}
              >
                <Download className="h-4 w-4 ml-2" />
                הורדת קוד QR
              </Button>
            )}
            
            <Button 
              className="w-full" 
              variant="outline"
              onClick={() => window.print()}
            >
              <Download className="h-4 w-4 ml-2" />
              הדפסת פרטי ההזמנה
            </Button>
            
            <Button 
              className="w-full" 
              variant="outline"
              onClick={() => refetch()}
            >
              <RefreshCw className="h-4 w-4 ml-2" />
              רענון נתונים
            </Button>
          </div>
        </Card>
      </main>
    </div>
  );
}