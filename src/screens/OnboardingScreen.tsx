import React, { useState, useEffect } from 'react';
import { ArrowRight, ArrowLeft, Sparkles, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AuraOrb } from '@/components/AuraOrb';
import { useAura } from '@/contexts/AuraContext';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

type StepType = 'intro' | 'text' | 'options' | 'multiSelect' | 'time' | 'chat';

interface Step {
  id: string;
  title: string;
  subtitle: string;
  type: StepType;
  field?: string;
  placeholder?: string;
  inputType?: string;
  options?: string[];
  maxSelect?: number;
  optional?: boolean;
  auraMessage?: string;
}

// Conversational onboarding - soft, human, not interrogative
const steps: Step[] = [
  {
    id: 'welcome',
    title: "Hey. I'm AURRA.",
    subtitle: "Good to have you here.",
    type: 'intro',
    auraMessage: "I'm not a chatbot or an assistant waiting for commands. I'm here to be a thinking partner, a calm presence, someone you can talk to about anything.",
  },
  {
    id: 'name',
    title: "What should I call you?",
    subtitle: "Just your name is enough",
    type: 'text',
    field: 'name',
    placeholder: "Your name",
    auraMessage: "Names matter. It helps me feel like I'm talking to a real person, not just answering questions.",
  },
  {
    id: 'work_study',
    title: "Are you studying, working, or both?",
    subtitle: "This helps me understand your day better",
    type: 'options',
    field: 'profession',
    options: ['Studying', 'Working', 'Both', 'Taking a break'],
    auraMessage: "No pressure here — everyone's journey is different.",
  },
  {
    id: 'purpose',
    title: "What would you like me to be for you?",
    subtitle: "Choose what feels right",
    type: 'multiSelect',
    field: 'goals',
    options: ['Thinking partner', 'Daily support', 'Learning & growth', 'Just exploring'],
    maxSelect: 2,
    auraMessage: "I can be different things for different people. Some need a mentor, some need a friend.",
  },
  {
    id: 'tone',
    title: "How should I talk to you?",
    subtitle: "I'll adapt to match your vibe",
    type: 'options',
    field: 'tonePreference',
    options: ['Calm & gentle', 'Playful & fun', 'Direct & clear', 'Adapt to my mood'],
    auraMessage: "This isn't set in stone — I'll learn how you like to communicate over time.",
  },
];

// Typing effect component
const TypingMessage: React.FC<{ message: string }> = ({ message }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
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
    }, 25);

    return () => clearInterval(timer);
  }, [message]);

  return (
    <motion.p 
      className="text-sm text-muted-foreground italic text-center max-w-xs mx-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      "{displayedText}
      {!isComplete && <span className="animate-pulse">|</span>}
      {isComplete && '"'}
    </motion.p>
  );
};

