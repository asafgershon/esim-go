import { Badge } from "@workspace/ui/components/badge";
import { Separator } from "@workspace/ui/components/separator";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { formatDistanceToNow } from "date-fns";
import { 
  Calendar, 
  Mail, 
  Phone, 
  Shield, 
  User, 
  Package, 
  Clock, 
  ShoppingCart, 
  DollarSign, 
  CardSim, 
  Activity, 
  Wifi,
  Hash 
} from "lucide-react";
import { useQuery, gql } from "@apollo/client";
import { GET_USER_ORDERS } from "@/lib/graphql/queries";
import type { GetUserOrdersQuery } from "@/__generated__/graphql";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@workspace/ui/components/tabs";
import { Progress } from "@workspace/ui/components/progress";
import {
  DetailsDrawer,
  DetailsSection,
  DetailsSectionHeader,
  DetailsField,
  DetailsContainer,
  DetailsHeaderWithAvatar,
} from "./common/DetailsDrawer";

const GET_CUSTOMER_ESIMS = gql`
  query GetCustomerESIMs($userId: ID!) {
    getCustomerESIMs(userId: $userId) {
      id
      iccid
      status
      apiStatus
      customerRef
      assignedDate
      lastAction
      actionDate
      createdAt
      usage {
        totalUsed
        totalRemaining
      }
      esim_bundles
    }
  }
`;

type User = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string | null | undefined;
  role: string;
  createdAt: string;
  updatedAt: string;
};

interface UserDetailsDrawerProps {
  user: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserDetailsDrawer({ user, open, onOpenChange }: UserDetailsDrawerProps) {
  const { data: esimsData, loading: esimsLoading } = useQuery(GET_CUSTOMER_ESIMS, {
    variables: { userId: user?.id || "" },
    skip: !user || !open,
  });

  if (!user) return null;

  const displayName = user.firstName || user.lastName 
    ? `${user.firstName} ${user.lastName}`.trim()
    : user.email;

  const initials = user.firstName && user.lastName
    ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    : user.email.slice(0, 2).toUpperCase();

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'partner':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <DetailsDrawer
      open={open}
      onOpenChange={onOpenChange}
      title="User Details"
      description="User details and account information"
    >
      <DetailsHeaderWithAvatar
        initials={initials}
        title={displayName}
        subtitle={user.email}
        badge={
          <Badge 
            variant="secondary"
            className={`mt-2 ${getRoleColor(user.role)}`}
          >
            {user.role}
          </Badge>
        }
      />

      <Tabs defaultValue="info">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="info">Info</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="esims">eSIMs</TabsTrigger>
        </TabsList>
        
        <TabsContent value="info" className="space-y-6 mt-6">
          {/* Basic Information Section */}
          <DetailsSection>
            <DetailsSectionHeader 
              icon={<User className="h-5 w-5 text-primary" />} 
              title="Basic Information" 
            />
            <DetailsContainer>
              <DetailsField
                icon={<User className="h-4 w-4 text-muted-foreground" />}
                label="Full Name"
                value={
                  user.firstName && user.lastName 
                    ? `${user.firstName} ${user.lastName}`
                    : 'Not provided'
                }
              />
              <DetailsField
                icon={<Mail className="h-4 w-4 text-muted-foreground" />}
                label="Email"
                value={user.email}
              />
              <DetailsField
                icon={<Phone className="h-4 w-4 text-muted-foreground" />}
                label="Phone Number"
                value={user.phoneNumber || 'Not provided'}
              />
            </DetailsContainer>
          </DetailsSection>

          <Separator />

          {/* Account Details Section */}
          <DetailsSection>
            <DetailsSectionHeader 
              icon={<Shield className="h-5 w-5 text-primary" />} 
              title="Account Details" 
            />
            <DetailsContainer>
              <DetailsField
                icon={<Calendar className="h-4 w-4 text-muted-foreground" />}
                label="Member Since"
                value={formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}
              />
              <DetailsField
                icon={<Clock className="h-4 w-4 text-muted-foreground" />}
                label="Last Updated"
                value={formatDistanceToNow(new Date(user.updatedAt), { addSuffix: true })}
              />
              <DetailsField
                icon={<User className="h-4 w-4 text-muted-foreground" />}
                label="User ID"
                value={<code className="text-xs">{user.id}</code>}
              />
            </DetailsContainer>
          </DetailsSection>
        </TabsContent>

        <TabsContent value="orders" className="mt-6">
          <OrdersSection userId={user.id} />
        </TabsContent>

        <TabsContent value="esims" className="mt-6">
          <ESIMsSection userId={user.id} esims={esimsData?.getCustomerESIMs} loading={esimsLoading} />
        </TabsContent>
      </Tabs>
    </DetailsDrawer>
  );
}

