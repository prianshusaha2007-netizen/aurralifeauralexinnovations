/**
 * AURRA Recovery Mode
 * 
 * Gentle recovery mode that activates after detecting 3+ stress signals.
 * Reduces productivity pushes and offers rest-first responses.
 */

import { useState, useCallback, useEffect, useMemo } from 'react';

export type StressSignal = {
  type: 'stressed' | 'tired' | 'anxious' | 'overwhelmed' | 'frustrated' | 'low';
  timestamp: number;
  message?: string;
};

export type RecoveryLevel = 'none' | 'light' | 'active' | 'deep';

interface RecoveryState {
  isActive: boolean;
  level: RecoveryLevel;
  stressSignals: StressSignal[];
  activatedAt: number | null;
  suggestionsReduced: boolean;
  toneAdapted: boolean;
}

const STORAGE_KEY = 'aurra-recovery-mode';
const STRESS_SIGNAL_THRESHOLD = 3;
const SIGNAL_WINDOW_HOURS = 2; // Signals within last 2 hours count

// Stress detection patterns
const STRESS_PATTERNS: { patterns: RegExp[]; type: StressSignal['type'] }[] = [
  {
    type: 'stressed',
    patterns: [
      /so much to do/i, /overwhelmed/i, /stressed/i, /pressure/i,
      /deadline/i, /too much/i, /can't handle/i, /freaking out/i,
      /behind on/i, /swamped/i, /slammed/i
    ]
  },
  {
    type: 'tired',
    patterns: [
      /tired/i, /exhausted/i, /drained/i, /sleepy/i, /no energy/i,
      /burnt out/i, /worn out/i, /haven't slept/i, /up all night/i,
      /can't focus/i, /brain fog/i
    ]
  },
  {
    type: 'anxious',
    patterns: [
      /worried/i, /anxious/i, /nervous/i, /scared/i, /afraid/i,
      /what if/i, /can't stop thinking/i, /overthinking/i, /panic/i
    ]
  },
  {
    type: 'overwhelmed',
    patterns: [
      /overwhelming/i, /too much going on/i, /drowning/i,
      /don't know where to start/i, /everything at once/i
    ]
  },
  {
    type: 'frustrated',
    patterns: [
      /frustrated/i, /annoyed/i, /irritated/i, /pissed/i,
      /ugh/i, /hate this/i, /nothing works/i
    ]
  },
  {
    type: 'low',
    patterns: [
      /sad/i, /down/i, /depressed/i, /lonely/i, /empty/i,
      /hopeless/i, /worthless/i, /😢|😭|💔/
    ]
  }
];

