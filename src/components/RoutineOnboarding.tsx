import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft, Check, Clock, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AuraOrb } from '@/components/AuraOrb';
import { cn } from '@/lib/utils';
import { useSmartRoutine, RoutineActivityType, FlexibilityLevel, MotivationBlocker, SmartRoutineBlock } from '@/hooks/useSmartRoutine';

interface RoutineOnboardingProps {
  onComplete: () => void;
  onSkip: () => void;
}

type OnboardingStep = 
  | 'intro'
  | 'wake_sleep'
  | 'activities'
  | 'timing'
  | 'blockers'
  | 'complete';

interface ActivitySelection {
  type: RoutineActivityType;
  timing: string;
  flexibility: FlexibilityLevel;
  blocker?: MotivationBlocker;
}

const ACTIVITY_OPTIONS: { type: RoutineActivityType; label: string; icon: string }[] = [
  { type: 'school', label: 'School / College', icon: '🎓' },
  { type: 'work', label: 'Work', icon: '💼' },
  { type: 'gym', label: 'Gym / Workout', icon: '💪' },
  { type: 'study', label: 'Study', icon: '📚' },
  { type: 'coding', label: 'Coding / Skill learning', icon: '💻' },
  { type: 'music', label: 'Music / Creative', icon: '🎵' },
  { type: 'content', label: 'Content creation', icon: '🎬' },
];

const FLEXIBILITY_OPTIONS: { value: FlexibilityLevel; label: string; desc: string }[] = [
  { value: 'fixed', label: 'Fixed time', desc: 'Same time every day' },
  { value: 'window', label: 'Rough window', desc: 'Around this time' },
  { value: 'alternate', label: 'Alternate days', desc: 'Every other day' },
  { value: 'depends', label: 'Depends', desc: 'Varies day to day' },
];

const BLOCKER_OPTIONS: { value: MotivationBlocker; label: string; icon: string }[] = [
  { value: 'tired', label: 'Tired', icon: '😴' },
  { value: 'distracted', label: 'Distracted', icon: '📱' },
  { value: 'no_motivation', label: 'No motivation', icon: '😕' },
  { value: 'time_slips', label: 'Time slips', icon: '⏰' },
  { value: 'overthinking', label: 'Overthinking', icon: '🤔' },
  { value: 'none', label: 'Nothing really', icon: '✨' },
];

// Typing effect component
const TypingMessage: React.FC<{ message: string; delay?: number }> = ({ message, delay = 0 }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isComplete, setIsComplete] = useState(false);

  React.useEffect(() => {
    const startTimer = setTimeout(() => {
      setDisplayedText('');
      setIsComplete(false);
      let index = 0;
      const timer = setInterval(() => {
        if (index < message.length) {
          setDisplayedText(message.slice(0, index + 1));
          index++;
        } else {
          setIsComplete(true);
          clearInterval(timer);
        }
      }, 20);
      return () => clearInterval(timer);
    }, delay);
    
    return () => clearTimeout(startTimer);
  }, [message, delay]);

  return (
    <motion.p 
      className="text-sm text-muted-foreground text-center max-w-xs mx-auto leading-relaxed"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {displayedText}
      {!isComplete && <span className="animate-pulse">|</span>}
    </motion.p>
  );
};

