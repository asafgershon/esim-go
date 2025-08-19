"use client";

import { Card } from "@workspace/ui";
import { motion } from "framer-motion";

export function CheckoutSkeleton() {
  return (
    <motion.div 
      className="max-w-4xl mx-auto" 
      dir="rtl"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Left Column - Order Details Skeleton */}
        <div className="space-y-6">
          {/* Order Details Section */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-6 h-6 md:w-8 md:h-8 bg-gray-200 rounded-full animate-pulse" />
              <div>
                <div className="h-4 md:h-5 w-24 bg-gray-200 rounded animate-pulse mb-1" />
                <div className="h-3 md:h-4 w-16 bg-gray-100 rounded animate-pulse" />
              </div>
            </div>
            
            <div className="space-y-4">
              {/* Plan details */}
              <div className="flex justify-between items-center">
                <div className="h-4 w-20 bg-gray-100 rounded animate-pulse" />
                <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
              </div>
              <div className="flex justify-between items-center">
                <div className="h-4 w-16 bg-gray-100 rounded animate-pulse" />
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
              </div>
              <div className="flex justify-between items-center">
                <div className="h-4 w-20 bg-gray-100 rounded animate-pulse" />
                <div className="h-4 w-28 bg-gray-200 rounded animate-pulse" />
              </div>
              
              {/* Pricing breakdown */}
              <div className="border-t pt-4 mt-4">
                <div className="flex justify-between items-center mb-2">
                  <div className="h-4 w-16 bg-gray-100 rounded animate-pulse" />
                  <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
                </div>
                <div className="flex justify-between items-center mb-2">
                  <div className="h-4 w-20 bg-gray-100 rounded animate-pulse" />
                  <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
                </div>
                <div className="flex justify-between items-center font-bold">
                  <div className="h-5 w-12 bg-gray-200 rounded animate-pulse" />
                  <div className="h-5 w-24 bg-gray-200 rounded animate-pulse" />
                </div>
              </div>
            </div>
          </Card>

          {/* Delivery Method Section */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-6 h-6 md:w-8 md:h-8 bg-gray-200 rounded-full animate-pulse" />
              <div>
                <div className="h-4 md:h-5 w-28 bg-gray-200 rounded animate-pulse mb-1" />
                <div className="h-3 md:h-4 w-20 bg-gray-100 rounded animate-pulse" />
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="border border-gray-200 rounded-lg p-3">
                  <div className="h-4 w-12 bg-gray-200 rounded animate-pulse mb-2" />
                  <div className="h-3 w-20 bg-gray-100 rounded animate-pulse" />
                </div>
                <div className="border border-gray-200 rounded-lg p-3">
                  <div className="h-4 w-16 bg-gray-200 rounded animate-pulse mb-2" />
                  <div className="h-3 w-24 bg-gray-100 rounded animate-pulse" />
                </div>
              </div>
              <div className="h-10 w-full bg-gray-200 rounded animate-pulse" />
            </div>
          </Card>
        </div>

        {/* Right Column - Payment & Login */}
        <div className="space-y-6">
          {/* Login Section */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-6 h-6 md:w-8 md:h-8 bg-gray-200 rounded-full animate-pulse" />
              <div>
                <div className="h-4 md:h-5 w-20 bg-gray-200 rounded animate-pulse mb-1" />
                <div className="h-3 md:h-4 w-16 bg-gray-100 rounded animate-pulse" />
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="h-10 w-full bg-gray-200 rounded animate-pulse" />
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-32 bg-gray-100 rounded animate-pulse" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="h-10 w-full bg-gray-200 rounded animate-pulse" />
                <div className="h-10 w-full bg-gray-200 rounded animate-pulse" />
              </div>
            </div>
          </Card>

          {/* Validation Status Skeleton */}
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 bg-gray-200 rounded-full animate-pulse" />
              <div className="h-4 w-40 bg-gray-100 rounded animate-pulse" />
            </div>
          </Card>

          {/* Payment Section */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-6 h-6 md:w-8 md:h-8 bg-gray-200 rounded-full animate-pulse" />
              <div>
                <div className="h-4 md:h-5 w-16 bg-gray-200 rounded animate-pulse mb-1" />
                <div className="h-3 md:h-4 w-20 bg-gray-100 rounded animate-pulse" />
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="h-4 w-20 bg-gray-100 rounded animate-pulse" />
                <div className="h-10 w-full bg-gray-200 rounded animate-pulse" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <div className="h-4 w-16 bg-gray-100 rounded animate-pulse" />
                  <div className="h-10 w-full bg-gray-200 rounded animate-pulse" />
                </div>
                <div className="space-y-2">
                  <div className="h-4 w-12 bg-gray-100 rounded animate-pulse" />
                  <div className="h-10 w-full bg-gray-200 rounded animate-pulse" />
                </div>
              </div>
              <div className="h-12 w-full bg-gray-200 rounded animate-pulse" />
            </div>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}