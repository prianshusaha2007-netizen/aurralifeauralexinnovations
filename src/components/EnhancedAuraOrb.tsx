import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export type OrbState = 
  | 'idle' 
  | 'listening' 
  | 'thinking' 
  | 'executing' 
  | 'speaking'
  | 'reflecting' 
  | 'night' 
  | 'emotional';

export type EmotionalTint = 
  | 'neutral' 
  | 'happy' 
  | 'calm' 
  | 'focused' 
  | 'concerned' 
  | 'excited';

interface EnhancedAuraOrbProps {
  state?: OrbState;
  emotionalTint?: EmotionalTint;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  onClick?: () => void;
  showPulse?: boolean;
}

const sizeConfig = {
  sm: { orb: 'w-12 h-12', glow: 'w-16 h-16', eye: 'w-1.5 h-1.5', eyeGap: 'gap-2' },
  md: { orb: 'w-16 h-16', glow: 'w-24 h-24', eye: 'w-2 h-2', eyeGap: 'gap-3' },
  lg: { orb: 'w-24 h-24', glow: 'w-32 h-32', eye: 'w-2.5 h-2.5', eyeGap: 'gap-4' },
  xl: { orb: 'w-32 h-32', glow: 'w-44 h-44', eye: 'w-3 h-3', eyeGap: 'gap-5' },
};

const emotionalColors: Record<EmotionalTint, { primary: string; secondary: string; glow: string }> = {
  neutral: { 
    primary: 'from-violet-500 to-indigo-600', 
    secondary: 'from-violet-400/50 to-indigo-500/50',
    glow: 'shadow-violet-500/30'
  },
  happy: { 
    primary: 'from-amber-400 to-orange-500', 
    secondary: 'from-amber-300/50 to-orange-400/50',
    glow: 'shadow-amber-500/30'
  },
  calm: { 
    primary: 'from-cyan-400 to-teal-500', 
    secondary: 'from-cyan-300/50 to-teal-400/50',
    glow: 'shadow-cyan-500/30'
  },
  focused: { 
    primary: 'from-blue-500 to-indigo-600', 
    secondary: 'from-blue-400/50 to-indigo-500/50',
    glow: 'shadow-blue-500/30'
  },
  concerned: { 
    primary: 'from-rose-400 to-pink-500', 
    secondary: 'from-rose-300/50 to-pink-400/50',
    glow: 'shadow-rose-500/30'
  },
  excited: { 
    primary: 'from-fuchsia-500 to-purple-600', 
    secondary: 'from-fuchsia-400/50 to-purple-500/50',
    glow: 'shadow-fuchsia-500/30'
  },
};

