/**
 * Today at a Glance - Enhanced Morning Experience
 * 
 * Shows weather, routine preview, and gentle focus setup
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sun, Cloud, CloudRain, Coffee, Dumbbell, BookOpen, Code, 
  Calendar, Volume2, VolumeX, X, Sparkles, Zap, Moon,
  CloudSun, Thermometer, Wind, Droplets, Target
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRoutineBlocks } from '@/hooks/useRoutineBlocks';
import { useVoiceFeedback } from '@/hooks/useVoiceFeedback';
import { useRealtimeContext } from '@/hooks/useRealtimeContext';
import { useUserStateDetection } from '@/hooks/useUserStateDetection';
import auraAvatar from '@/assets/aura-avatar.jpeg';

interface TodayAtGlanceProps {
  userName: string;
  onDismiss: () => void;
  onSetIntention: (intention: 'light' | 'balanced' | 'push') => void;
  onStartFocus?: (type: string) => void;
}

const BLOCK_ICONS: Record<string, React.ElementType> = {
  morning: Coffee,
  gym: Dumbbell,
  study: BookOpen,
  coding: Code,
  work: Target,
  default: Calendar,
};

export const TodayAtGlance: React.FC<TodayAtGlanceProps> = ({
  userName,
  onDismiss,
  onSetIntention,
  onStartFocus,
}) => {
  const [isTyping, setIsTyping] = useState(true);
  const [hasSpoken, setHasSpoken] = useState(false);
  const { blocks } = useRoutineBlocks();
  const { speak, stop, isSpeaking } = useVoiceFeedback();
  const { context, isReady: weatherReady } = useRealtimeContext();
  const { state: userState, adaptations } = useUserStateDetection();

  // Get today's blocks sorted by time
  const todayDayIndex = new Date().getDay();
  const todayBlocks = blocks
    .filter(b => b.isActive && b.days.includes(todayDayIndex))
    .sort((a, b) => {
      const timeA = a.startTime.split(':').map(Number);
      const timeB = b.startTime.split(':').map(Number);
      return (timeA[0] * 60 + timeA[1]) - (timeB[0] * 60 + timeB[1]);
    })
    .slice(0, 4);

  // Next upcoming block
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const nextBlock = todayBlocks.find(b => {
    const [h, m] = b.startTime.split(':').map(Number);
    return h * 60 + m > currentMinutes;
  });

  // Typing animation
  useEffect(() => {
    const timer = setTimeout(() => setIsTyping(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  // Generate greeting based on state and time
  const getGreeting = () => {
    const hour = now.getHours();
    
    // State-aware greeting
    if (userState === 'burnout' || userState === 'low_energy') {
      return `Hey ${userName}. Take it easy today.`;
    }
    if (userState === 'exam_mode') {
      return `Focus day, ${userName}. One step at a time.`;
    }
    
    // Time-based greeting
    if (hour < 6) return `Early start, ${userName}? Let's make it count.`;
    if (hour < 9) return `Good morning, ${userName} ☀️`;
    if (hour < 12) return `Morning, ${userName}. Here's today:`;
    if (hour < 17) return `Afternoon, ${userName}. Quick check-in:`;
    if (hour < 21) return `Evening, ${userName}. Wrapping up?`;
    return `Late night, ${userName}. Still going?`;
  };

  // Weather icon
  const getWeatherIcon = () => {
    const condition = context.condition?.toLowerCase() || '';
    if (condition.includes('rain')) return CloudRain;
    if (condition.includes('cloud')) return condition.includes('sun') ? CloudSun : Cloud;
    if (now.getHours() >= 19 || now.getHours() < 6) return Moon;
    return Sun;
  };
  const WeatherIcon = getWeatherIcon();

  // Format time for blocks
  const formatBlockTime = (time: string) => {
    const [hours, mins] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${mins.toString().padStart(2, '0')} ${period}`;
  };

  // Generate briefing text for voice
  const generateBriefingText = () => {
    const weatherText = context.temperature 
      ? `It's ${context.temperature} degrees and ${context.condition?.toLowerCase() || 'clear'}.` 
      : '';
    
    const routineText = todayBlocks.length > 0
      ? `Today you have ${todayBlocks.map(b => b.title.toLowerCase()).join(', ')}.`
      : "You have a flexible day ahead.";
    
    return `${getGreeting()} ${weatherText} ${routineText}`;
  };

  const handleSpeak = () => {
    if (isSpeaking) {
      stop();
    } else {
      speak(generateBriefingText());
      setHasSpoken(true);
    }
  };

  // Get intention options based on user state
  const getIntentionOptions = () => {
    if (userState === 'burnout') {
      return [
        { id: 'light' as const, label: 'Take it very light', icon: Coffee },
      ];
    }
    if (userState === 'low_energy') {
      return [
        { id: 'light' as const, label: 'Go slow', icon: Coffee },
        { id: 'balanced' as const, label: 'Just normal', icon: Calendar },
      ];
    }
    return [
      { id: 'light' as const, label: 'Light day', icon: Coffee },
      { id: 'balanced' as const, label: 'Balanced', icon: Calendar },
      { id: 'push' as const, label: 'Push it', icon: Zap },
    ];
  };

  const intentionOptions = getIntentionOptions();

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="p-4"
      >
        {/* AURRA Message */}
        <div className="flex gap-3 mb-4">
          <div className="w-9 h-9 rounded-full overflow-hidden ring-2 ring-primary/20 shrink-0">
            <img src={auraAvatar} alt="AURRA" className="w-full h-full object-cover" />
          </div>
          
          <div className="flex-1">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gradient-to-br from-primary/10 via-accent/5 to-muted/30 border border-primary/20 rounded-2xl rounded-tl-sm px-4 py-3"
            >
              {isTyping ? (
                <div className="flex gap-1.5 py-1">
                  <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Header with greeting */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-primary" />
                      <span className="text-xs font-medium text-primary">Today at a Glance</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-7 h-7 rounded-full"
                        onClick={handleSpeak}
                      >
                        {isSpeaking ? (
                          <VolumeX className="w-3.5 h-3.5 text-muted-foreground" />
                        ) : (
                          <Volume2 className="w-3.5 h-3.5 text-muted-foreground" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-6 h-6 rounded-full"
                        onClick={onDismiss}
                      >
                        <X className="w-3 h-3 text-muted-foreground" />
                      </Button>
                    </div>
                  </div>

                  {/* Greeting */}
                  <p className="text-foreground font-medium">
                    {getGreeting()}
                  </p>

                  {/* Weather strip */}
                  {weatherReady && context.temperature && (
                    <div className="flex items-center gap-3 py-2 px-3 rounded-xl bg-background/50 border border-border/50">
                      <WeatherIcon className="w-5 h-5 text-primary" />
                      <div className="flex-1">
                        <span className="text-sm font-medium">{context.temperature}°C</span>
                        <span className="text-sm text-muted-foreground ml-2">
                          {context.condition}
                        </span>
                      </div>
                      {context.humidity && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Droplets className="w-3 h-3" />
                          <span>{context.humidity}%</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Today's blocks */}
                  {todayBlocks.length > 0 ? (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Coming up</p>
                      <div className="flex flex-wrap gap-2">
                        {todayBlocks.slice(0, 3).map((block) => {
                          const IconComponent = BLOCK_ICONS[block.type] || BLOCK_ICONS.default;
                          const isNext = block === nextBlock;
                          return (
                            <motion.button
                              key={block.id}
                              onClick={() => onStartFocus?.(block.type)}
                              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all ${
                                isNext 
                                  ? 'bg-primary/20 border border-primary/30 text-primary' 
                                  : 'bg-muted/50 border border-border text-foreground'
                              }`}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              <IconComponent className="w-4 h-4" />
                              <span className="font-medium">{block.title}</span>
                              <span className="text-xs opacity-70">{formatBlockTime(block.startTime)}</span>
                            </motion.button>
                          );
                        })}
                        {todayBlocks.length > 3 && (
                          <span className="text-xs text-muted-foreground self-center">
                            +{todayBlocks.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No routines set. Your day is flexible.
                    </p>
                  )}

                  {/* Quick suggestion for next hour */}
                  {nextBlock && (
                    <p className="text-sm text-muted-foreground">
                      Next up: <span className="font-medium text-foreground">{nextBlock.title}</span> at {formatBlockTime(nextBlock.startTime)}
                    </p>
                  )}
                </div>
              )}
            </motion.div>
          </div>
        </div>

        {/* Intention buttons */}
        <AnimatePresence>
          {!isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ delay: 0.1 }}
              className="ml-12 space-y-2"
            >
              <p className="text-xs text-muted-foreground">How do you want today to feel?</p>
              <div className="flex gap-2 flex-wrap">
                {intentionOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <motion.button
                      key={option.id}
                      onClick={() => {
                        onSetIntention(option.id);
                        onDismiss();
                      }}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-border bg-card hover:bg-muted transition-all"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Icon className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium text-sm">{option.label}</span>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
};
