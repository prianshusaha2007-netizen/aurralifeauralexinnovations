/**
 * AURRA Burnout Detection System
 * 
 * Passively monitors usage patterns and suggests rest when needed
 * No labels, no diagnosis, no panic - just gentle awareness
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useLifeRhythm } from './useLifeRhythm';

export interface BurnoutIndicators {
  lateNightUsage: number;       // Count of sessions after 11 PM in last 7 days
  longFocusSessions: number;    // Sessions > 2 hours without break
  skippedBreaks: number;        // Breaks dismissed or skipped
  negativeLanguage: number;     // Count of negative language patterns
  consecutiveHeavyDays: number; // Days with high activity
  weekendUsage: boolean;        // Using during recovery weekend
}

export interface BurnoutState {
  level: 'healthy' | 'watch' | 'concern' | 'rest_needed';
  score: number;
  indicators: BurnoutIndicators;
  suggestedAction: string | null;
  lastChecked: Date;
}

const STORAGE_KEY = 'aurra-burnout-detection';

const NEGATIVE_PATTERNS = [
  'tired', 'exhausted', 'burnt', 'burnout', "can't focus", 
  'overwhelmed', 'drained', 'done', "don't feel like", 'sigh',
  'whatever', 'idk', 'meh', 'ugh', 'too much', "can't anymore",
  'stressed', 'anxious', 'worried', 'frustrated', 'stuck'
];

export const useBurnoutDetection = () => {
  const { rhythm } = useLifeRhythm();
  
  const [data, setData] = useState<{
    sessionLogs: { timestamp: string; duration: number; isLateNight: boolean }[];
    breaksDismissed: number;
    negativeCount: number;
    lastRestSuggestion: string | null;
    restAccepted: boolean;
    dailyActiveMinutes: { date: string; minutes: number }[];
  }>({
    sessionLogs: [],
    breaksDismissed: 0,
    negativeCount: 0,
    lastRestSuggestion: null,
    restAccepted: false,
    dailyActiveMinutes: [],
  });

  // Load from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setData(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse burnout detection data:', e);
      }
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  /**
   * Calculate burnout indicators from stored data
   */
  const indicators = useMemo((): BurnoutIndicators => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    // Filter to last 7 days
    const recentSessions = data.sessionLogs.filter(
      s => new Date(s.timestamp) >= weekAgo
    );

    const lateNightUsage = recentSessions.filter(s => s.isLateNight).length;
    const longFocusSessions = recentSessions.filter(s => s.duration > 120).length;
    
    // Calculate consecutive heavy days
    const sortedDays = [...data.dailyActiveMinutes]
      .filter(d => new Date(d.date) >= weekAgo)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    let consecutiveHeavyDays = 0;
    for (const day of sortedDays) {
      if (day.minutes > 180) { // More than 3 hours
        consecutiveHeavyDays++;
      } else {
        break;
      }
    }

    // Check weekend usage
    const isWeekend = now.getDay() === 0 || now.getDay() === 6;
    const weekendUsage = isWeekend && recentSessions.some(s => {
      const sessionDate = new Date(s.timestamp);
      return sessionDate.getDay() === 0 || sessionDate.getDay() === 6;
    });

    return {
      lateNightUsage,
      longFocusSessions,
      skippedBreaks: data.breaksDismissed,
      negativeLanguage: data.negativeCount,
      consecutiveHeavyDays,
      weekendUsage: weekendUsage && rhythm.weekendPattern.recovery,
    };
  }, [data, rhythm]);

  /**
   * Calculate burnout state from indicators
   */
  const burnoutState = useMemo((): BurnoutState => {
    let score = 0;
    
    // Late night usage (max 25 points)
    score += Math.min(indicators.lateNightUsage * 5, 25);
    
    // Long focus sessions (max 20 points)
    score += Math.min(indicators.longFocusSessions * 7, 20);
    
    // Skipped breaks (max 15 points)
    score += Math.min(indicators.skippedBreaks * 3, 15);
    
    // Negative language (max 20 points)
    score += Math.min(indicators.negativeLanguage * 4, 20);
    
    // Consecutive heavy days (max 15 points)
    score += Math.min(indicators.consecutiveHeavyDays * 5, 15);
    
    // Weekend usage during recovery (5 points)
    if (indicators.weekendUsage) score += 5;

    // Determine level
    let level: BurnoutState['level'] = 'healthy';
    let suggestedAction: string | null = null;

    if (score >= 60) {
      level = 'rest_needed';
      suggestedAction = "You've been pushing hard. Today might be a good day to rest.";
    } else if (score >= 40) {
      level = 'concern';
      suggestedAction = "You seem tired lately. Want to go lighter today?";
    } else if (score >= 20) {
      level = 'watch';
      suggestedAction = null; // Just monitoring, no suggestion yet
    }

    return {
      level,
      score,
      indicators,
      suggestedAction,
      lastChecked: new Date(),
    };
  }, [indicators]);

  /**
   * Log a focus/work session
   */
  const logSession = useCallback((durationMinutes: number) => {
    const now = new Date();
    const isLateNight = now.getHours() >= 23 || now.getHours() < 5;
    
    setData(prev => {
      const today = now.toISOString().split('T')[0];
      const existingDay = prev.dailyActiveMinutes.find(d => d.date === today);
      
      const updatedDaily = existingDay
        ? prev.dailyActiveMinutes.map(d => 
            d.date === today ? { ...d, minutes: d.minutes + durationMinutes } : d
          )
        : [...prev.dailyActiveMinutes.slice(-30), { date: today, minutes: durationMinutes }];

      return {
        ...prev,
        sessionLogs: [
          ...prev.sessionLogs.slice(-50),
          { timestamp: now.toISOString(), duration: durationMinutes, isLateNight }
        ],
        dailyActiveMinutes: updatedDaily,
      };
    });
  }, []);

  /**
   * Log when user dismisses a break suggestion
   */
  const logBreakDismissed = useCallback(() => {
    setData(prev => ({
      ...prev,
      breaksDismissed: prev.breaksDismissed + 1,
    }));
  }, []);

  /**
   * Analyze a message for negative language patterns
   */
  const analyzeMessage = useCallback((message: string) => {
    const lower = message.toLowerCase();
    const hasNegative = NEGATIVE_PATTERNS.some(p => lower.includes(p));
    
    if (hasNegative) {
      setData(prev => ({
        ...prev,
        negativeCount: prev.negativeCount + 1,
      }));
    }
  }, []);

  /**
   * User accepted rest suggestion
   */
  const acceptRestSuggestion = useCallback(() => {
    setData(prev => ({
      ...prev,
      restAccepted: true,
      lastRestSuggestion: new Date().toISOString(),
      // Reset some counters after acceptance
      breaksDismissed: 0,
      negativeCount: Math.max(0, prev.negativeCount - 3),
    }));
  }, []);

  /**
   * Reset weekly counters (call on Monday)
   */
  const weeklyReset = useCallback(() => {
    setData(prev => ({
      ...prev,
      breaksDismissed: 0,
      negativeCount: 0,
      restAccepted: false,
    }));
  }, []);

  /**
   * Get context for AI prompt
   */
  const getBurnoutContextForAI = useCallback((): string => {
    if (burnoutState.level === 'healthy') {
      return ''; // Don't add context if healthy
    }

    const contexts: Record<string, string> = {
      watch: `
USER WELLNESS: Monitoring
- Some signs of fatigue detected
- Continue normal interactions
- Be ready to suggest breaks if pattern continues`,

      concern: `
USER WELLNESS: Concern Level
- User shows fatigue patterns: ${indicators.lateNightUsage} late night sessions, ${indicators.consecutiveHeavyDays} heavy days
- Tone: More supportive, less push
- Offer lighter options when possible
- Don't mention "burnout" directly`,

      rest_needed: `
USER WELLNESS: Rest Recommended
- Strong fatigue signals detected
- REDUCE productivity pushes significantly
- Suggest rest without diagnosing
- Use phrases like "take it easy today" or "you've been working hard"
- If user asks to focus: gently suggest shorter duration
- Evening message: prioritize winding down`,
    };

    return contexts[burnoutState.level] || '';
  }, [burnoutState, indicators]);

  /**
   * Check if we should show a rest suggestion
   */
  const shouldSuggestRest = useCallback((): boolean => {
    if (burnoutState.level !== 'rest_needed' && burnoutState.level !== 'concern') {
      return false;
    }

    // Don't suggest if already accepted today
    if (data.restAccepted) {
      const lastSuggestion = data.lastRestSuggestion ? new Date(data.lastRestSuggestion) : null;
      if (lastSuggestion && lastSuggestion.toDateString() === new Date().toDateString()) {
        return false;
      }
    }

    return true;
  }, [burnoutState, data]);

  return {
    burnoutState,
    indicators,
    logSession,
    logBreakDismissed,
    analyzeMessage,
    acceptRestSuggestion,
    weeklyReset,
    getBurnoutContextForAI,
    shouldSuggestRest,
  };
};
