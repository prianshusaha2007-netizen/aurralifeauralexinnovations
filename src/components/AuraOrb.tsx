import React from 'react';
import { cn } from '@/lib/utils';
import auraLogo from '@/assets/aura-logo.jpeg';

interface AuraOrbProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isThinking?: boolean;
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

export const AuraOrb: React.FC<AuraOrbProps> = ({ 
  size = 'lg', 
  isThinking = false,
  className 
}) => {
  return (
    <div className={cn('relative flex items-center justify-center', className)}>
      {/* Outer glow ring */}
      <div 
        className={cn(
          'absolute rounded-full opacity-40',
          glowSizes[size],
          'bg-gradient-to-br from-primary/50 to-accent/50',
          'blur-xl',
          isThinking ? 'animate-pulse' : 'animate-breathe'
        )}
      />
      
      {/* Middle glow */}
      <div 
        className={cn(
          'absolute rounded-full opacity-50',
          sizeClasses[size],
          'bg-gradient-to-br from-primary/40 via-accent/30 to-primary/40',
          'blur-md',
          isThinking ? 'animate-pulse' : 'animate-breathe'
        )}
        style={{ transform: 'scale(1.15)', animationDelay: '0.2s' }}
      />
      
      {/* Main orb with logo */}
      <div 
        className={cn(
          'relative rounded-full overflow-hidden',
          sizeClasses[size],
          'shadow-lg ring-2 ring-primary/20',
          isThinking ? 'animate-pulse' : 'animate-breathe animate-pulse-glow'
        )}
        style={{ animationDelay: '0.1s' }}
      >
        <img 
          src={auraLogo} 
          alt="AURRA" 
          className="w-full h-full object-cover"
        />
        
        {/* Subtle overlay for glow effect */}
        <div 
          className={cn(
            "absolute inset-0 bg-gradient-to-br from-white/10 to-transparent",
            isThinking && "animate-pulse"
          )}
        />
      </div>

      {/* Thinking indicator */}
      {isThinking && (
        <div className="absolute -bottom-8 flex gap-1">
          <span className="w-2 h-2 rounded-full bg-primary animate-thinking" style={{ animationDelay: '0s' }} />
          <span className="w-2 h-2 rounded-full bg-primary animate-thinking" style={{ animationDelay: '0.2s' }} />
          <span className="w-2 h-2 rounded-full bg-primary animate-thinking" style={{ animationDelay: '0.4s' }} />
        </div>
      )}
    </div>
  );
};
