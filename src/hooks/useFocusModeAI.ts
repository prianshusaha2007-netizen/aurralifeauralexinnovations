import { useState, useCallback, useEffect, useRef } from 'react';
import { useFocusMode, FocusSession } from './useFocusMode';
import { useFocusSessions } from './useFocusSessions';

export type FocusType = 'study' | 'coding' | 'work' | 'creative' | 'quiet' | 'gym';

export type GymSubType = 'strength' | 'cardio' | 'light';
export type GymBodyArea = 'upper' | 'lower' | 'full';

export interface FocusGoal {
  description: string;
  type: FocusType;
  startedAt: Date;
  gymSubType?: GymSubType;
  gymBodyArea?: GymBodyArea;
}

export interface StruggleSignal {
  type: 'confusion' | 'frustration' | 'distraction' | 'pause' | 'fatigue' | 'pain';
  timestamp: Date;
  message?: string;
}

export interface RecoveryState {
  needsRecovery: boolean;
  lastGymSession: Date | null;
  energyLevel: 'high' | 'moderate' | 'low';
  recoveryDaysRemaining: number;
}

export interface FocusModeState {
  isActive: boolean;
  focusType: FocusType | null;
  goal: FocusGoal | null;
  struggledSignals: StruggleSignal[];
  pauseCount: number;
  lastInteractionTime: Date | null;
  persona: 'mentor' | 'guide' | 'silent' | 'companion';
  recoveryState: RecoveryState;
}

const FOCUS_STORAGE_KEY = 'aurra-focus-ai-state';

const RECOVERY_STORAGE_KEY = 'aurra-recovery-state';

