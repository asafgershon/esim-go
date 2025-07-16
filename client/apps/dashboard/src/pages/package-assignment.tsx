import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { GET_USERS } from "@/lib/graphql/queries";
import { GET_DATA_PLANS, ASSIGN_PACKAGE_TO_USER } from "@/lib/graphql/queries";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { Avatar, AvatarFallback } from "@workspace/ui/components/avatar";
import { Search, Package, User, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import type { GetUsersQuery, GetDataPlansQuery } from "@/__generated__/graphql";

type User = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string | null;
  role: string;
};

type DataPlan = {
  id: string;
  name: string;
  description: string;
  region: string;
  duration: number;
  price: number;
  currency: string;
  isUnlimited: boolean;
  bundleGroup?: string;
};

export function PackageAssignmentPage() {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<DataPlan | null>(null);
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [planSearchTerm, setPlanSearchTerm] = useState("");
  const [debouncedPlanSearchTerm, setDebouncedPlanSearchTerm] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);

  // Debounce plan search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedPlanSearchTerm(planSearchTerm);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [planSearchTerm]);

  const { data: usersData, loading: usersLoading } = useQuery<GetUsersQuery>(GET_USERS);
  
  // Use search filter for plans
  const planFilter = useMemo(() => {
    return debouncedPlanSearchTerm.trim() ? { search: debouncedPlanSearchTerm } : {};
  }, [debouncedPlanSearchTerm]);
  
  const { data: plansData, loading: plansLoading } = useQuery<GetDataPlansQuery>(GET_DATA_PLANS, {
    variables: { filter: planFilter },
  });

  const [assignPackage] = useMutation(ASSIGN_PACKAGE_TO_USER);

  const users = usersData?.users || [];
  const plans = plansData?.dataPlans || [];

  // Keep client-side filtering for users (smaller dataset)
  const filteredUsers = users.filter(
    (user) =>
      user.email.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
      `${user.firstName} ${user.lastName}`.toLowerCase().includes(userSearchTerm.toLowerCase())
  );

  // Use plans directly from API (server-side filtered)
  const filteredPlans = plans;

  const handleAssignPackage = async () => {
    if (!selectedUser || !selectedPlan) {
      toast.error("Please select both a user and a package");
      return;
    }

    setIsAssigning(true);
    try {
      const result = await assignPackage({
        variables: {
          userId: selectedUser.id,
          planId: selectedPlan.id,
        },
      });

      if (result.data?.assignPackageToUser?.success) {
        toast.success(`Package "${selectedPlan.name}" assigned to ${selectedUser.email}`);
        setSelectedUser(null);
        setSelectedPlan(null);
        setUserSearchTerm("");
        setPlanSearchTerm("");
      } else {
        toast.error(result.data?.assignPackageToUser?.error || "Failed to assign package");
      }
    } catch (error) {
      console.error("Error assigning package:", error);
      toast.error("Failed to assign package");
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Package Assignment</h1>
        <p className="text-muted-foreground">
          Assign eSIM packages from our catalog to specific customers
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* User Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Select Customer
            </CardTitle>
            <CardDescription>
              Choose the customer who will receive the eSIM package
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search customers by email or name..."
                value={userSearchTerm}
                onChange={(e) => setUserSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {usersLoading ? (
                <div className="text-center py-4">Loading customers...</div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  No customers found
                </div>
              ) : (
                filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedUser?.id === user.id
                        ? "border-primary bg-primary/5"
                        : "hover:bg-muted/50"
                    }`}
                    onClick={() => setSelectedUser(user)}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">
                        {(user.firstName?.[0] || user.email[0])?.toUpperCase()}
                        {(user.lastName?.[0] || user.email[1])?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {user.firstName || user.lastName
                          ? `${user.firstName} ${user.lastName}`.trim()
                          : user.email}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {user.email}
                      </p>
                    </div>
                    {selectedUser?.id === user.id && (
                      <CheckCircle className="h-4 w-4 text-primary" />
                    )}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Package Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Select Package
            </CardTitle>
            <CardDescription>
              Choose an eSIM package from our catalog
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search packages by name or region..."
                value={planSearchTerm}
                onChange={(e) => setPlanSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {plansLoading ? (
                <div className="text-center py-4">Loading packages...</div>
              ) : filteredPlans.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  No packages found
                </div>
              ) : (
                filteredPlans.map((plan) => (
                  <div
                    key={plan.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedPlan?.id === plan.id
                        ? "border-primary bg-primary/5"
                        : "hover:bg-muted/50"
                    }`}
                    onClick={() => setSelectedPlan(plan)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="text-sm font-medium">{plan.name}</h4>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {plan.description}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs bg-secondary px-2 py-1 rounded">
                            {plan.region}
                          </span>
                          <span className="text-xs bg-secondary px-2 py-1 rounded">
                            {plan.duration} days
                          </span>
                          {plan.isUnlimited && (
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                              Unlimited
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">
                          {plan.price} {plan.currency}
                        </p>
                        {selectedPlan?.id === plan.id && (
                          <CheckCircle className="h-4 w-4 text-primary ml-auto mt-1" />
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Assignment Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Assignment Summary</CardTitle>
          <CardDescription>
            Review the assignment details before confirming
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Selected Customer</Label>
                {selectedUser ? (
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">
                        {(selectedUser.firstName?.[0] || selectedUser.email[0])?.toUpperCase()}
                        {(selectedUser.lastName?.[0] || selectedUser.email[1])?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">
                        {selectedUser.firstName || selectedUser.lastName
                          ? `${selectedUser.firstName} ${selectedUser.lastName}`.trim()
                          : selectedUser.email}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {selectedUser.email}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg text-muted-foreground">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm">No customer selected</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Selected Package</Label>
                {selectedPlan ? (
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <h4 className="text-sm font-medium">{selectedPlan.name}</h4>
                    <p className="text-xs text-muted-foreground">
                      {selectedPlan.region} • {selectedPlan.duration} days • {selectedPlan.price} {selectedPlan.currency}
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg text-muted-foreground">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm">No package selected</span>
                  </div>
                )}
              </div>
            </div>

            <Button
              onClick={handleAssignPackage}
              disabled={!selectedUser || !selectedPlan || isAssigning}
              className="w-full"
            >
              {isAssigning ? "Assigning..." : "Assign Package"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}