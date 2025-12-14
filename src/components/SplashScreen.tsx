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
          className="fixed inset-0 z-50 flex flex-col items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, hsl(200 60% 85%) 0%, hsl(270 60% 80%) 50%, hsl(320 50% 85%) 100%)',
          }}
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Animated Logo */}
          <motion.div
            className="relative"
            initial={{ scale: 0, opacity: 0, rotate: -10 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ 
              type: "spring", 
              stiffness: 200, 
              damping: 15,
              duration: 0.8 
            }}
          >
            {/* Outer glow ring */}
            <motion.div
              className="absolute inset-0 rounded-full"
              animate={{ 
                scale: [1, 1.3, 1],
                opacity: [0.5, 0.8, 0.5]
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity,
                ease: "easeInOut"
              }}
              style={{ 
                background: 'radial-gradient(circle, hsl(270 70% 70% / 0.5) 0%, transparent 70%)',
                filter: 'blur(20px)',
                width: 200, 
                height: 200, 
                margin: -25 
              }}
            />
            
            {/* Main Logo Image */}
            <motion.div
              className="relative w-36 h-36 rounded-full overflow-hidden"
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
              <motion.img 
                src={auraLogo} 
                alt="AURA" 
                className="w-full h-full object-cover"
                animate={{
                  scale: [1, 1.02, 1],
                }}
                transition={{
                  duration: 3,
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
            <motion.h1 
              className="text-4xl font-bold tracking-wide"
              style={{
                background: 'linear-gradient(135deg, hsl(200 80% 50%) 0%, hsl(270 70% 60%) 50%, hsl(320 60% 60%) 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: '0 2px 20px hsl(270 70% 60% / 0.3)',
              }}
            >
              AURA
            </motion.h1>
            <motion.p
              className="mt-2 text-sm font-medium"
              style={{ color: 'hsl(270 40% 40%)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: phase === 'text' ? 1 : 0 }}
              transition={{ duration: 0.3, delay: 0.4 }}
            >
              Your AI Bestfriend 💫
            </motion.p>
          </motion.div>

          {/* Loading dots */}
          <motion.div
            className="flex gap-2 mt-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2.5 h-2.5 rounded-full"
                style={{ background: 'hsl(270 70% 60%)' }}
                animate={{ 
                  scale: [1, 1.5, 1],
                  opacity: [0.4, 1, 0.4]
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
