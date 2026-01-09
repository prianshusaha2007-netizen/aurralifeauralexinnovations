import { useState, useCallback, useEffect, useRef } from 'react';

// Re-define type locally to avoid circular dependency
export type FocusTypeNudge = 'study' | 'coding' | 'work' | 'creative' | 'quiet' | 'gym';

export interface FocusNudge {
  message: string;
  isBreakSuggestion?: boolean;
  emoji?: string;
}

// Mode-specific contextual templates following AURRA philosophy
const MODE_TEMPLATES: Record<FocusTypeNudge, {
  framing: string[];
  nudges: string[];
  breakSuggestions: string[];
  reflectionPrompts: string[];
}> = {
  coding: {
    framing: [
      "Flow state incoming. I'll stay quiet unless you need me.",
      "Let's debug together. Take your time.",
      "Building something cool. I'm here if you get stuck.",
    ],
    nudges: [
      "Still in the zone? Want a hint or explanation?",
      "How's the logic feeling? Need a fresh perspective?",
      "Any blockers I can help with?",
    ],
    breakSuggestions: [
      "Eyes need a break? 5 minutes can help you see the solution.",
      "Step away for a moment? Sometimes the answer comes when you're not looking.",
    ],
    reflectionPrompts: [
      "What did you build or fix?",
      "Any 'aha' moments worth remembering?",
    ],
  },
  study: {
    framing: [
      "Learning mode activated. Let's make it stick.",
      "Ready to understand, not just memorize.",
      "Your brain is ready. Let's go at your pace.",
    ],
    nudges: [
      "What did you just learn? (Quick recall helps!)",
      "Any stuck point I can help clarify?",
      "Want me to quiz you on what you've covered?",
    ],
    breakSuggestions: [
      "Short break? Your brain consolidates during rest.",
      "5 minutes to stretch. The concepts will settle in.",
    ],
    reflectionPrompts: [
      "What stayed with you from this session?",
      "Anything you want to revisit tomorrow?",
    ],
  },
  work: {
    framing: [
      "Priorities clear. Let's knock them out.",
      "Focus on what matters. I'll help you stay on track.",
      "Work mode: clarity over chaos.",
    ],
    nudges: [
      "Making progress? Anything blocking you?",
      "Need help prioritizing the next step?",
      "How can I help you move faster?",
    ],
    breakSuggestions: [
      "Quick breather? You'll come back sharper.",
      "5 minutes to reset. Then we finish strong.",
    ],
    reflectionPrompts: [
      "What did you accomplish?",
      "What's the one thing left for later?",
    ],
  },
  gym: {
    framing: [
      "Time to move. I'm here for support, not pressure. 💪",
      "Your body, your pace. Let's do this.",
      "Workout companion mode. Form over ego.",
    ],
    nudges: [
      "Hydration check. 💧",
      "How's your form feeling?",
      "Rest when needed. Consistency beats intensity.",
    ],
    breakSuggestions: [
      "Take a breather between sets.",
      "Listen to your body. Rest is part of the workout.",
    ],
    reflectionPrompts: [
      "How do you feel?",
      "Remember to stretch and hydrate. 🧘",
    ],
  },
  creative: {
    framing: [
      "Creative flow. I'll stay out of your way.",
      "Make something. I'm just here if you need me.",
      "Your canvas, your rules.",
    ],
    nudges: [
      "Still creating? Need any input?",
    ],
    breakSuggestions: [
      "Step back and see it with fresh eyes?",
    ],
    reflectionPrompts: [
      "What did you create today?",
    ],
  },
  quiet: {
    framing: [
      "Quiet focus. No interruptions from me.",
      "I'll be here. Silently.",
    ],
    nudges: [], // No nudges for quiet mode
    breakSuggestions: [],
    reflectionPrompts: [
      "How was the focus time?",
    ],
  },
};

