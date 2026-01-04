/**
 * AURRA Life Rhythm Onboarding
 * 
 * Asks the ONE simple question about weekly life patterns
 * Free text, no forms, no buttons, no pressure
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useLifeRhythm } from '@/hooks/useLifeRhythm';
import { Send } from 'lucide-react';

interface LifeRhythmOnboardingProps {
  onComplete: () => void;
  userName?: string;
}

type OnboardingStep = 'question' | 'processing' | 'confirm' | 'done';

export const LifeRhythmOnboarding: React.FC<LifeRhythmOnboardingProps> = ({
  onComplete,
  userName,
}) => {
  const { saveLifeRhythm } = useLifeRhythm();
  const [step, setStep] = useState<OnboardingStep>('question');
  const [response, setResponse] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-focus textarea
  useEffect(() => {
    if (!isTyping && step === 'question' && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isTyping, step]);

  // Typing animation on step change
  useEffect(() => {
    setIsTyping(true);
    const timer = setTimeout(() => setIsTyping(false), 2000);
    return () => clearTimeout(timer);
  }, [step]);

  const handleSubmit = () => {
    if (response.trim().length < 10) return;

    setStep('processing');

    // Parse the response - split into weekday and weekend parts
    const lowerResponse = response.toLowerCase();
    
    // Try to find weekend separator
    const weekendKeywords = ['weekend', 'saturday', 'sunday', 'sat', 'sun', 'weekends'];
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

    // If no weekend part found, assume the whole response describes weekdays
    // and weekends are "relaxed/chill"
    if (!weekendPart) {
      weekendPart = 'weekends are relaxed and flexible';
    }

    // Save the rhythm
    setTimeout(() => {
      saveLifeRhythm(weekdayPart, weekendPart);
      setStep('confirm');
      
      // Auto complete after confirmation
      setTimeout(() => {
        setStep('done');
        setTimeout(onComplete, 1500);
      }, 2500);
    }, 1000);
  };

  const messages: Record<OnboardingStep, string> = {
    question: `Before we plan anything, tell me a little about how your days usually look 🙂

How is your life from Monday to Friday?
And how are Saturday & Sunday different?`,
    processing: 'Got it, let me understand your rhythm...',
    confirm: `I'll keep weekdays structured and weekends lighter.

I'll suggest things gently, not rigid schedules — and you can change anything anytime.`,
    done: `Perfect. Let's start 🙂`,
  };

  const placeholderExamples = [
    "Weekdays I have college till afternoon, then I study or rest. Weekends are chill, sometimes gym, sometimes friends.",
    "Weekdays are packed with work and meetings. Weekends I try to slow down but still plan the next week.",
    "I work from 9-6, gym in evenings. Weekends I catch up on personal projects and hang out with family.",
  ];

  return (
    <div className="p-4 pb-6 max-w-lg mx-auto">
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {/* AURRA Message */}
          <div className="flex gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center text-sm font-medium shrink-0">
              A
            </div>
            <div className="flex-1">
              <motion.div
                className="bg-muted/50 rounded-2xl rounded-tl-sm px-4 py-3"
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
              >
                {isTyping ? (
                  <div className="flex gap-1 py-2">
                    <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                ) : (
                  <p className="text-foreground whitespace-pre-line leading-relaxed">
                    {messages[step]}
                  </p>
                )}
              </motion.div>
            </div>
          </div>

          {/* User Input Area */}
          {!isTyping && step === 'question' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="ml-13 pl-13"
            >
              <div className="relative">
                <Textarea
                  ref={textareaRef}
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                  placeholder={placeholderExamples[Math.floor(Math.random() * placeholderExamples.length)]}
                  className="min-h-[120px] pr-12 resize-none rounded-2xl border-muted/50 focus:border-primary/50 bg-background"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.metaKey) {
                      handleSubmit();
                    }
                  }}
                />
                <Button
                  size="icon"
                  onClick={handleSubmit}
                  disabled={response.trim().length < 10}
                  className="absolute bottom-3 right-3 rounded-full h-8 w-8"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              
              <p className="text-xs text-muted-foreground mt-2 ml-1">
                Just describe naturally — no right or wrong answers
              </p>
            </motion.div>
          )}

          {/* Processing State */}
          {step === 'processing' && !isTyping && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="ml-13 flex items-center gap-2 text-muted-foreground"
            >
              <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              <span className="text-sm">Understanding your rhythm...</span>
            </motion.div>
          )}

          {/* Confirmation */}
          {step === 'confirm' && !isTyping && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="ml-13"
            >
              <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">✨</span>
                  <span className="font-medium text-sm">Rhythm saved</span>
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>• Weekdays: Structured support</p>
                  <p>• Weekends: Lighter approach</p>
                  <p>• Always: Gentle suggestions, never commands</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Done */}
          {step === 'done' && !isTyping && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="ml-13 text-center"
            >
              <motion.div 
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary"
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <span>🎉</span>
                <span className="font-medium">You're all set!</span>
              </motion.div>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
