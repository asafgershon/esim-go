import React from "react";
import type { GetUsersQuery } from "@/__generated__/graphql";
import { GET_USERS, DELETE_USER, UPDATE_USER_ROLE } from "@/lib/graphql/queries";
import { useQuery, useMutation } from "@apollo/client";
import { Avatar, AvatarFallback } from "@workspace/ui/components/avatar";
import { Badge } from "@workspace/ui/components/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { Label } from "@workspace/ui/components/label";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { AdvancedDataTable } from "@workspace/ui/components/advanced-data-table";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, MoreHorizontal, Package } from "lucide-react";
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
import { InviteAdminDialog } from "@/components/invite-admin-dialog";
import { UserDetailsDrawer } from "@/components/user-details-drawer";
import { AssignESimModal } from "@/components/assign-esim-modal";

type User = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string | null | undefined;
  role: string;
  createdAt: string;
  updatedAt: string;
  orderCount?: number;
};

const createColumns = (
  handleDeleteUser: (userId: string, userEmail: string) => void,
  handleOpenUserDetails: (user: User) => void,
  handleAssignESim: (user: User) => void,
  handleRoleChange: (userId: string, newRole: string) => void
): ColumnDef<User>[] => [
  {
    accessorKey: "email",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          User
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const user = row.original;
      return (
        <div 
          className="flex items-center space-x-3 cursor-pointer hover:bg-muted/50 -mx-2 px-2 py-1 rounded"
          onClick={() => handleOpenUserDetails(user)}
        >
          <Avatar>
            <AvatarFallback>
              {(user.firstName?.[0] || user.email[0])?.toUpperCase()}
              {(user.lastName?.[0] || user.email[1])?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium">
              {user.firstName || user.lastName
                ? `${user.firstName} ${user.lastName}`.trim()
                : user.email}
            </p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "role",
    header: "Role",
    cell: ({ row }) => {
      const user = row.original;
      
      // Role configuration
      const ROLES = [
        { value: 'USER', label: 'User', variant: 'outline' as const },
        { value: 'PARTNER', label: 'Partner', variant: 'secondary' as const },
        { value: 'ADMIN', label: 'Admin', variant: 'default' as const },
      ];
      
      const currentRoleConfig = ROLES.find(role => role.value === user.role) || ROLES[0];
      
      return (
        <div className="w-32">
          <Label htmlFor={`${user.id}-role`} className="sr-only">
            Role
          </Label>
          <Select
            value={user.role}
            onValueChange={(newRole) => {
              if (newRole !== user.role) {
                // Handle role change with confirmation
                const confirmed = window.confirm(
                  `Change ${user.firstName || user.email}'s role to ${ROLES.find(r => r.value === newRole)?.label}?`
                );
                                 if (confirmed) {
                   handleRoleChange(user.id, newRole);
                 }
              }
            }}
          >
            <SelectTrigger 
              className="h-8 border-transparent bg-transparent hover:bg-muted/50 focus:bg-background focus:border-border"
              id={`${user.id}-role`}
            >
              <SelectValue>
                <Badge variant={currentRoleConfig.variant} className="text-xs">
                  {currentRoleConfig.label}
                </Badge>
              </SelectValue>
            </SelectTrigger>
            <SelectContent align="end">
              {ROLES.map((role) => (
                <SelectItem key={role.value} value={role.value}>
                  <Badge variant={role.variant} className="text-xs">
                    {role.label}
                  </Badge>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );
    },
  },
  {
    accessorKey: "phoneNumber",
    header: "Phone",
    cell: ({ row }) => {
      const phoneNumber = row.getValue("phoneNumber") as string | null | undefined;
      return phoneNumber || "N/A";
    },
  },
  {
    accessorKey: "orderCount",
    header: "Orders",
    cell: ({ row }) => {
      const user = row.original;
      return (
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">{user.orderCount || 0}</span>
        </div>
      );
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
    accessorKey: "updatedAt",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Updated
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const updatedAt = row.getValue("updatedAt") as string;
      return formatDistanceToNow(new Date(updatedAt), { addSuffix: true });
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const user = row.original;

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
              onClick={() => navigator.clipboard.writeText(user.id)}
            >
              Copy user ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleAssignESim(user)}>
              Assign ESim
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => {
                // Navigate to orders page with user filter
                const ordersUrl = `/orders?user=${user.id}`;
                window.open(ordersUrl, '_blank');
              }}
            >
              View Orders ({user.orderCount})
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="text-destructive"
              onClick={() => handleDeleteUser(user.id, user.email)}
            >
              Delete user
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

export function UsersPage() {
  const { data, loading, error, refetch } = useQuery<GetUsersQuery>(GET_USERS);
  const [deleteUser] = useMutation(DELETE_USER);
  const [updateUserRole] = useMutation(UPDATE_USER_ROLE, {
    refetchQueries: [{ query: GET_USERS }],
    onCompleted: (data) => {
      if (data.updateUserRole) {
        console.log(`Successfully updated user role to ${data.updateUserRole.role}`);
      }
    },
    onError: (error) => {
      console.error('Error updating user role:', error.message);
      alert(`Error: ${error.message}`);
    },
  });
  const [selectedUser, setSelectedUser] = React.useState<User | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);
  const [assignModalUser, setAssignModalUser] = React.useState<User | null>(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = React.useState(false);

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete user "${userEmail}"? This action cannot be undone.`
    );
    
    if (!confirmed) return;

    try {
      const result = await deleteUser({
        variables: { userId },
      });

      if (result.data?.deleteUser.success) {
        await refetch();
      } else {
        alert(`Error deleting user: ${result.data?.deleteUser.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Error deleting user:', err);
      alert('An error occurred while deleting the user');
    }
  };

  const handleOpenUserDetails = (user: User) => {
    setSelectedUser(user);
    setIsDrawerOpen(true);
  };

  const handleAssignESim = (user: User) => {
    setAssignModalUser(user);
    setIsAssignModalOpen(true);
  };

  const handleRoleChange = (userId: string, newRole: string) => {
    updateUserRole({
      variables: {
        userId,
        role: newRole,
      },
    });
  };

  const columns = createColumns(handleDeleteUser, handleOpenUserDetails, handleAssignESim, handleRoleChange);

  if (error) {
    console.error("Error fetching users:", error);
  }

  const users = data?.users || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Users</h1>
          <p className="text-muted-foreground">
            Manage and view all platform users
          </p>
        </div>
        <InviteAdminDialog />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>
            A list of all users registered on the platform
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-4 w-[200px]" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center">
              <p className="text-sm text-destructive">
                Error loading users: {error.message}
              </p>
            </div>
          ) : (
            <AdvancedDataTable 
              columns={columns} 
              data={users} 
              searchKey="email"
              searchPlaceholder="Search users..."
              enableSorting={true}
              enableFiltering={true}
              enablePagination={true}
              initialPageSize={10}
            />
          )}
        </CardContent>
      </Card>
      
      <UserDetailsDrawer 
        user={selectedUser}
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
      />
      
      <AssignESimModal
        user={assignModalUser}
        open={isAssignModalOpen}
        onOpenChange={setIsAssignModalOpen}
      />
    </div>
  );
}
