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
import { ME } from "@/lib/graphql/mutations";
import { Order } from "@/__generated__/graphql";

// Mock data - will be replaced with real API calls
// const mockProfile = {
//   name: "יעל כהן",
//   email: "yael.cohen@example.com",
//   phone: "+972-50-123-4567",
//   avatar: null,
// };

const mockCurrentPlan = {
  country: "צרפת",
  dataUsed: 650, // MB
  dataTotal: 1000, // MB (1GB)
  daysLeft: 4,
  totalDays: 30,
  expiryDate: new Date("2025-01-18"),
  qrCode: "mock-qr-code-data",
  isActive: true,
};

// const mockOrders = [
//   {
//     id: "ORD-001",
//     country: "צרפת",
//     duration: "30 ימים",
//     data: "1GB יומי",
//     price: "₪89",
//     date: new Date('2024-12-19'),
//     status: "פעיל",
//     qrCode: "mock-qr-1",
//   },
//   {
//     id: "ORD-002",
//     country: "איטליה",
//     duration: "14 ימים",
//     data: "1GB יומי",
//     price: "₪59",
//     date: new Date('2024-11-15'),
//     status: "הושלם",
//     qrCode: "mock-qr-2",
//   },
//   {
//     id: "ORD-003",
//     country: "ספרד",
//     duration: "7 ימים",
//     data: "1GB יומי",
//     price: "₪39",
//     date: new Date('2024-10-10'),
//     status: "הושלם",
//     qrCode: "mock-qr-3",
//   },
// ];

export default function ProfilePage() {
  const { data: userData, loading: userLoading } = useQuery(ME);
  const { data: ordersData, loading: ordersLoading } = useQuery(GetUserOrders);

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

  const dataUsagePercentage =
    (mockCurrentPlan.dataUsed / mockCurrentPlan.dataTotal) * 100;
  const daysUsagePercentage =
    ((mockCurrentPlan.totalDays - mockCurrentPlan.daysLeft) /
      mockCurrentPlan.totalDays) *
    100;

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
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Wifi className="h-5 w-5" />
              החבילה שלי - {mockCurrentPlan.country}
            </h3>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleShowQRCode(mockCurrentPlan.qrCode)}
              >
                <QrCode className="h-4 w-4" />
              </Button>
              <Badge
                variant={mockCurrentPlan.isActive ? "default" : "secondary"}
              >
                {mockCurrentPlan.isActive ? "פעיל" : "לא פעיל"}
              </Badge>
            </div>
          </div>

          {/* Data Usage */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">שימוש בנתונים היום</span>
              <span className="text-sm text-muted-foreground">
                {mockCurrentPlan.dataUsed}MB / {mockCurrentPlan.dataTotal}MB
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
                {mockCurrentPlan.daysLeft} מתוך {mockCurrentPlan.totalDays} ימים
              </span>
            </div>
            <Progress value={daysUsagePercentage} className="h-2 mb-2" />
            <p className="text-xs text-muted-foreground">
              תפוגה: {mockCurrentPlan.expiryDate.toLocaleDateString("he-IL")}
            </p>
          </div>

          {/* Extend Package CTA */}
          <Button onClick={handleExtendPackage} className="w-full" size="lg">
            <Plus className="h-4 w-4 ml-2" />
            הוספת ימים לחבילה
          </Button>
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
