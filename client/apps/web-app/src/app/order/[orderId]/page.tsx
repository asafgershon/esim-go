"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@apollo/client";
import { ArrowLeft, Download, RefreshCw } from "lucide-react";
import Link from "next/link";
import { Button } from "@workspace/ui";
import { Card } from "@workspace/ui";
import { Badge } from "@workspace/ui/components/badge";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { OrderDetails } from "@/lib/graphql/checkout";
import Image from "next/image";
export default function OrderPage() {
  const { orderId } = useParams();
  
  const { data, loading, error, refetch } = useQuery(OrderDetails, {
    variables: { id: orderId },
    skip: !orderId,
  });

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

        <div className="container mx-auto px-4 py-6 max-w-2xl">
          <Card className="p-6 text-center">
            <h2 className="text-xl font-semibold mb-2">שגיאה בטעינת ההזמנה</h2>
            <p className="text-muted-foreground mb-4">
              לא הצלחנו לטעון את פרטי ההזמנה. אנא נסה שוב.
            </p>
            <Button onClick={() => refetch()} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              נסה שוב
            </Button>
          </Card>
        </div>
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

      <div className="container mx-auto px-4 py-6 max-w-2xl">
        {/* Order Info */}
        <Card className="p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold">הזמנה #{order.reference}</h2>
              <p className="text-sm text-muted-foreground">מזהה: {order.id}</p>
            </div>
            <div className="text-left">
              <Badge variant={getStatusColor(order.status)}>
                {getStatusText(order.status)}
              </Badge>
              <p className="text-lg font-semibold mt-1">₪{order.totalPrice}</p>
            </div>
          </div>
        </Card>

        {/* QR Code */}
        {primaryEsim && (
          <Card className="p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4 text-center">קוד QR להפעלה</h3>
            <div className="flex justify-center mb-4">
              <div className="bg-white p-4 rounded-lg border">
                <Image 
                  src={primaryEsim.qrCode} 
                  alt="QR Code"
                  width={256}
                  height={256}
                  className="w-64 h-64"
                />
              </div>
            </div>
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                ICCID: {primaryEsim.iccid}
              </p>
              <p className="text-sm text-muted-foreground">
                סטטוס eSIM: {getStatusText(primaryEsim.status)}
              </p>
            </div>
          </Card>
        )}

        {/* eSIM Details */}
        {order.esims.length > 1 && (
          <Card className="p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">כרטיסי eSIM</h3>
            <div className="space-y-4">
              {order.esims.map((esim: any, index: number) => (
                <div key={esim.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">eSIM #{index + 1}</p>
                      <p className="text-sm text-muted-foreground">
                        ICCID: {esim.iccid}
                      </p>
                    </div>
                    <Badge variant={getStatusColor(esim.status)}>
                      {getStatusText(esim.status)}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Actions */}
        <Card className="p-6">
          <div className="space-y-3">
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
      </div>
    </div>
  );
}