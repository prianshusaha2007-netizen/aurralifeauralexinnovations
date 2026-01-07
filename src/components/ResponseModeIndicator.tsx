import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Brain } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ResponseModeIndicatorProps {
  mode: 'fast' | 'deep' | null;
  className?: string;
}

export const ResponseModeIndicator: React.FC<ResponseModeIndicatorProps> = ({ mode, className }) => {
  if (!mode) return null;

  const isFast = mode === 'fast';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -5 }}
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
          isFast 
            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" 
            : "bg-violet-500/10 text-violet-600 dark:text-violet-400",
          className
        )}
      >
        {isFast ? (
          <>
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 0.6, repeat: Infinity }}
            >
              <Zap className="w-3 h-3" />
            </motion.div>
            <span>Quick reply</span>
          </>
        ) : (
          <>
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <Brain className="w-3 h-3" />
            </motion.div>
            <span>Deep thinking</span>
          </>
        )}
      </motion.div>
    </AnimatePresence>
  );
};
