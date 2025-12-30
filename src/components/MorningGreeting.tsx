import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useVoiceGreeting, getTimeBasedGreeting } from '@/hooks/useVoiceGreeting';
import { useAura } from '@/contexts/AuraContext';
import { AuraOrb } from './AuraOrb';

const GREETING_KEY = 'aurra-last-greeting';
export const GREETING_FREQUENCY_KEY = 'aurra-greeting-frequency';

export type GreetingFrequency = 'every4h' | 'daily' | 'off';

export const getGreetingFrequency = (): GreetingFrequency => {
  const saved = localStorage.getItem(GREETING_FREQUENCY_KEY);
  if (saved === 'every4h' || saved === 'daily' || saved === 'off') {
    return saved;
  }
  return 'every4h'; // Default
};

export const setGreetingFrequency = (frequency: GreetingFrequency) => {
  localStorage.setItem(GREETING_FREQUENCY_KEY, frequency);
};

const getCooldownHours = (frequency: GreetingFrequency): number => {
  switch (frequency) {
    case 'every4h': return 4;
    case 'daily': return 24;
    case 'off': return Infinity;
  }
};

export const MorningGreeting: React.FC = () => {
  const { userProfile } = useAura();
  const { playGreeting, isPlaying } = useVoiceGreeting();
  const [showGreeting, setShowGreeting] = useState(false);
  const [greetingText, setGreetingText] = useState('');
  const hasChecked = useRef(false);

  useEffect(() => {
    if (hasChecked.current) return;
    hasChecked.current = true;

    const frequency = getGreetingFrequency();
    
    // If greetings are off, don't show
    if (frequency === 'off') return;

    const lastGreeting = localStorage.getItem(GREETING_KEY);
    const now = new Date();
    const cooldownHours = getCooldownHours(frequency);
    
    // Check cooldown
    if (lastGreeting) {
      const lastTime = new Date(lastGreeting);
      const hoursSince = (now.getTime() - lastTime.getTime()) / (1000 * 60 * 60);
      
      if (hoursSince < cooldownHours) {
        return; // Too soon since last greeting
      }
    }

    // Show greeting based on time of day
    const userName = userProfile.name || 'there';
    const aiName = userProfile.aiName || 'AURRA';
    const userBirthday = userProfile.birthday || undefined;
    const greeting = getTimeBasedGreeting(userName, aiName, userBirthday);
    
    setGreetingText(greeting);
    setShowGreeting(true);
    localStorage.setItem(GREETING_KEY, now.toISOString());

    
    // Auto-play voice after a short delay
    setTimeout(() => {
      playGreeting(greeting);
    }, 500);
  }, [userProfile.name, userProfile.aiName, userProfile.birthday, playGreeting]);

  const handleDismiss = () => {
    setShowGreeting(false);
  };

  const handleReplay = () => {
    playGreeting(greetingText);
  };

  if (!showGreeting) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="fixed top-4 left-4 right-4 z-50 mx-auto max-w-sm"
      >
        <div className="bg-card/95 backdrop-blur-xl border border-border/50 rounded-2xl p-4 shadow-lg">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <AuraOrb size="sm" />
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground leading-relaxed">
                {greetingText}
              </p>
            </div>

            <div className="flex items-center gap-1 flex-shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleReplay}
                disabled={isPlaying}
              >
                {isPlaying ? (
                  <Volume2 className="w-4 h-4 animate-pulse text-primary" />
                ) : (
                  <Volume2 className="w-4 h-4 text-muted-foreground" />
                )}
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleDismiss}
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
