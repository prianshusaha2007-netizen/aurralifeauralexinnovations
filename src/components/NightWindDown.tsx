import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Moon, Calendar, Sparkles } from 'lucide-react';

interface NightWindDownProps {
  onDismiss: () => void;
  onSendMessage: (message: string) => void;
}

export const NightWindDown: React.FC<NightWindDownProps> = ({
  onDismiss,
  onSendMessage,
}) => {
  const [step, setStep] = useState<'ask' | 'response' | 'done'>('ask');
  const [feeling, setFeeling] = useState<string>('');

  const handleFeelingSelect = (selected: string) => {
    setFeeling(selected);
    setStep('response');
    
    // Save to local storage for tracking
    const today = new Date().toISOString().split('T')[0];
    const windDownHistory = JSON.parse(localStorage.getItem('aura-winddown-history') || '[]');
    windDownHistory.push({ date: today, feeling: selected });
    localStorage.setItem('aura-winddown-history', JSON.stringify(windDownHistory.slice(-30)));
    localStorage.setItem('aura-winddown-date', today);
    
    // Auto dismiss after showing response
    setTimeout(() => {
      setStep('done');
      setTimeout(onDismiss, 1500);
    }, 2500);
  };

  const handleAction = (action: 'reflect' | 'rest' | 'plan') => {
    switch (action) {
      case 'reflect':
        onSendMessage("I'd like to reflect on today");
        break;
      case 'rest':
        onDismiss();
        break;
      case 'plan':
        onSendMessage("Help me plan tomorrow");
        break;
    }
  };

  const getResponseMessage = (feel: string) => {
    switch (feel) {
      case 'productive':
        return "That's great to hear. Rest well tonight 🤍";
      case 'okay':
        return "Some days are just okay, and that's fine.\nRest well 🤍";
      case 'tiring':
        return "You showed up even when it was hard.\nTomorrow's a fresh start. Rest well 🤍";
      default:
        return "Sleep well 🤍";
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="p-4 pb-6"
      >
        {/* AURRA Message */}
        <div className="flex gap-3 mb-4">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center">
            <Moon className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="flex-1">
            <motion.div
              key={step}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-2xl rounded-tl-sm px-4 py-3 max-w-[85%]"
            >
              {step === 'ask' && (
                <div>
                  <p className="text-foreground font-medium mb-1">
                    Before you wind down... 🌙
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Today felt productive, even if tiring.
                    <br />Want to reflect or just rest?
                  </p>
                </div>
              )}
              {step === 'response' && (
                <p className="text-foreground whitespace-pre-line">
                  {getResponseMessage(feeling)}
                </p>
              )}
              {step === 'done' && (
                <p className="text-foreground flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Goodnight 🌙
                </p>
              )}
            </motion.div>
          </div>
        </div>

        {/* Response Options */}
        {step === 'ask' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="ml-11 flex gap-2 flex-wrap"
          >
            <Button
              variant="outline"
              onClick={() => handleAction('reflect')}
              className="rounded-full"
            >
              Quick reflection
            </Button>
            <Button
              variant="outline"
              onClick={() => handleAction('rest')}
              className="rounded-full"
            >
              Just rest
            </Button>
            <Button
              variant="outline"
              onClick={() => handleAction('plan')}
              className="rounded-full flex items-center gap-1"
            >
              <Calendar className="w-3 h-3" />
              Plan tomorrow
            </Button>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};
