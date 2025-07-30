import { gql, useQuery } from "@apollo/client";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Separator } from "@workspace/ui/components/separator";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@workspace/ui/components/tabs";
import { format, formatDistanceToNow } from "date-fns";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Copy,
  ExternalLink,
  Package,
  QrCode,
  CardSim,
  Smartphone,
  User,
  XCircle,
  DollarSign,
  Hash,
  Calendar,
  Activity
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  DetailsDrawer,
  DetailsSection,
  DetailsSectionHeader,
  DetailsField,
  DetailsContainer,
} from "./common/DetailsDrawer";

const GET_ORDER_DETAILS = gql`
  query GetOrderDetails($id: ID!) {
    orderDetails(id: $id) {
      id
      reference
      status
      quantity
      totalPrice
      createdAt
      updatedAt
      bundleId
      bundleName
      user {
        id
        email
        firstName
        lastName
        phoneNumber
        role
      }
      esims {
        id
        iccid
        status
        qrCode
        smdpAddress
        matchingId
        customerRef
        assignedDate
        lastAction
        actionDate
        createdAt
        installationLinks {
          universalLink
          lpaScheme
        }
      }
    }
  }
`;

interface OrderDetailsDrawerProps {
  orderId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OrderDetailsDrawer({ orderId, open, onOpenChange }: OrderDetailsDrawerProps) {
  const [activeTab, setActiveTab] = useState("overview");
  
  const { data, loading, error } = useQuery(GET_ORDER_DETAILS, {
    variables: { id: orderId },
    skip: !orderId || !open,
  });

  const order = data?.orderDetails;

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "default";
      case "PROCESSING":
        return "secondary";
      case "FAILED":
      case "CANCELLED":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getESIMStatusIcon = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "ASSIGNED":
        return <Clock className="h-4 w-4 text-blue-500" />;
      case "SUSPENDED":
      case "EXPIRED":
      case "CANCELLED":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  if (!orderId) return null;

  return (
    <DetailsDrawer
      open={open}
      onOpenChange={onOpenChange}
      title="Order Details"
      description="View order information and associated eSIMs"
      width="w-[600px] max-w-[90vw]"
    >
      {loading ? (
        <div className="space-y-4 mt-6">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : error ? (
        <div className="mt-6 text-center">
          <p className="text-sm text-destructive">
            Error loading order: {error.message}
          </p>
        </div>
      ) : order ? (
        <div className="mt-6">
          {/* Order Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold">{order.reference}</h3>
              <p className="text-sm text-muted-foreground">Order ID: {order.id}</p>
            </div>
            <Badge variant={getStatusColor(order.status)}>
              {order.status}
            </Badge>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="esims">
                eSIMs {order.esims?.length > 0 && `(${order.esims.length})`}
              </TabsTrigger>
              <TabsTrigger value="customer">Customer</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6 mt-6">
              {/* Order Information */}
              <DetailsSection>
                <DetailsSectionHeader 
                  icon={<Package className="h-5 w-5 text-primary" />} 
                  title="Order Information" 
                />
                <DetailsContainer>
                  <DetailsField
                    icon={<Package className="h-4 w-4 text-muted-foreground" />}
                    label="Bundle"
                    value={order.bundleName || "N/A"}
                  />
                  <DetailsField
                    icon={<Hash className="h-4 w-4 text-muted-foreground" />}
                    label="Quantity"
                    value={order.quantity}
                  />
                  <DetailsField
                    icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
                    label="Total Price"
                    value={`$${order.totalPrice.toFixed(2)}`}
                  />
                  <Separator />
                  <DetailsField
                    icon={<Calendar className="h-4 w-4 text-muted-foreground" />}
                    label="Created"
                    value={format(new Date(order.createdAt), "PPP")}
                  />
                  <DetailsField
                    icon={<Clock className="h-4 w-4 text-muted-foreground" />}
                    label="Last Updated"
                    value={formatDistanceToNow(new Date(order.updatedAt), { addSuffix: true })}
                  />
                </DetailsContainer>
              </DetailsSection>

              <Separator />

              {/* Order Summary Stats */}
              <DetailsSection>
                <DetailsSectionHeader 
                  icon={<CardSim className="h-5 w-5 text-primary" />} 
                  title="eSIM Summary" 
                />
                <div className="grid grid-cols-2 gap-4">
                  <DetailsContainer>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{order.esims?.length || 0}</div>
                      <p className="text-xs text-muted-foreground">Total eSIMs</p>
                    </div>
                  </DetailsContainer>
                  <DetailsContainer>
                    <div className="text-center">
                      <div className="text-2xl font-bold">
                        {order.esims?.filter((e: any) => e.status === "ACTIVE").length || 0}
                      </div>
                      <p className="text-xs text-muted-foreground">Active eSIMs</p>
                    </div>
                  </DetailsContainer>
                </div>
              </DetailsSection>
            </TabsContent>

            <TabsContent value="esims" className="space-y-6 mt-6">
              {order.esims && order.esims.length > 0 ? (
                order.esims.map((esim: any, index: number) => (
                  <DetailsSection key={esim.id}>
                    <DetailsSectionHeader 
                      icon={<CardSim className="h-5 w-5 text-primary" />} 
                      title={`eSIM #${index + 1}`} 
                    />
                    <DetailsContainer>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          {getESIMStatusIcon(esim.status)}
                          <Badge variant={getStatusColor(esim.status)} className="text-xs">
                            {esim.status}
                          </Badge>
                        </div>
                      </div>

                      {/* ICCID */}
                      <DetailsField
                        icon={<Hash className="h-4 w-4 text-muted-foreground" />}
                        label="ICCID"
                        value={<code className="text-xs font-mono">{esim.iccid}</code>}
                        action={
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => handleCopy(esim.iccid, "ICCID")}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        }
                      />

                      {/* QR Code */}
                      {esim.qrCode && (
                        <DetailsField
                          icon={<QrCode className="h-4 w-4 text-muted-foreground" />}
                          label="QR Code"
                          value=""
                          action={
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(esim.qrCode, "_blank")}
                            >
                              <QrCode className="mr-2 h-4 w-4" />
                              View QR
                            </Button>
                          }
                        />
                      )}

                      {/* Installation Links */}
                      {esim.installationLinks && (
                        <>
                          <Separator />
                          <div className="space-y-2">
                            <span className="text-sm font-medium">Direct Installation</span>
                            <div className="flex gap-2">
                              {esim.installationLinks.universalLink && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleCopy(esim.installationLinks.universalLink, "iOS link")}
                                >
                                  <Smartphone className="mr-2 h-4 w-4" />
                                  iOS 17.4+
                                </Button>
                              )}
                              {esim.installationLinks.lpaScheme && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleCopy(esim.installationLinks.lpaScheme, "LPA link")}
                                >
                                  <Smartphone className="mr-2 h-4 w-4" />
                                  Android
                                </Button>
                              )}
                            </div>
                          </div>
                        </>
                      )}

                      {/* Technical Details */}
                      {(esim.smdpAddress || esim.matchingId) && (
                        <>
                          <Separator />
                          {esim.smdpAddress && (
                            <div className="space-y-1">
                              <span className="text-sm text-muted-foreground">SM-DP+ Address</span>
                              <div className="flex items-center gap-2">
                                <code className="text-xs bg-muted p-1 rounded flex-1 break-all">
                                  {esim.smdpAddress}
                                </code>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={() => handleCopy(esim.smdpAddress, "SM-DP+ Address")}
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          )}
                          {esim.matchingId && (
                            <div className="space-y-1">
                              <span className="text-sm text-muted-foreground">Matching ID</span>
                              <div className="flex items-center gap-2">
                                <code className="text-xs bg-muted p-1 rounded">
                                  {esim.matchingId}
                                </code>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={() => handleCopy(esim.matchingId, "Matching ID")}
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          )}
                        </>
                      )}

                      {/* Timestamps */}
                      <Separator />
                      <DetailsField
                        icon={<Calendar className="h-4 w-4 text-muted-foreground" />}
                        label="Assigned"
                        value={formatDistanceToNow(new Date(esim.assignedDate || esim.createdAt), { addSuffix: true })}
                      />
                      {esim.lastAction && (
                        <DetailsField
                          icon={<Activity className="h-4 w-4 text-muted-foreground" />}
                          label="Last Action"
                          value={esim.lastAction}
                        />
                      )}
                    </DetailsContainer>
                  </DetailsSection>
                ))
              ) : (
                <DetailsSection>
                  <DetailsContainer>
                    <div className="py-8 text-center">
                      <CardSim className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-sm font-medium">No eSIMs found</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        This order doesn't have any associated eSIMs
                      </p>
                    </div>
                  </DetailsContainer>
                </DetailsSection>
              )}
            </TabsContent>

            <TabsContent value="customer" className="space-y-6 mt-6">
              {order.user ? (
                <DetailsSection>
                  <DetailsSectionHeader 
                    icon={<User className="h-5 w-5 text-primary" />} 
                    title="Customer Information" 
                  />
                  <DetailsContainer>
                    <DetailsField
                      icon={<User className="h-4 w-4 text-muted-foreground" />}
                      label="Name"
                      value={
                        order.user.firstName || order.user.lastName
                          ? `${order.user.firstName} ${order.user.lastName}`.trim()
                          : "Not provided"
                      }
                    />
                    <DetailsField
                      icon={<User className="h-4 w-4 text-muted-foreground" />}
                      label="Email"
                      value={order.user.email}
                      action={
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => handleCopy(order.user.email, "Email")}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      }
                    />
                    {order.user.phoneNumber && (
                      <DetailsField
                        icon={<Phone className="h-4 w-4 text-muted-foreground" />}
                        label="Phone"
                        value={order.user.phoneNumber}
                      />
                    )}
                    <DetailsField
                      icon={<Shield className="h-4 w-4 text-muted-foreground" />}
                      label="Role"
                      value={<Badge variant="secondary">{order.user.role}</Badge>}
                    />
                    <Separator />
                    <DetailsField
                      icon={<Hash className="h-4 w-4 text-muted-foreground" />}
                      label="User ID"
                      value={<code className="text-xs">{order.user.id}</code>}
                      action={
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => {/* Navigate to user details */}}
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      }
                    />
                  </DetailsContainer>
                </DetailsSection>
              ) : (
                <DetailsSection>
                  <DetailsContainer>
                    <div className="py-8 text-center">
                      <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-sm font-medium">Customer not found</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        The customer associated with this order could not be found
                      </p>
                    </div>
                  </DetailsContainer>
                </DetailsSection>
              )}
            </TabsContent>
          </Tabs>
        </div>
      ) : null}
    </DetailsDrawer>
  );
}