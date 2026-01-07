import React from 'react';
import { motion } from 'framer-motion';
import { Brain, Sparkles, Zap } from 'lucide-react';
import auraAvatar from '@/assets/aura-avatar.jpeg';

interface ThinkingIndicatorProps {
  className?: string;
  mode?: 'fast' | 'deep' | null;
}

const fastPhrases = [
  'Quick reply...',
  'On it...',
  'Processing...',
];

const deepPhrases = [
  'Deep thinking...',
  'Analyzing...',
  'Reasoning...',
  'Reflecting...',
];

export const ThinkingIndicator: React.FC<ThinkingIndicatorProps> = ({ className, mode = 'fast' }) => {
  const [phraseIndex, setPhraseIndex] = React.useState(0);
  const isDeep = mode === 'deep';
  const phrases = isDeep ? deepPhrases : fastPhrases;

  React.useEffect(() => {
    const interval = setInterval(() => {
      setPhraseIndex((prev) => (prev + 1) % phrases.length);
    }, isDeep ? 2500 : 1500);
    return () => clearInterval(interval);
  }, [phrases.length, isDeep]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10, scale: 0.95 }} 
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -5, scale: 0.98 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={`flex gap-3 ${className}`}
    >
      {/* Avatar with thinking glow */}
      <div className="relative">
        <motion.div
          className={`absolute inset-0 rounded-full ${isDeep ? 'bg-violet-500/20' : 'bg-emerald-500/20'}`}
          animate={{ 
            scale: [1, 1.3, 1],
            opacity: [0.4, 0.1, 0.4],
          }}
          transition={{ 
            duration: isDeep ? 2.5 : 1.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <div className={`w-9 h-9 rounded-full overflow-hidden ring-2 ${isDeep ? 'ring-violet-500/30' : 'ring-emerald-500/30'} relative z-10`}>
          <img src={auraAvatar} alt="AURRA" className="w-full h-full object-cover" />
        </div>
      </div>

      {/* Thinking bubble */}
      <motion.div 
        className="bg-card/90 backdrop-blur-md border border-border/40 px-4 py-3 rounded-2xl rounded-bl-sm shadow-lg"
        animate={{ 
          boxShadow: isDeep 
            ? [
                '0 4px 6px -1px hsl(262 80% 50% / 0.05)',
                '0 4px 12px -1px hsl(262 80% 50% / 0.15)',
                '0 4px 6px -1px hsl(262 80% 50% / 0.05)',
              ]
            : [
                '0 4px 6px -1px hsl(160 80% 40% / 0.05)',
                '0 4px 12px -1px hsl(160 80% 40% / 0.1)',
                '0 4px 6px -1px hsl(160 80% 40% / 0.05)',
              ]
        }}
        transition={{ duration: isDeep ? 2.5 : 1.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div className="flex items-center gap-2.5">
          {/* Mode indicator badge */}
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

          {/* Thinking text */}
          <motion.span 
            key={phraseIndex}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="text-sm text-muted-foreground font-medium"
          >
            {phrases[phraseIndex]}
          </motion.span>

          {/* Animated dots */}
          <div className="flex gap-1 ml-1">
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className={`w-1.5 h-1.5 rounded-full ${isDeep ? 'bg-violet-500/50' : 'bg-emerald-500/50'}`}
                animate={{ 
                  scale: [1, 1.4, 1],
                  opacity: [0.4, 1, 0.4],
                }}
                transition={{ 
                  duration: isDeep ? 1 : 0.6,
                  repeat: Infinity,
                  delay: i * 0.15,
                  ease: 'easeInOut',
                }}
              />
            ))}
          </div>

          {/* Sparkle decoration (only for deep mode) */}
          {isDeep && (
            <motion.div
              animate={{ 
                rotate: [0, 180, 360],
                opacity: [0.3, 0.7, 0.3],
              }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
              className="ml-1"
            >
              <Sparkles className="w-3 h-3 text-violet-500/40" />
            </motion.div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};
