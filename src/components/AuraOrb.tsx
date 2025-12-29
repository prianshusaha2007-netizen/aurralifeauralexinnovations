import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import auraLogo from '@/assets/aura-logo.jpeg';

interface AuraOrbProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isThinking?: boolean;
  isActive?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: 'w-12 h-12',
  md: 'w-20 h-20',
  lg: 'w-28 h-28',
  xl: 'w-40 h-40',
};

const glowSizes = {
  sm: 'w-16 h-16 -m-2',
  md: 'w-28 h-28 -m-4',
  lg: 'w-40 h-40 -m-6',
  xl: 'w-56 h-56 -m-8',
};

// Eye position and size relative to orb
const eyeConfigs = {
  sm: { size: 6, left: 8, right: 8, top: 14 },
  md: { size: 10, left: 14, right: 14, top: 24 },
  lg: { size: 14, left: 20, right: 20, top: 34 },
  xl: { size: 20, left: 28, right: 28, top: 48 },
};

// Particle configuration
const particleCount = 8;

const Particle: React.FC<{ delay: number; size: 'sm' | 'md' | 'lg' | 'xl' }> = ({ delay, size }) => {
  const orbSize = { sm: 48, md: 80, lg: 112, xl: 160 }[size];
  const startX = Math.random() * orbSize - orbSize / 2;
  
  return (
    <motion.div
      className="absolute rounded-full bg-primary/60"
      style={{
        width: Math.random() * 4 + 2,
        height: Math.random() * 4 + 2,
        left: '50%',
        bottom: '20%',
      }}
      initial={{ 
        x: startX, 
        y: 0, 
        opacity: 0,
        scale: 0 
      }}
      animate={{ 
        x: [startX, startX + (Math.random() - 0.5) * 30],
        y: [0, -80 - Math.random() * 40],
        opacity: [0, 0.8, 0],
        scale: [0, 1, 0.5]
      }}
      transition={{
        duration: 2 + Math.random(),
        delay,
        repeat: Infinity,
        repeatDelay: Math.random() * 0.5,
        ease: "easeOut"
      }}
    />
  );
};

export const AuraOrb: React.FC<AuraOrbProps> = ({ 
  size = 'lg', 
  isThinking = false,
  isActive = false,
  className 
}) => {
  const eyeConfig = eyeConfigs[size];
  const [isBlinking, setIsBlinking] = useState(false);

  // Random blink effect
  useEffect(() => {
    const scheduleNextBlink = () => {
      const delay = 2000 + Math.random() * 4000; // 2-6 seconds
      return setTimeout(() => {
        setIsBlinking(true);
        setTimeout(() => setIsBlinking(false), 150); // Blink duration
        scheduleNextBlink();
      }, delay);
    };

    const timeoutId = scheduleNextBlink();
    return () => clearTimeout(timeoutId);
  }, []);

  const showParticles = isThinking || isActive;

  return (
    <div className={cn('relative flex items-center justify-center', className)}>
      {/* Floating particles during active state */}
      <AnimatePresence>
        {showParticles && (
          <div className="absolute inset-0 pointer-events-none overflow-visible">
            {Array.from({ length: particleCount }).map((_, i) => (
              <Particle key={i} delay={i * 0.25} size={size} />
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Outer teal aura ring - pulsing glow */}
      <div 
        className={cn(
          'absolute rounded-full',
          glowSizes[size],
          'bg-gradient-to-br from-primary/40 to-primary/20',
          'blur-xl',
          isThinking ? 'animate-eye-thinking' : 'animate-aura-ring-pulse'
        )}
      />
      
      {/* Middle glow layer */}
      <div 
        className={cn(
          'absolute rounded-full opacity-60',
          sizeClasses[size],
          'bg-gradient-to-br from-primary/30 via-accent/20 to-primary/30',
          'blur-md',
          isThinking ? 'animate-pulse' : 'animate-breathe'
        )}
        style={{ transform: 'scale(1.2)', animationDelay: '0.15s' }}
      />
      
      {/* Main orb with logo */}
      <div 
        className={cn(
          'relative rounded-full overflow-hidden',
          sizeClasses[size],
          'shadow-lg ring-2 ring-primary/30',
          isThinking ? 'animate-pulse' : 'animate-breathe animate-pulse-glow'
        )}
        style={{ animationDelay: '0.1s' }}
      >
        <img 
          src={auraLogo} 
          alt="AURRA" 
          className="w-full h-full object-cover"
        />
        
        {/* Left eye glow overlay with blink */}
        <motion.div 
          className={cn(
            "absolute rounded-full",
            isThinking ? "animate-eye-thinking" : "animate-eye-glow"
          )}
          animate={{
            scaleY: isBlinking ? 0.1 : 1,
            opacity: isBlinking ? 0.4 : 1
          }}
          transition={{ duration: 0.1 }}
          style={{
            width: eyeConfig.size,
            height: eyeConfig.size,
            left: eyeConfig.left,
            top: eyeConfig.top,
            background: 'radial-gradient(circle, hsl(45 80% 60% / 0.6) 0%, transparent 70%)',
            mixBlendMode: 'screen',
            transformOrigin: 'center',
          }}
        />
        
        {/* Right eye glow overlay with blink */}
        <motion.div 
          className={cn(
            "absolute rounded-full",
            isThinking ? "animate-eye-thinking" : "animate-eye-glow"
          )}
          animate={{
            scaleY: isBlinking ? 0.1 : 1,
            opacity: isBlinking ? 0.4 : 1
          }}
          transition={{ duration: 0.1 }}
          style={{
            width: eyeConfig.size,
            height: eyeConfig.size,
            right: eyeConfig.right,
            top: eyeConfig.top,
            background: 'radial-gradient(circle, hsl(45 80% 60% / 0.6) 0%, transparent 70%)',
            mixBlendMode: 'screen',
            transformOrigin: 'center',
          }}
        />
        
        {/* Subtle shine overlay */}
        <div 
          className={cn(
            "absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent",
            isThinking && "animate-pulse"
          )}
        />
      </div>

      {/* Thinking indicator dots */}
      {isThinking && (
        <div className="absolute -bottom-8 flex gap-1.5">
          <span className="w-2 h-2 rounded-full bg-primary animate-thinking" style={{ animationDelay: '0s' }} />
          <span className="w-2 h-2 rounded-full bg-primary animate-thinking" style={{ animationDelay: '0.2s' }} />
          <span className="w-2 h-2 rounded-full bg-primary animate-thinking" style={{ animationDelay: '0.4s' }} />
        </div>
      )}
    </div>
  );
};