export const EnhancedAuraOrb: React.FC<EnhancedAuraOrbProps> = ({
  state = 'idle',
  emotionalTint = 'neutral',
  size = 'lg',
  className,
  onClick,
  showPulse = true
}) => {
  const [isBlinking, setIsBlinking] = useState(false);
  const [particles, setParticles] = useState<number[]>([]);
  
  const config = sizeConfig[size];
  const colors = emotionalColors[emotionalTint];

  // Blink animation
  useEffect(() => {
    if (state === 'idle' || state === 'night') {
      const interval = setInterval(() => {
        setIsBlinking(true);
        setTimeout(() => setIsBlinking(false), 150);
      }, 4000 + Math.random() * 2000);
      return () => clearInterval(interval);
    }
  }, [state]);

  // Particle generation for active states
  useEffect(() => {
    if (state === 'executing' || state === 'thinking' || state === 'reflecting') {
      const count = state === 'executing' ? 8 : 5;
      setParticles(Array.from({ length: count }, (_, i) => i));
    } else {
      setParticles([]);
    }
  }, [state]);

  // Animation variants based on state
  const orbAnimation = useMemo((): { scale?: number | number[]; rotate?: number[]; opacity?: number; transition: object } => {
    switch (state) {
      case 'listening':
        return { scale: [1, 1.05, 1], transition: { duration: 1.5, repeat: Infinity } };
      case 'thinking':
        return { scale: [1, 1.02, 1], rotate: [0, 5, -5, 0], transition: { duration: 2, repeat: Infinity } };
      case 'executing':
        return { scale: [1, 1.1, 1], transition: { duration: 0.8, repeat: Infinity } };
      case 'speaking':
        return { scale: [1, 1.03, 0.98, 1], transition: { duration: 0.5, repeat: Infinity } };
      case 'reflecting':
        return { rotate: [0, 360], transition: { duration: 20, repeat: Infinity } };
      case 'night':
        return { scale: 0.9, opacity: 0.6, transition: { duration: 2 } };
      default:
        return { scale: [1, 1.02, 1], transition: { duration: 4, repeat: Infinity } };
    }
  }, [state]);

  const glowAnimation = useMemo(() => {
    switch (state) {
      case 'listening':
        return {
          scale: [1, 1.3, 1],
          opacity: [0.3, 0.6, 0.3],
          transition: { duration: 1.5, repeat: Infinity }
        };
      case 'executing':
        return {
          scale: [1, 1.5, 1],
          opacity: [0.4, 0.8, 0.4],
          transition: { duration: 0.8, repeat: Infinity }
        };
      case 'thinking':
        return {
          scale: [1, 1.2, 1],
          opacity: [0.2, 0.5, 0.2],
          transition: { duration: 2, repeat: Infinity }
        };
      default:
        return {
          scale: [1, 1.1, 1],
          opacity: [0.2, 0.4, 0.2],
          transition: { duration: 3, repeat: Infinity }
        };
    }
  }, [state]);

  return (
    <div 
      className={cn("relative flex items-center justify-center cursor-pointer", className)}
      onClick={onClick}
    >
      {/* Outer glow */}
      {showPulse && (
        <motion.div
          className={cn(
            "absolute rounded-full blur-xl",
            config.glow,
            `bg-gradient-to-br ${colors.secondary}`
          )}
          animate={glowAnimation}
        />
      )}

      {/* Ripple effect for executing state */}
      <AnimatePresence>
        {state === 'executing' && (
          <>
            {[0, 1, 2].map((i) => (
              <motion.div
                key={`ripple-${i}`}
                className={cn(
                  "absolute rounded-full border-2 border-primary/30",
                  config.orb
                )}
                initial={{ scale: 1, opacity: 0.5 }}
                animate={{ scale: 2.5, opacity: 0 }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.5,
                  ease: "easeOut"
                }}
              />
            ))}
          </>
        )}
      </AnimatePresence>

      {/* Floating particles */}
      <AnimatePresence>
        {particles.map((i) => (
          <motion.div
            key={`particle-${i}`}
            className="absolute w-1 h-1 rounded-full bg-primary"
            initial={{ 
              x: 0, 
              y: 0, 
              opacity: 0,
              scale: 0 
            }}
            animate={{
              x: Math.cos(i * (Math.PI * 2 / particles.length)) * 50,
              y: Math.sin(i * (Math.PI * 2 / particles.length)) * 50,
              opacity: [0, 1, 0],
              scale: [0, 1, 0]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.2,
              ease: "easeInOut"
            }}
          />
        ))}
      </AnimatePresence>

      {/* Main orb */}
      <motion.div
        className={cn(
          "relative rounded-full shadow-lg",
          config.orb,
          colors.glow,
          `bg-gradient-to-br ${colors.primary}`
        )}
        animate={orbAnimation}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {/* Inner gradient overlay */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-t from-black/20 to-white/10" />
        
        {/* Shine effect */}
        <motion.div 
          className="absolute top-1 left-1/4 w-1/3 h-1/6 rounded-full bg-white/30 blur-sm"
          animate={state === 'reflecting' ? { 
            rotate: 360,
            x: [0, 10, 0, -10, 0]
          } : undefined}
          transition={{ duration: 20, repeat: Infinity }}
        />

        {/* Eyes */}
        <div className={cn("absolute inset-0 flex items-center justify-center", config.eyeGap)}>
          <motion.div
            className={cn(
              "rounded-full bg-white/90",
              config.eye,
              isBlinking && "scale-y-0"
            )}
            animate={state === 'thinking' ? { y: [0, -2, 0] } : undefined}
            transition={{ duration: 1, repeat: Infinity }}
          />
          <motion.div
            className={cn(
              "rounded-full bg-white/90",
              config.eye,
              isBlinking && "scale-y-0"
            )}
            animate={state === 'thinking' ? { y: [0, -2, 0] } : undefined}
            transition={{ duration: 1, repeat: Infinity, delay: 0.1 }}
          />
        </div>

        {/* State indicator overlay */}
        {state === 'listening' && (
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-green-400"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1, repeat: Infinity }}
          />
        )}

        {/* Night mode overlay */}
        {state === 'night' && (
          <div className="absolute inset-0 rounded-full bg-black/30" />
        )}
      </motion.div>

      {/* State label (optional, for debugging) */}
      {/* <span className="absolute -bottom-6 text-xs text-muted-foreground capitalize">{state}</span> */}
    </div>
  );
};
