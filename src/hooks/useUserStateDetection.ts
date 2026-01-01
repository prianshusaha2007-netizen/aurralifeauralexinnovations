import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAura } from '@/contexts/AuraContext';

export type UserState = 
  | 'normal'
  | 'burnout'      // Low energy, mental fatigue
  | 'exam_mode'    // High stress, time-bound
  | 'founder_mode' // High load, low clarity
  | 'low_energy';  // General tiredness

export interface StateIndicators {
  sleepDebt: number;           // Days of poor sleep
  skippedRoutines: number;     // Consecutive skipped routines
  shortReplies: boolean;       // Recent messages are short
  heavyLanguage: boolean;      // Sigh words, tired phrases
  anxiousLanguage: boolean;    // Exam/deadline words
  overloadLanguage: boolean;   // Meeting/decision words
  lastMoodRating: 'good' | 'okay' | 'heavy' | null;
}

export interface DetectedState {
  state: UserState;
  confidence: number;
  indicators: StateIndicators;
  adaptations: StateAdaptations;
}

export interface StateAdaptations {
  responseLength: 'short' | 'medium' | 'normal';
  reminderIntensity: 'paused' | 'gentle' | 'normal';
  toneStyle: 'supportive' | 'mentor' | 'cofounder' | 'calm';
  showProductivityPush: boolean;
  singleOptionOnly: boolean;
  morningMessage: string;
  eveningMessage: string;
}

const BURNOUT_PHRASES = [
  'tired', 'exhausted', 'burnt out', 'burnout', "can't focus", 
  'overwhelmed', 'drained', 'done', "don't feel like", 'sigh',
  'whatever', 'idk', 'meh', 'ugh', 'too much', "can't anymore"
];

const EXAM_PHRASES = [
  'exam', 'test', 'study', 'revision', 'syllabus', 'paper',
  'marks', 'grade', 'deadline', 'submit', 'assignment', 'project due',
  'how much to study', 'stuck on', 'understand this', 'concept'
];

const FOUNDER_PHRASES = [
  'meeting', 'investor', 'pitch', 'revenue', 'product', 'team',
  'strategy', 'decision', 'should i', 'makes sense', 'priority',
  'stakeholder', 'runway', 'growth', 'pivot', 'launch'
];

const STORAGE_KEY = 'aurra-user-state-data';

