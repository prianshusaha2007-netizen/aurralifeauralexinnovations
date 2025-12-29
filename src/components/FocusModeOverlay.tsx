import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Pause, Play, Music, Timer, 
  Focus, Volume2, VolumeX, Maximize2, Minimize2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useFocusMode } from '@/hooks/useFocusMode';
import { AuraOrb } from './AuraOrb';

interface FocusModeOverlayProps {
  blockTitle?: string;
  blockType?: string;
  onClose?: () => void;
}

export const FocusModeOverlay: React.FC<FocusModeOverlayProps> = ({
  blockTitle,
  blockType,
  onClose
}) => {
  const {
    isActive,
    currentSession,
    remainingTime,
    musicPlaying,
    startSession,
    endSession,
    pauseSession,
    resumeSession,
    toggleMusic,
    formatTime,
    getTotalFocusTime
  } = useFocusMode();

  const [isMinimized, setIsMinimized] = useState(false);
  const [showDurationPicker, setShowDurationPicker] = useState(!isActive);

  const durations = [15, 25, 45, 60, 90];

  const handleStartSession = (duration: number) => {
    startSession(duration, blockType, true);
    setShowDurationPicker(false);
  };

  const handleEndSession = () => {
    endSession(false);
    onClose?.();
  };

  const progress = currentSession 
    ? ((currentSession.duration * 60 - remainingTime) / (currentSession.duration * 60)) * 100
    : 0;

  // Minimized view
  if (isMinimized && isActive) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="fixed bottom-24 right-4 z-50"
      >
        <button
          onClick={() => setIsMinimized(false)}
          className={cn(
            'w-16 h-16 rounded-full flex items-center justify-center',
            'bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/30',
            'text-primary-foreground font-bold text-sm'
          )}
        >
          {formatTime(remainingTime)}
        </button>
      </motion.div>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-background/95 backdrop-blur-xl"
      >
        <div className="absolute inset-0 overflow-hidden">
          {/* Ambient background gradients */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        <div className="relative h-full flex flex-col items-center justify-center p-6">
          {/* Header Controls */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMinimized(true)}
              className="rounded-full"
            >
              <Minimize2 className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleEndSession}
              className="rounded-full"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Duration Picker */}
          {showDurationPicker && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <Focus className="w-16 h-16 mx-auto text-primary mb-6" />
              <h2 className="text-2xl font-bold mb-2">Focus Mode</h2>
              <p className="text-muted-foreground mb-8">
                {blockTitle ? `Time for ${blockTitle}` : 'How long do you want to focus?'}
              </p>
              
              <div className="flex flex-wrap gap-3 justify-center max-w-sm">
                {durations.map((duration) => (
                  <Button
                    key={duration}
                    variant="outline"
                    onClick={() => handleStartSession(duration)}
                    className="w-20 h-20 rounded-2xl flex flex-col items-center justify-center"
                  >
                    <span className="text-2xl font-bold">{duration}</span>
                    <span className="text-xs text-muted-foreground">min</span>
                  </Button>
                ))}
              </div>

              <Button
                variant="ghost"
                onClick={handleEndSession}
                className="mt-8"
              >
                Maybe later
              </Button>
            </motion.div>
          )}

          {/* Active Session View */}
          {isActive && !showDurationPicker && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              {/* Timer Ring */}
              <div className="relative w-64 h-64 mx-auto mb-8">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="128"
                    cy="128"
                    r="120"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                    className="text-muted/20"
                  />
                  <circle
                    cx="128"
                    cy="128"
                    r="120"
                    fill="none"
                    stroke="url(#gradient)"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 120}`}
                    strokeDashoffset={`${2 * Math.PI * 120 * (1 - progress / 100)}`}
                    className="transition-all duration-1000"
                  />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="hsl(var(--primary))" />
                      <stop offset="100%" stopColor="hsl(var(--primary) / 0.6)" />
                    </linearGradient>
                  </defs>
                </svg>
                
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-5xl font-bold tracking-tight">
                    {formatTime(remainingTime)}
                  </span>
                  <span className="text-sm text-muted-foreground mt-2">
                    {blockTitle || 'Focus Session'}
                  </span>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-center gap-4 mb-8">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={toggleMusic}
                  className="w-14 h-14 rounded-full"
                >
                  {musicPlaying ? (
                    <Volume2 className="w-6 h-6" />
                  ) : (
                    <VolumeX className="w-6 h-6" />
                  )}
                </Button>

                <Button
                  onClick={isActive ? pauseSession : resumeSession}
                  size="icon"
                  className="w-20 h-20 rounded-full aura-gradient"
                >
                  {isActive ? (
                    <Pause className="w-8 h-8" />
                  ) : (
                    <Play className="w-8 h-8" />
                  )}
                </Button>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleEndSession}
                  className="w-14 h-14 rounded-full"
                >
                  <X className="w-6 h-6" />
                </Button>
              </div>

              {/* Stats */}
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  Today's focus time: <span className="font-semibold">{getTotalFocusTime()} min</span>
                </p>
              </div>

              {/* Breathing Guide (optional subtle animation) */}
              <motion.div
                className="mt-8 text-muted-foreground/50 text-sm"
                animate={{ opacity: [0.3, 0.7, 0.3] }}
                transition={{ duration: 4, repeat: Infinity }}
              >
                Breathe and focus...
              </motion.div>
            </motion.div>
          )}

          {/* Motivational Quote */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="absolute bottom-8 text-center text-sm text-muted-foreground/70 max-w-md"
          >
            "Deep work is the ability to focus without distraction on a cognitively demanding task."
          </motion.p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

// Quick Focus Button for easy access
export const QuickFocusButton: React.FC<{ onClick: () => void }> = ({ onClick }) => {
  return (
    <Button
      onClick={onClick}
      variant="outline"
      className="gap-2"
    >
      <Focus className="w-4 h-4" />
      Focus Mode
    </Button>
  );
};
