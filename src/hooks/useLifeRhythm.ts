/**
 * AURRA Life Rhythm Hook
 * 
 * Manages user's weekly rhythm patterns - weekday vs weekend
 * Asked ONCE during onboarding, never repeated unless user edits
 */

import { useState, useEffect, useCallback } from 'react';

export interface WeekdayPattern {
  morning: string;
  afternoon: string;
  evening: string;
  night: string;
}

export interface WeekendPattern {
  pace: 'relaxed' | 'productive' | 'mixed';
  flexibility: 'high' | 'medium' | 'low';
  social: string;
  recovery: boolean;
}

export interface LifeRhythm {
  weekdayPattern: WeekdayPattern;
  weekendPattern: WeekendPattern;
  rawWeekdayDescription: string;
  rawWeekendDescription: string;
  onboardingComplete: boolean;
  lastUpdated: string;
}

interface ParsedRhythm {
  weekdayPattern: WeekdayPattern;
  weekendPattern: WeekendPattern;
}

const STORAGE_KEY = 'aurra-life-rhythm';

const DEFAULT_RHYTHM: LifeRhythm = {
  weekdayPattern: {
    morning: 'flexible',
    afternoon: 'flexible',
    evening: 'flexible',
    night: 'wind down',
  },
  weekendPattern: {
    pace: 'relaxed',
    flexibility: 'high',
    social: 'optional',
    recovery: true,
  },
  rawWeekdayDescription: '',
  rawWeekendDescription: '',
  onboardingComplete: false,
  lastUpdated: '',
};

// Keywords for pattern detection
const PATTERN_KEYWORDS = {
  busy: ['college', 'work', 'meetings', 'class', 'classes', 'packed', 'hectic', 'busy', 'full', 'office', 'school'],
  study: ['study', 'studying', 'learn', 'learning', 'homework', 'exam', 'exams', 'assignment', 'library'],
  work: ['work', 'working', 'office', 'job', 'meetings', 'business', 'clients', 'calls'],
  gym: ['gym', 'workout', 'exercise', 'fitness', 'training', 'run', 'running', 'sports'],
  rest: ['rest', 'relax', 'chill', 'sleep', 'nap', 'recover', 'recovery', 'lazy'],
  social: ['friends', 'family', 'hangout', 'party', 'meet', 'social', 'date', 'outing'],
  creative: ['coding', 'music', 'art', 'writing', 'content', 'creative', 'project', 'side project'],
};

const TIME_KEYWORDS = {
  morning: ['morning', 'early', 'sunrise', 'am', 'breakfast', 'wake'],
  afternoon: ['afternoon', 'lunch', 'mid-day', 'noon', 'midday'],
  evening: ['evening', 'dinner', 'sunset', 'after work', 'after college'],
  night: ['night', 'late', 'pm', 'sleep', 'bed', 'wind down'],
};

/**
 * Parse free-text description into structured patterns
 */
export function parseLifeRhythm(weekdayText: string, weekendText: string): ParsedRhythm {
  const weekdayLower = weekdayText.toLowerCase();
  const weekendLower = weekendText.toLowerCase();

  // Detect weekday patterns
  const weekdayPattern: WeekdayPattern = {
    morning: detectActivityForTime(weekdayLower, 'morning'),
    afternoon: detectActivityForTime(weekdayLower, 'afternoon'),
    evening: detectActivityForTime(weekdayLower, 'evening'),
    night: detectActivityForTime(weekdayLower, 'night'),
  };

  // Detect weekend patterns
  const weekendPattern: WeekendPattern = {
    pace: detectPace(weekendLower),
    flexibility: detectFlexibility(weekendLower),
    social: detectSocial(weekendLower),
    recovery: detectRecovery(weekendLower),
  };

  return { weekdayPattern, weekendPattern };
}

function detectActivityForTime(text: string, timeOfDay: keyof typeof TIME_KEYWORDS): string {
  // Check for explicit time mentions
  const timeKeywords = TIME_KEYWORDS[timeOfDay];
  const hasTimeReference = timeKeywords.some(kw => text.includes(kw));

  // If time is mentioned, extract nearby activities
  if (hasTimeReference) {
    for (const [activity, keywords] of Object.entries(PATTERN_KEYWORDS)) {
      if (keywords.some(kw => text.includes(kw))) {
        return activity;
      }
    }
  }

  // Default inference based on time of day
  const defaults: Record<string, string> = {
    morning: PATTERN_KEYWORDS.busy.some(kw => text.includes(kw)) ? 'busy' : 'flexible',
    afternoon: PATTERN_KEYWORDS.work.some(kw => text.includes(kw)) ? 'focused' : 
               PATTERN_KEYWORDS.study.some(kw => text.includes(kw)) ? 'study' : 'flexible',
    evening: PATTERN_KEYWORDS.gym.some(kw => text.includes(kw)) ? 'gym' : 
             PATTERN_KEYWORDS.rest.some(kw => text.includes(kw)) ? 'rest' : 'flexible',
    night: 'wind down',
  };

  return defaults[timeOfDay] || 'flexible';
}

function detectPace(text: string): 'relaxed' | 'productive' | 'mixed' {
  const relaxedKeywords = ['chill', 'relax', 'slow', 'easy', 'lazy', 'rest', 'nothing', 'free'];
  const productiveKeywords = ['plan', 'productive', 'busy', 'work', 'study', 'gym', 'active'];
  
  const hasRelaxed = relaxedKeywords.some(kw => text.includes(kw));
  const hasProductive = productiveKeywords.some(kw => text.includes(kw));
  
  if (hasRelaxed && hasProductive) return 'mixed';
  if (hasRelaxed) return 'relaxed';
  if (hasProductive) return 'productive';
  return 'relaxed'; // Default weekends to relaxed
}

