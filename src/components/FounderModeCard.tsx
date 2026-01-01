import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Briefcase, Target, Users, TrendingUp, Moon, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import auraAvatar from '@/assets/aura-avatar.jpeg';

interface FounderModeCardProps {
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  onChoice: (choice: string) => void;
  onSendMessage: (message: string) => void;
  onDismiss: () => void;
}

export const FounderModeCard: React.FC<FounderModeCardProps> = ({
  timeOfDay,
  onChoice,
  onSendMessage,
  onDismiss,
}) => {
  const [isTyping, setIsTyping] = useState(true);
  const [step, setStep] = useState<'initial' | 'focus' | 'clarify' | 'done'>('initial');
  const [selectedPriority, setSelectedPriority] = useState('');

  React.useEffect(() => {
    const timer = setTimeout(() => setIsTyping(false), 1000);
    return () => clearTimeout(timer);
  }, [step]);

  const getMessage = () => {
    switch (step) {
      case 'initial':
        if (timeOfDay === 'morning') {
          return "Looks like a packed day.\nLet's find one clear priority.";
        } else if (timeOfDay === 'evening') {
          return "You've been in decisions all day.\nWant clarity or rest right now?";
        } else if (timeOfDay === 'night') {
          return "You did enough today.\nBig decisions are clearer in the morning.";
        }
        return "How's the day going?\nNeed to think something through?";
      case 'focus':
        return `Okay. ${selectedPriority} is the priority.\nEverything else is secondary today.`;
      case 'clarify':
        return "Let's slow it down.\nWhat's the real risk here—time or money?";
      case 'done':
        return "Get some rest. Tomorrow's a new day.";
    }
  };

  const getOptions = () => {
    switch (step) {
      case 'initial':
        if (timeOfDay === 'morning') {
          return [
            { id: 'revenue', label: 'Revenue', icon: TrendingUp },
            { id: 'product', label: 'Product', icon: Target },
            { id: 'team', label: 'Team', icon: Users },
          ];
        } else if (timeOfDay === 'evening') {
          return [
            { id: 'clarity', label: 'Clarity', icon: Lightbulb },
            { id: 'rest', label: 'Rest', icon: Moon },
          ];
        } else if (timeOfDay === 'night') {
          return [
            { id: 'rest', label: 'You are right, goodnight', icon: Moon },
          ];
        }
        return [
          { id: 'think', label: 'Think through something', icon: Lightbulb },
          { id: 'vent', label: 'Just vent', icon: Briefcase },
        ];
      default:
        return [];
    }
  };

  const handleChoice = (choice: string) => {
    if (['revenue', 'product', 'team'].includes(choice)) {
      setSelectedPriority(choice.charAt(0).toUpperCase() + choice.slice(1));
      setStep('focus');
      setIsTyping(true);
      
      // Store today's priority
      localStorage.setItem('aurra-today-priority', JSON.stringify({
        date: new Date().toDateString(),
        priority: choice,
      }));
      
      setTimeout(() => {
        onChoice(choice);
        setTimeout(onDismiss, 2000);
      }, 2000);
    } else if (choice === 'clarity') {
      setStep('clarify');
      setIsTyping(true);
      onSendMessage("I need to think through a decision");
    } else if (choice === 'rest') {
      setStep('done');
      setIsTyping(true);
      setTimeout(onDismiss, 2000);
    } else if (choice === 'think') {
      onSendMessage("I need to think something through");
      onDismiss();
    } else {
      onChoice(choice);
      onDismiss();
    }
  };

  const options = getOptions();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="p-4"
    >
      {/* AURRA Message */}
      <div className="flex gap-3 mb-4">
        <div className="w-9 h-9 rounded-full overflow-hidden ring-2 ring-orange-500/20 shrink-0">
          <img src={auraAvatar} alt="AURRA" className="w-full h-full object-cover" />
        </div>
        
        <div className="flex-1">
          <motion.div
            key={step}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-br from-orange-500/10 to-amber-500/10 border border-orange-500/20 rounded-2xl rounded-tl-sm px-4 py-3 max-w-[85%]"
          >
            {isTyping ? (
              <div className="flex gap-1.5 py-1">
                <span className="w-2 h-2 bg-orange-400/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-orange-400/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-orange-400/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            ) : (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-orange-500">
                  <Briefcase className="w-4 h-4" />
                  <span className="text-xs font-medium">Founder Mode</span>
                </div>
                <p className="text-foreground whitespace-pre-line">
                  {getMessage()}
                </p>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Options */}
      <AnimatePresence>
        {!isTyping && step === 'initial' && options.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ delay: 0.1 }}
            className="ml-12 flex gap-2 flex-wrap"
          >
            {options.map((option) => {
              const Icon = option.icon;
              return (
                <motion.button
                  key={option.id}
                  onClick={() => handleChoice(option.id)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-orange-500/30 bg-orange-500/10 text-orange-600 dark:text-orange-400 hover:bg-orange-500/20 transition-all font-medium text-sm"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Icon className="w-4 h-4" />
                  {option.label}
                </motion.button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
