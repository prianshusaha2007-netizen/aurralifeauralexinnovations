/**
 * AURRA Smart Hydration Hook
 * 
 * Hydration reminders that respect user's life rhythm patterns
 * Silent during sleep, gentler during weekends, active during waking hours
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useLifeRhythm } from './useLifeRhythm';
import { toast } from 'sonner';

interface HydrationNudge {
  id: string;
  message: string;
  timestamp: Date;
  dismissed: boolean;
}

const NUDGE_MESSAGES = [
  "Quick reminder — take a sip of water 💧",
  "Hydration check! How's your water intake?",
  "Don't forget to stay hydrated 🌊",
  "Your body will thank you for some water 💦",
  "Time for a water break ☕",
  "Stay refreshed — grab some water 🥤",
];

const GENTLE_MESSAGES = [
  "Just a soft reminder to hydrate 💧",
  "Water when you're ready ☺️",
  "No rush, but water is nice 🌿",
];

const STORAGE_KEY = 'aurra-smart-hydration';

export const useSmartHydration = () => {
  const { rhythm } = useLifeRhythm();
  const [lastNudgeTime, setLastNudgeTime] = useState<Date | null>(null);
  const [nudgesShown, setNudgesShown] = useState(0);
  const [isEnabled, setIsEnabled] = useState(true);
  const [intervalMinutes, setIntervalMinutes] = useState(60);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load settings from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setIsEnabled(parsed.isEnabled ?? true);
        setIntervalMinutes(parsed.intervalMinutes ?? 60);
        if (parsed.lastNudgeTime) {
          setLastNudgeTime(new Date(parsed.lastNudgeTime));
        }
        setNudgesShown(parsed.nudgesShown ?? 0);
      } catch (e) {
        console.error('Failed to parse smart hydration settings:', e);
      }
    }
  }, []);

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      isEnabled,
      intervalMinutes,
      lastNudgeTime: lastNudgeTime?.toISOString(),
      nudgesShown,
    }));
  }, [isEnabled, intervalMinutes, lastNudgeTime, nudgesShown]);

  /**
   * Check if it's an appropriate time to show hydration reminder
   * Respects user's life rhythm patterns
   */
  const isActiveHours = useCallback((): boolean => {
    const now = new Date();
    const hour = now.getHours();
    const isWeekend = now.getDay() === 0 || now.getDay() === 6;

    // Default active hours: 7 AM - 10 PM
    let wakeHour = 7;
    let sleepHour = 22;

    // Check rhythm patterns
    if (rhythm.onboardingComplete) {
      // Weekend handling - be more relaxed
      if (isWeekend && rhythm.weekendPattern.pace === 'relaxed') {
        wakeHour = 9; // Later start on relaxed weekends
      }
      
      // If it's "wind down" time based on pattern, stop nudges
      if (!isWeekend && rhythm.weekdayPattern.night === 'wind down' && hour >= 21) {
        return false;
      }
    }

    return hour >= wakeHour && hour < sleepHour;
  }, [rhythm]);

  /**
   * Get the appropriate nudge intensity based on rhythm
   */
  const getNudgeIntensity = useCallback((): 'normal' | 'gentle' | 'silent' => {
    const now = new Date();
    const isWeekend = now.getDay() === 0 || now.getDay() === 6;
    const hour = now.getHours();

    if (!isActiveHours()) {
      return 'silent';
    }

    if (rhythm.onboardingComplete) {
      // Weekend with high flexibility = gentle
      if (isWeekend && rhythm.weekendPattern.flexibility === 'high') {
        return 'gentle';
      }

      // Evening hours = gentle
      if (hour >= 19) {
        return 'gentle';
      }

      // If user is typically "busy" during this time, use gentle
      if (!isWeekend) {
        const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
        const pattern = rhythm.weekdayPattern[timeOfDay];
        if (pattern === 'busy' || pattern === 'focused' || pattern === 'study') {
          return 'gentle';
        }
      }
    }

    return 'normal';
  }, [rhythm, isActiveHours]);

  /**
   * Show a hydration nudge
   */
  const showNudge = useCallback(() => {
    if (!isEnabled) return;
    
    const intensity = getNudgeIntensity();
    if (intensity === 'silent') return;

    const messages = intensity === 'gentle' ? GENTLE_MESSAGES : NUDGE_MESSAGES;
    const message = messages[Math.floor(Math.random() * messages.length)];

    toast(message, {
      duration: 5000,
      icon: '💧',
    });

    setLastNudgeTime(new Date());
    setNudgesShown(prev => prev + 1);
  }, [isEnabled, getNudgeIntensity]);

  /**
   * Check if enough time has passed since last nudge
   */
  const shouldNudgeNow = useCallback((): boolean => {
    if (!isEnabled || !isActiveHours()) return false;
    
    if (!lastNudgeTime) return true;

    const timeSince = Date.now() - lastNudgeTime.getTime();
    const intervalMs = intervalMinutes * 60 * 1000;
    
    return timeSince >= intervalMs;
  }, [isEnabled, isActiveHours, lastNudgeTime, intervalMinutes]);

  // Set up interval for checking nudges
  useEffect(() => {
    if (!isEnabled) return;

    const checkAndNudge = () => {
      if (shouldNudgeNow()) {
        showNudge();
      }
    };

    // Check every minute
    intervalRef.current = setInterval(checkAndNudge, 60 * 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isEnabled, shouldNudgeNow, showNudge]);

  /**
   * Get context for AI to understand hydration state
   */
  const getHydrationContextForAI = useCallback((): string => {
    const intensity = getNudgeIntensity();
    const now = new Date();
    const hour = now.getHours();

    if (intensity === 'silent') {
      return 'Hydration reminders are paused (outside active hours)';
    }

    return `
HYDRATION CONTEXT:
- Reminders: ${isEnabled ? 'enabled' : 'disabled'}
- Intensity: ${intensity}
- Nudges shown today: ${nudgesShown}
- Current hour: ${hour}

BEHAVIOR:
- Only mention water naturally, don't force
- If user seems focused, don't interrupt with hydration
- Gentle reminder is okay when conversation allows
`;
  }, [isEnabled, nudgesShown, getNudgeIntensity]);

  /**
   * Log hydration (when user drinks water)
   */
  const logHydration = useCallback((amountMl: number = 250) => {
    setLastNudgeTime(new Date()); // Reset nudge timer
    toast.success(`+${amountMl}ml logged! 💧`, { duration: 2000 });
  }, []);

  /**
   * Temporarily pause nudges (e.g., during focus mode)
   */
  const pauseNudges = useCallback((durationMinutes: number = 60) => {
    // Set last nudge time to future to skip nudges
    const futureTime = new Date(Date.now() + durationMinutes * 60 * 1000);
    setLastNudgeTime(futureTime);
  }, []);

  return {
    isEnabled,
    setIsEnabled,
    intervalMinutes,
    setIntervalMinutes,
    lastNudgeTime,
    nudgesShown,
    isActiveHours,
    getNudgeIntensity,
    showNudge,
    shouldNudgeNow,
    getHydrationContextForAI,
    logHydration,
    pauseNudges,
  };
};
