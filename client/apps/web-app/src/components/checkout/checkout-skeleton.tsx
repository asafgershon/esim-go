import { Card } from "@workspace/ui";
import { Skeleton } from "@workspace/ui/components/skeleton";

export function CheckoutSkeleton() {
  return (
    <div className="max-w-4xl mx-auto" dir="rtl">
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Left Column - Order Details Skeleton */}
        <div className="space-y-6">
          {/* Order Details Section */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Skeleton className="w-8 h-8 rounded-full" />
              <div>
                <Skeleton className="h-5 w-24 mb-1" />
                <Skeleton className="h-4 w-16" />
              </div>
            </div>
            
            <div className="space-y-4">
              {/* Plan details */}
              <div className="flex justify-between items-center">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-32" />
              </div>
              <div className="flex justify-between items-center">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-24" />
              </div>
              <div className="flex justify-between items-center">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-28" />
              </div>
              
              {/* Pricing breakdown */}
              <div className="border-t pt-4 mt-4">
                <div className="flex justify-between items-center mb-2">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <div className="flex justify-between items-center mb-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <div className="flex justify-between items-center font-bold">
                  <Skeleton className="h-5 w-12" />
                  <Skeleton className="h-5 w-24" />
                </div>
              </div>
            </div>
          </Card>

          {/* Delivery Method Section */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Skeleton className="w-8 h-8 rounded-full" />
              <div>
                <Skeleton className="h-5 w-28 mb-1" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="border rounded-lg p-3">
                  <Skeleton className="h-4 w-12 mb-2" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <div className="border rounded-lg p-3">
                  <Skeleton className="h-4 w-16 mb-2" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <Skeleton className="h-10 w-full" />
            </div>
          </Card>
        </div>

        {/* Right Column - Payment & Login */}
        <div className="space-y-6">
          {/* Login Section */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Skeleton className="w-8 h-8 rounded-full" />
              <div>
                <Skeleton className="h-5 w-20 mb-1" />
                <Skeleton className="h-4 w-16" />
              </div>
            </div>
            
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4 rounded" />
                <Skeleton className="h-4 w-32" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
          </Card>

          {/* Validation Status Skeleton */}
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <Skeleton className="w-5 h-5 rounded-full" />
              <Skeleton className="h-4 w-40" />
            </div>
          </Card>

          {/* Payment Section */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Skeleton className="w-8 h-8 rounded-full" />
              <div>
                <Skeleton className="h-5 w-16 mb-1" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>
              <Skeleton className="h-12 w-full" />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}