function OrdersSection({ userId }: { userId: string }) {
  const { data, loading, error } = useQuery<GetUserOrdersQuery>(GET_USER_ORDERS, {
    variables: { userId },
    skip: !userId,
  });

  const orders = data?.getUserOrders || [];

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'processing':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'refunded':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <DetailsSection>
        <DetailsSectionHeader 
          icon={<Package className="h-5 w-5 text-primary" />} 
          title="Orders" 
        />
        <DetailsContainer>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-6 w-16" />
            </div>
          ))}
        </DetailsContainer>
      </DetailsSection>
    );
  }

  if (error) {
    return (
      <DetailsSection>
        <DetailsSectionHeader 
          icon={<Package className="h-5 w-5 text-primary" />} 
          title="Orders" 
        />
        <DetailsContainer>
          <div className="text-center py-4">
            <p className="text-sm text-destructive">Error loading orders: {error.message}</p>
          </div>
        </DetailsContainer>
      </DetailsSection>
    );
  }

  if (orders.length === 0) {
    return (
      <DetailsSection>
        <DetailsSectionHeader 
          icon={<Package className="h-5 w-5 text-primary" />} 
          title="Orders" 
        />
        <DetailsContainer>
          <div className="text-center py-8">
            <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <div className="text-sm font-medium text-foreground">No orders found</div>
            <div className="text-xs text-muted-foreground mt-1">
              This user hasn't placed any orders yet
            </div>
          </div>
        </DetailsContainer>
      </DetailsSection>
    );
  }

  return (
    <DetailsSection>
      <DetailsSectionHeader 
        icon={<Package className="h-5 w-5 text-primary" />} 
        title={`Orders (${orders.length})`} 
      />
      <DetailsContainer>
        {orders.map((order) => (
          <div key={order.id} className="flex items-center justify-between p-3 bg-background rounded-lg border">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-foreground">#{order.reference}</p>
                <Badge 
                  variant="secondary"
                  className={getStatusColor(order.status)}
                >
                  {order.status}
                </Badge>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Package className="h-3 w-3" />
                  <span>Qty: {order.quantity}</span>
                </div>
                <div className="flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  <span>${order.totalPrice}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })}</span>
                </div>
              </div>
              {order.bundleName && (
                <p className="text-xs text-muted-foreground">
                  {order.bundleName}
                </p>
              )}
            </div>
          </div>
        ))}
      </DetailsContainer>
    </DetailsSection>
  );
}

function ESIMsSection({ userId, esims, loading }: { userId: string; esims?: any[]; loading: boolean }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'ASSIGNED':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'SUSPENDED':
      case 'EXPIRED':
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <DetailsSection>
        <DetailsSectionHeader 
          icon={<CardSim className="h-5 w-5 text-primary" />} 
          title="eSIMs" 
        />
        <DetailsContainer>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-6 w-16" />
            </div>
          ))}
        </DetailsContainer>
      </DetailsSection>
    );
  }

  if (!esims || esims.length === 0) {
    return (
      <DetailsSection>
        <DetailsSectionHeader 
          icon={<CardSim className="h-5 w-5 text-primary" />} 
          title="eSIMs" 
        />
        <DetailsContainer>
          <div className="text-center py-8">
            <CardSim className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <div className="text-sm font-medium text-foreground">No eSIMs found</div>
            <div className="text-xs text-muted-foreground mt-1">
              This user hasn't activated any eSIMs yet
            </div>
          </div>
        </DetailsContainer>
      </DetailsSection>
    );
  }

  return (
    <DetailsSection>
      <DetailsSectionHeader 
        icon={<CardSim className="h-5 w-5 text-primary" />} 
        title={`eSIMs (${esims.length})`} 
      />
      <DetailsContainer>
        {esims.map((esim) => (
          <div key={esim.id} className="flex items-center justify-between p-3 bg-background rounded-lg border">
            <div className="space-y-1 flex-1">
              <div className="flex items-center gap-2">
                <code className="text-xs font-mono">{esim.iccid.slice(0, 10)}...</code>
                <Badge 
                  variant="secondary"
                  className={getStatusColor(esim.status)}
                >
                  {esim.status}
                </Badge>
                {esim.apiStatus && esim.apiStatus !== esim.status && (
                  <Badge variant="outline" className="text-xs">
                    API: {esim.apiStatus}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                {esim.usage && (
                  <div className="flex items-center gap-1">
                    <Wifi className="h-3 w-3" />
                    <span>
                      {(esim.usage.totalUsed / 1024).toFixed(2)}GB /
                      {esim.usage.totalRemaining 
                        ? ` ${((esim.usage.totalUsed + esim.usage.totalRemaining) / 1024).toFixed(2)}GB`
                        : ' Unlimited'}
                    </span>
                  </div>
                )}
                {esim.lastAction && (
                  <div className="flex items-center gap-1">
                    <Activity className="h-3 w-3" />
                    <span>{esim.lastAction}</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{formatDistanceToNow(new Date(esim.assignedDate || esim.createdAt), { addSuffix: true })}</span>
                </div>
              </div>
              {esim.customerRef && (
                <p className="text-xs text-muted-foreground">
                  Ref: {esim.customerRef}
                </p>
              )}
            </div>
            {esim.usage && esim.usage.totalRemaining && (
              <div className="ml-4">
                <Progress 
                  value={(esim.usage.totalUsed / (esim.usage.totalUsed + esim.usage.totalRemaining)) * 100} 
                  className="h-2 w-20"
                />
              </div>
            )}
          </div>
        ))}
      </DetailsContainer>
    </DetailsSection>
  );
}