import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Square, History, Dumbbell, Code, Video, Palette, Music, Sparkles, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useSkillsProgress, SkillType } from '@/hooks/useSkillsProgress';
import { SkillSessionHistory } from '@/components/SkillSessionHistory';
import { cn } from '@/lib/utils';
import confetti from 'canvas-confetti';

const SKILL_ICONS: Record<SkillType, React.ElementType> = {
  gym: Dumbbell,
  coding: Code,
  video_editing: Video,
  graphic_design: Palette,
  music: Music,
  content_creation: Sparkles,
  self_discipline: Target,
  general: Target,
};

const SKILL_COLORS: Record<SkillType, string> = {
  gym: 'text-red-500',
  coding: 'text-blue-500',
  video_editing: 'text-purple-500',
  graphic_design: 'text-pink-500',
  music: 'text-amber-500',
  content_creation: 'text-emerald-500',
  self_discipline: 'text-orange-500',
  general: 'text-primary',
};

const SKILL_CONFETTI_COLORS: Record<SkillType, string[]> = {
  gym: ['#ef4444', '#f87171', '#fca5a5'],
  coding: ['#3b82f6', '#60a5fa', '#93c5fd'],
  video_editing: ['#a855f7', '#c084fc', '#d8b4fe'],
  graphic_design: ['#ec4899', '#f472b6', '#f9a8d4'],
  music: ['#f59e0b', '#fbbf24', '#fcd34d'],
  content_creation: ['#10b981', '#34d399', '#6ee7b7'],
  self_discipline: ['#f97316', '#fb923c', '#fdba74'],
  general: ['#8b5cf6', '#a78bfa', '#c4b5fd'],
};

interface SkillSessionTimerProps {
  compact?: boolean;
  onSessionEnd?: () => void;
}

export const SkillSessionTimer: React.FC<SkillSessionTimerProps> = ({ 
  compact = false,
  onSessionEnd 
}) => {
  const { currentSession, skills, endSession } = useSkillsProgress();
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Find the skill for the current session
  const activeSkill = currentSession 
    ? skills.find(s => s.id === currentSession.skillId)
    : null;

  // Timer effect
  useEffect(() => {
    if (!currentSession || isPaused) return;

    const startTime = new Date(currentSession.startedAt).getTime();
    
    const updateTimer = () => {
      const now = Date.now();
      setElapsedSeconds(Math.floor((now - startTime) / 1000));
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [currentSession, isPaused]);

  const triggerCelebration = useCallback((skillType: SkillType) => {
    const colors = SKILL_CONFETTI_COLORS[skillType];
    
    // First burst - center
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors,
    });

    // Second burst - left side
    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors,
      });
    }, 150);

    // Third burst - right side
    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors,
      });
    }, 300);
  }, []);

  if (!currentSession || !activeSkill) {
    // Show history button when no active session
    return (
      <>
        <SkillSessionHistory open={showHistory} onOpenChange={setShowHistory} />
      </>
    );
  }

  const targetSeconds = activeSkill.sessionDurationMinutes * 60;
  const progress = Math.min((elapsedSeconds / targetSeconds) * 100, 100);
  const isOvertime = elapsedSeconds > targetSeconds;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleEndSession = () => {
    // Trigger celebration confetti
    triggerCelebration(activeSkill.type);
    
    // End the session
    endSession();
    onSessionEnd?.();
  };

  const Icon = SKILL_ICONS[activeSkill.type];
  const colorClass = SKILL_COLORS[activeSkill.type];

  if (compact) {
    return (
      <>
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="flex items-center gap-3 px-4 py-2 bg-primary/10 border-b border-primary/20 cursor-pointer"
          onClick={() => setShowHistory(true)}
        >
          <div className={cn("p-1.5 rounded-full bg-background", colorClass)}>
            <Icon className="w-4 h-4" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium truncate">{activeSkill.displayName}</span>
              <span className={cn(
                "text-sm font-mono",
                isOvertime ? "text-amber-500" : "text-muted-foreground"
              )}>
                {formatTime(elapsedSeconds)}
              </span>
            </div>
            <Progress value={progress} className="h-1 mt-1" />
          </div>

          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setIsPaused(!isPaused)}
            >
              {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={handleEndSession}
            >
              <Square className="w-4 h-4" />
            </Button>
          </div>
        </motion.div>
        
        <SkillSessionHistory open={showHistory} onOpenChange={setShowHistory} />
      </>
    );
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="px-4 pb-3"
      >
        <Card 
          className="p-4 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20 cursor-pointer"
          onClick={() => setShowHistory(true)}
        >
          <div className="flex items-start gap-4">
            {/* Icon */}
            <div className={cn(
              "p-3 rounded-xl bg-background shadow-sm",
              colorClass
            )}>
              <Icon className="w-6 h-6" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  {activeSkill.displayName} Session
                  <History className="w-4 h-4 text-muted-foreground" />
                </h3>
                {isOvertime && (
                  <span className="text-xs text-amber-500 font-medium">
                    +{formatTime(elapsedSeconds - targetSeconds)} overtime
                  </span>
                )}
              </div>

              {/* Timer Display */}
              <div className="flex items-baseline gap-2 mb-3">
                <span className={cn(
                  "text-3xl font-mono font-bold",
                  isOvertime ? "text-amber-500" : "text-foreground"
                )}>
                  {formatTime(elapsedSeconds)}
                </span>
                <span className="text-sm text-muted-foreground">
                  / {formatTime(targetSeconds)}
                </span>
              </div>

              {/* Progress Bar */}
              <Progress 
                value={progress} 
                className={cn(
                  "h-2 mb-3",
                  isOvertime && "[&>div]:bg-amber-500"
                )} 
              />

              {/* Controls */}
              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                <Button
                  variant={isPaused ? "default" : "secondary"}
                  size="sm"
                  onClick={() => setIsPaused(!isPaused)}
                  className="flex-1"
                >
                  {isPaused ? (
                    <>
                      <Play className="w-4 h-4 mr-1" /> Resume
                    </>
                  ) : (
                    <>
                      <Pause className="w-4 h-4 mr-1" /> Pause
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleEndSession}
                  className="flex-1"
                >
                  <Square className="w-4 h-4 mr-1" /> End Session
                </Button>
              </div>

              {/* Motivational text */}
              {!isPaused && (
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  {isOvertime 
                    ? "Great dedication! End when you're ready." 
                    : progress > 75 
                      ? "Almost there! Keep pushing!" 
                      : "Stay focused, you've got this!"}
                </p>
              )}
            </div>
          </div>
        </Card>
      </motion.div>
      
      <SkillSessionHistory open={showHistory} onOpenChange={setShowHistory} />
    </>
  );
};

export default SkillSessionTimer;
