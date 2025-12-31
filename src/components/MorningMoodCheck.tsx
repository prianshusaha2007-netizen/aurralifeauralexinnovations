import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Cloud, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useSmartRoutine, MoodLevel } from '@/hooks/useSmartRoutine';
import { AuraOrb } from './AuraOrb';

interface MorningMoodCheckProps {
  onComplete: (mood: MoodLevel) => void;
  userName?: string;
}

const MOOD_STORAGE_KEY = 'aurra-last-mood-check';

export const MorningMoodCheck: React.FC<MorningMoodCheckProps> = ({ onComplete, userName }) => {
  const { setMood, settings } = useSmartRoutine();
  const [selectedMood, setSelectedMood] = useState<MoodLevel | null>(null);
  const [showMessage, setShowMessage] = useState(false);

  const moods: { value: MoodLevel; label: string; icon: React.ReactNode; color: string; response: string }[] = [
    { 
      value: 'low', 
      label: 'Low energy', 
      icon: <Cloud className="w-6 h-6" />,
      color: 'from-slate-400 to-gray-500',
      response: "That's okay. We'll keep things light today."
    },
    { 
      value: 'normal', 
      label: 'Normal', 
      icon: <Sun className="w-6 h-6" />,
      color: 'from-amber-400 to-orange-500',
      response: "Good. Let's have a steady day."
    },
    { 
      value: 'high', 
      label: 'High energy', 
      icon: <Zap className="w-6 h-6" />,
      color: 'from-green-400 to-emerald-500',
      response: "Nice! Ready to make the most of it."
    },
  ];

  const handleSelect = (mood: MoodLevel) => {
    setSelectedMood(mood);
    setMood(mood);
    
    // Store check time
    localStorage.setItem(MOOD_STORAGE_KEY, new Date().toISOString());
    
    // Show response message
    setShowMessage(true);
    
    // Auto-complete after delay
    setTimeout(() => {
      onComplete(mood);
    }, 2000);
  };

  const selectedMoodConfig = moods.find(m => m.value === selectedMood);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-3xl border border-border/50 p-6 max-w-sm mx-auto"
    >
      <div className="flex justify-center mb-4">
        <AuraOrb size="md" />
      </div>

      <AnimatePresence mode="wait">
        {!selectedMood ? (
          <motion.div
            key="question"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            <div className="text-center">
              <p className="text-lg font-medium">
                Morning{userName ? ` ${userName}` : ''} 🙂
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                How are you feeling today — low, normal, or energetic?
              </p>
            </div>

            <div className="flex gap-3">
              {moods.map((mood) => (
                <motion.button
                  key={mood.value}
                  onClick={() => handleSelect(mood.value)}
                  className={cn(
                    'flex-1 p-4 rounded-2xl border border-border/50 transition-all',
                    'hover:border-primary/50 hover:bg-muted/30',
                    'flex flex-col items-center gap-2'
                  )}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className={cn(
                    'w-12 h-12 rounded-full flex items-center justify-center',
                    'bg-gradient-to-br text-white',
                    mood.color
                  )}>
                    {mood.icon}
                  </div>
                  <span className="text-xs font-medium">{mood.label}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="response"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-4"
          >
            <motion.div
              className={cn(
                'w-16 h-16 rounded-full flex items-center justify-center mx-auto',
                'bg-gradient-to-br text-white',
                selectedMoodConfig?.color
              )}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring' }}
            >
              {selectedMoodConfig?.icon}
            </motion.div>
            <p className="text-sm text-muted-foreground">
              {selectedMoodConfig?.response}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// Hook to check if we should show morning mood check
export const useShouldShowMoodCheck = () => {
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    const lastCheck = localStorage.getItem(MOOD_STORAGE_KEY);
    const now = new Date();
    const hour = now.getHours();

    // Only show in morning hours (5 AM - 11 AM)
    if (hour < 5 || hour > 11) {
      setShouldShow(false);
      return;
    }

    if (!lastCheck) {
      setShouldShow(true);
      return;
    }

    const lastCheckDate = new Date(lastCheck);
    const isNewDay = lastCheckDate.toDateString() !== now.toDateString();
    
    setShouldShow(isNewDay);
  }, []);

  const dismiss = () => {
    localStorage.setItem(MOOD_STORAGE_KEY, new Date().toISOString());
    setShouldShow(false);
  };

  return { shouldShow, dismiss };
};