function detectFlexibility(text: string): 'high' | 'medium' | 'low' {
  const lowFlexKeywords = ['strict', 'fixed', 'always', 'must', 'have to', 'scheduled'];
  const highFlexKeywords = ['sometimes', 'maybe', 'depends', 'flexible', 'free', 'whatever'];
  
  if (lowFlexKeywords.some(kw => text.includes(kw))) return 'low';
  if (highFlexKeywords.some(kw => text.includes(kw))) return 'high';
  return 'high'; // Default to flexible
}

function detectSocial(text: string): string {
  const socialKeywords = ['friends', 'family', 'people', 'hangout', 'meet', 'party'];
  if (socialKeywords.some(kw => text.includes(kw))) {
    return 'friends / personal time';
  }
  return 'optional';
}

function detectRecovery(text: string): boolean {
  const recoveryKeywords = ['rest', 'recover', 'recharge', 'chill', 'relax', 'sleep'];
  return recoveryKeywords.some(kw => text.includes(kw));
}

export function useLifeRhythm() {
  const [rhythm, setRhythm] = useState<LifeRhythm>(DEFAULT_RHYTHM);
  const [isLoading, setIsLoading] = useState(true);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setRhythm(parsed);
      } catch (e) {
        console.error('Failed to parse life rhythm:', e);
      }
    }
    setIsLoading(false);
  }, []);

  // Save to localStorage when rhythm changes
  useEffect(() => {
    if (!isLoading && rhythm.onboardingComplete) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(rhythm));
    }
  }, [rhythm, isLoading]);

  /**
   * Save the user's life rhythm from free-text descriptions
   * Called ONCE during onboarding
   */
  const saveLifeRhythm = useCallback((weekdayDescription: string, weekendDescription: string) => {
    const parsed = parseLifeRhythm(weekdayDescription, weekendDescription);
    
    const newRhythm: LifeRhythm = {
      ...parsed,
      rawWeekdayDescription: weekdayDescription,
      rawWeekendDescription: weekendDescription,
      onboardingComplete: true,
      lastUpdated: new Date().toISOString(),
    };

    setRhythm(newRhythm);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newRhythm));
    
    // Also mark the routine onboarding as complete
    localStorage.setItem('aurra-routine-onboarding-complete', 'true');
    
    return newRhythm;
  }, []);

  /**
   * Update rhythm for temporary daily changes
   */
  const adjustForToday = useCallback((adjustment: 'lighter' | 'heavier' | 'skip') => {
    const todayKey = `aurra-today-adjustment-${new Date().toISOString().split('T')[0]}`;
    localStorage.setItem(todayKey, adjustment);
  }, []);

  /**
   * Check if user has completed rhythm onboarding
   */
  const hasCompletedRhythmOnboarding = useCallback(() => {
    return rhythm.onboardingComplete;
  }, [rhythm.onboardingComplete]);

  /**
   * Get context for AI prompt
   */
  const getRhythmContextForAI = useCallback(() => {
    if (!rhythm.onboardingComplete) {
      return '';
    }

    const now = new Date();
    const isWeekend = now.getDay() === 0 || now.getDay() === 6;
    const hour = now.getHours();

    let timeOfDay: keyof WeekdayPattern = 'morning';
    if (hour >= 12 && hour < 17) timeOfDay = 'afternoon';
    else if (hour >= 17 && hour < 21) timeOfDay = 'evening';
    else if (hour >= 21 || hour < 5) timeOfDay = 'night';

    const currentPattern = isWeekend ? rhythm.weekendPattern : rhythm.weekdayPattern;
    const currentActivity = isWeekend ? 
      `Pace: ${rhythm.weekendPattern.pace}, Flexibility: ${rhythm.weekendPattern.flexibility}` :
      `${timeOfDay}: ${rhythm.weekdayPattern[timeOfDay]}`;

    return `
USER'S LIFE RHYTHM:
- Day type: ${isWeekend ? 'Weekend' : 'Weekday'}
- Time of day: ${timeOfDay}
- Current pattern: ${currentActivity}
${isWeekend ? `
- Weekend pace: ${rhythm.weekendPattern.pace}
- Weekend flexibility: ${rhythm.weekendPattern.flexibility}
- Social preference: ${rhythm.weekendPattern.social}
` : `
- Morning: ${rhythm.weekdayPattern.morning}
- Afternoon: ${rhythm.weekdayPattern.afternoon}
- Evening: ${rhythm.weekdayPattern.evening}
- Night: ${rhythm.weekdayPattern.night}
`}

RHYTHM BEHAVIOR:
- Suggest based on patterns, never command
- If user seems tired, reduce expectations
- "Want to start, or shift it a bit?" is the preferred nudge style
- Never say "you missed" or "you failed"
`;
  }, [rhythm]);

  /**
   * Edit rhythm (only when user explicitly requests)
   */
  const editRhythm = useCallback((updates: Partial<LifeRhythm>) => {
    setRhythm(prev => ({
      ...prev,
      ...updates,
      lastUpdated: new Date().toISOString(),
    }));
  }, []);

  return {
    rhythm,
    isLoading,
    saveLifeRhythm,
    adjustForToday,
    hasCompletedRhythmOnboarding,
    getRhythmContextForAI,
    editRhythm,
  };
}
