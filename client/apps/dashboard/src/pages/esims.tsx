import { useState } from "react";
import { useQuery } from "@apollo/client";
import { Badge } from "@workspace/ui/components/badge";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { AdvancedDataTable } from "@workspace/ui/components/advanced-data-table";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, MoreHorizontal, CardSim,Copy, Eye } from "lucide-react";
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
import { PageLayout } from "@/components/common/PageLayout";
import { gql } from "@apollo/client";
import { ESIMDetailsDrawer } from "@/components/esim-details-drawer";
import { toast } from "sonner";

// GraphQL query to get all eSIMs (admin only)
const GET_ALL_ESIMS = gql`
  query GetAllESIMs {
    getAllESIMs {
      id
      iccid
      status
      apiStatus
      userId
      orderId
      customerRef
      assignedDate
      lastAction
      actionDate
      createdAt
      updatedAt
      user {
        id
        email
        firstName
        lastName
      }
      order {
        id
        reference
        bundleName
      }
      usage {
        totalUsed
        totalRemaining
      }
    }
  }
`;

function getStatusColor(status: string): "default" | "secondary" | "destructive" | "outline" {
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
}

type ESIM = {
  id: string;
  iccid: string;
  status: string;
  apiStatus?: string;
  userId: string;
  orderId: string;
  customerRef?: string;
  assignedDate?: string;
  lastAction?: string;
  actionDate?: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
  order?: {
    id: string;
    reference: string;
    bundleName?: string;
  };
  usage?: {
    totalUsed: number;
    totalRemaining?: number;
  };
};

const getColumns = (
  handleESIMClick: (esim: ESIM) => void,
  handleCopyICCID: (iccid: string) => void
): ColumnDef<ESIM>[] => [
  {
    accessorKey: "iccid",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        ICCID
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const esim = row.original;
      return (
        <div className="flex items-center gap-2">
          <code className="text-xs font-mono">{esim.iccid.slice(0, 10)}...</code>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={(e) => {
              e.stopPropagation();
              handleCopyICCID(esim.iccid);
            }}
          >
            <Copy className="h-3 w-3" />
          </Button>
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      const apiStatus = row.original.apiStatus;
      return (
        <div className="space-y-1">
          <Badge variant={getStatusColor(status)}>{status}</Badge>
          {apiStatus && apiStatus !== status && (
            <Badge variant="outline" className="text-xs">
              API: {apiStatus}
            </Badge>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "user",
    header: "Customer",
    cell: ({ row }) => {
      const user = row.original.user;
      if (!user) return <span className="text-muted-foreground">Unknown</span>;
      
      const displayName = user.firstName || user.lastName
        ? `${user.firstName} ${user.lastName}`.trim()
        : user.email || `User ${user.id.slice(0, 8)}`;
      
      return (
        <div>
          <p className="text-sm font-medium">{displayName}</p>
          <p className="text-xs text-muted-foreground">
            {user.email || `ID: ${user.id.slice(0, 8)}...`}
          </p>
        </div>
      );
    },
  },
  {
    accessorKey: "order",
    header: "Order",
    cell: ({ row }) => {
      const order = row.original.order;
      if (!order) return <span className="text-muted-foreground">N/A</span>;
      
      return (
        <div>
          <p className="text-sm font-medium">{order.reference}</p>
          <p className="text-xs text-muted-foreground">{order.bundleName || "Unknown bundle"}</p>
        </div>
      );
    },
  },
  {
    accessorKey: "usage",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Usage
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const usage = row.original.usage;
      if (!usage) return <span className="text-muted-foreground">No data</span>;
      
      const usedGB = (usage.totalUsed / 1024).toFixed(2);
      const totalGB = usage.totalRemaining 
        ? ((usage.totalUsed + usage.totalRemaining) / 1024).toFixed(2)
        : "∞";
      
      return (
        <div className="text-sm">
          <p>{usedGB}GB / {totalGB}GB</p>
          {usage.totalRemaining && (
            <p className="text-xs text-muted-foreground">
              {Math.round((usage.totalUsed / (usage.totalUsed + usage.totalRemaining)) * 100)}% used
            </p>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "assignedDate",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Assigned
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const date = row.original.assignedDate || row.original.createdAt;
      return formatDistanceToNow(new Date(date), { addSuffix: true });
    },
  },
  {
    accessorKey: "lastAction",
    header: "Last Action",
    cell: ({ row }) => {
      const action = row.original.lastAction;
      const actionDate = row.original.actionDate;
      
      if (!action) return <span className="text-muted-foreground">None</span>;
      
      return (
        <div>
          <p className="text-sm">{action}</p>
          {actionDate && (
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(actionDate), { addSuffix: true })}
            </p>
          )}
        </div>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const esim = row.original;

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
            <DropdownMenuItem onClick={() => handleESIMClick(esim)}>
              <Eye className="mr-2 h-4 w-4" />
              View details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleCopyICCID(esim.iccid)}>
              <Copy className="mr-2 h-4 w-4" />
              Copy ICCID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Suspend eSIM</DropdownMenuItem>
            <DropdownMenuItem>Restore eSIM</DropdownMenuItem>
            <DropdownMenuItem className="text-destructive">Cancel eSIM</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

export function ESIMsPage() {
  const { data, loading, error } = useQuery(GET_ALL_ESIMS, {
    onError: (err) => {
      console.error('GraphQL Error:', err);
    },
    onCompleted: (data) => {
      console.log('Data received:', data);
    }
  });

  const [selectedESIM, setSelectedESIM] = useState<ESIM | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleESIMClick = (esim: ESIM) => {
    setSelectedESIM(esim);
    setDrawerOpen(true);
  };

  const handleCopyICCID = (iccid: string) => {
    navigator.clipboard.writeText(iccid);
    toast.success("ICCID copied to clipboard");
  };

  const esims = data?.getAllESIMs || [];

  // Custom search function to search across multiple fields
  const searchableESIMs = esims.map((esim: ESIM) => ({
    ...esim,
    searchableText: `${esim.iccid} ${esim.status} ${esim.user?.email || ""} ${esim.user?.id || ""} ${esim.user?.firstName || ""} ${esim.user?.lastName || ""} ${esim.order?.reference || ""} ${esim.customerRef || ""}`.toLowerCase(),
  }));

  return (
    <PageLayout.Container>
      <PageLayout.Header
        title="eSIM Management"
        subtitle="eSIMs"
        description="View and manage all platform eSIMs"
        icon={<CardSim className="h-6 w-6" />}
      />

      <PageLayout.Content>
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-12 w-12 rounded-full" />
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
              Error loading eSIMs: {error.message}
            </p>
          </div>
        ) : (
          <AdvancedDataTable
            columns={getColumns(handleESIMClick, handleCopyICCID)}
            data={searchableESIMs}
            searchKey="searchableText"
            searchPlaceholder="Search by ICCID, customer, order..."
            enableSorting={true}
            enableFiltering={true}
            enablePagination={true}
            initialPageSize={10}
          />
        )}

        {selectedESIM && (
          <ESIMDetailsDrawer
            esim={selectedESIM}
            open={drawerOpen}
            onOpenChange={setDrawerOpen}
          />
        )}
      </PageLayout.Content>
    </PageLayout.Container>
  );
}