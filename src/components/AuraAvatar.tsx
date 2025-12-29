import React from 'react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';
import { motion } from 'framer-motion';

export type AvatarStyle = 'silhouette' | 'abstract' | 'geometric' | 'illustrated';
export type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

interface AuraAvatarProps {
  style?: AvatarStyle;
  size?: AvatarSize;
  isThinking?: boolean;
  isSpeaking?: boolean;
  className?: string;
  showBreathing?: boolean;
}

const sizeMap = {
  sm: 'w-8 h-8',
  md: 'w-12 h-12',
  lg: 'w-20 h-20',
  xl: 'w-32 h-32',
};

const innerSizeMap = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-10 h-10',
  xl: 'w-16 h-16',
};

export const AuraAvatar: React.FC<AuraAvatarProps> = ({
  style = 'abstract',
  size = 'md',
  isThinking = false,
  isSpeaking = false,
  className,
  showBreathing = true,
}) => {
  const { activeTheme } = useTheme();
  const isDark = activeTheme === 'dark';

  // Silhouette - minimal human form
  const SilhouetteAvatar = () => (
    <div className={cn(
      sizeMap[size],
      'relative rounded-full overflow-hidden',
      'bg-gradient-to-br from-primary/20 to-accent/20',
      'border border-primary/30',
      className
    )}>
      {/* Head silhouette */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className={cn(
          innerSizeMap[size],
          'rounded-full bg-gradient-to-br from-primary/60 to-primary/40',
          isThinking && 'animate-pulse'
        )} />
      </div>
      {/* Subtle glow ring */}
      {isSpeaking && (
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-primary/50"
          animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      )}
    </div>
  );

  // Abstract - soft face-like form
  const AbstractAvatar = () => (
    <div className={cn(
      sizeMap[size],
      'relative rounded-full overflow-hidden',
      'bg-gradient-to-br from-primary/15 to-accent/15',
      isDark ? 'bg-aura-surface-elevated' : 'bg-card',
      'border border-primary/20',
      showBreathing && !isThinking && 'animate-breathe',
      className
    )}>
      {/* Inner glow core */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          className={cn(
            innerSizeMap[size],
            'rounded-full',
            'bg-gradient-to-br from-primary to-accent',
            isThinking && 'animate-eye-thinking'
          )}
          animate={isSpeaking ? {
            scale: [1, 1.2, 1],
            opacity: [0.8, 1, 0.8],
          } : {}}
          transition={{ duration: 0.8, repeat: isSpeaking ? Infinity : 0 }}
        />
      </div>
      {/* Outer ring */}
      <div className={cn(
        'absolute inset-0 rounded-full',
        'border border-primary/30',
        isSpeaking && 'animate-aura-ring-pulse'
      )} />
    </div>
  );

  // Geometric - calm shapes
  const GeometricAvatar = () => (
    <div className={cn(
      sizeMap[size],
      'relative overflow-hidden',
      'bg-gradient-to-br from-primary/10 to-accent/10',
      isDark ? 'bg-aura-surface-elevated' : 'bg-card',
      'border border-primary/20',
      'rounded-2xl',
      showBreathing && !isThinking && 'animate-breathe',
      className
    )}>
      {/* Geometric pattern */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          className={cn(
            'w-1/2 h-1/2 rounded-lg rotate-45',
            'bg-gradient-to-br from-primary to-accent',
            isThinking && 'animate-pulse'
          )}
          animate={isSpeaking ? {
            rotate: [45, 55, 45],
            scale: [1, 1.1, 1],
          } : {}}
          transition={{ duration: 1, repeat: isSpeaking ? Infinity : 0 }}
        />
      </div>
    </div>
  );

  // Illustrated - gentle human-like form
  const IllustratedAvatar = () => (
    <div className={cn(
      sizeMap[size],
      'relative rounded-full overflow-hidden',
      'bg-gradient-to-br from-primary/20 via-accent/10 to-primary/20',
      isDark ? 'bg-aura-surface-elevated' : 'bg-card',
      'border border-primary/20',
      showBreathing && !isThinking && 'animate-breathe',
      className
    )}>
      {/* Face representation - two eyes and smile */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
        {/* Eyes */}
        <div className="flex gap-1">
          <motion.div
            className={cn(
              size === 'sm' ? 'w-1 h-1' : size === 'md' ? 'w-1.5 h-1.5' : 'w-2 h-2',
              'rounded-full bg-primary',
              isThinking && 'animate-eye-thinking'
            )}
            animate={!isThinking ? { scaleY: [1, 0.1, 1] } : {}}
            transition={{ duration: 4, repeat: Infinity, repeatDelay: 2 }}
          />
          <motion.div
            className={cn(
              size === 'sm' ? 'w-1 h-1' : size === 'md' ? 'w-1.5 h-1.5' : 'w-2 h-2',
              'rounded-full bg-primary',
              isThinking && 'animate-eye-thinking'
            )}
            animate={!isThinking ? { scaleY: [1, 0.1, 1] } : {}}
            transition={{ duration: 4, repeat: Infinity, repeatDelay: 2 }}
          />
        </div>
        {/* Smile - subtle curve */}
        {size !== 'sm' && (
          <motion.div
            className={cn(
              size === 'md' ? 'w-2 h-0.5' : 'w-3 h-1',
              'rounded-full bg-primary/60 mt-0.5'
            )}
            animate={isSpeaking ? {
              scaleX: [1, 1.3, 1],
              scaleY: [1, 0.5, 1],
            } : {}}
            transition={{ duration: 0.3, repeat: isSpeaking ? Infinity : 0 }}
          />
        )}
      </div>
      {/* Speaking ring */}
      {isSpeaking && (
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-accent/40"
          animate={{ scale: [1, 1.1, 1], opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 1, repeat: Infinity }}
        />
      )}
    </div>
  );

  // Render based on style
  switch (style) {
    case 'silhouette':
      return <SilhouetteAvatar />;
    case 'geometric':
      return <GeometricAvatar />;
    case 'illustrated':
      return <IllustratedAvatar />;
    case 'abstract':
    default:
      return <AbstractAvatar />;
  }
};
