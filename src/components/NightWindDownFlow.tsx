import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Moon, Sun, CloudRain, Sparkles } from 'lucide-react';
import { useSoftUpsell } from '@/hooks/useSoftUpsell';
import auraAvatar from '@/assets/aura-avatar.jpeg';

interface NightWindDownFlowProps {
  onDismiss: () => void;
  onSendMessage: (message: string) => void;
  onAdjustTomorrow: (intensity: 'lighter' | 'same' | 'heavier') => void;
}

type FlowStep = 'ask' | 'response' | 'upsell' | 'done';
type DayFeeling = 'good' | 'okay' | 'heavy' | null;

export const NightWindDownFlow: React.FC<NightWindDownFlowProps> = ({
  onDismiss,
  onSendMessage,
  onAdjustTomorrow,
}) => {
  const [step, setStep] = useState<FlowStep>('ask');
  const [feeling, setFeeling] = useState<DayFeeling>(null);
  const [isTyping, setIsTyping] = useState(true);
  const { triggerNightUpsell, consecutiveLimitDays, dismissNightUpsell } = useSoftUpsell();
  const [upsellMessage, setUpsellMessage] = useState<string | null>(null);

  // Typing animation on step change
  useEffect(() => {
    setIsTyping(true);
    const timer = setTimeout(() => setIsTyping(false), 1200);
    return () => clearTimeout(timer);
  }, [step]);

  // Check for upsell after response
  useEffect(() => {
    if (step === 'response' && consecutiveLimitDays >= 3) {
      const msg = triggerNightUpsell();
      if (msg) {
        setUpsellMessage(msg);
      }
    }
  }, [step, consecutiveLimitDays, triggerNightUpsell]);

  const handleFeelingSelect = (selectedFeeling: DayFeeling) => {
    if (!selectedFeeling) return;
    
    setFeeling(selectedFeeling);
    
    // Adjust tomorrow based on feeling
    let intensity: 'lighter' | 'same' | 'heavier' = 'same';
    if (selectedFeeling === 'heavy') {
      intensity = 'lighter';
    } else if (selectedFeeling === 'good') {
      intensity = 'same'; // Keep momentum
    }
    
    // Save to localStorage for tomorrow's routine
    const today = new Date().toDateString();
    localStorage.setItem('aurra-last-day-feeling', JSON.stringify({
      date: today,
      feeling: selectedFeeling,
      tomorrowIntensity: intensity,
    }));
    
    onAdjustTomorrow(intensity);
    setStep('response');
    
    // Auto-dismiss after showing response
    setTimeout(() => {
      if (upsellMessage) {
        setStep('upsell');
      } else {
        setStep('done');
        setTimeout(onDismiss, 2000);
      }
    }, 2500);
  };

  const handleUpsellAction = (action: 'see_plans' | 'not_now') => {
    dismissNightUpsell();
    if (action === 'see_plans') {
      onSendMessage("Show my subscription and credits");
    }
    setStep('done');
    setTimeout(onDismiss, 1500);
  };

  const getResponseMessage = (): string => {
    const hour = new Date().getHours();
    
    switch (feeling) {
      case 'good':
        return hour >= 23 
          ? "That's great to hear 🌟\nRest well — tomorrow looks good."
          : "Nice. Keep that energy ✨";
      case 'okay':
        return "That's fair.\nTomorrow's a fresh start.";
      case 'heavy':
        return "I hear you.\nI'll keep tomorrow lighter. Rest well 🌙";
      default:
        return "Take care. I'll be here. 🤍";
    }
  };

  const feelingOptions = [
    { id: 'good' as DayFeeling, label: 'Good', icon: Sun, color: 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30 hover:bg-emerald-500/30' },
    { id: 'okay' as DayFeeling, label: 'Okay', icon: Sparkles, color: 'bg-amber-500/20 text-amber-500 border-amber-500/30 hover:bg-amber-500/30' },
    { id: 'heavy' as DayFeeling, label: 'Heavy', icon: CloudRain, color: 'bg-blue-500/20 text-blue-500 border-blue-500/30 hover:bg-blue-500/30' },
  ];

  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="p-4"
      >
        {/* AURRA Message Bubble */}
        <div className="flex gap-3 mb-4">
          <div className="w-9 h-9 rounded-full overflow-hidden ring-2 ring-indigo-500/20 shrink-0">
            <img src={auraAvatar} alt="AURRA" className="w-full h-full object-cover" />
          </div>
          
          <div className="flex-1">
            <motion.div
              key={step}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-2xl rounded-tl-sm px-4 py-3 max-w-[85%]"
            >
              {isTyping ? (
                <div className="flex gap-1.5 py-1">
                  <span className="w-2 h-2 bg-indigo-400/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-indigo-400/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-indigo-400/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              ) : (
                <>
                  {step === 'ask' && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-indigo-400">
                        <Moon className="w-4 h-4" />
                        <span className="text-xs font-medium">Wind Down</span>
                      </div>
                      <p className="text-foreground">
                        How did today feel overall?
                      </p>
                    </div>
                  )}
                  
                  {step === 'response' && (
                    <p className="text-foreground whitespace-pre-line">
                      {getResponseMessage()}
                    </p>
                  )}
                  
                  {step === 'upsell' && upsellMessage && (
                    <div className="space-y-3">
                      <p className="text-foreground whitespace-pre-line">
                        {upsellMessage}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-full text-xs"
                          onClick={() => handleUpsellAction('see_plans')}
                        >
                          See plans
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="rounded-full text-xs text-muted-foreground"
                          onClick={() => handleUpsellAction('not_now')}
                        >
                          Not now
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  {step === 'done' && (
                    <p className="text-foreground flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-indigo-400" />
                      Goodnight 🌙
                    </p>
                  )}
                </>
              )}
            </motion.div>
          </div>
        </div>

        {/* Feeling Options */}
        <AnimatePresence>
          {step === 'ask' && !isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ delay: 0.1 }}
              className="ml-12 flex gap-2 flex-wrap"
            >
              {feelingOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <motion.button
                    key={option.id}
                    onClick={() => handleFeelingSelect(option.id)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-full border transition-all ${option.color}`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="font-medium">{option.label}</span>
                  </motion.button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
};
