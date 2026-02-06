import React from 'react';
import { motion } from 'framer-motion';
import auraAvatar from '@/assets/aura-avatar.jpeg';

interface TypingIndicatorProps {
  className?: string;
  mode?: 'fast' | 'deep' | null;
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({ className, mode = 'fast' }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 4 }} 
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
      className={`flex gap-2.5 ${className}`}
    >
      {/* Avatar - calmer, smaller */}
      <div className="flex-shrink-0 mt-auto mb-1">
        <motion.div
          className="w-8 h-8 rounded-xl overflow-hidden shadow-sm ring-1 ring-border/20"
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <img 
            src={auraAvatar} 
            alt="AURRA" 
            className="w-full h-full object-cover"
          />
        </motion.div>
      </div>

      {/* Typing bubble - minimal, calm */}
      <div className="bg-muted/50 border border-border/30 px-4 py-2.5 rounded-2xl rounded-bl-md">
        <div className="flex items-center gap-1.5">
          {/* Simple breathing dots - no colors, just subtle animation */}
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40"
              animate={{ 
                opacity: [0.3, 0.7, 0.3],
                scale: [0.9, 1.1, 0.9],
              }}
              transition={{ 
                duration: 1.2,
                repeat: Infinity,
                delay: i * 0.2,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
};