export const useFocusSessionNudges = (
  focusType: FocusTypeNudge | null,
  isActive: boolean,
  remainingTime: number
) => {
  const [currentNudge, setCurrentNudge] = useState<FocusNudge | null>(null);
  const [framingMessage, setFramingMessage] = useState<string>('');
  const [nudgeHistory, setNudgeHistory] = useState<Date[]>([]);
  const nudgeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const sessionStartRef = useRef<Date | null>(null);

  // Get random item from array
  const getRandomItem = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

  // Generate framing message on session start
  const generateFramingMessage = useCallback(() => {
    if (!focusType) return '';
    const templates = MODE_TEMPLATES[focusType];
    return getRandomItem(templates.framing);
  }, [focusType]);

  // Generate contextual nudge (20-40 min intervals)
  const generateNudge = useCallback((): FocusNudge | null => {
    if (!focusType) return null;
    
    const templates = MODE_TEMPLATES[focusType];
    
    // Skip nudges for quiet mode
    if (focusType === 'quiet' || templates.nudges.length === 0) return null;
    
    // Calculate session duration
    const sessionMinutes = sessionStartRef.current 
      ? Math.floor((Date.now() - sessionStartRef.current.getTime()) / 60000)
      : 0;
    
    // Suggest break after 45+ minutes
    if (sessionMinutes >= 45 && templates.breakSuggestions.length > 0) {
      return {
        message: getRandomItem(templates.breakSuggestions),
        isBreakSuggestion: true,
        emoji: '☕',
      };
    }
    
    return {
      message: getRandomItem(templates.nudges),
      emoji: focusType === 'gym' ? '💪' : '✨',
    };
  }, [focusType]);

  // Get reflection prompt for end of session
  const getReflectionPrompt = useCallback((): string => {
    if (!focusType) return 'How did it go?';
    const templates = MODE_TEMPLATES[focusType];
    return getRandomItem(templates.reflectionPrompts);
  }, [focusType]);

  // Start nudge cycle when session becomes active
  useEffect(() => {
    if (isActive && focusType) {
      sessionStartRef.current = new Date();
      setFramingMessage(generateFramingMessage() || '');
      setNudgeHistory([]);
      setCurrentNudge(null);
      
      // Set up nudge timer (random 20-40 minutes)
      const scheduleNudge = () => {
        // Skip for quiet mode
        if (focusType === 'quiet') return;
        
        const nudgeInterval = (20 + Math.random() * 20) * 60 * 1000; // 20-40 min in ms
        
        nudgeTimerRef.current = setTimeout(() => {
          const nudge = generateNudge();
          if (nudge) {
            setCurrentNudge(nudge);
            setNudgeHistory(prev => [...prev, new Date()]);
          }
          // Schedule next nudge
          scheduleNudge();
        }, nudgeInterval);
      };
      
      scheduleNudge();
    } else {
      // Clear on session end
      if (nudgeTimerRef.current) {
        clearTimeout(nudgeTimerRef.current);
        nudgeTimerRef.current = null;
      }
    }
    
    return () => {
      if (nudgeTimerRef.current) {
        clearTimeout(nudgeTimerRef.current);
      }
    };
  }, [isActive, focusType, generateFramingMessage, generateNudge]);

  // Dismiss current nudge
  const dismissNudge = useCallback(() => {
    setCurrentNudge(null);
  }, []);

  // Get session affirmation based on duration
  const getSessionAffirmation = useCallback((): string => {
    const sessionMinutes = sessionStartRef.current
      ? Math.floor((Date.now() - sessionStartRef.current.getTime()) / 60000)
      : 0;
    
    if (sessionMinutes >= 60) return "That was a solid session. Well done.";
    if (sessionMinutes >= 30) return "Good focus block. You showed up.";
    if (sessionMinutes >= 15) return "Every minute counts.";
    return "Showing up is half the battle.";
  }, []);

  return {
    framingMessage,
    currentNudge,
    nudgeHistory,
    dismissNudge,
    getReflectionPrompt,
    getSessionAffirmation,
    generateNudge,
  };
};
