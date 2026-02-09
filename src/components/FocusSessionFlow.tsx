import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, Code, Briefcase, Palette, VolumeX, Dumbbell,
  Sparkles, X, ArrowLeft, Coffee
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { FocusType } from '@/hooks/useFocusModeAI';
import { useFocusSessionNudges } from '@/hooks/useFocusSessionNudges';

interface FocusFramingCardProps {
  focusType: FocusType;
  framingMessage: string;
  goal?: string;
  onDismiss: () => void;
}

// Initial framing card shown when session starts
export const FocusFramingCard: React.FC<FocusFramingCardProps> = ({
  focusType,
  framingMessage,
  goal,
  onDismiss,
}) => {
  const getGradient = () => {
    switch (focusType) {
      case 'gym': return 'from-orange-500/20 via-amber-500/10 to-transparent';
      case 'coding': return 'from-emerald-500/20 via-green-500/10 to-transparent';
      case 'study': return 'from-blue-500/20 via-indigo-500/10 to-transparent';
      case 'creative': return 'from-purple-500/20 via-pink-500/10 to-transparent';
      default: return 'from-primary/20 via-primary/10 to-transparent';
    }
  };

  const getIcon = () => {
    switch (focusType) {
      case 'gym': return <Dumbbell className="w-6 h-6" />;
      case 'coding': return <Code className="w-6 h-6" />;
      case 'study': return <BookOpen className="w-6 h-6" />;
      case 'work': return <Briefcase className="w-6 h-6" />;
      case 'creative': return <Palette className="w-6 h-6" />;
      case 'quiet': return <VolumeX className="w-6 h-6" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className={cn(
        "relative overflow-hidden rounded-2xl border border-border/50",
        "bg-gradient-to-br", getGradient()
      )}
    >
      {/* Soft ambient glow */}
      <div className="absolute inset-0 bg-gradient-to-t from-background/50 to-transparent" />
      
      <div className="relative p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center",
            focusType === 'gym' ? "bg-orange-500/20 text-orange-500" : "bg-primary/20 text-primary"
          )}>
            {getIcon()}
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={onDismiss}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Framing Message */}
        <div className="space-y-2">
          <h3 className="text-lg font-medium text-foreground leading-relaxed">
            {framingMessage}
          </h3>
          {goal && (
            <p className="text-sm text-muted-foreground">
              Today's focus: <span className="text-foreground">{goal}</span>
            </p>
          )}
        </div>

        {/* Status indicator */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
            className={cn(
              "w-2 h-2 rounded-full",
              focusType === 'gym' ? "bg-orange-500" : "bg-emerald-500"
            )}
          />
          <span>Focusing</span>
        </div>
      </div>
    </motion.div>
  );
};

// Gentle nudge card (appears during session)
interface FocusNudgeCardProps {
  message: string;
  emoji?: string;
  isBreakSuggestion?: boolean;
  onDismiss: () => void;
  onAcceptBreak?: () => void;
}

