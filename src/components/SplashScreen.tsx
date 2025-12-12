import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SplashScreenProps {
  onComplete: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const [phase, setPhase] = useState<'logo' | 'text' | 'fade'>('logo');

  useEffect(() => {
    const timer1 = setTimeout(() => setPhase('text'), 800);
    const timer2 = setTimeout(() => setPhase('fade'), 2000);
    const timer3 = setTimeout(() => onComplete(), 2500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [onComplete]);

  return (
    <AnimatePresence>
      {phase !== 'fade' && (
        <motion.div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Animated Orb */}
          <motion.div
            className="relative"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ 
              type: "spring", 
              stiffness: 200, 
              damping: 20,
              duration: 0.8 
            }}
          >
            {/* Outer glow ring */}
            <motion.div
              className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 blur-xl"
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.5, 0.8, 0.5]
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity,
                ease: "easeInOut"
              }}
              style={{ width: 160, height: 160, margin: -20 }}
            />
            
            {/* Main orb */}
            <motion.div
              className="relative w-32 h-32 rounded-full aura-gradient flex items-center justify-center"
              animate={{ 
                boxShadow: [
                  '0 0 40px hsl(270 70% 60% / 0.4), 0 0 80px hsl(270 70% 60% / 0.2)',
                  '0 0 60px hsl(270 70% 60% / 0.6), 0 0 120px hsl(270 70% 60% / 0.3)',
                  '0 0 40px hsl(270 70% 60% / 0.4), 0 0 80px hsl(270 70% 60% / 0.2)',
                ]
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              {/* Inner pulse */}
              <motion.div
                className="w-16 h-16 rounded-full bg-primary-foreground/20"
                animate={{ 
                  scale: [0.8, 1, 0.8],
                  opacity: [0.3, 0.6, 0.3]
                }}
                transition={{ 
                  duration: 1.5, 
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            </motion.div>
          </motion.div>

          {/* Text */}
          <motion.div
            className="mt-8 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ 
              opacity: phase === 'text' ? 1 : 0, 
              y: phase === 'text' ? 0 : 20 
            }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h1 className="text-4xl font-bold aura-gradient-text tracking-wide">
              AURA
            </h1>
            <motion.p
              className="text-muted-foreground mt-2 text-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: phase === 'text' ? 1 : 0 }}
              transition={{ duration: 0.3, delay: 0.4 }}
            >
              Your AI Companion
            </motion.p>
          </motion.div>

          {/* Loading dots */}
          <motion.div
            className="flex gap-1 mt-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 rounded-full bg-primary"
                animate={{ 
                  scale: [1, 1.5, 1],
                  opacity: [0.3, 1, 0.3]
                }}
                transition={{ 
                  duration: 1,
                  repeat: Infinity,
                  delay: i * 0.2,
                  ease: "easeInOut"
                }}
              />
            ))}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