export const useFocusModeAI = () => {
  const focusMode = useFocusMode();
  const { saveFocusSession } = useFocusSessions();
  
  const [focusType, setFocusType] = useState<FocusType | null>(null);
  const [goal, setGoal] = useState<FocusGoal | null>(null);
  const [struggleSignals, setStruggleSignals] = useState<StruggleSignal[]>([]);
  const [pauseCount, setPauseCount] = useState(0);
  const [lastInteractionTime, setLastInteractionTime] = useState<Date | null>(null);
  const [awaitingGoal, setAwaitingGoal] = useState(false);
  const [awaitingTypeSelection, setAwaitingTypeSelection] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(false);
  
  // Gym-specific state
  const [awaitingGymSubType, setAwaitingGymSubType] = useState(false);
  const [awaitingGymBodyArea, setAwaitingGymBodyArea] = useState(false);
  const [gymSubType, setGymSubType] = useState<GymSubType | null>(null);
  const [recoveryState, setRecoveryState] = useState<RecoveryState>(() => {
    const stored = localStorage.getItem(RECOVERY_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        return {
          ...parsed,
          lastGymSession: parsed.lastGymSession ? new Date(parsed.lastGymSession) : null,
        };
      } catch {
        return { needsRecovery: false, lastGymSession: null, energyLevel: 'high', recoveryDaysRemaining: 0 };
      }
    }
    return { needsRecovery: false, lastGymSession: null, energyLevel: 'high', recoveryDaysRemaining: 0 };
  });
  
  const longPauseTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Save recovery state
  useEffect(() => {
    localStorage.setItem(RECOVERY_STORAGE_KEY, JSON.stringify(recoveryState));
  }, [recoveryState]);

  // Check if it's a recovery day
  const checkRecoveryNeeded = useCallback(() => {
    if (!recoveryState.lastGymSession) return false;
    
    const hoursSinceGym = (Date.now() - recoveryState.lastGymSession.getTime()) / (1000 * 60 * 60);
    const isWithin24Hours = hoursSinceGym < 24;
    
    // Check for late-night workout or fatigue signals
    const lastGymHour = recoveryState.lastGymSession.getHours();
    const wasLateWorkout = lastGymHour >= 21; // After 9 PM
    
    return isWithin24Hours && (wasLateWorkout || recoveryState.energyLevel === 'low');
  }, [recoveryState]);

  // Determine persona based on focus type
  const getPersona = useCallback((): 'mentor' | 'guide' | 'silent' | 'companion' => {
    if (!focusType) return 'guide';
    
    switch (focusType) {
      case 'study':
      case 'coding':
        return 'mentor';
      case 'work':
        return 'guide';
      case 'gym':
        return 'companion'; // Calm, supportive presence for gym
      case 'creative':
      case 'quiet':
        return 'silent';
      default:
        return 'guide';
    }
  }, [focusType]);

  // Detect struggle from message content (including gym-specific signals)
  const detectStruggle = useCallback((message: string): StruggleSignal | null => {
    const lowerMessage = message.toLowerCase();
    
    // Pain patterns (SAFETY - highest priority for gym)
    const painPatterns = [
      /push through pain/i,
      /hurts/i,
      /pain/i,
      /injury/i,
      /something's wrong/i,
      /sharp/i,
    ];
    
    // Fatigue patterns (gym-specific)
    const fatiguePatterns = [
      /tired/i,
      /exhausted/i,
      /feeling tired/i,
      /no energy/i,
      /worn out/i,
      /थक गया/i,
    ];
    
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
    
    // Priority: Pain > Fatigue > Others
    if (painPatterns.some(p => p.test(lowerMessage))) {
      return { type: 'pain', timestamp: new Date(), message };
    }
    
    if (fatiguePatterns.some(p => p.test(lowerMessage))) {
      return { type: 'fatigue', timestamp: new Date(), message };
    }
    
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
    } else if (type === 'gym') {
      // For gym, ask about workout type first
      setAwaitingGymSubType(true);
    } else {
      setAwaitingGoal(true);
    }
  }, [focusMode]);

  // Select gym sub-type (strength/cardio/light)
  const selectGymSubType = useCallback((subType: GymSubType) => {
    setGymSubType(subType);
    setAwaitingGymSubType(false);
    
    if (subType === 'strength') {
      setAwaitingGymBodyArea(true);
    } else {
      // For cardio/light, go straight to session
      const description = subType === 'cardio' ? 'Cardio workout' : 'Light movement';
      const duration = subType === 'cardio' ? 30 : 20;
      setGoal({ description, type: 'gym', startedAt: new Date(), gymSubType: subType });
      focusMode.startSession(duration, 'gym', false);
    }
  }, [focusMode]);

  // Select gym body area (for strength)
  const selectGymBodyArea = useCallback((area: GymBodyArea) => {
    setAwaitingGymBodyArea(false);
    const description = `${area.charAt(0).toUpperCase() + area.slice(1)} body strength`;
    setGoal({ 
      description, 
      type: 'gym', 
      startedAt: new Date(), 
      gymSubType: gymSubType || 'strength',
      gymBodyArea: area 
    });
    focusMode.startSession(45, 'gym', false);
  }, [focusMode, gymSubType]);

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
    
    // If gym session, update recovery state
    if (focusType === 'gym') {
      const hasFatigue = struggleSignals.some(s => s.type === 'fatigue');
      const wasShortSession = (focusMode.currentSession?.duration || 0) < 20;
      const isLateNight = new Date().getHours() >= 21;
      
      setRecoveryState({
        needsRecovery: true,
        lastGymSession: new Date(),
        energyLevel: hasFatigue || wasShortSession ? 'low' : isLateNight ? 'moderate' : 'high',
        recoveryDaysRemaining: hasFatigue ? 2 : 1,
      });
    }
    
    // Clear timers
    if (longPauseTimerRef.current) {
      clearTimeout(longPauseTimerRef.current);
    }
  }, [focusMode, focusType, struggleSignals]);

  // Record reflection and reset state
  const recordReflection = useCallback(async (completed: 'yes' | 'almost' | 'not_today') => {
    // Store session result for routine learning
    const sessionResult = {
      type: focusType,
      gymSubType: goal?.gymSubType,
      gymBodyArea: goal?.gymBodyArea,
      goal: goal?.description,
      duration: focusMode.currentSession?.duration || 0,
      completed,
      struggledCount: struggleSignals.length,
      struggledTypes: struggleSignals.map(s => s.type),
      timestamp: new Date().toISOString(),
    };
    
    // Save to localStorage for routine adaptation
    const storedResults = localStorage.getItem('aurra-focus-results');
    const results = storedResults ? JSON.parse(storedResults) : [];
    results.push(sessionResult);
    localStorage.setItem('aurra-focus-results', JSON.stringify(results.slice(-50))); // Keep last 50
    
    // Also save to database for friend circles
    if (focusType) {
      await saveFocusSession({
        focusType,
        goal: goal?.description,
        durationMinutes: focusMode.currentSession?.duration || 25,
        completed,
        struggledCount: struggleSignals.length,
        gymSubType: goal?.gymSubType,
        gymBodyArea: goal?.gymBodyArea,
      });
    }
    
    // Reset state
    setFocusType(null);
    setGoal(null);
    setStruggleSignals([]);
    setPauseCount(0);
    setSessionComplete(false);
    setGymSubType(null);
  }, [focusType, goal, struggleSignals, focusMode.currentSession, saveFocusSession]);

  // Update recovery status (called on app open)
  const updateRecoveryStatus = useCallback((feeling: 'better' | 'still_tired') => {
    if (feeling === 'better') {
      setRecoveryState(prev => ({
        ...prev,
        needsRecovery: false,
        energyLevel: 'high',
        recoveryDaysRemaining: 0,
      }));
    } else {
      setRecoveryState(prev => ({
        ...prev,
        recoveryDaysRemaining: Math.max(0, prev.recoveryDaysRemaining - 1),
        energyLevel: prev.recoveryDaysRemaining > 1 ? 'low' : 'moderate',
      }));
    }
  }, []);

  // Get adaptive response based on struggle patterns
  const getStruggleResponse = useCallback((): { message: string; buttons?: string[]; isSafetyOverride?: boolean } | null => {
    if (struggleSignals.length === 0) return null;
    
    const recentSignals = struggleSignals.filter(
      s => new Date().getTime() - s.timestamp.getTime() < 5 * 60 * 1000
    );
    
    const lastSignal = struggleSignals[struggleSignals.length - 1];
    
    // SAFETY OVERRIDE - Pain during gym (highest priority)
    if (lastSignal.type === 'pain' && focusType === 'gym') {
      return {
        message: "Let's not do that.\nPain isn't something to ignore.",
        buttons: ['Stop workout', 'Switch to stretching'],
        isSafetyOverride: true,
      };
    }
    
    // Fatigue during gym
    if (lastSignal.type === 'fatigue' && focusType === 'gym') {
      return {
        message: "That's okay.\nWant to slow down or stop after this set?",
        buttons: ['Slow down', 'Finish this set'],
      };
    }
    
    if (recentSignals.length >= 2) {
      // Multiple struggles - offer break
      return {
        message: "Let's pause for a minute.\nWant a simpler explanation or a break?",
        buttons: ['Simpler', 'Short break'],
      };
    }
    
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
      case 'fatigue':
        return {
          message: "Your body's asking for rest.\nTake it easy?",
          buttons: ['Short break', 'Wrap up'],
        };
      default:
        return null;
    }
  }, [struggleSignals, focusType]);

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
      // Gym-specific context
      gymSubType: goal?.gymSubType,
      gymBodyArea: goal?.gymBodyArea,
      isRecoveryDay: checkRecoveryNeeded(),
      energyLevel: recoveryState.energyLevel,
    };
  }, [focusMode.isActive, focusMode.remainingTime, focusType, goal, getPersona, struggleSignals, checkRecoveryNeeded, recoveryState.energyLevel]);

  // Get recommended music type based on focus type
  const getRecommendedMusic = useCallback(() => {
    switch (focusType) {
      case 'coding':
        return 'lofi'; // Low-beat instrumental
      case 'study':
        return 'binaural'; // Alpha waves for focus
      case 'gym':
        return 'cafe'; // Rhythmic, steady
      case 'creative':
        return 'nature'; // Ambient, non-distracting
      case 'work':
        return 'whitenoise'; // Block distractions
      case 'quiet':
      default:
        return null; // No music
    }
  }, [focusType]);

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
    
    // Gym-specific state
    awaitingGymSubType,
    awaitingGymBodyArea,
    gymSubType,
    recoveryState,
    
    // Actions
    initiateFocusMode,
    selectFocusType,
    selectGymSubType,
    selectGymBodyArea,
    setFocusGoal,
    handleFocusInteraction,
    endFocusSession,
    recordReflection,
    updateRecoveryStatus,
    logStruggle,
    
    // Helpers
    detectStruggle,
    getStruggleResponse,
    getFocusContext,
    getRecommendedMusic,
    checkRecoveryNeeded,
  };
};
