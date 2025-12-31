import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Clock, X, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { PendingNudge, useSmartRoutine } from '@/hooks/useSmartRoutine';

interface SmartRoutineNudgeProps {
  nudge: PendingNudge | null;
  onRespond: (action: 'start' | 'shift' | 'skip') => void;
  className?: string;
}

export const SmartRoutineNudge: React.FC<SmartRoutineNudgeProps> = ({
  nudge,
  onRespond,
  className,
}) => {
  const { getActivityConfig } = useSmartRoutine();
  
  if (!nudge) return null;

  const config = getActivityConfig(nudge.block.type);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        className={cn(
          'bg-card rounded-3xl border border-border/50 p-4 shadow-lg',
          className
        )}
      >
        {/* Header */}
        <div className="flex items-start gap-3 mb-4">
          <div className={cn(
            'w-12 h-12 rounded-2xl flex items-center justify-center text-2xl',
            'bg-gradient-to-br',
            config.color
          )}>
            {config.icon}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">
              {nudge.block.name}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {nudge.block.timing}
            </p>
          </div>
          <button
            onClick={() => onRespond('skip')}
            className="p-1.5 rounded-full hover:bg-muted/50 transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Message - WhatsApp style */}
        <div className="bg-muted/30 rounded-2xl rounded-tl-sm p-3 mb-4">
          <p className="text-sm text-foreground whitespace-pre-line">
            {nudge.message}
          </p>
        </div>

        {/* Action buttons - friendly, not commanding */}
        <div className="flex gap-2">
          <Button
            onClick={() => onRespond('start')}
            className={cn(
              'flex-1 rounded-full bg-gradient-to-r',
              config.color,
              'text-white border-0'
            )}
          >
            <Play className="w-4 h-4 mr-2" />
            Start
          </Button>
          <Button
            variant="outline"
            onClick={() => onRespond('shift')}
            className="flex-1 rounded-full"
          >
            <Clock className="w-4 h-4 mr-2" />
            Shift
          </Button>
          <Button
            variant="ghost"
            onClick={() => onRespond('skip')}
            className="rounded-full px-4 text-muted-foreground"
          >
            Skip today
          </Button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

// Inline nudge for chat view
export const InlineChatNudge: React.FC<{
  nudge: PendingNudge;
  onRespond: (action: 'start' | 'shift' | 'skip') => void;
}> = ({ nudge, onRespond }) => {
  const { getActivityConfig } = useSmartRoutine();
  const config = getActivityConfig(nudge.block.type);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex gap-3"
    >
      {/* Avatar-like icon */}
      <div className={cn(
        'w-9 h-9 rounded-full flex items-center justify-center text-lg shrink-0',
        'bg-gradient-to-br ring-2 ring-background',
        config.color
      )}>
        {config.icon}
      </div>

      {/* Message bubble */}
      <div className="flex-1 space-y-2">
        <div className="bg-muted/50 rounded-2xl rounded-tl-sm p-3 max-w-[85%]">
          <p className="text-sm whitespace-pre-line">{nudge.message}</p>
        </div>

        {/* Quick actions */}
        <div className="flex gap-2 flex-wrap">
          <motion.button
            onClick={() => onRespond('start')}
            className={cn(
              'px-4 py-2 rounded-full text-sm font-medium',
              'bg-gradient-to-r text-white',
              config.color
            )}
            whileTap={{ scale: 0.95 }}
          >
            Start
          </motion.button>
          <motion.button
            onClick={() => onRespond('shift')}
            className="px-4 py-2 rounded-full text-sm font-medium bg-muted hover:bg-muted/80 transition-colors"
            whileTap={{ scale: 0.95 }}
          >
            Shift
          </motion.button>
          <motion.button
            onClick={() => onRespond('skip')}
            className="px-4 py-2 rounded-full text-sm text-muted-foreground hover:text-foreground transition-colors"
            whileTap={{ scale: 0.95 }}
          >
            Skip today
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};