export const OnboardingScreen: React.FC = () => {
  const { updateUserProfile } = useAura();
  const [currentStep, setCurrentStep] = useState(0);
  const [showAuraMessage, setShowAuraMessage] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: '',
    profession: '',
    professions: [] as string[],
    goals: [] as string[],
    languages: ['English'] as string[],
    wakeTime: '07:00',
    sleepTime: '23:00',
    tonePreference: '',
  });

  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;

  // Show AURRA's message after a delay
  useEffect(() => {
    setShowAuraMessage(false);
    const timer = setTimeout(() => {
      if (step.auraMessage) {
        setShowAuraMessage(true);
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [currentStep, step.auraMessage]);

  const handleNext = () => {
    if (isLastStep) {
      // Map goals to more detailed format for backend
      const goalMapping: Record<string, string> = {
        'Thinking partner': 'Work & Productivity',
        'Daily support': 'Mental Wellness',
        'Learning & growth': 'Study & Learning',
        'Just exploring': 'Creativity & Content',
      };
      
      const mappedGoals = formData.goals.map(g => goalMapping[g] || g);
      
      // Map profession to array format
      const professionMapping: Record<string, string[]> = {
        'Studying': ['Student'],
        'Working': ['Professional'],
        'Both': ['Student', 'Professional'],
        'Taking a break': ['Career Break'],
      };
      
      const mappedProfessions = professionMapping[formData.profession] || [];
      
      updateUserProfile({ 
        ...formData,
        goals: mappedGoals,
        professions: mappedProfessions,
        onboardingComplete: true 
      });
      
      // Mark first day of gradual onboarding
      localStorage.setItem('aurra-first-use', new Date().toISOString());
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (!isFirstStep) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleOptionSelect = (option: string) => {
    if (step.type === 'multiSelect') {
      const fieldKey = step.field as keyof typeof formData;
      const current = formData[fieldKey] as string[];
      const maxSelect = step.maxSelect;
      
      if (current.includes(option)) {
        setFormData({ ...formData, [step.field!]: current.filter(o => o !== option) });
      } else if (!maxSelect || current.length < maxSelect) {
        setFormData({ ...formData, [step.field!]: [...current, option] });
      }
    } else {
      setFormData({ ...formData, [step.field!]: option });
    }
  };

  const canProceed = () => {
    if (step.type === 'intro') return true;
    if (step.optional) return true;
    if (step.type === 'multiSelect') {
      return (formData[step.field as keyof typeof formData] as string[]).length > 0;
    }
    return !!formData[step.field as keyof typeof formData];
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Progress - minimal, not distracting */}
      <div className="p-6 pt-8">
        <div className="flex gap-2 max-w-xs mx-auto">
          {steps.map((_, index) => (
            <motion.div
              key={index}
              className={cn(
                'flex-1 h-1 rounded-full transition-all duration-500',
                index <= currentStep ? 'bg-primary' : 'bg-muted/50'
              )}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            />
          ))}
        </div>
      </div>

      {/* Content - centered, calm */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div 
            className="w-full max-w-sm" 
            key={currentStep}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {/* Orb - breathing, alive */}
            <div className="flex justify-center mb-6">
              <AuraOrb size={step.type === 'intro' ? 'xl' : 'lg'} />
            </div>

            {/* Text - clear, human */}
            <div className="text-center mb-6">
              <motion.h1 
                className="text-2xl font-semibold mb-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                {step.title}
              </motion.h1>
              <motion.p 
                className="text-muted-foreground text-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                {step.subtitle}
              </motion.p>
            </div>

            {/* AURRA's conversational message */}
            <AnimatePresence>
              {showAuraMessage && step.auraMessage && (
                <motion.div 
                  className="mb-8"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <TypingMessage message={step.auraMessage} />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Input Area - simple, spacious */}
            <div className="space-y-3">
              {step.type === 'text' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <Input
                    value={formData[step.field as keyof typeof formData] as string}
                    onChange={(e) => setFormData({ ...formData, [step.field!]: e.target.value })}
                    placeholder={step.placeholder}
                    type={step.inputType || 'text'}
                    className="text-center text-lg py-6 h-14 border-muted/50 focus:border-primary/50"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && canProceed()) {
                        handleNext();
                      }
                    }}
                  />
                </motion.div>
              )}

              {step.type === 'time' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <Input
                    type="time"
                    value={formData[step.field as keyof typeof formData] as string}
                    onChange={(e) => setFormData({ ...formData, [step.field!]: e.target.value })}
                    className="text-center text-lg py-6 h-14 border-muted/50"
                  />
                </motion.div>
              )}

              {(step.type === 'options' || step.type === 'multiSelect') && (
                <motion.div 
                  className="grid gap-3"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  {step.options?.map((option, index) => {
                    const isSelected = step.type === 'multiSelect'
                      ? (formData[step.field as keyof typeof formData] as string[]).includes(option)
                      : formData[step.field as keyof typeof formData] === option;
                    
                    return (
                      <motion.button
                        key={option}
                        onClick={() => handleOptionSelect(option)}
                        className={cn(
                          'p-4 rounded-2xl border transition-all duration-200 text-left',
                          'hover:bg-muted/30 active:scale-[0.98]',
                          isSelected
                            ? 'border-primary/50 bg-primary/5'
                            : 'border-border/50'
                        )}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 + index * 0.1 }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <span className={cn(
                          'font-medium',
                          isSelected && 'text-primary'
                        )}>{option}</span>
                      </motion.button>
                    );
                  })}
                </motion.div>
              )}
            </div>

            {/* Hint for multiSelect */}
            {step.type === 'multiSelect' && step.maxSelect && (
              <motion.p 
                className="text-xs text-muted-foreground text-center mt-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
              >
                Choose up to {step.maxSelect}
              </motion.p>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation - large, thumb-friendly */}
      <div className="p-6 pb-8 flex gap-3">
        {!isFirstStep && (
          <Button
            variant="ghost"
            size="lg"
            onClick={handleBack}
            className="px-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        )}
        
        <Button
          size="lg"
          onClick={handleNext}
          disabled={!canProceed()}
          className={cn(
            'flex-1 h-14 transition-all duration-300',
            !canProceed() && 'opacity-50'
          )}
        >
          {isLastStep ? (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Let's Begin
            </>
          ) : isFirstStep ? (
            <>
              <MessageCircle className="w-4 h-4 mr-2" />
              Continue
            </>
          ) : (
            <>
              Continue
              <ArrowRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </div>

      {/* Skip option for later steps */}
      {!isFirstStep && !isLastStep && step.optional && (
        <div className="pb-4 text-center">
          <button 
            onClick={handleNext}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Skip for now
          </button>
        </div>
      )}
    </div>
  );
};
