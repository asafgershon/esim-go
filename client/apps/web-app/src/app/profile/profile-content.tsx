"use client";

import { Esim, EsimBundle, GetUserOrdersQuery } from "@/__generated__/graphql";
import { GetUserOrders } from "@/lib/graphql/checkout";
import { GET_ACTIVE_ESIM_PLAN, ME } from "@/lib/graphql/mutations";
import { useQuery } from "@apollo/client";
import { Button, Card, Progress } from "@workspace/ui";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar";
import { Badge } from "@workspace/ui/components/badge";
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
import BundleUsage from "./bundle-usage";

// Currency symbol mapping
const getCurrencySymbol = (currency: string) => {
  const symbols: Record<string, string> = {
    USD: "$",
    EUR: "€",
    GBP: "£",
    ILS: "₪",
    NIS: "₪", // Support both ILS and NIS
  };
  return symbols[currency?.toUpperCase()] || currency || "$";
};

export default function ProfileContent() {
  const { data: userData, loading: userLoading } = useQuery(ME);
  const { data: ordersData, loading: ordersLoading } =
    useQuery<GetUserOrdersQuery>(GetUserOrders);
  const { data: esimsData, loading: esimsLoading } =
    useQuery(GET_ACTIVE_ESIM_PLAN);

  // Get active eSIM plan from real data
  const getActiveESIM = () => {
    if (!esimsData?.myESIMs || esimsData.myESIMs.length === 0) {
      return null;
    }

    // Find the first active or assigned eSIM
    const activeESIM = esimsData.myESIMs.find(
      (esim: Esim) => esim.status === "ACTIVE" || esim.status === "ASSIGNED"
    );

    return activeESIM || esimsData.myESIMs[0]; // Fallback to first eSIM
  };

  const activeESIM = getActiveESIM();

  // Calculate current plan data from real eSIM data
  const getCurrentPlan = () => {
    return {
      country: "Israel",
      dataUsedMB: 1000,
      dataRemainingMB: 1000,
      dataTotalMB: 2000,
      dataUsedGB: 1,
      dataTotalGB: 2,
      expiryDate: new Date(),
      daysLeft: 10,
      totalDays: 30,
    };
    if (!activeESIM) return null;

    const activeBundle = activeESIM.bundles?.find(
      (bundle: EsimBundle) => bundle.state === "ACTIVE"
    );

    if (!activeBundle) return null;

    const startDate = new Date(activeBundle.startDate);
    const endDate = new Date(activeBundle.endDate);
    const now = new Date();

    const totalDays = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    const daysLeft = Math.max(
      0,
      Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    );

    // Get country name (prefer Hebrew name)
    const countryName =
      activeESIM.plan?.countries?.[0]?.nameHebrew ||
      activeESIM.plan?.countries?.[0]?.name ||
      activeESIM.plan?.region ||
      "Unknown";

    // Use usage data from the API if available, otherwise fall back to bundle data
    const dataUsedMB =
      activeESIM.usage?.totalUsed || activeBundle.dataUsed || 0;
    const dataRemainingMB =
      activeESIM.usage?.totalRemaining || activeBundle.dataRemaining || 0;
    const dataTotalMB = dataUsedMB + dataRemainingMB;

    return {
      country: countryName,
      dataUsedMB: dataUsedMB,
      dataRemainingMB: dataRemainingMB,
      dataTotalMB: dataTotalMB,
      dataUsedGB: dataUsedMB / 1024, // Convert MB to GB
      dataTotalGB: dataTotalMB / 1024, // Convert MB to GB
      daysLeft,
      totalDays,
      expiryDate: endDate,
      qrCode: activeESIM.qrCode || "",
      isActive: activeBundle.state === "ACTIVE",
      planName: activeESIM.plan?.name || "Unknown Plan",
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
  const dataUsagePercentage =
    currentPlan && currentPlan.dataTotalMB > 0
      ? (currentPlan.dataUsedMB / currentPlan.dataTotalMB) * 100
      : 0;
  const daysUsagePercentage =
    currentPlan && currentPlan.totalDays > 0
      ? ((currentPlan.totalDays - currentPlan.daysLeft) /
          currentPlan.totalDays) *
        100
      : 0;

  // Check if usage exceeds 80%
  const isHighUsage = dataUsagePercentage > 80;

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Header */}
      <header className="bg-card border-b px-4 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-xl font-semibold">אזור אישי</h1>
            <div className="w-10" /> {/* Spacer */}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Grid Layout - 1 col mobile, 2 col tablet, 3-4 col desktop */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {/* Profile Information - spans 1 column on all screens */}
          <Card className="md:col-span-1">
            <div className="flex items-center gap-4 mb-4">
              <Avatar className="h-16 w-16">
                <AvatarImage className="" src={""} />
                <AvatarFallback className="">
                  <User className="h-8 w-8" />
                </AvatarFallback>
              </Avatar>
              <div>
                {userLoading ? (
                  <>
                    <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-2" />
                    <div className="h-4 w-48 bg-gray-100 rounded animate-pulse mb-1" />
                    <div className="h-4 w-36 bg-gray-100 rounded animate-pulse" />
                  </>
                ) : (
                  <>
                    <h2 className="text-xl font-semibold truncate">
                      {userData?.me?.firstName} {userData?.me?.lastName}
                    </h2>
                    <p className="text-muted-foreground truncate">
                      {userData?.me?.email}
                    </p>
                    <p className="text-sm text-muted-foreground truncate">
                      {userData?.me?.phoneNumber}
                    </p>
                  </>
                )}
              </div>
            </div>
          </Card>

          {/* Bundle Usage Indicator - spans 2 columns on tablet, 2 on lg, 2 on xl */}
          <div className="md:col-span-1 lg:col-span-2 xl:col-span-2">
            {esimsLoading ? (
              // Loading skeleton
              <Card className="p-6">
                <div className="animate-pulse space-y-4">
                  <div className="h-32 bg-gray-200 rounded" />
                  <div className="h-20 bg-gray-200 rounded" />
                  <div className="h-12 bg-gray-200 rounded" />
                </div>
              </Card>
            ) : currentPlan ? (
              // Show BundleUsage component when there's an active plan
              <BundleUsage
                planName={currentPlan.planName}
                totalDays={currentPlan.totalDays}
                currentDay={currentPlan.totalDays - currentPlan.daysLeft}
                totalDataUsed={`${currentPlan.dataUsedGB.toFixed(1)} GB`}
                dailyThreshold="2 GB"
                installationLinks={activeESIM?.installationLinks}
                qrCode={activeESIM?.qrCode}
                iccid={activeESIM?.iccid}
              />
            ) : (
              // Empty state when no active plan
              <Card className="p-6">
                <div className="text-center py-8 text-muted-foreground">
                  <Wifi className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg mb-2">אין חבילה פעילה</p>
                  <p className="text-sm">הזמן חבילה חדשה כדי להתחיל</p>
                </div>
              </Card>
            )}
          </div>

          {/* Order History - spans 1 col on mobile, 2 cols on tablet and desktop */}
          <Card className="md:col-span-2 lg:col-span-2 xl:col-span-2 max-h-[600px] flex flex-col">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 flex-shrink-0">
              <Calendar className="h-5 w-5" />
              היסטוריית הזמנות
            </h3>

            <div className="space-y-4 overflow-y-auto flex-1 pr-2">
              {ordersLoading ? (
                <>
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between border border-brand-dark/10 rounded-lg md:rounded-[15px] p-3 md:p-4"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                          <div className="h-4 w-12 bg-gray-100 rounded animate-pulse" />
                        </div>
                        <div className="space-y-1">
                          <div className="h-3 w-20 bg-gray-100 rounded animate-pulse" />
                          <div className="h-3 w-28 bg-gray-100 rounded animate-pulse" />
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <div>
                          <div className="h-5 w-16 bg-gray-200 rounded animate-pulse mb-1" />
                          <div className="h-3 w-20 bg-gray-100 rounded animate-pulse" />
                        </div>
                        <div className="h-4 w-4 bg-gray-100 rounded animate-pulse" />
                      </div>
                    </div>
                  ))}
                </>
              ) : ordersData?.myOrders?.length &&
                ordersData.myOrders.length > 0 ? (
                ordersData.myOrders.map((order) => (
                  <Link
                    key={order.id}
                    href={`/order/${order.id}`}
                    className="block"
                  >
                    <div className="flex items-center justify-between border border-brand-dark/10 rounded-lg md:rounded-[15px] p-3 md:p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-medium truncate">
                            הזמנה #{order.reference}
                          </h4>
                          <Badge
                            className=""
                            variant={getStatusColor(order.status)}
                          >
                            {getStatusText(order.status)}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p className="truncate">
                            {order.esims?.length || 0} eSIM(s)
                          </p>
                          <p className="truncate">
                            הוזמן:{" "}
                            {new Date(order.createdAt).toLocaleDateString(
                              "he-IL"
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 flex-shrink-0">
                        <div className="text-left">
                          <p className="font-semibold">
                            {getCurrencySymbol(order.currency)}
                            {order.totalPrice}
                          </p>
                          <p className="text-xs text-muted-foreground truncate max-w-20">
                            #{order.id.slice(-8)}
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
    </div>
  );
}
