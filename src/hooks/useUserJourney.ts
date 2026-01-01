import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAura } from '@/contexts/AuraContext';

// Stress states following the state machine
export type StressState = 'calm' | 'busy' | 'stressed' | 'burnout' | 'recovery';

// Retention phases
export type RetentionPhase = 
  | 'safety'      // Days 1-3
  | 'value'       // Days 4-7
  | 'habit'       // Days 8-14
  | 'bond'        // Days 15-21
  | 'dependence'; // Days 22-30+

// Persona types
export type DominantPersona = 'mentor' | 'cofounder' | 'companion';

export interface UserJourneyState {
  daysSinceFirstUse: number;
  retentionPhase: RetentionPhase;
  stressState: StressState;
  stressConfidence: number;
  energyLevel: number;
  recoveryNeeded: boolean;
  studentScore: number;
  founderScore: number;
  dominantPersona: DominantPersona;
  lastActiveDate: string;
  consecutiveActiveDays: number;
  totalSessions: number;
}

export interface PhaseAdaptations {
  responseLength: 'short' | 'medium' | 'long';
  pushRoutines: boolean;
  showReminders: boolean;
  suggestionsPerDay: number;
  allowDeepReasoning: boolean;
  showSubscriptionNudge: boolean;
  toneIntensity: 'gentle' | 'balanced' | 'proactive';
}

const STORAGE_KEY = 'aurra-user-journey';
const FIRST_USE_KEY = 'aurra-first-use-date';

// Student signal keywords
const STUDENT_SIGNALS = [
  'exam', 'test', 'study', 'class', 'lecture', 'homework', 'assignment',
  'teacher', 'professor', 'college', 'school', 'university', 'semester',
  'grade', 'marks', 'syllabus', 'chapter', 'subject', 'tuition',
  'explain', 'understand', 'learn', 'revision', 'notes', 'doubt'
];

// Founder signal keywords
const FOUNDER_SIGNALS = [
  'revenue', 'users', 'product', 'startup', 'investor', 'pitch', 'funding',
  'team', 'hire', 'growth', 'metrics', 'churn', 'conversion', 'launch',
  'strategy', 'roadmap', 'pivot', 'runway', 'valuation', 'market',
  'customer', 'b2b', 'saas', 'mvp', 'scale', 'stakeholder', 'board'
];

// Stress trigger keywords
const STRESS_SIGNALS = {
  busy: ['busy', 'packed', 'meetings', 'deadline', 'rush', 'hectic', 'crazy day'],
  stressed: ['stressed', 'anxious', 'worried', 'overwhelmed', 'pressure', 'tense'],
  burnout: ['burnt out', 'burnout', 'exhausted', "can't anymore", 'done', 'giving up', 'too much'],
  recovery: ['better', 'rested', 'recovered', 'relaxed', 'calm now', 'feeling good']
};

