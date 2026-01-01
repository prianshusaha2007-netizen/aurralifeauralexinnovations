import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import { useAura } from '@/contexts/AuraContext';
import { useSmartRoutine, RoutineActivityType } from '@/hooks/useSmartRoutine';
import auraAvatar from '@/assets/aura-avatar.jpeg';

interface RoutineOnboardingChatProps {
  onComplete: () => void;
  onSkip: () => void;
}

type OnboardingStep = 'intro' | 'wake' | 'sleep' | 'activities' | 'flexibility' | 'confirm' | 'done';

const ACTIVITY_OPTIONS: { id: RoutineActivityType; label: string; emoji: string }[] = [
  { id: 'study', label: 'Study / Classes', emoji: '📚' },
  { id: 'work', label: 'Work / Business', emoji: '💼' },
  { id: 'gym', label: 'Gym / Workout', emoji: '💪' },
  { id: 'coding', label: 'Coding / Tech', emoji: '💻' },
  { id: 'music', label: 'Music / Creative', emoji: '🎵' },
  { id: 'content', label: 'Content Creation', emoji: '🎬' },
];

export const RoutineOnboardingChat: React.FC<RoutineOnboardingChatProps> = ({
  onComplete,
  onSkip,
}) => {
  const { userProfile, updateUserProfile } = useAura();
  const { updateSchedule, addBlock, completeOnboarding } = useSmartRoutine();
  
  const [step, setStep] = useState<OnboardingStep>('intro');
  const [wakeTime, setWakeTime] = useState('07:00');
  const [sleepTime, setSleepTime] = useState('23:00');
  const [selectedActivities, setSelectedActivities] = useState<RoutineActivityType[]>([]);
  const [flexibility, setFlexibility] = useState<'chill' | 'structured'>('chill');
  const [isTyping, setIsTyping] = useState(true);

  // Typing animation on step change
  useEffect(() => {
    setIsTyping(true);
    const timer = setTimeout(() => setIsTyping(false), 1000 + Math.random() * 500);
    return () => clearTimeout(timer);
  }, [step]);

  const toggleActivity = useCallback((id: RoutineActivityType) => {
    setSelectedActivities(prev => 
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    );
  }, []);

  const handleNext = useCallback(() => {
    switch (step) {
      case 'intro':
        setStep('wake');
        break;
      case 'wake':
        updateUserProfile({ wakeTime });
        setStep('sleep');
        break;
      case 'sleep':
        updateUserProfile({ sleepTime });
        updateSchedule(wakeTime, sleepTime);
        setStep('activities');
        break;
      case 'activities':
        // Create routine blocks for selected activities
        selectedActivities.forEach((activityType, index) => {
          // Stagger times based on wake time
          const [wakeHours] = wakeTime.split(':').map(Number);
          const blockHour = wakeHours + 2 + (index * 3); // Space them 3 hours apart
          const timing = `${String(blockHour % 24).padStart(2, '0')}:00`;
          
          addBlock({
            name: ACTIVITY_OPTIONS.find(a => a.id === activityType)?.label || activityType,
            type: activityType,
            timing,
            flexibility: 'window',
            frequency: 'daily',
            isActive: true,
            notificationsEnabled: true,
          });
        });
        setStep('flexibility');
        break;
      case 'flexibility':
        updateUserProfile({ 
          tonePreference: flexibility === 'chill' ? 'casual' : 'supportive'
        });
        setStep('confirm');
        break;
      case 'confirm':
        completeOnboarding();
        localStorage.setItem('aurra-routine-onboarding-complete', 'true');
        setStep('done');
        setTimeout(onComplete, 2000);
        break;
    }
  }, [step, wakeTime, sleepTime, selectedActivities, flexibility, updateUserProfile, updateSchedule, addBlock, completeOnboarding, onComplete]);

  const handleSkip = useCallback(() => {
    localStorage.setItem('aurra-routine-onboarding-complete', 'true');
    onSkip();
  }, [onSkip]);

  const messages: Record<OnboardingStep, string> = {
    intro: "Before we go ahead — want me to shape your day around how you actually live?",
    wake: "Cool. I'll keep this quick.\n\nWhen do you usually wake up?",
    sleep: "And when do you usually sleep?",
    activities: "Which of these are part of your regular day?\nYou can pick more than one.",
    flexibility: "Got it.\n\nHow strict should I be with reminders?",
    confirm: `Nice. I'll gently shape your day around:\n• Wake at ${wakeTime}\n• ${selectedActivities.length} activities\n• ${flexibility === 'chill' ? 'Chill reminders' : 'Structured reminders'}\n\nYou can change anything anytime.`,
    done: "All set 🌟\nLet's start your day.",
  };

  return (
    <AnimatePresence mode="wait">
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
              key={step}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-muted/50 rounded-2xl rounded-tl-sm px-4 py-3 max-w-[85%]"
            >
              {isTyping ? (
                <div className="flex gap-1.5 py-1">
                  <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              ) : (
                <p className="text-foreground whitespace-pre-line">{messages[step]}</p>
              )}
            </motion.div>
          </div>
        </div>

        {/* Response Options */}
        <AnimatePresence>
          {!isTyping && step !== 'done' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ delay: 0.1 }}
              className="ml-12 space-y-3"
            >
              {step === 'intro' && (
                <div className="flex gap-2 flex-wrap">
                  <Button onClick={handleNext} className="rounded-full">
                    Sure
                  </Button>
                  <Button variant="ghost" onClick={handleSkip} className="rounded-full text-muted-foreground">
                    Skip for now
                  </Button>
                </div>
              )}

              {step === 'wake' && (
                <div className="flex gap-2 items-center flex-wrap">
                  <input
                    type="time"
                    value={wakeTime}
                    onChange={(e) => setWakeTime(e.target.value)}
                    className="rounded-full px-4 py-2.5 bg-card border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <Button onClick={handleNext} className="rounded-full">
                    Continue
                  </Button>
                </div>
              )}

              {step === 'sleep' && (
                <div className="flex gap-2 items-center flex-wrap">
                  <input
                    type="time"
                    value={sleepTime}
                    onChange={(e) => setSleepTime(e.target.value)}
                    className="rounded-full px-4 py-2.5 bg-card border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <Button onClick={handleNext} className="rounded-full">
                    Continue
                  </Button>
                </div>
              )}

              {step === 'activities' && (
                <div className="space-y-3">
                  <div className="flex gap-2 flex-wrap">
                    {ACTIVITY_OPTIONS.map(opt => (
                      <motion.button
                        key={opt.id}
                        onClick={() => toggleActivity(opt.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all ${
                          selectedActivities.includes(opt.id)
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-card border-border hover:border-primary/50'
                        }`}
                        whileTap={{ scale: 0.95 }}
                      >
                        <span>{opt.emoji}</span>
                        <span className="text-sm font-medium">{opt.label}</span>
                        {selectedActivities.includes(opt.id) && (
                          <Check className="w-4 h-4" />
                        )}
                      </motion.button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      onClick={handleNext} 
                      disabled={selectedActivities.length === 0}
                      className="rounded-full"
                    >
                      Continue ({selectedActivities.length} selected)
                    </Button>
                    <Button 
                      variant="ghost"
                      onClick={() => {
                        setSelectedActivities([]);
                        handleNext();
                      }}
                      className="rounded-full text-muted-foreground"
                    >
                      Nothing fixed
                    </Button>
                  </div>
                </div>
              )}

              {step === 'flexibility' && (
                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant={flexibility === 'chill' ? 'default' : 'outline'}
                    onClick={() => {
                      setFlexibility('chill');
                      setTimeout(handleNext, 200);
                    }}
                    className="rounded-full"
                  >
                    Chill — gentle nudges
                  </Button>
                  <Button
                    variant={flexibility === 'structured' ? 'default' : 'outline'}
                    onClick={() => {
                      setFlexibility('structured');
                      setTimeout(handleNext, 200);
                    }}
                    className="rounded-full"
                  >
                    Structured — keep me on track
                  </Button>
                </div>
              )}

              {step === 'confirm' && (
                <div className="flex gap-2 flex-wrap">
                  <Button onClick={handleNext} className="rounded-full">
                    Looks good
                  </Button>
                  <Button 
                    variant="ghost" 
                    onClick={() => setStep('wake')}
                    className="rounded-full text-muted-foreground"
                  >
                    Let me adjust
                  </Button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Done State */}
        {step === 'done' && !isTyping && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="ml-12 text-sm text-muted-foreground"
          >
            Setting up your day...
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};
