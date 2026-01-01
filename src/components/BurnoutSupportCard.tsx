import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Moon, Wind } from 'lucide-react';
import { Button } from '@/components/ui/button';
import auraAvatar from '@/assets/aura-avatar.jpeg';

interface BurnoutSupportCardProps {
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  onChoice: (choice: string) => void;
  onDismiss: () => void;
}

export const BurnoutSupportCard: React.FC<BurnoutSupportCardProps> = ({
  timeOfDay,
  onChoice,
  onDismiss,
}) => {
  const [isTyping, setIsTyping] = useState(true);
  const [responded, setResponded] = useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => setIsTyping(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  const getMessage = () => {
    switch (timeOfDay) {
      case 'morning':
        return "Hey. Today feels heavy, doesn't it.\nWe don't have to fix everything.";
      case 'afternoon':
        return "How are you holding up?\nEven resting is doing something.";
      case 'evening':
        return "You made it through today.\nThat already counts.";
      case 'night':
        return "Before you sleep—\ntoday wasn't about progress. It was about recovery.";
    }
  };

  const getOptions = () => {
    switch (timeOfDay) {
      case 'morning':
        return [
          { id: 'light', label: 'Take it very light' },
          { id: 'later', label: 'Just talk later' },
        ];
      case 'afternoon':
        return [
          { id: 'reset', label: 'Want a 5-minute reset?' },
        ];
      case 'evening':
      case 'night':
        return [
          { id: 'rest', label: 'Just rest' },
          { id: 'write', label: 'Write one line' },
        ];
    }
  };

  const handleChoice = (choice: string) => {
    setResponded(true);
    onChoice(choice);
    
    // Auto-dismiss after response
    setTimeout(onDismiss, 2000);
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
        <div className="w-9 h-9 rounded-full overflow-hidden ring-2 ring-rose-500/20 shrink-0">
          <img src={auraAvatar} alt="AURRA" className="w-full h-full object-cover" />
        </div>
        
        <div className="flex-1">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-br from-rose-500/10 to-pink-500/10 border border-rose-500/20 rounded-2xl rounded-tl-sm px-4 py-3 max-w-[85%]"
          >
            {isTyping ? (
              <div className="flex gap-1.5 py-1">
                <span className="w-2 h-2 bg-rose-400/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-rose-400/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-rose-400/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            ) : responded ? (
              <p className="text-foreground flex items-center gap-2">
                <Heart className="w-4 h-4 text-rose-400" />
                I'm here with you.
              </p>
            ) : (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-rose-400">
                  <Wind className="w-4 h-4" />
                  <span className="text-xs font-medium">Taking it easy</span>
                </div>
                <p className="text-foreground whitespace-pre-line">
                  {getMessage()}
                </p>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Options - Only show if not responded */}
      <AnimatePresence>
        {!isTyping && !responded && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ delay: 0.1 }}
            className="ml-12 flex gap-2 flex-wrap"
          >
            {options.map((option) => (
              <motion.button
                key={option.id}
                onClick={() => handleChoice(option.id)}
                className="px-4 py-2.5 rounded-full border border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 transition-all font-medium text-sm"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {option.label}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
