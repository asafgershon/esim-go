import { GET_ORDERS } from "@/lib/graphql/queries";
import { useQuery } from "@apollo/client";
import { Badge } from "@workspace/ui/components/badge";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { AdvancedDataTable } from "@workspace/ui/components/advanced-data-table";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, MoreHorizontal } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback } from "@workspace/ui/components/avatar";
import { OrderDetailsDrawer } from "@/components/order-details-drawer";
import { useState } from "react";
import { PageLayout } from "@/components/common/PageLayout";
import { Package } from "lucide-react";

function getStatusColor(
  status: string
): "default" | "secondary" | "destructive" | "outline" {
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
}

type Order = {
  id: string;
  reference: string;
  status: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string | null;
    role: string;
  } | null;
  bundleId?: string | null;
  bundleName?: string | null;
  quantity: number;
  totalPrice: number;
  createdAt: string;
  updatedAt: string;
};

const getColumns = (handleOrderClick: (orderId: string) => void): ColumnDef<Order>[] => [
  {
    accessorKey: "reference",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Order
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const order = row.original;
      return (
        <div 
          className="cursor-pointer hover:bg-muted/50 p-2 -m-2 rounded"
          onClick={() => handleOrderClick(order.id)}
        >
          <p className="text-sm font-medium">{order.reference}</p>
          <p className="text-xs text-muted-foreground">{order.id}</p>
        </div>
      );
    },
  },
  {
    accessorKey: "user",
    header: "Customer",
    cell: ({ row }) => {
      const order = row.original;
      const user = order.user;
      
      if (!user) {
        return (
          <div className="flex items-center space-x-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs">
                ?
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">Unknown User</p>
              <p className="text-xs text-muted-foreground">User not found</p>
            </div>
          </div>
        );
      }
      
      const displayName = user.firstName || user.lastName
        ? `${user.firstName} ${user.lastName}`.trim()
        : user.email;
      const initials = user.firstName && user.lastName
        ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
        : user.email.slice(0, 2).toUpperCase();
      
      return (
        <div className="flex items-center space-x-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium">{displayName}</p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "dataPlan",
    header: "Plan",
    cell: ({ row }) => {
      const order = row.original;
      return (
        <div>
          <p className="text-sm font-medium">{order.bundleName || 'N/A'}</p>
          <p className="text-xs text-muted-foreground">
            Bundle ID: {order.bundleId || 'N/A'}
          </p>
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      return <Badge variant={getStatusColor(status)}>{status}</Badge>;
    },
  },
  {
    accessorKey: "quantity",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Quantity
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },
  {
    accessorKey: "totalPrice",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Total
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const order = row.original;
      return `$${order.totalPrice.toFixed(2)}`;
    },
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Created
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const createdAt = row.getValue("createdAt") as string;
      return formatDistanceToNow(new Date(createdAt), { addSuffix: true });
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const order = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(order.id)}
            >
              Copy order ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleOrderClick(order.id)}>
              View order details
            </DropdownMenuItem>
            {order.user && (
              <>
                <DropdownMenuItem
                  onClick={() => navigator.clipboard.writeText(order.user?.email || '')}
                >
                  Copy customer email
                </DropdownMenuItem>
                <DropdownMenuItem>View customer profile</DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

export function OrdersPage() {
  const { data, loading, error } = useQuery(GET_ORDERS);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  if (error) {
    console.error("Error fetching orders:", error);
  }

  const orders = data?.orders || [];

  const handleOrderClick = (orderId: string) => {
    setSelectedOrderId(orderId);
    setDrawerOpen(true);
  };
  
  // Custom search function to search across multiple fields
  const searchableOrders = orders.map((order: any) => ({
    ...order,
    searchableText: `${order.reference} ${order.user?.email || ''} ${order.user?.firstName || ''} ${order.user?.lastName || ''} ${order.bundleName || ''} ${order.status}`.toLowerCase()
  }));

  return (
    <PageLayout.Container>
      <PageLayout.Header
        title="Orders Management"
        subtitle="Orders"
        description="Manage and view all platform orders"
        icon={<Package className="h-6 w-6" />}
      />
      
      <PageLayout.Content>
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[200px]" />
                  <Skeleton className="h-4 w-[150px]" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center">
            <p className="text-sm text-destructive">
              Error loading orders: {error.message}
            </p>
          </div>
        ) : (
          <AdvancedDataTable 
            columns={getColumns(handleOrderClick)} 
            data={searchableOrders} 
            searchKey="searchableText"
            searchPlaceholder="Search orders or customers..."
            enableSorting={true}
            enableFiltering={true}
            enablePagination={true}
            initialPageSize={10}
          />
        )}

        <OrderDetailsDrawer
          orderId={selectedOrderId}
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
        />
      </PageLayout.Content>
    </PageLayout.Container>
  );
}
