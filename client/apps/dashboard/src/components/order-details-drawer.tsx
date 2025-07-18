import { Avatar, AvatarFallback } from "@workspace/ui/components/avatar";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Separator } from "@workspace/ui/components/separator";
import { formatDistanceToNow } from "date-fns";
import { 
  Calendar, 
  Mail, 
  Phone, 
  User, 
  Package, 
  Clock, 
  ShoppingCart, 
  DollarSign, 
  MapPin, 
  Hash,
  Copy,
  ExternalLink
} from "lucide-react";
import { useQuery } from "@apollo/client";
import { GET_ORDERS } from "@/lib/graphql/queries";
import type { GetOrdersQuery } from "@/__generated__/graphql";
import { DetailsDrawer, DetailsSection, DetailsRow } from "./details-drawer";

type Order = {
  id: string;
  reference: string;
  status: string;
  quantity: number;
  totalPrice: number;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string | null;
    role: string;
  } | null;
  dataPlan?: {
    id: string;
    name: string;
    description: string;
    region: string;
    duration: number;
    price: number;
    currency: string;
  } | null;
};

interface OrderDetailsDrawerProps {
  orderId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OrderDetailsDrawer({ orderId, open, onOpenChange }: OrderDetailsDrawerProps) {
  const { data, loading, error } = useQuery<GetOrdersQuery>(GET_ORDERS, {
    skip: !orderId,
  });

  const order = data?.orders?.find(o => o.id === orderId) || null;

  if (!orderId) return null;

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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const title = (
    <div className="flex items-center gap-2">
      <Package className="h-5 w-5" />
      Order Details
    </div>
  );

  const description = order 
    ? `View comprehensive details for order ${order.reference}`
    : (error ? "Error loading order details" : "Order not found");

  const errorMessage = error 
    ? "Please try again later" 
    : "The requested order could not be found";

  const user = order.user;
  const dataPlan = order.dataPlan;

  const userDisplayName = user 
    ? (user.firstName || user.lastName 
        ? `${user.firstName} ${user.lastName}`.trim()
        : user.email)
    : "Unknown User";

  const userInitials = user 
    ? (user.firstName && user.lastName
        ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
        : user.email.slice(0, 2).toUpperCase())
    : "?";

  return (
    <DetailsDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      loading={loading}
      error={error || !order}
      errorMessage={errorMessage}
    >
          {/* Order Overview */}
          <DetailsSection
            icon={<ShoppingCart className="h-5 w-5 text-primary" />}
            title="Order Overview"
          >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Hash className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Reference</span>
                </div>
                <div className="flex items-center gap-2">
                  <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                    {order.reference}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(order.reference)}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Status</span>
                </div>
                <Badge className={getStatusColor(order.status)} variant="outline">
                  {order.status}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Total</span>
                </div>
                <span className="text-sm font-semibold">
                  ${order.totalPrice.toFixed(2)} {dataPlan?.currency || ''}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Quantity</span>
                </div>
                <span className="text-sm">{order.quantity}</span>
              </div>
            </div>
          </section>

          <Separator />

          {/* Customer Information */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Customer</h3>
            </div>
            <div className="bg-muted/30 rounded-lg p-4">
              {user ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>{userInitials}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{userDisplayName}</div>
                      <div className="text-sm text-muted-foreground">{user.email}</div>
                    </div>
                  </div>
                  
                  {user.phoneNumber && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{user.phoneNumber}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {user.role}
                    </Badge>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>?</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">Unknown User</div>
                    <div className="text-sm text-muted-foreground">User not found</div>
                  </div>
                </div>
              )}
            </div>
          </section>

          <Separator />

          {/* Data Plan Details */}
          {dataPlan && (
            <>
              <section className="space-y-4">
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">Data Plan</h3>
                </div>
                <div className="bg-muted/30 rounded-lg p-4 space-y-4">
                  <div>
                    <div className="font-medium">{dataPlan.name}</div>
                    <div className="text-sm text-muted-foreground">{dataPlan.description}</div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm font-medium">Duration</div>
                      <div className="text-sm text-muted-foreground">{dataPlan.duration} days</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium">Price</div>
                      <div className="text-sm text-muted-foreground">
                        ${dataPlan.price.toFixed(2)} {dataPlan.currency}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{dataPlan.region}</span>
                  </div>
                </div>
              </section>

              <Separator />
            </>
          )}

          {/* Order Timeline */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Timeline</h3>
            </div>
            <div className="bg-muted/30 rounded-lg p-4 space-y-4">
              <div className="flex items-start gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <div className="text-sm font-medium">Order Created</div>
                  <div className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <div className="text-sm font-medium">Last Updated</div>
                  <div className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(order.updatedAt), { addSuffix: true })}
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}