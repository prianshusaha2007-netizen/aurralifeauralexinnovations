import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Focus, X, Clock, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useRoutineBlocks } from '@/hooks/useRoutineBlocks';
import { useRoutineNotifications } from '@/hooks/useRoutineNotifications';
import { FocusModeOverlay } from './FocusModeOverlay';

export const FloatingFocusButton: React.FC = () => {
  const { activeBlock, focusModeActive, startFocusMode, blocks, createDefaultBlocks } = useRoutineBlocks();
  const { getUpcomingBlocks } = useRoutineNotifications(blocks);
  const [showOverlay, setShowOverlay] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [upcomingCount, setUpcomingCount] = useState(0);

  // Create sample blocks if none exist (for testing)
  useEffect(() => {
    if (blocks.length === 0) {
      createDefaultBlocks();
    }
  }, [blocks.length, createDefaultBlocks]);

  // Check upcoming blocks
  useEffect(() => {
    const check = () => {
      const upcoming = getUpcomingBlocks();
      setUpcomingCount(upcoming.length);
    };
    check();
    const interval = setInterval(check, 60000);
    return () => clearInterval(interval);
  }, [getUpcomingBlocks]);

  // Don't show if no active block or user dismissed
  if (!activeBlock || isDismissed) return null;

  // Don't show if focus mode overlay is already active
  if (showOverlay) {
    return (
      <FocusModeOverlay
        blockTitle={activeBlock.block.title}
        blockType={activeBlock.block.type}
        onClose={() => setShowOverlay(false)}
      />
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: 20 }}
        className="fixed bottom-24 right-4 z-40"
      >
        <div className="relative">
          {/* Upcoming notifications badge */}
          {upcomingCount > 0 && (
            <div className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center z-10">
              <Bell className="w-3 h-3 text-white" />
            </div>
          )}

          {/* Dismiss button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsDismissed(true)}
            className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-muted/80 hover:bg-muted z-10"
          >
            <X className="w-3 h-3" />
          </Button>

          {/* Main button */}
          <motion.button
            onClick={() => setShowOverlay(true)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={cn(
              'flex items-center gap-3 px-4 py-3 rounded-2xl',
              'bg-gradient-to-r shadow-lg backdrop-blur-sm',
              'border border-white/10',
              activeBlock.block.color
            )}
          >
            {/* Pulsing indicator */}
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <Focus className="w-5 h-5 text-white" />
              </div>
              <motion.div
                className="absolute inset-0 rounded-full bg-white/30"
                animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </div>

            <div className="text-left text-white">
              <p className="font-semibold text-sm">{activeBlock.block.title}</p>
              <div className="flex items-center gap-1 text-xs text-white/80">
                <Clock className="w-3 h-3" />
                <span>{activeBlock.remainingMinutes}m left</span>
              </div>
            </div>

            <div className="ml-2 px-2 py-1 bg-white/20 rounded-lg">
              <span className="text-xs font-medium text-white">Focus</span>
            </div>
          </motion.button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
