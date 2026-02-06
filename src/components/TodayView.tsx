import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sun, Moon, CloudSun, Sunrise, 
  Zap, Leaf, Coffee, HelpCircle,
  Bell, Check, Clock, Sparkles,
  ChevronRight, Target, Droplets
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAurraDailyPlan, DailyPlan } from '@/hooks/useAurraDailyPlan';
import { useReminders, Reminder } from '@/hooks/useReminders';
import { useMoodCheckIn } from '@/hooks/useMoodCheckIn';
import { format, isToday, isFuture } from 'date-fns';

interface TodayViewProps {
  onAskAurra?: (message: string) => void;
  className?: string;
}

// Get time of day
const getTimeOfDay = (): 'morning' | 'afternoon' | 'evening' | 'night' => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
};

const timeIcons = {
  morning: Sunrise,
  afternoon: Sun,
  evening: CloudSun,
  night: Moon,
};

const timeGreetings = {
  morning: 'Good morning',
  afternoon: 'Good afternoon', 
  evening: 'Good evening',
  night: 'Good night',
};

// Intensity config
const intensityConfig = {
  light: {
    icon: Leaf,
    label: 'Light Day',
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
    description: 'Taking it easy today',
  },
  normal: {
    icon: Coffee,
    label: 'Steady Day',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    description: 'A balanced, productive day',
  },
  busy: {
    icon: Zap,
    label: 'Busy Day',
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
    description: 'Lots to handle — I\'ll help you pace',
  },
  unknown: {
    icon: HelpCircle,
    label: 'Flexible',
    color: 'text-muted-foreground',
    bgColor: 'bg-muted/50',
    description: 'Going with the flow',
  },
};

// Mood emoji map
const moodEmoji: Record<string, string> = {
  happy: '😊',
  calm: '😌',
  energetic: '⚡',
  sad: '😔',
  stressed: '😰',
  tired: '😴',
  angry: '😤',
  bored: '😐',
  confused: '🤔',
};

export const TodayView: React.FC<TodayViewProps> = ({ onAskAurra, className }) => {
  const timeOfDay = getTimeOfDay();
  const TimeIcon = timeIcons[timeOfDay];
  
  const { currentPlan, shouldAskForPlan } = useAurraDailyPlan();
  const { reminders, getTimeRemaining } = useReminders();
  const { currentMood } = useMoodCheckIn();
  
  const [dailyScore, setDailyScore] = useState(0);

  // Calculate daily score (simple version)
  useEffect(() => {
    let score = 0;
    
    // Plan set: +20
    if (currentPlan) score += 20;
    
    // Mood logged: +15
    if (currentMood) score += 15;
    
    // Active reminders: +5 each (max 25)
    const activeReminders = reminders.filter(r => r.isActive && r.status === 'scheduled');
    score += Math.min(activeReminders.length * 5, 25);
    
    // Completed reminders today: +10 each (max 40)
    const completedToday = reminders.filter(r => 
      r.status === 'completed' && 
      r.completedAt && 
      isToday(new Date(r.completedAt))
    );
    score += Math.min(completedToday.length * 10, 40);
    
    setDailyScore(Math.min(score, 100));
  }, [currentPlan, currentMood, reminders]);

  // Get upcoming reminders (next 3)
  const upcomingReminders = reminders
    .filter(r => r.isActive && r.status === 'scheduled' && isFuture(new Date(r.time)))
    .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime())
    .slice(0, 3);

  const handleSetPlan = () => {
    onAskAurra?.("What's my plan for today?");
  };

  const handleCheckMood = () => {
    onAskAurra?.("I want to check in about how I'm feeling");
  };

  return (
    <div className={cn('space-y-4 p-4', className)}>
      {/* Header with greeting */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-primary/10">
            <TimeIcon className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-medium">{timeGreetings[timeOfDay]}</h2>
            <p className="text-sm text-muted-foreground">
              {format(new Date(), 'EEEE, MMMM d')}
            </p>
          </div>
        </div>
        
        {/* Daily Score */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10"
        >
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-primary">{dailyScore}%</span>
        </motion.div>
      </motion.div>

      {/* Today's Plan Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-2xl border bg-card p-4 space-y-3"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">Today's Plan</span>
          </div>
          {currentPlan && (
            <div className={cn(
              'px-2 py-0.5 rounded-full text-xs font-medium',
              intensityConfig[currentPlan.intensity].bgColor,
              intensityConfig[currentPlan.intensity].color
            )}>
              {intensityConfig[currentPlan.intensity].label}
            </div>
          )}
        </div>
        
        {currentPlan ? (
          <div className="space-y-2">
            <p className="text-sm text-foreground/80">"{currentPlan.plan}"</p>
            {currentPlan.keywords.length > 0 && (
              <div className="flex gap-1.5 flex-wrap">
                {currentPlan.keywords.map((keyword) => (
                  <span
                    key={keyword}
                    className="px-2 py-0.5 rounded-full text-xs bg-muted text-muted-foreground"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              {intensityConfig[currentPlan.intensity].description}
            </p>
          </div>
        ) : (
          <button
            onClick={handleSetPlan}
            className="w-full py-3 rounded-xl border-2 border-dashed border-muted-foreground/20 
                       text-sm text-muted-foreground hover:border-primary/30 hover:text-primary 
                       transition-colors flex items-center justify-center gap-2"
          >
            <span>Tell AURRA about your day</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </motion.div>

      {/* Mood & Energy Row */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-2 gap-3"
      >
        {/* Current Mood */}
        <button
          onClick={handleCheckMood}
          className="rounded-xl border bg-card p-3 text-left hover:bg-accent/50 transition-colors"
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">
              {currentMood ? moodEmoji[currentMood] || '💭' : '💭'}
            </span>
            <span className="text-xs font-medium text-muted-foreground">Mood</span>
          </div>
          <p className="text-sm font-medium capitalize">
            {currentMood || 'Check in'}
          </p>
        </button>

        {/* Quick Stats */}
        <div className="rounded-xl border bg-card p-3">
          <div className="flex items-center gap-2 mb-1">
            <Bell className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">Reminders</span>
          </div>
          <p className="text-sm font-medium">
            {upcomingReminders.length} upcoming
          </p>
        </div>
      </motion.div>

      {/* Upcoming Reminders */}
      {upcomingReminders.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-2xl border bg-card p-4 space-y-3"
        >
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">Coming Up</span>
          </div>
          
          <div className="space-y-2">
            {upcomingReminders.map((reminder, index) => (
              <motion.div
                key={reminder.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index }}
                className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/30"
              >
                <div className="flex items-center gap-3">
                  <span className="text-base">{reminder.icon}</span>
                  <div>
                    <p className="text-sm font-medium">{reminder.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(reminder.time), 'h:mm a')}
                    </p>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">
                  {getTimeRemaining(reminder)}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Empty state for no reminders */}
      {upcomingReminders.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-2xl border border-dashed bg-card/50 p-6 text-center"
        >
          <Bell className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No upcoming reminders</p>
          <p className="text-xs text-muted-foreground/70 mt-1">
            Ask AURRA to set one for you
          </p>
        </motion.div>
      )}

      {/* Gentle suggestion */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-center pt-2"
      >
        <p className="text-xs text-muted-foreground/60">
          This updates as your day unfolds ✨
        </p>
      </motion.div>
    </div>
  );
};

export default TodayView;