export const useUserStateDetection = () => {
  const { chatMessages, userProfile } = useAura();
  
  const [stateData, setStateData] = useState<{
    sleepLogs: { date: string; quality: 'poor' | 'okay' | 'good' }[];
    skippedRoutines: { date: string; count: number }[];
    lastMoodRating: 'good' | 'okay' | 'heavy' | null;
    lastStateChange: string | null;
    forcedState: UserState | null;
  }>({
    sleepLogs: [],
    skippedRoutines: [],
    lastMoodRating: null,
    lastStateChange: null,
    forcedState: null,
  });

  // Load state data from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setStateData(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse user state data:', e);
      }
    }
  }, []);

  // Save state data to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stateData));
  }, [stateData]);

  // Analyze recent messages for language patterns
  const analyzeLanguage = useCallback(() => {
    const recentMessages = chatMessages
      .filter(m => m.sender === 'user')
      .slice(-10);
    
    const messageText = recentMessages.map(m => m.content.toLowerCase()).join(' ');
    
    // Check for short replies
    const avgLength = recentMessages.length > 0
      ? recentMessages.reduce((sum, m) => sum + m.content.length, 0) / recentMessages.length
      : 50;
    const shortReplies = avgLength < 20;
    
    // Check for specific language patterns
    const heavyLanguage = BURNOUT_PHRASES.some(phrase => messageText.includes(phrase));
    const anxiousLanguage = EXAM_PHRASES.some(phrase => messageText.includes(phrase));
    const overloadLanguage = FOUNDER_PHRASES.some(phrase => messageText.includes(phrase));
    
    return { shortReplies, heavyLanguage, anxiousLanguage, overloadLanguage };
  }, [chatMessages]);

  // Calculate indicators
  const indicators = useMemo((): StateIndicators => {
    const language = analyzeLanguage();
    
    // Calculate sleep debt (last 7 days)
    const recentSleep = stateData.sleepLogs.slice(-7);
    const sleepDebt = recentSleep.filter(s => s.quality === 'poor').length;
    
    // Calculate skipped routines (last 3 days)
    const recentSkips = stateData.skippedRoutines.slice(-3);
    const skippedRoutines = recentSkips.reduce((sum, s) => sum + s.count, 0);
    
    return {
      sleepDebt,
      skippedRoutines,
      shortReplies: language.shortReplies,
      heavyLanguage: language.heavyLanguage,
      anxiousLanguage: language.anxiousLanguage,
      overloadLanguage: language.overloadLanguage,
      lastMoodRating: stateData.lastMoodRating,
    };
  }, [stateData, analyzeLanguage]);

  // Detect current state
  const detectedState = useMemo((): DetectedState => {
    // Check for forced state first
    if (stateData.forcedState) {
      return {
        state: stateData.forcedState,
        confidence: 1,
        indicators,
        adaptations: getAdaptations(stateData.forcedState),
      };
    }

    let state: UserState = 'normal';
    let confidence = 0;

    // Burnout detection
    const burnoutScore = 
      (indicators.sleepDebt >= 2 ? 0.3 : 0) +
      (indicators.skippedRoutines >= 2 ? 0.25 : 0) +
      (indicators.shortReplies ? 0.15 : 0) +
      (indicators.heavyLanguage ? 0.3 : 0) +
      (indicators.lastMoodRating === 'heavy' ? 0.2 : 0);

    // Exam mode detection
    const examScore = indicators.anxiousLanguage ? 0.8 : 0;

    // Founder mode detection
    const founderScore = indicators.overloadLanguage ? 0.7 : 0;

    // Determine state based on highest score
    if (burnoutScore >= 0.5) {
      state = 'burnout';
      confidence = burnoutScore;
    } else if (examScore >= 0.7) {
      state = 'exam_mode';
      confidence = examScore;
    } else if (founderScore >= 0.6) {
      state = 'founder_mode';
      confidence = founderScore;
    } else if (burnoutScore >= 0.3 || indicators.lastMoodRating === 'heavy') {
      state = 'low_energy';
      confidence = burnoutScore + 0.2;
    }

    return {
      state,
      confidence,
      indicators,
      adaptations: getAdaptations(state),
    };
  }, [indicators, stateData.forcedState]);

  // Log sleep quality
  const logSleep = useCallback((quality: 'poor' | 'okay' | 'good') => {
    const today = new Date().toDateString();
    setStateData(prev => ({
      ...prev,
      sleepLogs: [...prev.sleepLogs.slice(-30), { date: today, quality }],
    }));
  }, []);

  // Log skipped routine
  const logSkippedRoutine = useCallback(() => {
    const today = new Date().toDateString();
    setStateData(prev => {
      const existing = prev.skippedRoutines.find(s => s.date === today);
      if (existing) {
        return {
          ...prev,
          skippedRoutines: prev.skippedRoutines.map(s => 
            s.date === today ? { ...s, count: s.count + 1 } : s
          ),
        };
      }
      return {
        ...prev,
        skippedRoutines: [...prev.skippedRoutines.slice(-14), { date: today, count: 1 }],
      };
    });
  }, []);

  // Set mood rating (from wind-down)
  const setMoodRating = useCallback((rating: 'good' | 'okay' | 'heavy') => {
    setStateData(prev => ({ ...prev, lastMoodRating: rating }));
  }, []);

  // Force a specific state (for testing/manual override)
  const forceState = useCallback((state: UserState | null) => {
    setStateData(prev => ({ 
      ...prev, 
      forcedState: state,
      lastStateChange: new Date().toISOString(),
    }));
  }, []);

  // Reset state detection
  const resetState = useCallback(() => {
    setStateData({
      sleepLogs: [],
      skippedRoutines: [],
      lastMoodRating: null,
      lastStateChange: null,
      forcedState: null,
    });
  }, []);

  return {
    ...detectedState,
    logSleep,
    logSkippedRoutine,
    setMoodRating,
    forceState,
    resetState,
  };
};

