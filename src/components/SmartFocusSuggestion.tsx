/**
 * AURRA Smart Focus Suggestion
 * 
 * Shows rhythm-aware focus suggestions in chat
 */

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Target, 
  BookOpen, 
  Code, 
  Dumbbell, 
  Volume2, 
  Clock,
  ChevronRight,
  Sparkles 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { FocusType } from '@/hooks/useFocusModeAI';

interface SmartFocusSuggestionProps {
  type: FocusType;
  reason: string;
  duration: number;
  confidence: 'high' | 'medium' | 'low';
  onStart: () => void;
  onDismiss: () => void;
}

const focusConfig: Record<FocusType, { 
  icon: typeof Target; 
  label: string; 
  color: string; 
  gradient: string 
}> = {
  study: {
    icon: BookOpen,
    label: 'Study',
    color: 'text-blue-500',
    gradient: 'from-blue-500/10 to-indigo-500/10',
  },
  work: {
    icon: Target,
    label: 'Work',
    color: 'text-emerald-500',
    gradient: 'from-emerald-500/10 to-teal-500/10',
  },
  coding: {
    icon: Code,
    label: 'Coding',
    color: 'text-violet-500',
    gradient: 'from-violet-500/10 to-purple-500/10',
  },
  creative: {
    icon: Sparkles,
    label: 'Creative',
    color: 'text-pink-500',
    gradient: 'from-pink-500/10 to-fuchsia-500/10',
  },
  gym: {
    icon: Dumbbell,
    label: 'Workout',
    color: 'text-orange-500',
    gradient: 'from-orange-500/10 to-red-500/10',
  },
  quiet: {
    icon: Volume2,
    label: 'Quiet Focus',
    color: 'text-pink-500',
    gradient: 'from-pink-500/10 to-rose-500/10',
  },
};

export const SmartFocusSuggestion: React.FC<SmartFocusSuggestionProps> = ({
  type,
  reason,
  duration,
  confidence,
  onStart,
  onDismiss,
}) => {
  const config = focusConfig[type];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -5 }}
      className={cn(
        'rounded-xl p-4 border border-border/50',
        `bg-gradient-to-br ${config.gradient}`
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn(
          'w-10 h-10 rounded-xl flex items-center justify-center',
          'bg-background/80'
        )}>
          <Icon className={cn('w-5 h-5', config.color)} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={cn('font-medium', config.color)}>
              {config.label} Time?
            </span>
            {confidence === 'high' && (
              <span className="text-xs px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
                Based on your rhythm
              </span>
            )}
          </div>
          
          <p className="text-sm text-muted-foreground mb-3">
            {reason}
          </p>

          <div className="flex items-center gap-3">
            <Button
              size="sm"
              onClick={onStart}
              className={cn('gap-1')}
            >
              <Clock className="w-3.5 h-3.5" />
              {duration} min session
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
            
            <Button
              size="sm"
              variant="ghost"
              onClick={onDismiss}
              className="text-muted-foreground"
            >
              Not now
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Compact version for header/banner
export const FocusSuggestionBanner: React.FC<{
  type: FocusType;
  onStart: () => void;
}> = ({ type, onStart }) => {
  const config = focusConfig[type];
  const Icon = config.icon;

  return (
    <motion.button
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onStart}
      className={cn(
        'flex items-center gap-2 px-3 py-1.5 rounded-full',
        'bg-accent/50 border border-border/50',
        'hover:bg-accent transition-colors',
        'text-sm'
      )}
    >
      <Icon className={cn('w-4 h-4', config.color)} />
      <span className="text-muted-foreground">
        {config.label} time?
      </span>
      <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
    </motion.button>
  );
};
