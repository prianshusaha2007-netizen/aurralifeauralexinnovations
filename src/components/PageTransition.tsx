import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface PageTransitionProps {
  children: React.ReactNode;
  pageKey: string;
}

export const PageTransition: React.FC<PageTransitionProps> = ({ children, pageKey }) => {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pageKey}
        initial={{ opacity: 0, x: 20, scale: 0.98 }}
        animate={{ 
          opacity: 1, 
          x: 0, 
          scale: 1,
          transition: { duration: 0.3, ease: "easeOut" }
        }}
        exit={{ 
          opacity: 0, 
          x: -20, 
          scale: 0.98,
          transition: { duration: 0.2, ease: "easeOut" }
        }}
        className="h-full w-full"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

// Fade transition for modals and overlays
export const FadeTransition: React.FC<{ children: React.ReactNode; show: boolean }> = ({ 
  children, 
  show 
}) => {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Scale in transition for cards and items
export const ScaleTransition: React.FC<{ 
  children: React.ReactNode; 
  delay?: number;
  className?: string;
}> = ({ children, delay = 0, className = '' }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ 
        duration: 0.3, 
        delay,
        ease: [0.25, 0.46, 0.45, 0.94]
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// Stagger children animation
export const StaggerContainer: React.FC<{ 
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
}> = ({ children, className = '', staggerDelay = 0.05 }) => {
  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: staggerDelay,
          },
        },
      }}
    >
      {children}
    </motion.div>
  );
};

export const StaggerItem: React.FC<{ 
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => {
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { 
          opacity: 1, 
          y: 0,
          transition: {
            duration: 0.3,
            ease: [0.25, 0.46, 0.45, 0.94],
          }
        },
      }}
    >
      {children}
    </motion.div>
  );
};
