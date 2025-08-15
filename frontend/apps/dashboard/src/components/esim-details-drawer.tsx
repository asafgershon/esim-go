import { gql, useQuery } from "@apollo/client";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Progress } from "@workspace/ui/components/progress";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { Separator } from "@workspace/ui/components/separator";
import { format, formatDistanceToNow } from "date-fns";
import {
  Activity,
  AlertCircle,
  Clock,
  Copy,
  ExternalLink,
  Package,
  Pause,
  Play,
  User,
  Wifi,
  XCircle,
  CardSim,
  Hash,
  Calendar,
  Shield,
  Globe,
} from "lucide-react";
import { toast } from "sonner";
import {
  DetailsDrawer,
  DetailsSection,
  DetailsSectionHeader,
  DetailsField,
  DetailsContainer,
} from "./common/DetailsDrawer";

const GET_ADMIN_ESIM_DETAILS = gql`
  query GetAdminESIMDetails($iccid: String!) {
    getAdminESIMDetails(iccid: $iccid) {
      id
      iccid
      userId
      orderId
      status
      customerRef
      assignedDate
      activationCode
      qrCodeUrl
      smdpAddress
      matchingId
      lastAction
      actionDate
      createdAt
      updatedAt
      apiDetails
      usage {
        totalUsed
        totalRemaining
        activeBundles {
          id
          name
          state
          dataUsed
          dataRemaining
          startDate
          endDate
        }
      }
      order {
        id
        reference
        status
        bundleName
        totalPrice
        createdAt
      }
    }
  }
`;

