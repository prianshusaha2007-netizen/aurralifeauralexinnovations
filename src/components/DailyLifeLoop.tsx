/**
 * Daily Life Loop - Ambient daily cycles
 * 
 * Morning (5am-11am): Briefing + day planning
 * Day (11am-5pm): Focus protection, contextual nudges
 * Evening (5pm-9pm): Reflection prompts, wind-down prep
 * Night (9pm-5am): Memory compression, tomorrow prep
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, Sunset, Coffee, Sparkles, X, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import auraAvatar from '@/assets/aura-avatar.jpeg';

type DayPhase = 'morning' | 'day' | 'evening' | 'night';
type FlowType = 'briefing' | 'reflection' | 'winddown' | 'none';

interface DailyLifeLoopProps {
  userName: string;
  onAskAurra: (message: string) => void;
  onDismiss: () => void;
}

// Get current day phase based on hour
const getDayPhase = (): DayPhase => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 11) return 'morning';
  if (hour >= 11 && hour < 17) return 'day';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
};

// Get flow type based on phase and last shown times
const getActiveFlow = (): FlowType => {
  const phase = getDayPhase();
  const today = new Date().toISOString().split('T')[0];
  
  // Check what was already shown today
  const lastBriefing = localStorage.getItem('aurra-flow-briefing-date');
  const lastReflection = localStorage.getItem('aurra-flow-reflection-date');
  const lastWinddown = localStorage.getItem('aurra-flow-winddown-date');
  
  if (phase === 'morning' && lastBriefing !== today) return 'briefing';
  if (phase === 'evening' && lastReflection !== today) return 'reflection';
  if (phase === 'night' && lastWinddown !== today) return 'winddown';
  
  return 'none';
};

const phaseIcons = {
  morning: Sun,
  day: Coffee,
  evening: Sunset,
  night: Moon,
};

const phaseColors = {
  morning: 'from-amber-500/20 to-orange-500/10 border-amber-500/30',
  day: 'from-blue-500/20 to-cyan-500/10 border-blue-500/30',
  evening: 'from-purple-500/20 to-pink-500/10 border-purple-500/30',
  night: 'from-indigo-500/20 to-violet-500/10 border-indigo-500/30',
};

export const DailyLifeLoop: React.FC<DailyLifeLoopProps> = ({
  userName,
  onAskAurra,
  onDismiss,
}) => {
  const [phase] = useState<DayPhase>(getDayPhase);
  const [flowType, setFlowType] = useState<FlowType>(getActiveFlow);
  const [step, setStep] = useState<'ask' | 'response'>('ask');
  const [isTyping, setIsTyping] = useState(true);
  
  const Icon = phaseIcons[phase];
  const colorClass = phaseColors[phase];

  // Typing animation
  useEffect(() => {
    setIsTyping(true);
    const timer = setTimeout(() => setIsTyping(false), 800);
    return () => clearTimeout(timer);
  }, [step]);

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

  const handleAction = (action: string) => {
    markFlowComplete();
    setStep('response');
    
    // Auto-dismiss after response
    setTimeout(() => {
      if (action !== 'dismiss') {
        onAskAurra(action);
      }
      onDismiss();
    }, 1500);
  };

  const handleDismiss = () => {
    markFlowComplete();
    onDismiss();
  };

  // Don't render if no active flow
  if (flowType === 'none') return null;

  const flowContent = {
    briefing: {
      title: 'Good morning',
      message: `Hey ${userName}. Ready to plan today?`,
      actions: [
        { label: 'Show my plan', action: "What's my plan for today?" },
        { label: 'Take it easy', action: 'dismiss' },
      ],
      response: "I'll be here when you need me ☀️",
    },
    reflection: {
      title: 'Evening check-in',
      message: 'How did today go?',
      actions: [
        { label: 'Good day', action: 'I had a good day' },
        { label: 'Tough day', action: 'Today was tough' },
        { label: 'Skip', action: 'dismiss' },
      ],
      response: 'Thanks for sharing. Rest well 🌙',
    },
    winddown: {
      title: 'Wind down',
      message: 'Time to slow down. Want me to prep tomorrow?',
      actions: [
        { label: 'Yes, plan tomorrow', action: 'Help me plan tomorrow' },
        { label: 'Not tonight', action: 'dismiss' },
      ],
      response: 'Sleep well. I\'ll be here tomorrow 💤',
    },
  };

  const content = flowContent[flowType];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.98 }}
        className="mb-4"
      >
        <div className="flex gap-3">
          {/* Avatar */}
          <div className="w-9 h-9 rounded-full overflow-hidden ring-2 ring-primary/20 shrink-0">
            <img src={auraAvatar} alt="AURRA" className="w-full h-full object-cover" />
          </div>
          
          {/* Card */}
          <div className={`flex-1 rounded-2xl rounded-tl-sm bg-gradient-to-br ${colorClass} border p-4`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Icon className="w-4 h-4 text-foreground/70" />
                <span className="text-xs font-medium text-foreground/70">{content.title}</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="w-6 h-6 rounded-full text-muted-foreground hover:text-foreground"
                onClick={handleDismiss}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>

            {/* Message */}
            {isTyping ? (
              <div className="flex gap-1.5 py-2">
                <span className="w-2 h-2 bg-foreground/30 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-foreground/30 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-foreground/30 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                {step === 'ask' ? (
                  <>
                    <p className="text-foreground mb-4">{content.message}</p>
                    <div className="flex flex-wrap gap-2">
                      {content.actions.map((action, i) => (
                        <Button
                          key={i}
                          variant={i === 0 ? 'default' : 'outline'}
                          size="sm"
                          className="rounded-full"
                          onClick={() => handleAction(action.action)}
                        >
                          {action.label}
                          {i === 0 && <ChevronRight className="w-3 h-3 ml-1" />}
                        </Button>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="text-foreground flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    {content.response}
                  </p>
                )}
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

// Debug/test functions - only attach on client
if (typeof window !== 'undefined') {
  const triggerDailyFlow = (flowType: 'briefing' | 'reflection' | 'winddown') => {
    localStorage.removeItem(`aurra-flow-${flowType}-date`);
    console.log(`[DailyLifeLoop] Triggered ${flowType} flow - refresh to see`);
    return `Flow ${flowType} triggered. Refresh to see.`;
  };

  const resetDailyFlows = () => {
    localStorage.removeItem('aurra-flow-briefing-date');
    localStorage.removeItem('aurra-flow-reflection-date');
    localStorage.removeItem('aurra-flow-winddown-date');
    console.log('[DailyLifeLoop] All flows reset');
    return 'All daily flows reset. Refresh to see.';
  };

  (window as any).triggerDailyFlow = triggerDailyFlow;
  (window as any).resetDailyFlows = resetDailyFlows;
}