export const useRecoveryMode = () => {
  const [state, setState] = useState<RecoveryState>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        return {
          ...parsed,
          stressSignals: parsed.stressSignals || [],
        };
      } catch {
        // Fallback to default
      }
    }
    return {
      isActive: false,
      level: 'none' as RecoveryLevel,
      stressSignals: [],
      activatedAt: null,
      suggestionsReduced: false,
      toneAdapted: false,
    };
  });

  // Persist state
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  // Clean up old signals (older than window)
  useEffect(() => {
    const now = Date.now();
    const windowMs = SIGNAL_WINDOW_HOURS * 60 * 60 * 1000;
    
    setState(prev => ({
      ...prev,
      stressSignals: prev.stressSignals.filter(
        s => now - s.timestamp < windowMs
      )
    }));
  }, []);

  /**
   * Detect stress signals from a message
   */
  const detectStressSignal = useCallback((message: string): StressSignal | null => {
    const lowerMessage = message.toLowerCase();
    
    for (const { patterns, type } of STRESS_PATTERNS) {
      if (patterns.some(p => p.test(lowerMessage))) {
        return { type, timestamp: Date.now(), message };
      }
    }
    
    return null;
  }, []);

  /**
   * Process a message and add stress signal if detected
   */
  const processMessage = useCallback((message: string): { 
    signalDetected: boolean; 
    signal: StressSignal | null;
    shouldActivateRecovery: boolean;
  } => {
    const signal = detectStressSignal(message);
    
    if (!signal) {
      return { signalDetected: false, signal: null, shouldActivateRecovery: false };
    }

    const now = Date.now();
    const windowMs = SIGNAL_WINDOW_HOURS * 60 * 60 * 1000;
    
    // Count recent signals including this one
    const recentSignals = state.stressSignals.filter(
      s => now - s.timestamp < windowMs
    );
    
    const newSignals = [...recentSignals, signal];
    const shouldActivate = newSignals.length >= STRESS_SIGNAL_THRESHOLD && !state.isActive;
    
    // Determine recovery level based on signal count and types
    let level: RecoveryLevel = 'none';
    if (newSignals.length >= 5) {
      level = 'deep';
    } else if (newSignals.length >= 4) {
      level = 'active';
    } else if (newSignals.length >= 3) {
      level = 'light';
    }

    setState(prev => ({
      ...prev,
      stressSignals: newSignals,
      isActive: shouldActivate || prev.isActive,
      level: shouldActivate ? level : prev.level,
      activatedAt: shouldActivate ? Date.now() : prev.activatedAt,
      suggestionsReduced: shouldActivate || prev.isActive,
      toneAdapted: shouldActivate || prev.isActive,
    }));

    return { signalDetected: true, signal, shouldActivateRecovery: shouldActivate };
  }, [detectStressSignal, state.stressSignals, state.isActive]);

  /**
   * Get recovery context for AI prompts
   */
  const getRecoveryContextForAI = useCallback((): string => {
    if (!state.isActive) return '';

    const levelDescriptions: Record<RecoveryLevel, string> = {
      none: '',
      light: 'User seems a bit stressed. Be gentler, keep responses short.',
      active: 'User is clearly stressed. Reduce productivity talk. Focus on presence.',
      deep: 'User is overwhelmed. Minimal suggestions. Maximum calm. Rest-first approach.',
    };

    return `
====================================
🌿 RECOVERY MODE ACTIVE (${state.level.toUpperCase()})
====================================
${levelDescriptions[state.level]}

BEHAVIOR ADJUSTMENTS:
- Reduce or eliminate productivity suggestions
- Don't mention tasks, routines, or "what's next"
- Shorter, calmer responses
- Acknowledge feelings without fixing
- Offer rest as a valid option
- No pressure, no guilt
- "It's okay to take a break"

TONE:
- Warm, gentle, present
- No forced positivity
- Simple acknowledgment: "That sounds tough."
- Offer without pushing: "Want to talk or just chill?"

DO NOT:
- Ask about tasks or productivity
- Suggest "getting back on track"
- Mention streaks or consistency
- Push any goals

SIGNAL COUNT: ${state.stressSignals.length} stress signals in last ${SIGNAL_WINDOW_HOURS} hours
`;
  }, [state.isActive, state.level, state.stressSignals.length]);

  /**
   * Get activation message when recovery mode kicks in
   */
  const getActivationMessage = useCallback((): string => {
    const messages: Record<RecoveryLevel, string> = {
      none: '',
      light: "Hey, I notice things feel a bit heavy. I'm here — no pressure on anything right now. 💙",
      active: "I see you've been under a lot lately. Let's slow down. You don't have to do anything right now.",
      deep: "I'm just here with you. No tasks, no plans, no pressure. Just us. 💙",
    };
    return messages[state.level];
  }, [state.level]);

  /**
   * Manually deactivate recovery mode
   */
  const deactivateRecovery = useCallback(() => {
    setState(prev => ({
      ...prev,
      isActive: false,
      level: 'none',
      activatedAt: null,
      suggestionsReduced: false,
      toneAdapted: false,
    }));
  }, []);

  /**
   * Check if recovery mode should auto-deactivate (4 hours of no stress signals)
   */
  const checkAutoDeactivation = useCallback(() => {
    if (!state.isActive) return false;

    const now = Date.now();
    const lastSignal = state.stressSignals[state.stressSignals.length - 1];
    
    if (!lastSignal) {
      deactivateRecovery();
      return true;
    }

    // Auto-deactivate after 4 hours of no new stress signals
    const fourHoursMs = 4 * 60 * 60 * 1000;
    if (now - lastSignal.timestamp > fourHoursMs) {
      deactivateRecovery();
      return true;
    }

    return false;
  }, [state.isActive, state.stressSignals, deactivateRecovery]);

  /**
   * Recent stress signal types for context
   */
  const recentSignalTypes = useMemo(() => {
    const types = new Set(state.stressSignals.map(s => s.type));
    return Array.from(types);
  }, [state.stressSignals]);

  return {
    // State
    isActive: state.isActive,
    level: state.level,
    stressSignals: state.stressSignals,
    recentSignalTypes,
    
    // Actions
    processMessage,
    detectStressSignal,
    deactivateRecovery,
    checkAutoDeactivation,
    
    // AI Context
    getRecoveryContextForAI,
    getActivationMessage,
    
    // Flags
    suggestionsReduced: state.suggestionsReduced,
    toneAdapted: state.toneAdapted,
  };
};
