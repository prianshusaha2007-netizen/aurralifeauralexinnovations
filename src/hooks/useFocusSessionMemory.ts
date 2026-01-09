import { useState, useCallback, useEffect } from 'react';
import { useAuth } from './useAuth';

// Re-define types locally to avoid circular dependency
export type FocusTypeLocal = 'study' | 'coding' | 'work' | 'creative' | 'quiet' | 'gym';
export type GymSubTypeLocal = 'strength' | 'cardio' | 'light';
export type GymBodyAreaLocal = 'upper' | 'lower' | 'full';

export interface FocusSessionRecord {
  id: string;
  mode: FocusTypeLocal;
  duration: number; // in minutes
  emotion: 'calm' | 'stressed' | 'motivated' | 'tired' | 'accomplished' | 'neutral';
  reflection?: string;
  completed: 'yes' | 'almost' | 'not_today';
  timestamp: string;
  goal?: string;
  gymSubType?: GymSubTypeLocal;
  gymBodyArea?: GymBodyAreaLocal;
  struggledCount: number;
  consistencyScore?: number; // Inferred from patterns
}

export interface DailySummary {
  date: string;
  whatWorked: string[];
  whatFailed: string[];
  frictionPoints: string[];
  insights: string[];
  tomorrowSuggestions: string[];
  totalFocusMinutes: number;
  sessionsCompleted: number;
  dominantMood: string;
}

export interface MorningInsight {
  greeting: string;
  yesterdayHighlight?: string;
  suggestion?: string;
  optimalFocusDuration?: number;
}

const FOCUS_MEMORY_KEY = 'aurra-focus-memory';
const DAILY_SUMMARY_KEY = 'aurra-daily-summaries';
const ENERGY_PATTERNS_KEY = 'aurra-energy-patterns';

