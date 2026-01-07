import React from 'react';
import { motion } from 'framer-motion';
import { Brain, Zap } from 'lucide-react';
import auraAvatar from '@/assets/aura-avatar.jpeg';

interface TypingIndicatorProps {
  className?: string;
  mode?: 'fast' | 'deep' | null;
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({ className, mode = 'fast' }) => {
  const isDeep = mode === 'deep';
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -5 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={`flex gap-3 ${className}`}
    >
      {/* Avatar */}
      <div className="flex-shrink-0 mt-auto relative">
        {/* Mode glow effect */}
        <motion.div
          className={`absolute inset-0 rounded-2xl ${isDeep ? 'bg-violet-500/20' : 'bg-emerald-500/20'}`}
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.1, 0.3],
          }}
          transition={{ 
            duration: isDeep ? 2 : 1.2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <div className={`w-10 h-10 rounded-2xl overflow-hidden shadow-sm ring-1 ${isDeep ? 'ring-violet-500/40' : 'ring-emerald-500/40'} relative z-10`}>
          <img 
            src={auraAvatar} 
            alt="AURRA" 
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* Typing bubble with mode indicator */}
      <div className="bg-card border border-border/50 px-4 py-3 rounded-3xl rounded-bl-lg shadow-sm">
        <div className="flex items-center gap-2">
          {/* Mode badge */}
          <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
            isDeep 
              ? 'bg-violet-500/10 text-violet-600 dark:text-violet-400' 
              : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
          }`}>
            {isDeep ? (
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Brain className="w-3 h-3" />
              </motion.div>
            ) : (
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.6, repeat: Infinity }}
              >
                <Zap className="w-3 h-3" />
              </motion.div>
            )}
            <span>{isDeep ? 'Deep' : 'Quick'}</span>
          </div>
          
          {/* Animated dots */}
          <div className="flex items-center gap-1.5">
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className={`w-2 h-2 rounded-full ${isDeep ? 'bg-violet-500/50' : 'bg-emerald-500/50'}`}
                animate={{ 
                  y: [0, -4, 0],
                  opacity: [0.4, 1, 0.4],
                }}
                transition={{ 
                  duration: isDeep ? 0.8 : 0.5,
                  repeat: Infinity,
                  delay: i * 0.15,
                  ease: 'easeInOut',
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
