import { motion } from "framer-motion";

export function PricingSkeleton() {
  return (
    <motion.div
      className="bg-brand-white border border-brand-dark/10 rounded-lg md:rounded-[15px] p-3 md:p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {/* Icon placeholder */}
          <div className="w-6 h-6 md:w-8 md:h-8 bg-gray-200 rounded animate-pulse" />
          <div>
            {/* Title placeholder */}
            <div className="h-4 md:h-5 w-24 bg-gray-200 rounded animate-pulse mb-1" />
            {/* Subtitle placeholder */}
            <div className="h-3 md:h-4 w-32 bg-gray-100 rounded animate-pulse" />
          </div>
        </div>
      </div>

      {/* Pricing Summary */}
      <div className="pt-3 border-t border-brand-dark/10">
        <div className="flex items-center justify-between">
          {/* Days text placeholder */}
          <div className="h-3 md:h-4 w-20 bg-gray-100 rounded animate-pulse" />
          {/* Price placeholder */}
          <div className="h-5 md:h-6 w-16 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
    </motion.div>
  );
}

export function SelectorSkeleton() {
  return (
    <div
      className="w-full max-w-xl mx-auto bg-card rounded-2xl shadow-lg overflow-hidden"
      dir="rtl"
    >
      {/* Header Skeleton */}
      <div className="bg-gradient-to-r from-muted to-secondary p-6 text-center">
        <div className="w-8 h-8 bg-muted rounded-full mx-auto mb-2 animate-pulse"></div>
        <div className="w-32 h-6 bg-muted rounded mx-auto mb-1 animate-pulse"></div>
        <div className="w-48 h-4 bg-muted rounded mx-auto animate-pulse"></div>
      </div>

      {/* Tabs Skeleton */}
      <div className="flex bg-muted p-1 m-4 rounded-xl">
        <div className="flex-1 py-3 px-4 bg-muted rounded-lg animate-pulse"></div>
        <div className="flex-1 py-3 px-4 bg-muted/10 rounded-lg animate-pulse ml-1"></div>
      </div>

      {/* Search Skeleton */}
      <div className="px-4 mb-4">
        <div className="w-full h-9 bg-muted rounded-md animate-pulse"></div>
      </div>

      {/* Content Skeleton */}
      <div className="px-4 pb-4 space-y-3">
        <div className="p-4 border border-brand-dark/10 rounded-xl">
          <div className="flex items-center justify-between">
            <div className="text-left">
              <div className="w-12 h-4 bg-muted rounded mb-1 animate-pulse"></div>
              <div className="w-24 h-5 bg-muted rounded mb-1 animate-pulse"></div>
              <div className="w-12 h-3 bg-muted rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Skeleton */}
      <div className="p-4 border-t bg-muted">
        <div className="w-full h-12 bg-white/70 dark:bg-black/70 rounded-lg animate-pulse"></div>
      </div>
    </div>
  );
}