export const useFocusSessionMemory = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<FocusSessionRecord[]>([]);
  const [dailySummaries, setDailySummaries] = useState<DailySummary[]>([]);
  const [energyPatterns, setEnergyPatterns] = useState<{
    peakHours: number[];
    avgFocusDuration: number;
    preferredModes: FocusTypeLocal[];
    fatigueThreshold: number; // Minutes before fatigue typically sets in
  }>({
    peakHours: [9, 10, 14, 15], // Default morning/afternoon peaks
    avgFocusDuration: 25,
    preferredModes: [],
    fatigueThreshold: 90,
  });

  // Load from localStorage
  useEffect(() => {
    const storedSessions = localStorage.getItem(FOCUS_MEMORY_KEY);
    const storedSummaries = localStorage.getItem(DAILY_SUMMARY_KEY);
    const storedPatterns = localStorage.getItem(ENERGY_PATTERNS_KEY);
    
    if (storedSessions) {
      try {
        setSessions(JSON.parse(storedSessions));
      } catch (e) {
        console.error('Failed to parse focus sessions:', e);
      }
    }
    
    if (storedSummaries) {
      try {
        setDailySummaries(JSON.parse(storedSummaries));
      } catch (e) {
        console.error('Failed to parse daily summaries:', e);
      }
    }
    
    if (storedPatterns) {
      try {
        setEnergyPatterns(JSON.parse(storedPatterns));
      } catch (e) {
        console.error('Failed to parse energy patterns:', e);
      }
    }
  }, []);

  // Save sessions
  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem(FOCUS_MEMORY_KEY, JSON.stringify(sessions.slice(-100)));
    }
    return undefined;
  }, [sessions]);

  // Save summaries
  useEffect(() => {
    if (dailySummaries.length > 0) {
      localStorage.setItem(DAILY_SUMMARY_KEY, JSON.stringify(dailySummaries.slice(-30)));
    }
    return undefined;
  }, [dailySummaries]);

  // Save patterns
  useEffect(() => {
    localStorage.setItem(ENERGY_PATTERNS_KEY, JSON.stringify(energyPatterns));
    return undefined;
  }, [energyPatterns]);
  // Calculate consistency score based on recent patterns
  const calculateConsistencyScore = useCallback((mode: FocusTypeLocal): number => {
    const recentSessions = sessions.filter(s => {
      const sessionDate = new Date(s.timestamp);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return sessionDate >= weekAgo && s.mode === mode;
    });
    
    const completedCount = recentSessions.filter(s => s.completed === 'yes').length;
    const totalCount = recentSessions.length;
    
    if (totalCount === 0) return 50; // Default for new
    return Math.round((completedCount / totalCount) * 100);
  }, [sessions]);

  // Record a focus session
  const recordSession = useCallback((session: Omit<FocusSessionRecord, 'id' | 'timestamp' | 'consistencyScore'>) => {
    const newSession: FocusSessionRecord = {
      ...session,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      consistencyScore: calculateConsistencyScore(session.mode),
    };
    
    setSessions(prev => [...prev, newSession]);
    
    // Update energy patterns
    updateEnergyPatterns(newSession);
    
    return newSession;
  }, [calculateConsistencyScore]);

  // Update energy patterns based on session data
  const updateEnergyPatterns = useCallback((session: FocusSessionRecord) => {
    const sessionHour = new Date(session.timestamp).getHours();
    
    setEnergyPatterns(prev => {
      // Update peak hours if session was successful
      let newPeakHours = [...prev.peakHours];
      if (session.completed === 'yes' && session.emotion !== 'stressed') {
        if (!newPeakHours.includes(sessionHour)) {
          newPeakHours.push(sessionHour);
          // Keep only top 4 hours
          newPeakHours = newPeakHours.slice(-4);
        }
      }
      
      // Update average focus duration
      const recentDurations = sessions.slice(-10).map(s => s.duration);
      const newAvgDuration = recentDurations.length > 0
        ? Math.round(recentDurations.reduce((a, b) => a + b, 0) / recentDurations.length)
        : prev.avgFocusDuration;
      
      // Update preferred modes
      const modeCounts: Record<string, number> = {};
      sessions.slice(-20).forEach(s => {
        modeCounts[s.mode] = (modeCounts[s.mode] || 0) + 1;
      });
      const sortedModes = Object.entries(modeCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([mode]) => mode as FocusTypeLocal);
      
      // Update fatigue threshold (when struggles start)
      const struggledSessions = sessions.filter(s => s.struggledCount > 0);
      const fatigueMinutes = struggledSessions.length > 0
        ? Math.round(struggledSessions.reduce((a, b) => a + b.duration, 0) / struggledSessions.length)
        : prev.fatigueThreshold;
      
      return {
        peakHours: newPeakHours,
        avgFocusDuration: newAvgDuration,
        preferredModes: sortedModes,
        fatigueThreshold: fatigueMinutes,
      };
    });
  }, [sessions]);

  // Generate night cycle summary (auto-reflection)
  const generateNightSummary = useCallback((): DailySummary | null => {
    const today = new Date().toISOString().split('T')[0];
    const todaySessions = sessions.filter(s => s.timestamp.startsWith(today));
    
    if (todaySessions.length === 0) return null;
    
    const completedSessions = todaySessions.filter(s => s.completed === 'yes');
    const struggledSessions = todaySessions.filter(s => s.struggledCount > 0);
    
    // Analyze what worked
    const whatWorked: string[] = [];
    if (completedSessions.length > 0) {
      whatWorked.push(`Completed ${completedSessions.length} focus session(s)`);
    }
    const bestMode = completedSessions.length > 0
      ? completedSessions[0].mode
      : null;
    if (bestMode) {
      whatWorked.push(`${bestMode} mode worked well today`);
    }
    
    // Analyze friction points
    const frictionPoints: string[] = [];
    struggledSessions.forEach(s => {
      if (s.duration > energyPatterns.fatigueThreshold) {
        frictionPoints.push(`Fatigue after ${s.duration} minutes of ${s.mode}`);
      }
    });
    
    // Generate insights
    const insights: string[] = [];
    const avgDurationToday = todaySessions.reduce((a, b) => a + b.duration, 0) / todaySessions.length;
    if (avgDurationToday > energyPatterns.avgFocusDuration * 1.2) {
      insights.push("You focused longer than usual today");
    }
    
    // Tomorrow suggestions
    const tomorrowSuggestions: string[] = [];
    if (struggledSessions.length > 0) {
      tomorrowSuggestions.push(`Try ${Math.round(energyPatterns.fatigueThreshold * 0.8)} minute sessions tomorrow`);
    }
    
    // Dominant mood
    const moodCounts: Record<string, number> = {};
    todaySessions.forEach(s => {
      moodCounts[s.emotion] = (moodCounts[s.emotion] || 0) + 1;
    });
    const dominantMood = Object.entries(moodCounts)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 'neutral';
    
    const summary: DailySummary = {
      date: today,
      whatWorked,
      whatFailed: struggledSessions.map(s => `Struggled during ${s.mode}`),
      frictionPoints,
      insights,
      tomorrowSuggestions,
      totalFocusMinutes: todaySessions.reduce((a, b) => a + b.duration, 0),
      sessionsCompleted: completedSessions.length,
      dominantMood,
    };
    
    setDailySummaries(prev => [...prev.filter(s => s.date !== today), summary]);
    
    return summary;
  }, [sessions, energyPatterns]);

  // Generate morning insight
  const generateMorningInsight = useCallback((): MorningInsight => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    const yesterdaySummary = dailySummaries.find(s => s.date === yesterdayStr);
    
    // Base greeting
    const hour = new Date().getHours();
    let greeting = "Good morning";
    if (hour >= 12 && hour < 17) greeting = "Good afternoon";
    if (hour >= 17) greeting = "Good evening";
    
    // Yesterday highlight
    let yesterdayHighlight: string | undefined;
    if (yesterdaySummary) {
      if (yesterdaySummary.sessionsCompleted > 0) {
        yesterdayHighlight = `Yesterday you completed ${yesterdaySummary.sessionsCompleted} focus sessions for ${yesterdaySummary.totalFocusMinutes} minutes total.`;
      }
      if (yesterdaySummary.frictionPoints.length > 0) {
        yesterdayHighlight += ` Some fatigue kicked in later.`;
      }
    }
    
    // Suggestion based on patterns
    let suggestion: string | undefined;
    if (energyPatterns.fatigueThreshold < 45) {
      suggestion = `Shall we try a ${Math.round(energyPatterns.fatigueThreshold * 0.8)} minute focused block today?`;
    } else {
      suggestion = `Your peak focus hours seem to be around ${energyPatterns.peakHours.slice(0, 2).join(' and ')}:00.`;
    }
    
    return {
      greeting,
      yesterdayHighlight,
      suggestion,
      optimalFocusDuration: Math.min(energyPatterns.avgFocusDuration, energyPatterns.fatigueThreshold),
    };
  }, [dailySummaries, energyPatterns]);

  // Get focus history for a specific mode
  const getModeHistory = useCallback((mode: FocusTypeLocal, days: number = 7): FocusSessionRecord[] => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return sessions.filter(s => 
      s.mode === mode && 
      new Date(s.timestamp) >= cutoffDate
    );
  }, [sessions]);

  // Get streak count (consecutive days with focus)
  const getFocusStreak = useCallback((): number => {
    const uniqueDates = [...new Set(sessions.map(s => s.timestamp.split('T')[0]))].sort().reverse();
    
    let streak = 0;
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    // Must have today or yesterday to have a streak
    if (!uniqueDates.includes(today) && !uniqueDates.includes(yesterdayStr)) {
      return 0;
    }
    
    for (let i = 0; i < uniqueDates.length; i++) {
      const expectedDate = new Date();
      expectedDate.setDate(expectedDate.getDate() - i);
      const expectedStr = expectedDate.toISOString().split('T')[0];
      
      if (uniqueDates.includes(expectedStr)) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  }, [sessions]);

  return {
    sessions,
    dailySummaries,
    energyPatterns,
    recordSession,
    generateNightSummary,
    generateMorningInsight,
    getModeHistory,
    getFocusStreak,
    calculateConsistencyScore,
  };
};