export const RoutineOnboarding: React.FC<RoutineOnboardingProps> = ({ onComplete, onSkip }) => {
  const { updateSchedule, addBlock, completeOnboarding } = useSmartRoutine();
  
  const [step, setStep] = useState<OnboardingStep>('intro');
  const [wakeTime, setWakeTime] = useState('07:00');
  const [sleepTime, setSleepTime] = useState('23:00');
  const [selectedActivities, setSelectedActivities] = useState<RoutineActivityType[]>([]);
  const [activityDetails, setActivityDetails] = useState<ActivitySelection[]>([]);
  const [currentActivityIndex, setCurrentActivityIndex] = useState(0);
  const [showBlockerStep, setShowBlockerStep] = useState(false);

  const handleNext = useCallback(() => {
    switch (step) {
      case 'intro':
        setStep('wake_sleep');
        break;
      case 'wake_sleep':
        updateSchedule(wakeTime, sleepTime);
        setStep('activities');
        break;
      case 'activities':
        if (selectedActivities.length > 0) {
          // Initialize activity details
          setActivityDetails(selectedActivities.map(type => ({
            type,
            timing: '09:00',
            flexibility: 'window' as FlexibilityLevel,
          })));
          setCurrentActivityIndex(0);
          setStep('timing');
        }
        break;
      case 'timing':
        if (currentActivityIndex < selectedActivities.length - 1) {
          setCurrentActivityIndex(prev => prev + 1);
        } else {
          setStep('blockers');
        }
        break;
      case 'blockers':
        // Create all the blocks
        activityDetails.forEach(activity => {
          addBlock({
            name: ACTIVITY_OPTIONS.find(a => a.type === activity.type)?.label || 'Activity',
            type: activity.type,
            timing: activity.timing,
            flexibility: activity.flexibility,
            frequency: activity.flexibility === 'alternate' ? 'alternate' : 'daily',
            motivationBlocker: activity.blocker,
            isActive: true,
            notificationsEnabled: true,
          });
        });
        completeOnboarding();
        setStep('complete');
        break;
      case 'complete':
        onComplete();
        break;
    }
  }, [step, wakeTime, sleepTime, selectedActivities, currentActivityIndex, activityDetails, updateSchedule, addBlock, completeOnboarding, onComplete]);

  const handleBack = useCallback(() => {
    switch (step) {
      case 'wake_sleep':
        setStep('intro');
        break;
      case 'activities':
        setStep('wake_sleep');
        break;
      case 'timing':
        if (currentActivityIndex > 0) {
          setCurrentActivityIndex(prev => prev - 1);
        } else {
          setStep('activities');
        }
        break;
      case 'blockers':
        setCurrentActivityIndex(selectedActivities.length - 1);
        setStep('timing');
        break;
    }
  }, [step, currentActivityIndex, selectedActivities.length]);

  const toggleActivity = (type: RoutineActivityType) => {
    if (selectedActivities.includes(type)) {
      setSelectedActivities(prev => prev.filter(t => t !== type));
    } else if (selectedActivities.length < 5) {
      setSelectedActivities(prev => [...prev, type]);
    }
  };

  const updateCurrentActivity = (updates: Partial<ActivitySelection>) => {
    setActivityDetails(prev => prev.map((a, i) => 
      i === currentActivityIndex ? { ...a, ...updates } : a
    ));
  };

  const currentActivity = activityDetails[currentActivityIndex];
  const currentActivityConfig = ACTIVITY_OPTIONS.find(a => a.type === currentActivity?.type);

  const renderStep = () => {
    switch (step) {
      case 'intro':
        return (
          <motion.div 
            className="text-center space-y-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex justify-center mb-6">
              <AuraOrb size="lg" />
            </div>
            <h2 className="text-xl font-medium">Before we go further —</h2>
            <TypingMessage 
              message="Wanna set a loose daily routine together? Totally okay if we keep it light." 
              delay={300}
            />
            <div className="flex flex-col gap-3 pt-4">
              <Button 
                onClick={handleNext}
                className="w-full rounded-full bg-gradient-to-r from-primary to-primary/80"
              >
                Yeah, let's do it
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button 
                variant="ghost" 
                onClick={onSkip}
                className="text-muted-foreground"
              >
                Maybe later
              </Button>
            </div>
          </motion.div>
        );

      case 'wake_sleep':
        return (
          <motion.div 
            className="space-y-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex justify-center mb-4">
              <AuraOrb size="md" />
            </div>
            <div className="text-center">
              <h2 className="text-xl font-medium mb-2">What time do you usually wake up?</h2>
              <p className="text-sm text-muted-foreground">Even roughly is fine</p>
            </div>
            
            <div className="space-y-4">
              <div className="bg-card rounded-2xl p-4 border border-border/50">
                <label className="text-sm text-muted-foreground block mb-2">Wake up</label>
                <Input
                  type="time"
                  value={wakeTime}
                  onChange={(e) => setWakeTime(e.target.value)}
                  className="text-center text-lg h-12 border-0 bg-muted/30"
                />
              </div>
              
              <div className="bg-card rounded-2xl p-4 border border-border/50">
                <label className="text-sm text-muted-foreground block mb-2">Sleep around</label>
                <Input
                  type="time"
                  value={sleepTime}
                  onChange={(e) => setSleepTime(e.target.value)}
                  className="text-center text-lg h-12 border-0 bg-muted/30"
                />
              </div>
            </div>

            <TypingMessage 
              message="This helps me understand your natural rhythm." 
              delay={500}
            />
          </motion.div>
        );

      case 'activities':
        return (
          <motion.div 
            className="space-y-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex justify-center mb-4">
              <AuraOrb size="md" />
            </div>
            <div className="text-center">
              <h2 className="text-xl font-medium mb-2">What are the main things in your day?</h2>
              <p className="text-sm text-muted-foreground">Pick 1-5 that matter most</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {ACTIVITY_OPTIONS.map((activity) => {
                const isSelected = selectedActivities.includes(activity.type);
                return (
                  <motion.button
                    key={activity.type}
                    onClick={() => toggleActivity(activity.type)}
                    className={cn(
                      'p-4 rounded-2xl border transition-all text-left',
                      isSelected 
                        ? 'border-primary bg-primary/10' 
                        : 'border-border/50 hover:border-border'
                    )}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span className="text-2xl block mb-1">{activity.icon}</span>
                    <span className={cn(
                      'text-sm font-medium',
                      isSelected && 'text-primary'
                    )}>{activity.label}</span>
                  </motion.button>
                );
              })}
            </div>

            {selectedActivities.length > 0 && (
              <p className="text-xs text-center text-muted-foreground">
                {selectedActivities.length} selected
              </p>
            )}
          </motion.div>
        );

      case 'timing':
        if (!currentActivity || !currentActivityConfig) return null;
        return (
          <motion.div 
            className="space-y-6"
            key={currentActivityIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="flex justify-center mb-4">
              <div className="text-4xl">{currentActivityConfig.icon}</div>
            </div>
            <div className="text-center">
              <h2 className="text-xl font-medium mb-2">
                When do you usually do {currentActivityConfig.label.toLowerCase()}?
              </h2>
              <p className="text-sm text-muted-foreground">
                Activity {currentActivityIndex + 1} of {selectedActivities.length}
              </p>
            </div>

            <div className="bg-card rounded-2xl p-4 border border-border/50">
              <label className="text-sm text-muted-foreground block mb-2">Time</label>
              <Input
                type="time"
                value={currentActivity.timing}
                onChange={(e) => updateCurrentActivity({ timing: e.target.value })}
                className="text-center text-lg h-12 border-0 bg-muted/30"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Flexibility</label>
              <div className="grid grid-cols-2 gap-2">
                {FLEXIBILITY_OPTIONS.map((option) => (
                  <motion.button
                    key={option.value}
                    onClick={() => updateCurrentActivity({ flexibility: option.value })}
                    className={cn(
                      'p-3 rounded-xl border transition-all text-left',
                      currentActivity.flexibility === option.value
                        ? 'border-primary bg-primary/10'
                        : 'border-border/50'
                    )}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span className={cn(
                      'text-sm font-medium block',
                      currentActivity.flexibility === option.value && 'text-primary'
                    )}>{option.label}</span>
                    <span className="text-xs text-muted-foreground">{option.desc}</span>
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        );

      case 'blockers':
        return (
          <motion.div 
            className="space-y-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex justify-center mb-4">
              <AuraOrb size="md" />
            </div>
            <div className="text-center">
              <h2 className="text-xl font-medium mb-2">What usually stops you on tough days?</h2>
              <p className="text-sm text-muted-foreground">This helps me support you better</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {BLOCKER_OPTIONS.map((blocker) => {
                const isSelected = activityDetails.some(a => a.blocker === blocker.value);
                return (
                  <motion.button
                    key={blocker.value}
                    onClick={() => {
                      // Apply to all activities
                      setActivityDetails(prev => prev.map(a => ({ ...a, blocker: blocker.value })));
                    }}
                    className={cn(
                      'p-4 rounded-2xl border transition-all',
                      isSelected 
                        ? 'border-primary bg-primary/10' 
                        : 'border-border/50 hover:border-border'
                    )}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span className="text-2xl block mb-1">{blocker.icon}</span>
                    <span className={cn(
                      'text-sm font-medium',
                      isSelected && 'text-primary'
                    )}>{blocker.label}</span>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        );

      case 'complete':
        return (
          <motion.div 
            className="text-center space-y-6"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <motion.div 
              className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.2 }}
            >
              <Check className="w-8 h-8 text-primary" />
            </motion.div>
            <div>
              <h2 className="text-xl font-medium mb-2">Got it.</h2>
              <TypingMessage 
                message="I'll keep this as a soft rhythm, not a strict timetable. You can change anything anytime." 
                delay={300}
              />
            </div>
          </motion.div>
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background p-6">
      {/* Progress */}
      {step !== 'intro' && step !== 'complete' && (
        <div className="mb-8">
          <div className="flex gap-2 max-w-xs mx-auto">
            {['wake_sleep', 'activities', 'timing', 'blockers'].map((s, i) => (
              <div
                key={s}
                className={cn(
                  'flex-1 h-1 rounded-full transition-colors',
                  ['wake_sleep', 'activities', 'timing', 'blockers'].indexOf(step) >= i
                    ? 'bg-primary'
                    : 'bg-muted/50'
                )}
              />
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
        <AnimatePresence mode="wait">
          {renderStep()}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      {step !== 'intro' && (
        <div className="flex gap-3 pt-6">
          {step !== 'complete' && (
            <Button 
              variant="ghost" 
              onClick={handleBack}
              className="flex-1"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          )}
          <Button 
            onClick={handleNext}
            className={cn(
              'flex-1 rounded-full',
              step === 'complete' 
                ? 'bg-gradient-to-r from-primary to-primary/80'
                : ''
            )}
            disabled={step === 'activities' && selectedActivities.length === 0}
          >
            {step === 'complete' ? "Let's go" : 'Continue'}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      )}
    </div>
  );
};
