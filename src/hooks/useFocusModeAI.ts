import { useState, useCallback, useEffect, useRef } from 'react';
import { useFocusMode, FocusSession } from './useFocusMode';

export type FocusType = 'study' | 'coding' | 'work' | 'creative' | 'quiet';

export interface FocusGoal {
  description: string;
  type: FocusType;
  startedAt: Date;
}

export interface StruggleSignal {
  type: 'confusion' | 'frustration' | 'distraction' | 'pause';
  timestamp: Date;
  message?: string;
}

export interface FocusModeState {
  isActive: boolean;
  focusType: FocusType | null;
  goal: FocusGoal | null;
  struggledSignals: StruggleSignal[];
  pauseCount: number;
  lastInteractionTime: Date | null;
  persona: 'mentor' | 'guide' | 'silent';
}

const FOCUS_STORAGE_KEY = 'aurra-focus-ai-state';

export const useFocusModeAI = () => {
  const focusMode = useFocusMode();
  
  const [focusType, setFocusType] = useState<FocusType | null>(null);
  const [goal, setGoal] = useState<FocusGoal | null>(null);
  const [struggleSignals, setStruggleSignals] = useState<StruggleSignal[]>([]);
  const [pauseCount, setPauseCount] = useState(0);
  const [lastInteractionTime, setLastInteractionTime] = useState<Date | null>(null);
  const [awaitingGoal, setAwaitingGoal] = useState(false);
  const [awaitingTypeSelection, setAwaitingTypeSelection] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(false);
  
  const longPauseTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Determine persona based on focus type
  const getPersona = useCallback((): 'mentor' | 'guide' | 'silent' => {
    if (!focusType) return 'guide';
    
    switch (focusType) {
      case 'study':
      case 'coding':
        return 'mentor';
      case 'work':
        return 'guide';
      case 'creative':
      case 'quiet':
        return 'silent';
      default:
        return 'guide';
    }
  }, [focusType]);

  // Detect struggle from message content
  const detectStruggle = useCallback((message: string): StruggleSignal | null => {
    const lowerMessage = message.toLowerCase();
    
    // Confusion patterns
    const confusionPatterns = [
      /i don'?t (?:get|understand)/i,
      /what does .+ mean/i,
      /confused/i,
      /stuck/i,
      /help me understand/i,
      /can you explain/i,
      /समझ नहीं आ रहा/i,
    ];
    
    // Frustration patterns
    const frustrationPatterns = [
      /i can'?t (?:do|figure)/i,
      /this (?:doesn'?t|won'?t) work/i,
      /frustrated/i,
      /annoyed/i,
      /ugh/i,
      /argh/i,
      /why (?:isn'?t|won'?t)/i,
    ];
    
    // Distraction patterns
    const distractionPatterns = [
      /distracted/i,
      /can'?t (?:focus|concentrate)/i,
      /mind is wandering/i,
      /bored/i,
      /don'?t feel like/i,
    ];
    
    if (confusionPatterns.some(p => p.test(lowerMessage))) {
      return { type: 'confusion', timestamp: new Date(), message };
    }
    
    if (frustrationPatterns.some(p => p.test(lowerMessage))) {
      return { type: 'frustration', timestamp: new Date(), message };
    }
    
    if (distractionPatterns.some(p => p.test(lowerMessage))) {
      return { type: 'distraction', timestamp: new Date(), message };
    }
    
    return null;
  }, []);

  // Log a struggle signal
  const logStruggle = useCallback((signal: StruggleSignal) => {
    setStruggleSignals(prev => [...prev, signal]);
  }, []);

  // Start focus mode with type selection
  const initiateFocusMode = useCallback(() => {
    setAwaitingTypeSelection(true);
  }, []);

  // Select focus type and proceed to goal setting
  const selectFocusType = useCallback((type: FocusType) => {
    setFocusType(type);
    setAwaitingTypeSelection(false);
    
    if (type === 'quiet') {
      // For quiet focus, skip goal setting
      setGoal({ description: 'Quiet focus time', type, startedAt: new Date() });
      focusMode.startSession(25, type, false);
    } else {
      setAwaitingGoal(true);
    }
  }, [focusMode]);

  // Set goal and start session
  const setFocusGoal = useCallback((description: string, duration: number = 25) => {
    if (!focusType) return;
    
    const newGoal: FocusGoal = {
      description,
      type: focusType,
      startedAt: new Date(),
    };
    
    setGoal(newGoal);
    setAwaitingGoal(false);
    focusMode.startSession(duration, focusType, false);
  }, [focusType, focusMode]);

  // Handle user interaction during focus mode
  const handleFocusInteraction = useCallback((message: string) => {
    setLastInteractionTime(new Date());
    
    // Check for struggle signals
    const struggle = detectStruggle(message);
    if (struggle) {
      logStruggle(struggle);
    }
    
    // Reset long pause timer
    if (longPauseTimerRef.current) {
      clearTimeout(longPauseTimerRef.current);
    }
    
    // Set new long pause timer (5 minutes)
    longPauseTimerRef.current = setTimeout(() => {
      logStruggle({ type: 'pause', timestamp: new Date() });
    }, 5 * 60 * 1000);
  }, [detectStruggle, logStruggle]);

  // End focus session with reflection prompt
  const endFocusSession = useCallback((completed: boolean) => {
    focusMode.endSession(completed);
    setSessionComplete(true);
    
    // Clear timers
    if (longPauseTimerRef.current) {
      clearTimeout(longPauseTimerRef.current);
    }
  }, [focusMode]);

  // Record reflection and reset state
  const recordReflection = useCallback((completed: 'yes' | 'almost' | 'not_today') => {
    // Store session result for routine learning
    const sessionResult = {
      type: focusType,
      goal: goal?.description,
      duration: focusMode.currentSession?.duration || 0,
      completed,
      struggledCount: struggleSignals.length,
      timestamp: new Date().toISOString(),
    };
    
    // Save to localStorage for routine adaptation
    const storedResults = localStorage.getItem('aurra-focus-results');
    const results = storedResults ? JSON.parse(storedResults) : [];
    results.push(sessionResult);
    localStorage.setItem('aurra-focus-results', JSON.stringify(results.slice(-50))); // Keep last 50
    
    // Reset state
    setFocusType(null);
    setGoal(null);
    setStruggleSignals([]);
    setPauseCount(0);
    setSessionComplete(false);
  }, [focusType, goal, struggleSignals, focusMode.currentSession]);

  // Get adaptive response based on struggle patterns
  const getStruggleResponse = useCallback((): { message: string; buttons?: string[] } | null => {
    if (struggleSignals.length === 0) return null;
    
    const recentSignals = struggleSignals.filter(
      s => new Date().getTime() - s.timestamp.getTime() < 5 * 60 * 1000
    );
    
    if (recentSignals.length >= 2) {
      // Multiple struggles - offer break
      return {
        message: "Let's pause for a minute.\nWant a simpler explanation or a break?",
        buttons: ['Simpler', 'Short break'],
      };
    }
    
    const lastSignal = struggleSignals[struggleSignals.length - 1];
    
    switch (lastSignal.type) {
      case 'confusion':
        return {
          message: "Let's slow it down.\nWhat part specifically is unclear?",
        };
      case 'frustration':
        return {
          message: "That happens.\nWant to take a different approach?",
          buttons: ['Try different way', 'Take a break'],
        };
      case 'distraction':
        return {
          message: "That happens.\nWant to reset for 5 minutes or stop for now?",
          buttons: ['5-minute reset', 'Stop focus'],
        };
      default:
        return null;
    }
  }, [struggleSignals]);

  // Get focus context for AI prompts
  const getFocusContext = useCallback(() => {
    if (!focusMode.isActive) return null;
    
    return {
      isActive: true,
      type: focusType,
      goal: goal?.description,
      persona: getPersona(),
      remainingMinutes: Math.ceil(focusMode.remainingTime / 60),
      struggledRecently: struggleSignals.filter(
        s => new Date().getTime() - s.timestamp.getTime() < 10 * 60 * 1000
      ).length > 0,
      totalStruggles: struggleSignals.length,
    };
  }, [focusMode.isActive, focusMode.remainingTime, focusType, goal, getPersona, struggleSignals]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (longPauseTimerRef.current) {
        clearTimeout(longPauseTimerRef.current);
      }
    };
  }, []);

  return {
    // Base focus mode
    ...focusMode,
    
    // AI-enhanced state
    focusType,
    goal,
    struggleSignals,
    pauseCount,
    lastInteractionTime,
    awaitingGoal,
    awaitingTypeSelection,
    sessionComplete,
    persona: getPersona(),
    
    // Actions
    initiateFocusMode,
    selectFocusType,
    setFocusGoal,
    handleFocusInteraction,
    endFocusSession,
    recordReflection,
    logStruggle,
    
    // Helpers
    detectStruggle,
    getStruggleResponse,
    getFocusContext,
  };
};
