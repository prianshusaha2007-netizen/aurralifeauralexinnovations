import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useVoiceGreeting, getMorningGreeting } from '@/hooks/useVoiceGreeting';
import { useAura } from '@/contexts/AuraContext';
import { AuraOrb } from './AuraOrb';

const MORNING_GREETING_KEY = 'aurra-last-morning-greeting';

export const MorningGreeting: React.FC = () => {
  const { userProfile } = useAura();
  const { playGreeting, isPlaying } = useVoiceGreeting();
  const [showGreeting, setShowGreeting] = useState(false);
  const [greetingText, setGreetingText] = useState('');
  const hasChecked = useRef(false);

  useEffect(() => {
    if (hasChecked.current) return;
    hasChecked.current = true;

    // Check if we should show morning greeting
    const lastGreeting = localStorage.getItem(MORNING_GREETING_KEY);
    const now = new Date();
    const hour = now.getHours();
    
    // Only show between 5 AM and 11 AM
    if (hour < 5 || hour >= 12) return;
    
    // Check if already shown today
    if (lastGreeting) {
      const lastDate = new Date(lastGreeting);
      if (
        lastDate.getDate() === now.getDate() &&
        lastDate.getMonth() === now.getMonth() &&
        lastDate.getFullYear() === now.getFullYear()
      ) {
        return; // Already shown today
      }
    }

    // Show greeting
    const userName = userProfile.name || 'there';
    const aiName = userProfile.aiName || 'AURRA';
    const greeting = getMorningGreeting(userName, aiName);
    
    setGreetingText(greeting);
    setShowGreeting(true);
    localStorage.setItem(MORNING_GREETING_KEY, now.toISOString());
    
    // Auto-play voice after a short delay
    setTimeout(() => {
      playGreeting(greeting);
    }, 500);
  }, [userProfile.name, userProfile.aiName, playGreeting]);

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
