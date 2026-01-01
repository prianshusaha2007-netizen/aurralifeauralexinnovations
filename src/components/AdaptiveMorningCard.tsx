import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Moon, Sun, Coffee, Target, BookOpen, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserState, StateAdaptations } from '@/hooks/useUserStateDetection';
import auraAvatar from '@/assets/aura-avatar.jpeg';

interface AdaptiveMorningCardProps {
  userState: UserState;
  adaptations: StateAdaptations;
  onChoice: (choice: string) => void;
  onDismiss: () => void;
}

export const AdaptiveMorningCard: React.FC<AdaptiveMorningCardProps> = ({
  userState,
  adaptations,
  onChoice,
  onDismiss,
}) => {
  const [isTyping, setIsTyping] = useState(true);

  React.useEffect(() => {
    const timer = setTimeout(() => setIsTyping(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  const getOptions = () => {
    switch (userState) {
      case 'burnout':
        return [
          { id: 'light', label: 'Take it very light', icon: Coffee },
          { id: 'later', label: 'Just talk later', icon: Moon },
        ];
      case 'low_energy':
        return [
          { id: 'slow', label: 'Start slow', icon: Coffee },
          { id: 'light', label: 'Keep it light', icon: Sun },
        ];
      case 'exam_mode':
        return [
          { id: 'plan', label: 'Make a light plan', icon: Target },
          { id: 'one', label: 'One subject at a time', icon: BookOpen },
        ];
      case 'founder_mode':
        return [
          { id: 'revenue', label: 'Revenue', icon: Briefcase },
          { id: 'product', label: 'Product', icon: Target },
          { id: 'team', label: 'Team', icon: Coffee },
        ];
      default:
        return [
          { id: 'ready', label: "Let's go", icon: Sun },
          { id: 'slow', label: 'Take it slow', icon: Coffee },
        ];
    }
  };

  const options = getOptions();
  const displayOptions = adaptations.singleOptionOnly ? options.slice(0, 1) : options;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="p-4"
    >
      {/* AURRA Message */}
      <div className="flex gap-3 mb-4">
        <div className="w-9 h-9 rounded-full overflow-hidden ring-2 ring-amber-500/20 shrink-0">
          <img src={auraAvatar} alt="AURRA" className="w-full h-full object-cover" />
        </div>
        
        <div className="flex-1">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-2xl rounded-tl-sm px-4 py-3 max-w-[85%]"
          >
            {isTyping ? (
              <div className="flex gap-1.5 py-1">
                <span className="w-2 h-2 bg-amber-400/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-amber-400/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-amber-400/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            ) : (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-amber-500">
                  <Sun className="w-4 h-4" />
                  <span className="text-xs font-medium">Morning</span>
                </div>
                <p className="text-foreground whitespace-pre-line">
                  {adaptations.morningMessage}
                </p>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Options */}
      <AnimatePresence>
        {!isTyping && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ delay: 0.1 }}
            className="ml-12 flex gap-2 flex-wrap"
          >
            {displayOptions.map((option) => {
              const Icon = option.icon;
              return (
                <motion.button
                  key={option.id}
                  onClick={() => {
                    onChoice(option.id);
                    onDismiss();
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-border bg-card hover:bg-muted transition-all"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Icon className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium text-sm">{option.label}</span>
                </motion.button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
