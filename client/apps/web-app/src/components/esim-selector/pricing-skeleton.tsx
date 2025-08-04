import { motion } from "framer-motion";

export function PricingSkeleton() {
  return (
    <motion.div 
      className="bg-brand-white border border-[rgba(10,35,46,0.2)] rounded-lg md:rounded-[15px] p-3 md:p-4"
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
      <div className="pt-3 border-t border-[rgba(10,35,46,0.1)]">
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