export const useUserJourney = () => {
  const { chatMessages } = useAura();
  
  const [state, setState] = useState<UserJourneyState>({
    daysSinceFirstUse: 0,
    retentionPhase: 'safety',
    stressState: 'calm',
    stressConfidence: 0.5,
    energyLevel: 0.7,
    recoveryNeeded: false,
    studentScore: 0.5,
    founderScore: 0.5,
    dominantPersona: 'companion',
    lastActiveDate: '',
    consecutiveActiveDays: 0,
    totalSessions: 0,
  });

  // Load state from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const firstUseDate = localStorage.getItem(FIRST_USE_KEY);
    
    // Set first use date if not exists
    if (!firstUseDate) {
      localStorage.setItem(FIRST_USE_KEY, new Date().toISOString());
    }
    
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setState(prev => ({ ...prev, ...parsed }));
      } catch (e) {
        console.error('Failed to parse user journey:', e);
      }
    }
  }, []);

  // Calculate days since first use and update retention phase
  useEffect(() => {
    const firstUseDate = localStorage.getItem(FIRST_USE_KEY);
    if (!firstUseDate) return;
    
    const firstUse = new Date(firstUseDate);
    const now = new Date();
    const daysDiff = Math.floor((now.getTime() - firstUse.getTime()) / (1000 * 60 * 60 * 24));
    
    let phase: RetentionPhase = 'safety';
    if (daysDiff >= 22) phase = 'dependence';
    else if (daysDiff >= 15) phase = 'bond';
    else if (daysDiff >= 8) phase = 'habit';
    else if (daysDiff >= 4) phase = 'value';
    
    setState(prev => ({
      ...prev,
      daysSinceFirstUse: daysDiff,
      retentionPhase: phase,
    }));
  }, []);

  // Track session and consecutive days
  useEffect(() => {
    const today = new Date().toDateString();
    
    setState(prev => {
      if (prev.lastActiveDate === today) {
        return prev; // Already tracked today
      }
      
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const wasActiveYesterday = prev.lastActiveDate === yesterday.toDateString();
      
      return {
        ...prev,
        lastActiveDate: today,
        consecutiveActiveDays: wasActiveYesterday ? prev.consecutiveActiveDays + 1 : 1,
        totalSessions: prev.totalSessions + 1,
      };
    });
  }, []);

  // Analyze messages for persona scoring and stress detection
  useEffect(() => {
    const recentMessages = chatMessages
      .filter(m => m.sender === 'user')
      .slice(-20);
    
    if (recentMessages.length === 0) return;
    
    const messageText = recentMessages.map(m => m.content.toLowerCase()).join(' ');
    
    // Calculate student score
    const studentMatches = STUDENT_SIGNALS.filter(s => messageText.includes(s)).length;
    const studentScore = Math.min(1, 0.5 + (studentMatches * 0.1));
    
    // Calculate founder score
    const founderMatches = FOUNDER_SIGNALS.filter(s => messageText.includes(s)).length;
    const founderScore = Math.min(1, 0.5 + (founderMatches * 0.1));
    
    // Determine dominant persona
    let dominantPersona: DominantPersona = 'companion';
    if (studentScore > 0.6 && studentScore > founderScore) {
      dominantPersona = 'mentor';
    } else if (founderScore > 0.6 && founderScore > studentScore) {
      dominantPersona = 'cofounder';
    }
    
    // Detect stress state from recent messages
    const veryRecentText = recentMessages.slice(-5).map(m => m.content.toLowerCase()).join(' ');
    let detectedStress: StressState = 'calm';
    
    if (STRESS_SIGNALS.burnout.some(s => veryRecentText.includes(s))) {
      detectedStress = 'burnout';
    } else if (STRESS_SIGNALS.stressed.some(s => veryRecentText.includes(s))) {
      detectedStress = 'stressed';
    } else if (STRESS_SIGNALS.busy.some(s => veryRecentText.includes(s))) {
      detectedStress = 'busy';
    } else if (STRESS_SIGNALS.recovery.some(s => veryRecentText.includes(s))) {
      detectedStress = 'recovery';
    }
    
    // Check for late hours (stress indicator)
    const hour = new Date().getHours();
    const isLateNight = hour >= 23 || hour < 5;
    
    // Check message patterns
    const avgMessageLength = recentMessages.reduce((sum, m) => sum + m.content.length, 0) / recentMessages.length;
    const hasShortReplies = avgMessageLength < 15;
    
    // Adjust stress based on patterns
    if (isLateNight && hasShortReplies && detectedStress === 'calm') {
      detectedStress = 'stressed';
    }
    
    setState(prev => ({
      ...prev,
      studentScore: prev.studentScore * 0.7 + studentScore * 0.3, // Gradual update
      founderScore: prev.founderScore * 0.7 + founderScore * 0.3,
      dominantPersona,
      stressState: detectedStress,
      stressConfidence: detectedStress !== 'calm' ? 0.7 : 0.5,
      recoveryNeeded: detectedStress === 'burnout' || detectedStress === 'stressed',
      energyLevel: detectedStress === 'burnout' ? 0.2 : 
                   detectedStress === 'stressed' ? 0.4 :
                   detectedStress === 'busy' ? 0.6 : 0.8,
    }));
  }, [chatMessages]);

  // Save state to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  // Get phase-specific adaptations
  const getPhaseAdaptations = useCallback((): PhaseAdaptations => {
    const { retentionPhase, stressState } = state;
    
    // Base adaptations by phase
    const phaseBase: Record<RetentionPhase, PhaseAdaptations> = {
      safety: {
        responseLength: 'short',
        pushRoutines: false,
        showReminders: false,
        suggestionsPerDay: 0,
        allowDeepReasoning: false,
        showSubscriptionNudge: false,
        toneIntensity: 'gentle',
      },
      value: {
        responseLength: 'medium',
        pushRoutines: false,
        showReminders: true,
        suggestionsPerDay: 1,
        allowDeepReasoning: false,
        showSubscriptionNudge: false,
        toneIntensity: 'gentle',
      },
      habit: {
        responseLength: 'medium',
        pushRoutines: true,
        showReminders: true,
        suggestionsPerDay: 2,
        allowDeepReasoning: true,
        showSubscriptionNudge: false,
        toneIntensity: 'balanced',
      },
      bond: {
        responseLength: 'medium',
        pushRoutines: true,
        showReminders: true,
        suggestionsPerDay: 2,
        allowDeepReasoning: true,
        showSubscriptionNudge: false,
        toneIntensity: 'balanced',
      },
      dependence: {
        responseLength: 'long',
        pushRoutines: true,
        showReminders: true,
        suggestionsPerDay: 3,
        allowDeepReasoning: true,
        showSubscriptionNudge: true,
        toneIntensity: 'proactive',
      },
    };
    
    let adaptations = { ...phaseBase[retentionPhase] };
    
    // Override based on stress state
    if (stressState === 'burnout') {
      adaptations = {
        ...adaptations,
        responseLength: 'short',
        pushRoutines: false,
        showReminders: false,
        suggestionsPerDay: 0,
        showSubscriptionNudge: false,
        toneIntensity: 'gentle',
      };
    } else if (stressState === 'stressed') {
      adaptations = {
        ...adaptations,
        pushRoutines: false,
        suggestionsPerDay: 0,
        toneIntensity: 'gentle',
      };
    } else if (stressState === 'busy') {
      adaptations = {
        ...adaptations,
        responseLength: 'short',
        suggestionsPerDay: Math.min(1, adaptations.suggestionsPerDay),
      };
    } else if (stressState === 'recovery') {
      adaptations = {
        ...adaptations,
        pushRoutines: false,
        suggestionsPerDay: 1,
        toneIntensity: 'gentle',
      };
    }
    
    return adaptations;
  }, [state]);

  // Get persona-specific greeting
  const getPersonaGreeting = useCallback((): string => {
    const { dominantPersona, retentionPhase, stressState } = state;
    const hour = new Date().getHours();
    const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : hour < 21 ? 'evening' : 'night';
    
    // Stress-state greetings take priority
    if (stressState === 'burnout') {
      return "Hey. Take your time today.";
    }
    if (stressState === 'stressed') {
      return "I'm here. No rush.";
    }
    
    // Phase-specific for early days
    if (retentionPhase === 'safety') {
      return timeOfDay === 'morning' ? "Hey 👋" : "What's up?";
    }
    
    // Persona-specific greetings
    if (dominantPersona === 'mentor') {
      if (timeOfDay === 'morning') return "Ready to learn something today?";
      if (timeOfDay === 'night') return "Winding down from studies?";
      return "How's the studying going?";
    }
    
    if (dominantPersona === 'cofounder') {
      if (timeOfDay === 'morning') return "What's the priority today?";
      if (timeOfDay === 'night') return "Big decisions are clearer tomorrow.";
      return "What's on your mind?";
    }
    
    // Default companion
    if (timeOfDay === 'morning') return "Morning. Ready when you are.";
    if (timeOfDay === 'night') return "Still up?";
    return "Hey. What's going on?";
  }, [state]);

  // Manual state transitions
  const transitionToRecovery = useCallback(() => {
    setState(prev => ({
      ...prev,
      stressState: 'recovery',
      recoveryNeeded: false,
      energyLevel: 0.6,
    }));
  }, []);

  const transitionToCalm = useCallback(() => {
    setState(prev => ({
      ...prev,
      stressState: 'calm',
      recoveryNeeded: false,
      energyLevel: 0.8,
      stressConfidence: 0.5,
    }));
  }, []);

  return {
    ...state,
    phaseAdaptations: getPhaseAdaptations(),
    getPersonaGreeting,
    transitionToRecovery,
    transitionToCalm,
  };
};

