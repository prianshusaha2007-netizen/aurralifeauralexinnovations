/**
 * AURRA Focus Timer Overlay
 * 
 * Floating timer during active focus sessions with break reminders
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Timer, 
  Pause, 
  Play, 
  X, 
  Coffee, 
  Minimize2, 
  Maximize2,
  Target,
  BookOpen,
  Code,
  Dumbbell,
  Volume2,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useFocusModeAI, FocusType } from '@/hooks/useFocusModeAI';
import { toast } from 'sonner';

const focusIcons: Record<FocusType, typeof Timer> = {
  study: BookOpen,
  coding: Code,
  work: Target,
  creative: Sparkles,
  gym: Dumbbell,
  quiet: Volume2,
};

const focusColors: Record<FocusType, string> = {
  study: 'from-blue-500 to-indigo-500',
  coding: 'from-violet-500 to-purple-500',
  work: 'from-emerald-500 to-teal-500',
  creative: 'from-pink-500 to-fuchsia-500',
  gym: 'from-orange-500 to-red-500',
  quiet: 'from-rose-400 to-pink-400',
};

export const FocusTimerOverlay: React.FC = () => {
  const {
    isActive,
    remainingTime,
    currentSession,
    focusType,
    goal,
    pauseSession,
    resumeSession,
    endSession,
    formatTime,
  } = useFocusModeAI();

  const [isMinimized, setIsMinimized] = useState(false);
  const [showBreakReminder, setShowBreakReminder] = useState(false);
  const [breaksDismissed, setBreaksDismissed] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Break reminder logic - every 25 minutes of focused time
  useEffect(() => {
    if (!isActive || !currentSession) return;

    const sessionDuration = currentSession.duration * 60;
    const elapsed = sessionDuration - remainingTime;
    
    // Show break reminder every 25 minutes
    const breakInterval = 25 * 60; // 25 minutes
    const shouldShowBreak = elapsed > 0 && elapsed % breakInterval === 0 && elapsed < sessionDuration;
    
    if (shouldShowBreak && !showBreakReminder) {
      setShowBreakReminder(true);
    }
  }, [remainingTime, isActive, currentSession, showBreakReminder]);

  const handlePauseToggle = useCallback(() => {
    if (isPaused) {
      resumeSession();
      setIsPaused(false);
    } else {
      pauseSession();
      setIsPaused(true);
    }
  }, [isPaused, pauseSession, resumeSession]);

  const handleTakeBreak = useCallback(() => {
    pauseSession();
    setIsPaused(true);
    setShowBreakReminder(false);
    toast.success('Taking a 5-minute break 🧘', { duration: 3000 });
    
    // Auto-resume after 5 minutes
    setTimeout(() => {
      resumeSession();
      setIsPaused(false);
      toast.success('Break over! Let\'s continue 💪', { duration: 3000 });
    }, 5 * 60 * 1000);
  }, [pauseSession, resumeSession]);

  const handleDismissBreak = useCallback(() => {
    setShowBreakReminder(false);
    setBreaksDismissed(prev => prev + 1);
  }, []);

  const handleEnd = useCallback(() => {
    endSession(false);
  }, [endSession]);

  if (!isActive) return null;

  const Icon = focusType ? focusIcons[focusType] : Timer;
  const gradient = focusType ? focusColors[focusType] : 'from-primary to-accent';
  const progress = currentSession 
    ? ((currentSession.duration * 60 - remainingTime) / (currentSession.duration * 60)) * 100 
    : 0;

  return (
    <>
      {/* Minimized View - Floating Pill */}
      <AnimatePresence>
        {isMinimized && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -20 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50"
          >
            <button
              onClick={() => setIsMinimized(false)}
              className={cn(
                'flex items-center gap-3 px-4 py-2 rounded-full',
                'bg-gradient-to-r shadow-lg border border-white/10',
                gradient
              )}
            >
              <Icon className="w-4 h-4 text-white" />
              <span className="text-white font-mono font-bold">
                {formatTime(remainingTime)}
              </span>
              <Maximize2 className="w-4 h-4 text-white/70" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Expanded View - Full Overlay */}
      <AnimatePresence>
        {!isMinimized && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-4 left-4 right-4 z-50 max-w-md mx-auto"
          >
            <div className={cn(
              'rounded-2xl p-4 shadow-2xl border border-white/10',
              'bg-gradient-to-br backdrop-blur-xl',
              gradient
            )}>
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-white/70 text-xs font-medium uppercase tracking-wider">
                      {focusType || 'Focus'} Mode
                    </p>
                    {goal && (
                      <p className="text-white text-sm font-medium truncate max-w-[180px]">
                        {goal.description}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10"
                    onClick={() => setIsMinimized(true)}
                  >
                    <Minimize2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10"
                    onClick={handleEnd}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Timer Display */}
              <div className="text-center mb-3">
                <div className="text-5xl font-mono font-bold text-white mb-1">
                  {formatTime(remainingTime)}
                </div>
                <Progress 
                  value={progress} 
                  className="h-1.5 bg-white/20"
                />
              </div>

              {/* Controls */}
              <div className="flex items-center justify-center gap-3">
                <Button
                  size="lg"
                  variant="secondary"
                  className={cn(
                    'rounded-full h-12 w-12 p-0',
                    isPaused ? 'bg-white text-primary' : 'bg-white/20 text-white'
                  )}
                  onClick={handlePauseToggle}
                >
                  {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="rounded-full text-white/80 hover:text-white hover:bg-white/10"
                  onClick={handleTakeBreak}
                >
                  <Coffee className="w-4 h-4 mr-1.5" />
                  Break
                </Button>
              </div>

              {/* Status */}
              {isPaused && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-3 text-center"
                >
                  <p className="text-white/60 text-sm">Paused — tap play to continue</p>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Break Reminder Modal */}
      <AnimatePresence>
        {showBreakReminder && !isMinimized && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          >
            <div className="bg-card border rounded-2xl p-6 max-w-sm w-full shadow-2xl">
              <div className="text-center mb-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-amber-500/10 flex items-center justify-center mb-3">
                  <Coffee className="w-8 h-8 text-amber-500" />
                </div>
                <h3 className="text-lg font-semibold mb-1">Time for a break?</h3>
                <p className="text-sm text-muted-foreground">
                  You've been focused for a while. A short break helps you stay sharp.
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleDismissBreak}
                >
                  Keep going
                </Button>
                <Button
                  className="flex-1 bg-amber-500 hover:bg-amber-600"
                  onClick={handleTakeBreak}
                >
                  <Coffee className="w-4 h-4 mr-1.5" />
                  5 min break
                </Button>
              </div>

              {breaksDismissed > 0 && (
                <p className="text-xs text-muted-foreground text-center mt-3">
                  {breaksDismissed} break{breaksDismissed > 1 ? 's' : ''} skipped today
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
