"use client";

import {
  ArrowLeft,
  Calendar,
  ChevronRight,
  Plus,
  QrCode,
  User,
  Wifi,
} from "lucide-react";
import Link from "next/link";
import { useQuery } from "@apollo/client";
import { Button } from "@workspace/ui";
import { Card } from "@workspace/ui";
import { Progress } from "@workspace/ui";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar";
import { Badge } from "@workspace/ui/components/badge";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { GetUserOrders } from "@/lib/graphql/checkout";
import { ME, GET_ACTIVE_ESIM_PLAN } from "@/lib/graphql/mutations";
import { Esim, EsimBundle, Order } from "@/__generated__/graphql";


export default function ProfilePage() {
  const { data: userData, loading: userLoading } = useQuery(ME);
  const { data: ordersData, loading: ordersLoading } = useQuery(GetUserOrders);
  const { data: esimsData, loading: esimsLoading } = useQuery(GET_ACTIVE_ESIM_PLAN);

  // Get active eSIM plan from real data
  const getActiveESIM = () => {
    if (!esimsData?.myESIMs || esimsData.myESIMs.length === 0) {
      return null;
    }
    
    // Find the first active or assigned eSIM
    const activeESIM = esimsData.myESIMs.find(
      (esim: Esim) => esim.status === 'ACTIVE' || esim.status === 'ASSIGNED'
    );
    
    return activeESIM || esimsData.myESIMs[0]; // Fallback to first eSIM
  };

  const activeESIM = getActiveESIM();
  
  // Calculate current plan data from real eSIM data
  const getCurrentPlan = () => {
    if (!activeESIM) return null;
    
    const activeBundle = activeESIM.bundles?.find((bundle: EsimBundle) => bundle.state === 'ACTIVE');
    
    if (!activeBundle) return null;
    
    const startDate = new Date(activeBundle.startDate);
    const endDate = new Date(activeBundle.endDate);
    const now = new Date();
    
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const daysLeft = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    
    // Get country name (prefer Hebrew name)
    const countryName = activeESIM.plan?.countries?.[0]?.nameHebrew || 
                      activeESIM.plan?.countries?.[0]?.name || 
                      activeESIM.plan?.region || 
                      "Unknown";
    
    return {
      country: countryName,
      dataUsed: activeBundle.dataUsed || 0, // Already in MB from backend
      dataTotal: (activeBundle.dataUsed || 0) + (activeBundle.dataRemaining || 0),
      daysLeft,
      totalDays,
      expiryDate: endDate,
      qrCode: activeESIM.qrCode || "",
      isActive: activeBundle.state === 'ACTIVE',
      planName: activeESIM.plan?.name || "Unknown Plan"
    };
  };
  
  const currentPlan = getCurrentPlan();

  const handleExtendPackage = () => {
    // TODO: Implement extend package functionality
    console.log("Extending package...");
  };

  const handleShowQRCode = (qrCode: string) => {
    // TODO: Implement QR code display modal
    console.log("Showing QR code:", qrCode);
  };

  const getStatusText = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "פעיל";
      case "delivered":
        return "נמסר";
      case "pending":
        return "ממתין";
      case "completed":
        return "הושלם";
      case "failed":
        return "נכשל";
      default:
        return "הושלם";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
      case "delivered":
        return "default";
      case "pending":
        return "secondary";
      case "failed":
        return "destructive";
      default:
        return "secondary";
    }
  };

  // Calculate percentages based on real data
  const dataUsagePercentage = currentPlan && currentPlan.dataTotal > 0 
    ? (currentPlan.dataUsed / currentPlan.dataTotal) * 100 
    : 0;
  const daysUsagePercentage = currentPlan && currentPlan.totalDays > 0
    ? ((currentPlan.totalDays - currentPlan.daysLeft) / currentPlan.totalDays) * 100
    : 0;

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Header */}
      <header className="bg-card border-b px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-xl font-semibold">אזור אישי</h1>
          <div className="w-10" /> {/* Spacer */}
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 max-w-2xl">
        {/* Profile Information */}
        <Card className="p-6 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={""} />
              <AvatarFallback>
                <User className="h-8 w-8" />
              </AvatarFallback>
            </Avatar>
            <div>
              {userLoading ? (
                <>
                  <Skeleton className="h-6 w-32 mb-2" />
                  <Skeleton className="h-4 w-48 mb-1" />
                  <Skeleton className="h-4 w-36" />
                </>
              ) : (
                <>
                  <h2 className="text-xl font-semibold">
                    {userData?.me?.firstName} {userData?.me?.lastName}
                  </h2>
                  <p className="text-muted-foreground">{userData?.me?.email}</p>
                  <p className="text-sm text-muted-foreground">
                    {userData?.me?.phoneNumber}
                  </p>
                </>
              )}
            </div>
          </div>
        </Card>

        {/* My Plan */}
        <Card className="p-6 mb-6">
          {esimsLoading ? (
            <div>
              <Skeleton className="h-8 w-64 mb-4" />
              <Skeleton className="h-20 w-full mb-4" />
              <Skeleton className="h-20 w-full mb-4" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : currentPlan ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Wifi className="h-5 w-5" />
                  החבילה שלי - {currentPlan.country}
                </h3>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleShowQRCode(currentPlan.qrCode)}
                  >
                    <QrCode className="h-4 w-4" />
                  </Button>
                  <Badge
                    variant={currentPlan.isActive ? "default" : "secondary"}
                  >
                    {currentPlan.isActive ? "פעיל" : "לא פעיל"}
                  </Badge>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Wifi className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg mb-2">אין חבילה פעילה</p>
              <p className="text-sm">הזמן חבילה חדשה כדי להתחיל</p>
            </div>
          )}
          
          {currentPlan && (
            <>

              {/* Data Usage */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">שימוש בנתונים היום</span>
                  <span className="text-sm text-muted-foreground">
                    {Math.round(currentPlan.dataUsed)}MB / {Math.round(currentPlan.dataTotal)}MB
                  </span>
                </div>
                <Progress value={dataUsagePercentage} className="h-2 mb-2" />
                <p className="text-xs text-muted-foreground">
                  לאחר חריגה מהמכסה, המהירות תהיה איטית יותר עד לאיפוס היומי
                </p>
              </div>

              {/* Days Remaining */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">ימים שנותרו</span>
                  <span className="text-sm text-muted-foreground">
                    {currentPlan.daysLeft} מתוך {currentPlan.totalDays} ימים
                  </span>
                </div>
                <Progress value={daysUsagePercentage} className="h-2 mb-2" />
                <p className="text-xs text-muted-foreground">
                  תפוגה: {currentPlan.expiryDate.toLocaleDateString("he-IL")}
                </p>
              </div>

              {/* Extend Package CTA */}
              <Button onClick={handleExtendPackage} className="w-full" size="lg">
                <Plus className="h-4 w-4 ml-2" />
                הוספת ימים לחבילה
              </Button>
            </>
          )}
        </Card>

        {/* Order History */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            היסטוריית הזמנות
          </h3>

          <div className="space-y-4">
            {ordersLoading ? (
              <>
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </>
            ) : ordersData?.myOrders?.length > 0 ? (
              ordersData.myOrders.map((order: Order) => (
                <Link
                  key={order.id}
                  href={`/order/${order.id}`}
                  className="block"
                >
                  <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-medium">
                          הזמנה #{order.reference}
                        </h4>
                        <Badge variant={getStatusColor(order.status)}>
                          {getStatusText(order.status)}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>{order.esims?.length || 0} eSIM(s)</p>
                        <p>
                          הוזמן:{" "}
                          {new Date(order.createdAt).toLocaleDateString(
                            "he-IL"
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-left">
                        <p className="font-semibold">₪{order.totalPrice}</p>
                        <p className="text-xs text-muted-foreground">
                          #{order.id}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>אין הזמנות עדיין</p>
                <p className="text-sm">כל ההזמנות שלך יופיעו כאן</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
