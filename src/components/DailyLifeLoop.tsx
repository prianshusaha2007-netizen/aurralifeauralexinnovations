/**
 * Daily Life Loop - Gentle, presence-like daily cycles
 * 
 * Philosophy: aurra.life responds to life rhythm, not tasks.
 * Interactions are simple, warm, and never overwhelming.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

type DayPhase = 'morning' | 'day' | 'evening' | 'night';
type FlowType = 'briefing' | 'reflection' | 'winddown' | 'none';

interface DailyLifeLoopProps {
  userName: string;
  onAskAurra: (message: string) => void;
  onDismiss: () => void;
}

const getDayPhase = (): DayPhase => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 11) return 'morning';
  if (hour >= 11 && hour < 17) return 'day';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
};

const getActiveFlow = (): FlowType => {
  const phase = getDayPhase();
  const today = new Date().toISOString().split('T')[0];
  
  const lastBriefing = localStorage.getItem('aurra-flow-briefing-date');
  const lastReflection = localStorage.getItem('aurra-flow-reflection-date');
  const lastWinddown = localStorage.getItem('aurra-flow-winddown-date');
  
  if (phase === 'morning' && lastBriefing !== today) return 'briefing';
  if (phase === 'evening' && lastReflection !== today) return 'reflection';
  if (phase === 'night' && lastWinddown !== today) return 'winddown';
  
  return 'none';
};

// Simple, warm flow content
const flowContent = {
  briefing: {
    greeting: 'Good morning',
    question: 'How would you like today to feel?',
    options: [
      { label: 'Productive', response: "I'd like a productive day" },
      { label: 'Easy', response: "I want to take it easy today" },
      { label: 'Balanced', response: "A balanced day would be good" },
    ],
    skipLabel: 'Skip',
  },
  reflection: {
    greeting: 'Evening',
    question: 'How did today go?',
    options: [
      { label: 'Good', response: 'Today was good' },
      { label: 'Okay', response: "Today was okay" },
      { label: 'Tough', response: 'Today was tough' },
    ],
    skipLabel: 'Not now',
  },
  winddown: {
    greeting: 'Winding down',
    question: 'Ready to close the day?',
    options: [
      { label: 'Yes', response: 'Help me wind down' },
      { label: 'Later', response: 'skip' },
    ],
    skipLabel: 'Skip',
  },
};

export const DailyLifeLoop: React.FC<DailyLifeLoopProps> = ({
  userName,
  onAskAurra,
  onDismiss,
}) => {
  const [flowType, setFlowType] = useState<FlowType>(getActiveFlow);
  const [isAnimating, setIsAnimating] = useState(true);
  
  useEffect(() => {
    const timer = setTimeout(() => setIsAnimating(false), 600);
    return () => clearTimeout(timer);
  }, []);

  const markFlowComplete = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    if (flowType === 'briefing') {
      localStorage.setItem('aurra-flow-briefing-date', today);
    } else if (flowType === 'reflection') {
      localStorage.setItem('aurra-flow-reflection-date', today);
    } else if (flowType === 'winddown') {
      localStorage.setItem('aurra-flow-winddown-date', today);
    }
  }, [flowType]);

  const handleOption = (response: string) => {
    markFlowComplete();
    if (response !== 'skip') {
      onAskAurra(response);
    }
    onDismiss();
  };

  const handleDismiss = () => {
    markFlowComplete();
    onDismiss();
  };

  if (flowType === 'none') return null;

  const content = flowContent[flowType];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="mb-4"
      >
        <div className="bg-muted/20 border border-border/50 rounded-2xl p-5">
          {/* Header with dismiss */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">
                {content.greeting}
              </p>
              <p className="text-foreground font-light">
                {content.question}
              </p>
            </div>
            <button
              onClick={handleDismiss}
              className="p-1.5 text-muted-foreground/50 hover:text-muted-foreground transition-colors -mt-1 -mr-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Options - simple, clear choices */}
          {!isAnimating && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="flex flex-wrap gap-2"
            >
              {content.options.map((option, i) => (
                <Button
                  key={i}
                  variant={i === 0 ? 'default' : 'outline'}
                  size="sm"
                  className="rounded-full h-9 px-4"
                  onClick={() => handleOption(option.response)}
                >
                  {option.label}
                  {i === 0 && <ChevronRight className="w-3 h-3 ml-1" />}
                </Button>
              ))}
            </motion.div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

// Debug exports for console use
export const triggerDailyFlow = (flowType: 'briefing' | 'reflection' | 'winddown') => {
  localStorage.removeItem(`aurra-flow-${flowType}-date`);
  console.log(`[DailyLifeLoop] Triggered ${flowType} flow - refresh to see`);
  return `Flow ${flowType} triggered. Refresh to see.`;
};

export const resetDailyFlows = () => {
  localStorage.removeItem('aurra-flow-briefing-date');
  localStorage.removeItem('aurra-flow-reflection-date');
  localStorage.removeItem('aurra-flow-winddown-date');
  console.log('[DailyLifeLoop] All flows reset');
  return 'All daily flows reset. Refresh to see.';
};
