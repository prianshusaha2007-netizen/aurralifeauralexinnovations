import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import auraLogo from '@/assets/aura-logo.jpeg';

interface SplashScreenProps {
  onComplete: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const [phase, setPhase] = useState<'logo' | 'text' | 'fade'>('logo');

  useEffect(() => {
    const timer1 = setTimeout(() => setPhase('text'), 800);
    const timer2 = setTimeout(() => setPhase('fade'), 2200);
    const timer3 = setTimeout(() => onComplete(), 2700);

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
          {/* Subtle gradient overlay - warm, calm */}
          <div 
            className="absolute inset-0 opacity-50"
            style={{
              background: 'radial-gradient(circle at 50% 50%, hsl(174 55% 42% / 0.15) 0%, transparent 70%)',
            }}
          />

          {/* Animated Logo */}
          <motion.div
            className="relative"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ 
              type: "spring", 
              stiffness: 200, 
              damping: 20,
              duration: 0.8 
            }}
          >
            {/* Outer glow ring - pulsing teal aura */}
            <motion.div
              className="absolute inset-0 rounded-3xl"
              animate={{ 
                scale: [1, 1.12, 1],
                opacity: [0.4, 0.7, 0.4]
              }}
              transition={{ 
                duration: 2.5, 
                repeat: Infinity,
                ease: "easeInOut"
              }}
              style={{ 
                background: 'radial-gradient(circle, hsl(174 60% 50% / 0.4) 0%, transparent 70%)',
                filter: 'blur(25px)',
                width: 200, 
                height: 200, 
                margin: -34 
              }}
            />
            
            {/* Main Logo Image */}
            <motion.div
              className="relative w-32 h-32 rounded-3xl overflow-hidden shadow-lg"
              animate={{ 
                boxShadow: [
                  '0 8px 40px hsl(174 55% 42% / 0.2)',
                  '0 12px 50px hsl(174 55% 42% / 0.3)',
                  '0 8px 40px hsl(174 55% 42% / 0.2)',
                ]
              }}
              transition={{ 
                duration: 3, 
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <motion.img 
                src={auraLogo} 
                alt="AURRA" 
                className="w-full h-full object-cover"
                animate={{
                  scale: [1, 1.02, 1],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            </motion.div>
          </motion.div>

          {/* Text */}
          <motion.div
            className="mt-8 text-center"
            initial={{ opacity: 0, y: 12 }}
            animate={{ 
              opacity: phase === 'text' ? 1 : 0, 
              y: phase === 'text' ? 0 : 12 
            }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <motion.h1 
              className="text-3xl font-bold tracking-wide aura-gradient-text"
            >
              AURRA
            </motion.h1>
            <motion.p
              className="mt-2 text-sm font-medium text-muted-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: phase === 'text' ? 1 : 0 }}
              transition={{ duration: 0.3, delay: 0.4 }}
            >
              Your all-time AI companion
            </motion.p>
          </motion.div>

          {/* Loading dots - gentle rhythm */}
          <motion.div
            className="flex gap-2 mt-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 rounded-full bg-primary"
                animate={{ 
                  scale: [1, 1.3, 1],
                  opacity: [0.3, 0.8, 0.3]
                }}
                transition={{ 
                  duration: 1.2,
                  repeat: Infinity,
                  delay: i * 0.15,
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