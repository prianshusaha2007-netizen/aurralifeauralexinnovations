/**
 * AURRA Life Rhythm Onboarding Chat
 * 
 * Asks the ONE simple question: 
 * "How is your life from Monday to Friday, and how are weekends different?"
 * 
 * Free text, no forms, no buttons, no pressure.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAura } from '@/contexts/AuraContext';
import { useLifeRhythm } from '@/hooks/useLifeRhythm';
import { Send } from 'lucide-react';
import auraAvatar from '@/assets/aura-avatar.jpeg';

interface RoutineOnboardingChatProps {
  onComplete: () => void;
  onSkip: () => void;
}

type OnboardingStep = 'intro' | 'question' | 'processing' | 'confirm' | 'done';

export const RoutineOnboardingChat: React.FC<RoutineOnboardingChatProps> = ({
  onComplete,
  onSkip,
}) => {
  const { userProfile } = useAura();
  const { saveLifeRhythm, rhythm } = useLifeRhythm();
  
  const [step, setStep] = useState<OnboardingStep>('intro');
  const [response, setResponse] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-focus textarea
  useEffect(() => {
    if (!isTyping && step === 'question' && textareaRef.current) {
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [isTyping, step]);

  // Typing animation on step change
  useEffect(() => {
    setIsTyping(true);
    const duration = step === 'question' ? 1500 : 1000;
    const timer = setTimeout(() => setIsTyping(false), duration);
    return () => clearTimeout(timer);
  }, [step]);

  const handleSubmit = useCallback(() => {
    if (response.trim().length < 5) return;

    setStep('processing');

    // Parse the response - try to split into weekday and weekend parts
    const lowerResponse = response.toLowerCase();
    
    // Try to find weekend separator
    const weekendKeywords = ['weekend', 'saturday', 'sunday', 'sat & sun', 'weekends'];
    let weekdayPart = response;
    let weekendPart = '';

    for (const keyword of weekendKeywords) {
      const index = lowerResponse.indexOf(keyword);
      if (index > 0) {
        weekdayPart = response.substring(0, index).trim();
        weekendPart = response.substring(index).trim();
        break;
      }
    }

    // If no weekend part found, assume relaxed weekends
    if (!weekendPart) {
      weekendPart = 'weekends are relaxed and flexible';
    }

    // Save the rhythm after a brief delay
    setTimeout(() => {
      saveLifeRhythm(weekdayPart, weekendPart);
      setStep('confirm');
      
      // Auto-complete after confirmation
      setTimeout(() => {
        setStep('done');
        setTimeout(onComplete, 1500);
      }, 2500);
    }, 1000);
  }, [response, saveLifeRhythm, onComplete]);

  const handleSkip = useCallback(() => {
    // Save default rhythm
    saveLifeRhythm('flexible weekdays', 'relaxed weekends');
    localStorage.setItem('aurra-routine-onboarding-complete', 'true');
    onSkip();
  }, [saveLifeRhythm, onSkip]);

  const messages: Record<OnboardingStep, string> = {
    intro: `Before we plan anything — want me to understand how your days usually look? 🙂`,
    question: `Tell me a little about your week:

How is your life from Monday to Friday?
And how are Saturday & Sunday different?`,
    processing: 'Got it, understanding your rhythm...',
    confirm: `I'll keep weekdays structured and weekends lighter.

I'll suggest things gently — not rigid schedules — and you can change anything anytime.`,
    done: `Perfect. Let's start 🙂`,
  };

  const placeholderExamples = [
    "Weekdays I have college till afternoon, then I study or rest. Weekends are chill, sometimes gym...",
    "Weekdays are packed with work and meetings. Weekends I try to slow down...",
    "I work from 9-6, gym in evenings. Weekends I catch up on personal projects...",
  ];

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
              className="bg-muted/50 rounded-2xl rounded-tl-sm px-4 py-3 max-w-[90%]"
            >
              {isTyping ? (
                <div className="flex gap-1.5 py-1">
                  <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              ) : (
                <p className="text-foreground whitespace-pre-line leading-relaxed">{messages[step]}</p>
              )}
            </motion.div>
          </div>
        </div>

        {/* Response Options */}
        <AnimatePresence>
          {!isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ delay: 0.1 }}
              className="ml-12 space-y-3"
            >
              {/* Intro Step */}
              {step === 'intro' && (
                <div className="flex gap-2 flex-wrap">
                  <Button onClick={() => setStep('question')} className="rounded-full">
                    Sure
                  </Button>
                  <Button variant="ghost" onClick={handleSkip} className="rounded-full text-muted-foreground">
                    Skip for now
                  </Button>
                </div>
              )}

              {/* Main Question - Free Text */}
              {step === 'question' && (
                <div className="space-y-2">
                  <div className="relative">
                    <Textarea
                      ref={textareaRef}
                      value={response}
                      onChange={(e) => setResponse(e.target.value)}
                      placeholder={placeholderExamples[Math.floor(Math.random() * placeholderExamples.length)]}
                      className="min-h-[100px] pr-12 resize-none rounded-2xl border-muted/50 focus:border-primary/50 bg-card text-foreground"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                          handleSubmit();
                        }
                      }}
                    />
                    <Button
                      size="icon"
                      onClick={handleSubmit}
                      disabled={response.trim().length < 5}
                      className="absolute bottom-3 right-3 rounded-full h-8 w-8"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Just describe naturally — no right or wrong answers
                  </p>
                </div>
              )}

              {/* Processing State */}
              {step === 'processing' && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                  <span className="text-sm">Understanding your rhythm...</span>
                </div>
              )}

              {/* Confirmation */}
              {step === 'confirm' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-3"
                >
                  <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">✨</span>
                      <span className="font-medium text-sm">Rhythm saved</span>
                    </div>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <p>• Weekdays: {rhythm.weekdayPattern.morning !== 'flexible' ? 'Structured support' : 'Flexible support'}</p>
                      <p>• Weekends: {rhythm.weekendPattern.pace === 'relaxed' ? 'Lighter approach' : 'Active support'}</p>
                      <p>• Always: Gentle suggestions, never commands</p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Done */}
              {step === 'done' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center"
                >
                  <motion.div 
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary"
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                  >
                    <span>🎉</span>
                    <span className="font-medium text-sm">You're all set!</span>
                  </motion.div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
};
