import React from 'react';
import { motion } from 'framer-motion';
import auraAvatar from '@/assets/aura-avatar.jpeg';

interface TypingIndicatorProps {
  className?: string;
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({ className }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -5 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={`flex gap-3 ${className}`}
    >
      {/* Avatar */}
      <div className="flex-shrink-0 mt-auto">
        <div className="w-10 h-10 rounded-2xl overflow-hidden shadow-sm ring-1 ring-border/30">
          <img 
            src={auraAvatar} 
            alt="AURRA" 
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* Typing bubble - WhatsApp style */}
      <div className="bg-card border border-border/50 px-4 py-3.5 rounded-3xl rounded-bl-lg shadow-sm">
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="w-2 h-2 rounded-full bg-muted-foreground/50"
              animate={{ 
                y: [0, -6, 0],
                opacity: [0.4, 1, 0.4],
              }}
              transition={{ 
                duration: 0.6,
                repeat: Infinity,
                delay: i * 0.15,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
};
