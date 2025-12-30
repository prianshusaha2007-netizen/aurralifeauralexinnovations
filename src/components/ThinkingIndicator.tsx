import React from 'react';
import { motion } from 'framer-motion';
import { Brain, Sparkles } from 'lucide-react';
import auraAvatar from '@/assets/aura-avatar.jpeg';

interface ThinkingIndicatorProps {
  className?: string;
}

const thinkingPhrases = [
  'Thinking...',
  'Processing...',
  'Understanding...',
  'Reflecting...',
];

export const ThinkingIndicator: React.FC<ThinkingIndicatorProps> = ({ className }) => {
  const [phraseIndex, setPhrasIndex] = React.useState(0);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setPhrasIndex((prev) => (prev + 1) % thinkingPhrases.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

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
          className="absolute inset-0 rounded-full bg-primary/20"
          animate={{ 
            scale: [1, 1.3, 1],
            opacity: [0.4, 0.1, 0.4],
          }}
          transition={{ 
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <div className="w-9 h-9 rounded-full overflow-hidden ring-2 ring-primary/20 relative z-10">
          <img src={auraAvatar} alt="AURRA" className="w-full h-full object-cover" />
        </div>
      </div>

      {/* Thinking bubble */}
      <motion.div 
        className="bg-card/90 backdrop-blur-md border border-border/40 px-4 py-3 rounded-2xl rounded-bl-sm shadow-lg shadow-primary/5"
        animate={{ 
          boxShadow: [
            '0 4px 6px -1px hsl(var(--primary) / 0.05)',
            '0 4px 12px -1px hsl(var(--primary) / 0.1)',
            '0 4px 6px -1px hsl(var(--primary) / 0.05)',
          ]
        }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div className="flex items-center gap-2.5">
          {/* Animated brain icon */}
          <motion.div
            animate={{ 
              rotate: [0, 5, -5, 0],
              scale: [1, 1.05, 1],
            }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Brain className="w-4 h-4 text-primary/70" />
          </motion.div>

          {/* Thinking text */}
          <motion.span 
            key={phraseIndex}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="text-sm text-muted-foreground font-medium"
          >
            {thinkingPhrases[phraseIndex]}
          </motion.span>

          {/* Animated dots */}
          <div className="flex gap-1 ml-1">
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-primary/50"
                animate={{ 
                  scale: [1, 1.4, 1],
                  opacity: [0.4, 1, 0.4],
                }}
                transition={{ 
                  duration: 0.8,
                  repeat: Infinity,
                  delay: i * 0.15,
                  ease: 'easeInOut',
                }}
              />
            ))}
          </div>

          {/* Sparkle decoration */}
          <motion.div
            animate={{ 
              rotate: [0, 180, 360],
              opacity: [0.3, 0.7, 0.3],
            }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            className="ml-1"
          >
            <Sparkles className="w-3 h-3 text-primary/40" />
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
};
