"use client";

import { CheckCircle2 } from "lucide-react";
import { cn } from "@workspace/ui";
import { motion, AnimatePresence } from "motion/react";

interface SectionHeaderProps {
  sectionNumber: number;
  title: string;
  icon?: React.ReactNode;
  isCompleted?: boolean;
  className?: string;
}

export function SectionHeader({
  sectionNumber,
  title,
  icon,
  isCompleted = false,
  className,
}: SectionHeaderProps) {
  return (
    <div className={cn("flex items-center gap-3 mb-4", className)}>
      <div className="relative">
        <AnimatePresence mode="wait">
          {isCompleted ? (
            <motion.div
              key="completed"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.3, type: "spring", stiffness: 500 }}
              className="bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg"
            >
              <CheckCircle2 className="h-5 w-5" />
            </motion.div>
          ) : (
            <motion.div
              key="pending"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center text-md font-bold shadow-lg"
            >
              {sectionNumber}
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Pulse animation for active step */}
        {!isCompleted && (
          <motion.div
            className="absolute inset-0 bg-primary rounded-full"
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            style={{ opacity: 0.3, zIndex: -1 }}
          />
        )}
      </div>
      
      {icon && (
        <motion.div
          animate={{ 
            scale: isCompleted ? 1 : 1,
            opacity: isCompleted ? 0.7 : 1 
          }}
          transition={{ duration: 0.2 }}
        >
          {icon}
        </motion.div>
      )}
      
      <motion.h2 
        className="text-xl font-semibold"
        animate={{ 
          opacity: isCompleted ? 0.8 : 1 
        }}
        transition={{ duration: 0.2 }}
      >
        {title}
      </motion.h2>
    </div>
  );
}