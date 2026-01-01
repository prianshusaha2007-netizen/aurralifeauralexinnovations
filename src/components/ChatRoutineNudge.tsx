import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Clock, X, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { PendingNudge, useSmartRoutine, RoutineActivityType } from '@/hooks/useSmartRoutine';
import { toast } from 'sonner';
import auraAvatar from '@/assets/aura-avatar.jpeg';

interface ChatRoutineNudgeProps {
  nudge: PendingNudge;
  onRespond: (action: 'start' | 'shift' | 'skip', blockId: string) => void;
  onSendMessage?: (message: string) => void;
}

const ACTIVITY_CONFIG: Record<RoutineActivityType, { icon: string; gradient: string }> = {
  study: { icon: '📚', gradient: 'from-blue-500 to-cyan-500' },
  work: { icon: '💼', gradient: 'from-orange-500 to-amber-500' },
  gym: { icon: '💪', gradient: 'from-red-500 to-pink-500' },
  coding: { icon: '💻', gradient: 'from-green-500 to-emerald-500' },
  music: { icon: '🎵', gradient: 'from-purple-500 to-violet-500' },
  content: { icon: '🎬', gradient: 'from-pink-500 to-rose-500' },
  school: { icon: '🎓', gradient: 'from-indigo-500 to-blue-500' },
  creative: { icon: '🎨', gradient: 'from-fuchsia-500 to-purple-500' },
  rest: { icon: '☕', gradient: 'from-amber-500 to-yellow-500' },
  custom: { icon: '⭐', gradient: 'from-gray-500 to-slate-500' },
};

export const ChatRoutineNudge: React.FC<ChatRoutineNudgeProps> = ({
  nudge,
  onRespond,
  onSendMessage,
}) => {
  const [showTimeShift, setShowTimeShift] = useState(false);
  const [shiftTime, setShiftTime] = useState('');
  const { shiftBlock } = useSmartRoutine();
  
  const config = ACTIVITY_CONFIG[nudge.block.type] || ACTIVITY_CONFIG.custom;
  
  const handleStart = useCallback(() => {
    onRespond('start', nudge.block.id);
    // Send a message to chat for natural flow
    if (onSendMessage) {
      onSendMessage(`Starting ${nudge.block.name.toLowerCase()} now`);
    }
  }, [nudge, onRespond, onSendMessage]);
  
  const handleShift = useCallback(() => {
    if (showTimeShift && shiftTime) {
      shiftBlock(nudge.block.id, shiftTime);
      onRespond('shift', nudge.block.id);
      setShowTimeShift(false);
    } else {
      setShowTimeShift(true);
    }
  }, [showTimeShift, shiftTime, nudge.block.id, shiftBlock, onRespond]);
  
  const handleSkip = useCallback(() => {
    onRespond('skip', nudge.block.id);
    toast('No problem. We\'ll skip this today.', { duration: 2000 });
  }, [nudge.block.id, onRespond]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className="flex gap-3"
    >
      {/* Activity icon as avatar */}
      <div 
        className={cn(
          'w-9 h-9 rounded-full flex items-center justify-center text-lg shrink-0',
          'bg-gradient-to-br ring-2 ring-background shadow-md',
          config.gradient
        )}
      >
        {config.icon}
      </div>

      {/* Message content */}
      <div className="flex-1 space-y-2.5 max-w-[85%]">
        {/* Nudge bubble */}
        <div className="bg-muted/50 rounded-2xl rounded-tl-sm p-3.5 border border-border/30">
          <div className="flex items-start justify-between gap-2 mb-1">
            <div>
              <p className="text-sm font-medium text-foreground">{nudge.block.name}</p>
              <p className="text-xs text-muted-foreground">{nudge.block.timing}</p>
            </div>
            <button
              onClick={handleSkip}
              className="p-1 rounded-full hover:bg-muted/80 transition-colors -mr-1 -mt-1"
            >
              <X className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </div>
          
          <p className="text-sm text-foreground whitespace-pre-line mt-2">
            {nudge.message}
          </p>
        </div>

        {/* Time shift input */}
        <AnimatePresence>
          {showTimeShift && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex gap-2 items-center"
            >
              <input
                type="time"
                value={shiftTime}
                onChange={(e) => setShiftTime(e.target.value)}
                className="rounded-full px-3 py-2 text-sm bg-card border border-border focus:outline-none focus:ring-2 focus:ring-primary/20"
                autoFocus
              />
              <Button 
                size="sm" 
                className="rounded-full"
                onClick={handleShift}
                disabled={!shiftTime}
              >
                Confirm
              </Button>
              <Button 
                size="sm" 
                variant="ghost"
                className="rounded-full text-muted-foreground"
                onClick={() => setShowTimeShift(false)}
              >
                Cancel
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quick action buttons */}
        {!showTimeShift && (
          <motion.div 
            className="flex gap-2 flex-wrap"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <motion.button
              onClick={handleStart}
              className={cn(
                'flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium',
                'bg-gradient-to-r text-white shadow-sm',
                config.gradient
              )}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Play className="w-3.5 h-3.5" />
              Start
            </motion.button>
            
            <motion.button
              onClick={handleShift}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium bg-muted hover:bg-muted/80 transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Clock className="w-3.5 h-3.5" />
              Shift
            </motion.button>
            
            <motion.button
              onClick={handleSkip}
              className="px-4 py-2 rounded-full text-sm text-muted-foreground hover:text-foreground transition-colors"
              whileTap={{ scale: 0.98 }}
            >
              Skip today
            </motion.button>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

// Compact version for when multiple nudges are pending
export const CompactNudgeBadge: React.FC<{
  count: number;
  onClick: () => void;
}> = ({ count, onClick }) => {
  if (count === 0) return null;
  
  return (
    <motion.button
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0 }}
      onClick={onClick}
      className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium hover:bg-primary/20 transition-colors"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
        {count}
      </span>
      <span>Routine {count === 1 ? 'nudge' : 'nudges'}</span>
      <ChevronRight className="w-4 h-4" />
    </motion.button>
  );
};
