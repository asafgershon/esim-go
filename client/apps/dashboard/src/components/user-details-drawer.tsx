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
import { formatDistanceToNow } from "date-fns";
import { Calendar, Mail, Phone, Shield, User, Package, Clock } from "lucide-react";

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
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Orders</h3>
            </div>
            <div className="bg-muted/30 rounded-lg p-4">
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <div className="text-sm font-medium text-foreground">No orders available</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Order history functionality will be implemented soon
                </div>
              </div>
            </div>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}