// Get adaptations for a given state
function getAdaptations(state: UserState): StateAdaptations {
  switch (state) {
    case 'burnout':
      return {
        responseLength: 'short',
        reminderIntensity: 'paused',
        toneStyle: 'supportive',
        showProductivityPush: false,
        singleOptionOnly: true,
        morningMessage: "Hey. Today feels heavy, doesn't it.\nWe don't have to fix everything.",
        eveningMessage: "Before you sleep—\ntoday wasn't about progress. It was about recovery.",
      };
    case 'low_energy':
      return {
        responseLength: 'short',
        reminderIntensity: 'gentle',
        toneStyle: 'supportive',
        showProductivityPush: false,
        singleOptionOnly: false,
        morningMessage: "Take it slow today. No rush.",
        eveningMessage: "You made it through today. That counts.",
      };
    case 'exam_mode':
      return {
        responseLength: 'medium',
        reminderIntensity: 'gentle',
        toneStyle: 'mentor',
        showProductivityPush: false,
        singleOptionOnly: false,
        morningMessage: "Exam week, right.\nLet's keep this calm and focused.",
        eveningMessage: "You showed up today. That counts.\nTomorrow, we'll continue from here.",
      };
    case 'founder_mode':
      return {
        responseLength: 'medium',
        reminderIntensity: 'normal',
        toneStyle: 'cofounder',
        showProductivityPush: false,
        singleOptionOnly: false,
        morningMessage: "Looks like a packed day.\nLet's find one clear priority.",
        eveningMessage: "You did enough today.\nBig decisions are clearer in the morning.",
      };
    default:
      return {
        responseLength: 'normal',
        reminderIntensity: 'normal',
        toneStyle: 'calm',
        showProductivityPush: true,
        singleOptionOnly: false,
        morningMessage: "Good morning! Ready when you are.",
        eveningMessage: "How did today go?",
      };
  }
}

// Export for use in AI prompts
export function getStateContextForAI(state: UserState, adaptations: StateAdaptations): string {
  const contexts: Record<UserState, string> = {
    burnout: `
USER STATE: BURNOUT DAY (Low Energy, Mental Fatigue)
- User shows signs of burnout: poor sleep, skipped routines, tired language
- KEEP RESPONSES SHORT (1-2 sentences max)
- NO productivity pushes or goal reminders
- Offer SINGLE gentle options only
- If user says "I don't feel like doing anything" → respond: "That's okay. Even resting is doing something."
- Pause non-essential reminders
- Focus on acknowledgment, not action
- Tone: Warm, understanding, zero pressure`,

    low_energy: `
USER STATE: LOW ENERGY DAY
- User seems tired but not burnt out
- Keep responses brief and supportive
- Reduce reminder intensity
- Don't push productivity
- Offer rest as a valid option`,

    exam_mode: `
USER STATE: EXAM WEEK (High Stress, Time-Bound)
- User is preparing for exams/tests
- Tone: Calm mentor, not pushy coach
- Break things into small, manageable steps
- "One subject at a time" approach
- If stuck on a topic: explain ONE concept, no overload
- Evening: acknowledge effort, promise continuity
- Focus on consistency, not perfection`,

    founder_mode: `
USER STATE: FOUNDER MODE (High Load, Low Clarity)
- User is dealing with business decisions/meetings
- Tone: Thoughtful co-founder, thinking partner
- Help clarify, not decide
- Ask reframing questions: "What's the real risk here?"
- Focus on ONE priority per day
- Evening: validate decisions, suggest rest
- Late night: discourage work, encourage sleep`,

    normal: `
USER STATE: NORMAL
- Regular day, balanced energy
- Full range of features available
- Standard greeting and interaction patterns`,
  };

  return contexts[state] || contexts.normal;
}
