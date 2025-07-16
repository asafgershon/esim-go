import type { GetUsersQuery } from "@/__generated__/graphql";
import { RoleSelector } from "@/components/role-selector";
import { GET_USERS } from "@/lib/graphql/queries";
import { useQuery } from "@apollo/client";
import { Avatar, AvatarFallback } from "@workspace/ui/components/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Skeleton } from "@workspace/ui/components/skeleton";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import { formatDistanceToNow } from "date-fns";

export function UsersPage() {
  const { data, loading, error } = useQuery<GetUsersQuery>(GET_USERS);

  if (error) {
    console.error("Error fetching users:", error);
  }

  const users = data?.users || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Users</h1>
        <p className="text-muted-foreground">
          Manage and view all platform users
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>
            A list of all users registered on the platform
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
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
            <div className="p-6">
              <p className="text-sm text-destructive">
                Error loading users: {error.message}
              </p>
            </div>
          ) : users.length === 0 ? (
            <div className="p-6">
              <p className="text-sm text-muted-foreground">No users found</p>
            </div>
          ) : (
            <Table>
              <TableCaption>Total users: {users.length}</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarFallback>
                            {(
                              user.firstName?.[0] || user.email[0]
                            )?.toUpperCase()}
                            {(
                              user.lastName?.[0] || user.email[1]
                            )?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">
                            {user.firstName || user.lastName
                              ? `${user.firstName} ${user.lastName}`.trim()
                              : user.email}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <RoleSelector
                        userId={user.id}
                        currentRole={user.role}
                        userEmail={user.email}
                        userName={
                          user.firstName || user.lastName
                            ? `${user.firstName} ${user.lastName}`.trim()
                            : ""
                        }
                      />
                    </TableCell>
                    <TableCell>{user.phoneNumber || "N/A"}</TableCell>
                    <TableCell>
                      {formatDistanceToNow(new Date(user.createdAt), {
                        addSuffix: true,
                      })}
                    </TableCell>
                    <TableCell>
                      {formatDistanceToNow(new Date(user.updatedAt), {
                        addSuffix: true,
                      })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
