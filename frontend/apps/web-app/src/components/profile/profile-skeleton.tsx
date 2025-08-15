"use client";

import { Card } from "@workspace/ui";
import { motion } from "framer-motion";

export function ProfileSkeleton() {
  return (
    <motion.div 
      className="min-h-screen bg-background" 
      dir="rtl"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Header Skeleton */}
      <header className="bg-card border-b px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="w-10 h-10 bg-gray-200 rounded animate-pulse" />
          <div className="h-6 w-24 bg-gray-200 rounded animate-pulse" />
          <div className="w-10" />
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 max-w-2xl">
        {/* Profile Information Skeleton */}
        <Card className="p-6 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="h-16 w-16 bg-gray-200 rounded-full animate-pulse" />
            <div>
              <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-2" />
              <div className="h-4 w-48 bg-gray-100 rounded animate-pulse mb-1" />
              <div className="h-4 w-36 bg-gray-100 rounded animate-pulse" />
            </div>
          </div>
        </Card>

        {/* My Plan Skeleton */}
        <Card className="p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 bg-gray-200 rounded animate-pulse" />
              <div className="h-5 w-40 bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
              <div className="h-5 w-12 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
          
          {/* Usage bars */}
          <div className="space-y-6">
            <div>
              <div className="flex justify-between items-center mb-2">
                <div className="h-4 w-20 bg-gray-100 rounded animate-pulse" />
                <div className="h-4 w-32 bg-gray-100 rounded animate-pulse" />
              </div>
              <div className="h-2 w-full bg-gray-200 rounded animate-pulse mb-2" />
              <div className="h-3 w-24 bg-gray-100 rounded animate-pulse" />
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-2">
                <div className="h-4 w-16 bg-gray-100 rounded animate-pulse" />
                <div className="h-4 w-28 bg-gray-100 rounded animate-pulse" />
              </div>
              <div className="h-2 w-full bg-gray-200 rounded animate-pulse mb-2" />
              <div className="h-3 w-32 bg-gray-100 rounded animate-pulse" />
            </div>
            
            {/* CTA Button */}
            <div className="h-12 w-full bg-gray-200 rounded animate-pulse" />
          </div>
        </Card>

        {/* Order History Skeleton */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-5 w-5 bg-gray-200 rounded animate-pulse" />
            <div className="h-5 w-32 bg-gray-200 rounded animate-pulse" />
          </div>

          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                    <div className="h-4 w-12 bg-gray-100 rounded animate-pulse" />
                  </div>
                  <div className="space-y-1">
                    <div className="h-3 w-20 bg-gray-100 rounded animate-pulse" />
                    <div className="h-3 w-28 bg-gray-100 rounded animate-pulse" />
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div>
                    <div className="h-5 w-16 bg-gray-200 rounded animate-pulse mb-1" />
                    <div className="h-3 w-20 bg-gray-100 rounded animate-pulse" />
                  </div>
                  <div className="h-4 w-4 bg-gray-100 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </motion.div>
  );
}