interface ESIMDetailsDrawerProps {
  esim: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ESIMDetailsDrawer({ esim, open, onOpenChange }: ESIMDetailsDrawerProps) {
  const { data, loading, error } = useQuery(GET_ADMIN_ESIM_DETAILS, {
    variables: { iccid: esim.iccid },
    skip: !open || !esim,
  });

  const esimDetails = data?.getAdminESIMDetails || esim;

  if (error) {
    console.error("Error fetching eSIM details:", error);
  }

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "default";
      case "ASSIGNED":
        return "secondary";
      case "SUSPENDED":
      case "EXPIRED":
      case "CANCELLED":
        return "destructive";
      default:
        return "outline";
    }
  };

  return (
    <DetailsDrawer
      open={open}
      onOpenChange={onOpenChange}
      title="eSIM Details"
      description="View and manage eSIM information and status"
    >
      {loading ? (
        <div className="space-y-4 mt-6">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : (
        <div className="space-y-6 mt-6">
          {/* Status and Quick Actions */}
          <div className="flex items-center justify-between">
            <Badge variant={getStatusColor(esimDetails.status)} className="text-sm">
              {esimDetails.status}
            </Badge>
            <div className="flex gap-2">
              {esimDetails.status === "ACTIVE" && (
                <Button variant="outline" size="sm">
                  <Pause className="mr-2 h-4 w-4" />
                  Suspend
                </Button>
              )}
              {esimDetails.status === "SUSPENDED" && (
                <Button variant="outline" size="sm">
                  <Play className="mr-2 h-4 w-4" />
                  Restore
                </Button>
              )}
              {esimDetails.status !== "CANCELLED" && (
                <Button variant="outline" size="sm" className="text-destructive">
                  <XCircle className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
              )}
            </div>
          </div>

          {/* eSIM Information Section */}
          <DetailsSection>
            <DetailsSectionHeader icon={<CardSim className="h-5 w-5 text-primary" />} title="eSIM Information" />
            <DetailsContainer>
              <DetailsField
                icon={<Hash className="h-4 w-4 text-muted-foreground" />}
                label="ICCID"
                value={
                  <code className="text-xs font-mono">{esimDetails.iccid}</code>
                }
                action={
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => handleCopy(esimDetails.iccid, "ICCID")}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                }
              />
              {esimDetails.customerRef && (
                <DetailsField
                  icon={<Shield className="h-4 w-4 text-muted-foreground" />}
                  label="Customer Reference"
                  value={esimDetails.customerRef}
                />
              )}
              <DetailsField
                icon={<Calendar className="h-4 w-4 text-muted-foreground" />}
                label="Assigned Date"
                value={format(new Date(esimDetails.assignedDate || esimDetails.createdAt), "PPP")}
              />
              {esimDetails.apiStatus && esimDetails.apiStatus !== esimDetails.status && (
                <DetailsField
                  icon={<Globe className="h-4 w-4 text-muted-foreground" />}
                  label="API Status"
                  value={<Badge variant="outline" className="text-xs">{esimDetails.apiStatus}</Badge>}
                />
              )}
            </DetailsContainer>
          </DetailsSection>

          <Separator />

          {/* Customer Section */}
          {esimDetails.user && (
            <DetailsSection>
              <DetailsSectionHeader icon={<User className="h-5 w-5 text-primary" />} title="Customer" />
              <DetailsContainer>
                <DetailsField
                  icon={<User className="h-4 w-4 text-muted-foreground" />}
                  label="Name"
                  value={`${esimDetails.user.firstName || ""} ${esimDetails.user.lastName || ""}`.trim() || "Not provided"}
                />
                <DetailsField
                  icon={<User className="h-4 w-4 text-muted-foreground" />}
                  label="Email"
                  value={esimDetails.user.email || `ID: ${esimDetails.userId.slice(0, 8)}...`}
                />
                <DetailsField
                  icon={<Hash className="h-4 w-4 text-muted-foreground" />}
                  label="User ID"
                  value={<code className="text-xs">{esimDetails.userId}</code>}
                  action={
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => {/* Navigate to user */}}
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  }
                />
              </DetailsContainer>
            </DetailsSection>
          )}

          <Separator />

          {/* Order Section */}
          {esimDetails.order && (
            <DetailsSection>
              <DetailsSectionHeader icon={<Package className="h-5 w-5 text-primary" />} title="Order" />
              <DetailsContainer>
                <DetailsField
                  icon={<Package className="h-4 w-4 text-muted-foreground" />}
                  label="Reference"
                  value={esimDetails.order.reference}
                  action={
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => {/* Navigate to order */}}
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  }
                />
                <DetailsField
                  icon={<Package className="h-4 w-4 text-muted-foreground" />}
                  label="Bundle"
                  value={esimDetails.order.bundleName || "Unknown"}
                />
                <DetailsField
                  icon={<Package className="h-4 w-4 text-muted-foreground" />}
                  label="Price"
                  value={`$${esimDetails.order.totalPrice}`}
                />
              </DetailsContainer>
            </DetailsSection>
          )}

          <Separator />

          {/* Usage Section */}
          {esimDetails.usage && (
            <DetailsSection>
              <DetailsSectionHeader icon={<Wifi className="h-5 w-5 text-primary" />} title="Data Usage" />
              <DetailsContainer>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Total Usage</span>
                    <span className="text-sm font-medium">
                      {(esimDetails.usage.totalUsed / 1024).toFixed(2)}GB / 
                      {esimDetails.usage.totalRemaining 
                        ? ` ${((esimDetails.usage.totalUsed + esimDetails.usage.totalRemaining) / 1024).toFixed(2)}GB`
                        : " Unlimited"}
                    </span>
                  </div>
                  {esimDetails.usage.totalRemaining && (
                    <Progress 
                      value={(esimDetails.usage.totalUsed / (esimDetails.usage.totalUsed + esimDetails.usage.totalRemaining)) * 100} 
                      className="h-2"
                    />
                  )}
                </div>

                {/* Active Bundles */}
                {esimDetails.usage.activeBundles && esimDetails.usage.activeBundles.length > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium">Active Bundles</h4>
                      {esimDetails.usage.activeBundles.map((bundle: any) => (
                        <div key={bundle.id} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm">{bundle.name}</span>
                            <Badge variant={bundle.state === "ACTIVE" ? "default" : "secondary"} className="text-xs">
                              {bundle.state}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>
                              {(bundle.dataUsed / 1024).toFixed(2)}GB / 
                              {bundle.dataRemaining 
                                ? ` ${((bundle.dataUsed + bundle.dataRemaining) / 1024).toFixed(2)}GB`
                                : " Unlimited"}
                            </span>
                            {bundle.endDate && (
                              <span>Expires {formatDistanceToNow(new Date(bundle.endDate), { addSuffix: true })}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </DetailsContainer>
            </DetailsSection>
          )}

          <Separator />

          {/* Technical Details Section */}
          {(esimDetails.smdpAddress || esimDetails.matchingId) && (
            <>
              <DetailsSection>
                <DetailsSectionHeader icon={<Shield className="h-5 w-5 text-primary" />} title="Activation Details" />
                <DetailsContainer>
                  {esimDetails.smdpAddress && (
                    <div className="space-y-1">
                      <span className="text-sm text-muted-foreground">SM-DP+ Address</span>
                      <div className="flex items-center gap-2">
                        <code className="text-xs bg-muted p-1 rounded flex-1">
                          {esimDetails.smdpAddress}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => handleCopy(esimDetails.smdpAddress, "SM-DP+ Address")}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                  {esimDetails.matchingId && (
                    <div className="space-y-1">
                      <span className="text-sm text-muted-foreground">Matching ID</span>
                      <div className="flex items-center gap-2">
                        <code className="text-xs bg-muted p-1 rounded flex-1">
                          {esimDetails.matchingId}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => handleCopy(esimDetails.matchingId, "Matching ID")}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                </DetailsContainer>
              </DetailsSection>
              <Separator />
            </>
          )}

          {/* Activity History Section */}
          <DetailsSection>
            <DetailsSectionHeader icon={<Clock className="h-5 w-5 text-primary" />} title="Activity History" />
            <DetailsContainer>
              <div className="space-y-4">
                {esimDetails.lastAction && (
                  <DetailsField
                    icon={<Activity className="h-4 w-4 text-muted-foreground" />}
                    label={esimDetails.lastAction}
                    value={formatDistanceToNow(new Date(esimDetails.actionDate || esimDetails.updatedAt), { addSuffix: true })}
                  />
                )}
                <DetailsField
                  icon={<AlertCircle className="h-4 w-4 text-muted-foreground" />}
                  label="eSIM Created"
                  value={format(new Date(esimDetails.createdAt), "PPpp")}
                />
              </div>
            </DetailsContainer>
          </DetailsSection>
        </div>
      )}
    </DetailsDrawer>
  );
}