// Generate AI context based on user journey
export function getJourneyContextForAI(state: UserJourneyState, adaptations: PhaseAdaptations): string {
  const stressContexts: Record<StressState, string> = {
    calm: 'User is in a calm, balanced state. Normal interaction.',
    busy: 'User is BUSY. Keep responses SHORT. Minimize interruptions. Help prioritize.',
    stressed: 'User is STRESSED. Acknowledge emotion FIRST. No extra tasks. Offer grounding.',
    burnout: 'User is in BURNOUT. Respect silence. NO routines. Supportive presence only. Very short responses.',
    recovery: 'User is RECOVERING. Gentle re-entry. One light suggestion max. Positive reinforcement.',
  };

  const personaContexts: Record<DominantPersona, string> = {
    mentor: 'Dominant persona: MENTOR (Student user). Focus on learning support, exam help, study structure. Explain concepts clearly. Be patient with doubts.',
    cofounder: 'Dominant persona: CO-FOUNDER (Founder user). Think strategically. Help with decisions. Reframe problems. No hand-holding.',
    companion: 'Dominant persona: COMPANION. Balanced emotional support. Daily life assistance. Flexible tone.',
  };

  const phaseContexts: Record<RetentionPhase, string> = {
    safety: 'RETENTION PHASE: Days 1-3 (Safety). SHORT replies. Mostly listen. No pushing. Build comfort.',
    value: 'RETENTION PHASE: Days 4-7 (Value). Introduce light routines. Remember preferences. ONE helpful suggestion/day.',
    habit: 'RETENTION PHASE: Days 8-14 (Habit). Adjust routines automatically. Adapt tone to energy. Deeper reasoning OK.',
    bond: 'RETENTION PHASE: Days 15-21 (Bond). Reflect patterns subtly. Support bad days. Be the thinking space.',
    dependence: 'RETENTION PHASE: Days 22+ (Dependence). Deep memory recall. Proactive clarity. Identity reinforcement.',
  };

  return `
${stressContexts[state.stressState]}
${personaContexts[state.dominantPersona]}
${phaseContexts[state.retentionPhase]}

INTERNAL STATE:
- Days since first use: ${state.daysSinceFirstUse}
- Stress confidence: ${(state.stressConfidence * 100).toFixed(0)}%
- Energy level: ${(state.energyLevel * 100).toFixed(0)}%
- Student score: ${(state.studentScore * 100).toFixed(0)}%
- Founder score: ${(state.founderScore * 100).toFixed(0)}%
- Consecutive active days: ${state.consecutiveActiveDays}

BEHAVIOR RULES FOR THIS STATE:
- Response length: ${adaptations.responseLength.toUpperCase()}
- Push routines: ${adaptations.pushRoutines ? 'Yes' : 'NO'}
- Show reminders: ${adaptations.showReminders ? 'Yes' : 'NO'}
- Suggestions today: ${adaptations.suggestionsPerDay}
- Tone intensity: ${adaptations.toneIntensity.toUpperCase()}
`;
}
