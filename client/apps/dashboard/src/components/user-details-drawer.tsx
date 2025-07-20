import { Avatar, AvatarFallback } from "@workspace/ui/components/avatar";
import { Badge } from "@workspace/ui/components/badge";
import { Separator } from "@workspace/ui/components/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@workspace/ui/components/sheet";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { formatDistanceToNow } from "date-fns";
import { Calendar, Mail, Phone, Shield, User, Package, Clock, ShoppingCart, DollarSign } from "lucide-react";
import { useQuery } from "@apollo/client";
import { GET_USER_ORDERS } from "@/lib/graphql/queries";
import type { GetUserOrdersQuery } from "@/__generated__/graphql";

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
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
        <SheetHeader className="pb-6 px-6">
          <SheetTitle className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="text-xl font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="text-xl font-semibold truncate">{displayName}</div>
              <div className="text-sm text-muted-foreground truncate">{user.email}</div>
              <Badge 
                variant="secondary"
                className={`mt-2 ${getRoleColor(user.role)}`}
              >
                {user.role}
              </Badge>
            </div>
          </SheetTitle>
          <SheetDescription>
            User details and account information
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 px-6 pb-6">
          {/* Basic Information Section */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Basic Information</h3>
            </div>
            <div className="bg-muted/30 rounded-lg p-4 space-y-4">
              <div className="flex items-start gap-3">
                <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-foreground">Full Name</div>
                  <div className="text-sm text-muted-foreground">
                    {user.firstName && user.lastName 
                      ? `${user.firstName} ${user.lastName}`
                      : 'Not provided'
                    }
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-foreground">Email</div>
                  <div className="text-sm text-muted-foreground">{user.email}</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-foreground">Phone Number</div>
                  <div className="text-sm text-muted-foreground">
                    {user.phoneNumber || 'Not provided'}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <Separator />

          {/* Account Details Section */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Account Details</h3>
            </div>
            <div className="bg-muted/30 rounded-lg p-4 space-y-4">
              <div className="flex items-start gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-foreground">Member Since</div>
                  <div className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-foreground">Last Updated</div>
                  <div className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(user.updatedAt), { addSuffix: true })}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-foreground">User ID</div>
                  <div className="text-sm text-muted-foreground font-mono text-xs">{user.id}</div>
                </div>
              </div>
            </div>
          </section>

          <Separator />

          {/* Orders Section */}
          <OrdersSection userId={user.id} />
        </div>
      </SheetContent>
    </Sheet>
  );
}

function OrdersSection({ userId }: { userId: string }) {
  const { data, loading, error } = useQuery<GetUserOrdersQuery>(GET_USER_ORDERS, {
    variables: { userId },
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
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Package className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Orders</h3>
        </div>
        <div className="bg-muted/30 rounded-lg p-4 space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-6 w-16" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Package className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Orders</h3>
        </div>
        <div className="bg-muted/30 rounded-lg p-4">
          <div className="text-center py-4">
            <p className="text-sm text-destructive">Error loading orders: {error.message}</p>
          </div>
        </div>
      </section>
    );
  }

  if (orders.length === 0) {
    return (
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Package className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Orders</h3>
        </div>
        <div className="bg-muted/30 rounded-lg p-4">
          <div className="text-center py-8">
            <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <div className="text-sm font-medium text-foreground">No orders found</div>
            <div className="text-xs text-muted-foreground mt-1">
              This user hasn't placed any orders yet
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <Package className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Orders ({orders.length})</h3>
      </div>
      <div className="bg-muted/30 rounded-lg p-4 space-y-3">
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
              {order.dataPlan && (
                <p className="text-xs text-muted-foreground">
                  {order.dataPlan.name} - {order.dataPlan.region}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}