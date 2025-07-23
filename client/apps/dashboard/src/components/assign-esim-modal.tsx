import React, { useEffect, useMemo, useState } from "react";
import type { GetCatalogBundlesQuery } from "@/__generated__/graphql";
import { ASSIGN_PACKAGE_TO_USER, GET_CATALOG_BUNDLES } from "@/lib/graphql/queries";
import { useMutation, useQuery } from "@apollo/client";
import { Avatar, AvatarFallback } from "@workspace/ui/components/avatar";
import { Button } from "@workspace/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Separator } from "@workspace/ui/components/separator";
import { AlertCircle, CheckCircle, Package, Search, User } from "lucide-react";
import { toast } from "sonner";

type User = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string | null;
  role: string;
};

type CatalogBundle = {
  id: string;
  esimGoName: string;
  description: string;
  regions: string[];
  duration: number;
  priceCents: number;
  currency: string;
  unlimited: boolean;
  bundleGroup?: string;
};

interface AssignESimModalProps {
  user: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AssignESimModal({ user, open, onOpenChange }: AssignESimModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<CatalogBundle | null>(null);
  const [planSearchTerm, setPlanSearchTerm] = useState("");
  const [debouncedPlanSearchTerm, setDebouncedPlanSearchTerm] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setSelectedPlan(null);
      setPlanSearchTerm("");
      setDebouncedPlanSearchTerm("");
      setIsAssigning(false);
    }
  }, [open]);

  // Debounce plan search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedPlanSearchTerm(planSearchTerm);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [planSearchTerm]);

  // Use search filter for plans
  const planFilter = useMemo(() => {
    return debouncedPlanSearchTerm.trim() ? { search: debouncedPlanSearchTerm } : {};
  }, [debouncedPlanSearchTerm]);
  
  const { data: plansData, loading: plansLoading } = useQuery<GetCatalogBundlesQuery>(GET_CATALOG_BUNDLES, {
    variables: { criteria: planFilter },
    skip: !open, // Only fetch when modal is open
  });

  const [assignPackage] = useMutation(ASSIGN_PACKAGE_TO_USER);

  const plans = plansData?.catalogBundles?.bundles || [];

  const handleAssignPackage = async () => {
    if (!user || !selectedPlan) {
      toast.error("Please select a package");
      return;
    }

    setIsAssigning(true);
    try {
      const result = await assignPackage({
        variables: {
          userId: user.id,
          planId: selectedPlan.esimGoName, // Use the eSIM Go bundle name as the plan ID
        },
      });

      if (result.data?.assignPackageToUser?.success) {
        toast.success(`Package "${selectedPlan.esimGoName}" assigned to ${user.email}`);
        onOpenChange(false);
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

  if (!user) return null;

  const displayName = user.firstName || user.lastName 
    ? `${user.firstName} ${user.lastName}`.trim()
    : user.email;

  const initials = user.firstName && user.lastName
    ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    : user.email.slice(0, 2).toUpperCase();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Assign eSIM Package</DialogTitle>
          <DialogDescription>
            Select an eSIM package to assign to the user
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Selected User Display */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              <Label className="text-base font-semibold">Selected Customer</Label>
            </div>
            <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg border">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="text-sm font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="text-sm font-medium">{displayName}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Package Selection */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              <Label className="text-base font-semibold">Select Package</Label>
            </div>
            
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search packages by name or region..."
                value={planSearchTerm}
                onChange={(e) => setPlanSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto border rounded-lg p-2">
              {plansLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                  <p className="text-sm text-muted-foreground">Loading packages...</p>
                </div>
              ) : plans.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-2 text-muted-foreground/50" />
                  <p className="text-sm">No packages found</p>
                </div>
              ) : (
                plans.map((plan) => (
                  <div
                    key={plan.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedPlan?.id === plan.id
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "hover:bg-muted/50"
                    }`}
                    onClick={() => plan && setSelectedPlan(plan as CatalogBundle)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="text-sm font-medium">{plan.esimGoName}</h4>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                          {plan.description}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs bg-secondary px-2 py-1 rounded">
                            {plan.regions[0]}
                          </span>
                          <span className="text-xs bg-secondary px-2 py-1 rounded">
                            {plan.duration} days
                          </span>
                          {plan.unlimited && (
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                              Unlimited
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <p className="text-sm font-semibold">
                          ${(plan.priceCents / 100).toFixed(2)}
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
          </div>

          <Separator />

          {/* Assignment Summary */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Assignment Summary</Label>
            {selectedPlan ? (
              <div className="p-4 bg-muted/50 rounded-lg border">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">Ready to assign</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  Package "{selectedPlan.esimGoName}" will be assigned to {user.email}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {selectedPlan.regions[0]} • {selectedPlan.duration} days • ${(selectedPlan.priceCents / 100).toFixed(2)}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 p-4 bg-muted/30 rounded-lg text-muted-foreground">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">Please select a package to assign</span>
              </div>
            )}
          </div>

          {/* Action Button */}
          <Button
            onClick={handleAssignPackage}
            disabled={!selectedPlan || isAssigning}
            className="w-full"
            size="lg"
          >
            {isAssigning ? "Assigning..." : "Assign Package"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}