export const FocusNudgeCard: React.FC<FocusNudgeCardProps> = ({
  message,
  emoji,
  isBreakSuggestion,
  onDismiss,
  onAcceptBreak,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="bg-card/80 backdrop-blur-sm border border-border/30 rounded-xl p-4"
    >
      <div className="flex items-start gap-3">
        <span className="text-xl">{emoji || '✨'}</span>
        <div className="flex-1 space-y-2">
          <p className="text-sm text-foreground">{message}</p>
          
          {isBreakSuggestion && (
            <div className="flex gap-2">
              <Button 
                variant="soft" 
                size="sm" 
                onClick={onAcceptBreak}
                className="text-xs gap-1"
              >
                <Coffee className="w-3 h-3" />
                Take 5
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onDismiss}
                className="text-xs text-muted-foreground"
              >
                I'm good
              </Button>
            </div>
          )}
          
          {!isBreakSuggestion && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onDismiss}
              className="text-xs text-muted-foreground"
            >
              Okay
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// Post-session reflection with emotion rating
interface FocusReflectionFlowProps {
  goal?: string;
  focusType: FocusType;
  sessionDuration: number;
  affirmation: string;
  reflectionPrompt: string;
  onComplete: (result: 'yes' | 'almost' | 'not_today', emotion: string, note?: string) => void;
}

export const FocusReflectionFlow: React.FC<FocusReflectionFlowProps> = ({
  goal,
  focusType,
  sessionDuration,
  affirmation,
  reflectionPrompt,
  onComplete,
}) => {
  const [step, setStep] = useState<'result' | 'emotion' | 'note'>('result');
  const [result, setResult] = useState<'yes' | 'almost' | 'not_today' | null>(null);
  const [emotion, setEmotion] = useState<string>('');
  const [note, setNote] = useState('');

  const emotions = [
    { id: 'calm', emoji: '😌', label: 'Calm' },
    { id: 'accomplished', emoji: '✨', label: 'Accomplished' },
    { id: 'motivated', emoji: '🔥', label: 'Motivated' },
    { id: 'tired', emoji: '😴', label: 'Tired' },
    { id: 'stressed', emoji: '😓', label: 'Stressed' },
    { id: 'neutral', emoji: '😐', label: 'Neutral' },
  ];

  const handleResultSelect = (r: 'yes' | 'almost' | 'not_today') => {
    setResult(r);
    setStep('emotion');
  };

  const handleEmotionSelect = (e: string) => {
    setEmotion(e);
    // Skip note step for quick flow
    onComplete(result!, e);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-card/90 backdrop-blur-sm border border-border/50 rounded-2xl p-5 space-y-4"
    >
      {/* Affirmation */}
      <div className="text-center space-y-1">
        <Sparkles className="w-6 h-6 mx-auto text-primary mb-2" />
        <p className="text-foreground font-medium">{affirmation}</p>
      </div>

      <AnimatePresence mode="wait">
        {step === 'result' && (
          <motion.div
            key="result"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-3"
          >
            <p className="text-sm text-muted-foreground text-center">{reflectionPrompt}</p>
            {goal && (
              <p className="text-xs text-center italic text-muted-foreground">"{goal}"</p>
            )}
            
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant="outline"
                onClick={() => handleResultSelect('yes')}
                className="flex-col gap-1 h-auto py-3 rounded-xl"
              >
                <span className="text-lg">✅</span>
                <span className="text-xs">{focusType === 'gym' ? 'Great' : 'Yes'}</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => handleResultSelect('almost')}
                className="flex-col gap-1 h-auto py-3 rounded-xl"
              >
                <span className="text-lg">🤏</span>
                <span className="text-xs">Almost</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => handleResultSelect('not_today')}
                className="flex-col gap-1 h-auto py-3 rounded-xl"
              >
                <span className="text-lg">🔄</span>
                <span className="text-xs">Not today</span>
              </Button>
            </div>
          </motion.div>
        )}

        {step === 'emotion' && (
          <motion.div
            key="emotion"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-3"
          >
            <p className="text-sm text-muted-foreground text-center">How are you feeling?</p>
            
            <div className="grid grid-cols-3 gap-2">
              {emotions.map((e) => (
                <Button
                  key={e.id}
                  variant="outline"
                  onClick={() => handleEmotionSelect(e.id)}
                  className="flex-col gap-1 h-auto py-3 rounded-xl"
                >
                  <span className="text-lg">{e.emoji}</span>
                  <span className="text-xs">{e.label}</span>
                </Button>
              ))}
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setStep('result')}
              className="w-full text-xs text-muted-foreground gap-1"
            >
              <ArrowLeft className="w-3 h-3" />
              Back
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// Summary card (shown after reflection)
interface FocusSummaryCardProps {
  mode: FocusType;
  duration: number;
  completed: string;
  emotion: string;
  streak?: number;
  onDismiss: () => void;
}

// Gentle summary card — no metrics, no streak pressure
export const FocusSummaryCard: React.FC<FocusSummaryCardProps> = ({
  mode,
  duration,
  completed,
  emotion,
  streak,
  onDismiss,
}) => {
  const getEmoji = () => {
    switch (emotion) {
      case 'calm': return '😌';
      case 'accomplished': return '✨';
      case 'motivated': return '🔥';
      case 'tired': return '😴';
      case 'stressed': return '😓';
      default: return '😐';
    }
  };

  const getMessage = () => {
    switch (emotion) {
      case 'calm': return "That sounds like a good session.";
      case 'accomplished': return "Glad that felt productive.";
      case 'motivated': return "Nice. Ride that energy.";
      case 'tired': return "Rest well. You earned it.";
      case 'stressed': return "Take it easy. Tomorrow's fresh.";
      default: return "Thanks for sharing.";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-card/90 backdrop-blur-sm border border-border/50 rounded-2xl p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <span className="text-2xl">{getEmoji()}</span>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onDismiss}>
          <X className="w-4 h-4" />
        </Button>
      </div>
      
      <p className="text-sm text-foreground">{getMessage()}</p>
    </motion.div>
  );
};
