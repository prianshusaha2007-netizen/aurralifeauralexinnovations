/**
 * Silent Persona Switching System
 * 
 * Automatically detects context and switches persona without announcement.
 * Uses time, emotional state, conversation content, and user patterns.
 */

import { useCallback, useMemo } from 'react';
import { usePersonaContext } from '@/contexts/PersonaContext';
import { useEmotionalDetection } from './useEmotionalDetection';

export type SilentPersona = 'companion' | 'mentor' | 'coach' | 'thinker' | 'creative' | 'night_companion';

interface PersonaContext {
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night' | 'late_night';
  emotionalState: string;
  conversationIntent: string;
  isWeekend: boolean;
  dayPart: string;
}

interface PersonaBehavior {
  responseLength: 'short' | 'medium' | 'long';
  tone: string;
  energy: 'low' | 'medium' | 'high';
  suggestions: boolean;
  questionStyle: 'none' | 'gentle' | 'probing';
}

// Intent detection patterns
const INTENT_PATTERNS = {
  learning: [
    /teach me/i, /explain/i, /how (do|does|can|should)/i, /what is/i,
    /help me understand/i, /tutorial/i, /guide/i, /learn/i
  ],
  building: [
    /create/i, /build/i, /make/i, /develop/i, /project/i,
    /startup/i, /business/i, /launch/i, /ship/i
  ],
  thinking: [
    /should i/i, /what do you think/i, /help me decide/i, /confused/i,
    /pros and cons/i, /analyze/i, /strategy/i, /planning/i
  ],
  emotional: [
    /feeling/i, /feel/i, /sad/i, /happy/i, /stressed/i, /anxious/i,
    /lonely/i, /talk/i, /vent/i, /bad day/i
  ],
  creative: [
    /idea/i, /brainstorm/i, /creative/i, /imagine/i, /story/i,
    /write/i, /design/i, /art/i
  ],
  casual: [
    /hey/i, /hi/i, /what's up/i, /how are you/i, /bored/i,
    /chat/i, /just talking/i
  ],
};

export const useSilentPersonaSwitching = () => {
  const { currentPersona, setPersona, getPersonaPromptAdditions } = usePersonaContext();
  const { emotionalTrend, currentEnergy } = useEmotionalDetection();

  /**
   * Get current context for persona decision
   */
  const getCurrentContext = useCallback((): PersonaContext => {
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay();
    const isWeekend = day === 0 || day === 6;

    let timeOfDay: PersonaContext['timeOfDay'] = 'afternoon';
    if (hour >= 5 && hour < 12) timeOfDay = 'morning';
    else if (hour >= 12 && hour < 17) timeOfDay = 'afternoon';
    else if (hour >= 17 && hour < 21) timeOfDay = 'evening';
    else if (hour >= 21 && hour < 24) timeOfDay = 'night';
    else timeOfDay = 'late_night';

    let dayPart = 'day';
    if (hour >= 5 && hour < 10) dayPart = 'early_morning';
    else if (hour >= 10 && hour < 14) dayPart = 'peak_hours';
    else if (hour >= 14 && hour < 17) dayPart = 'afternoon_dip';
    else if (hour >= 17 && hour < 21) dayPart = 'evening';
    else dayPart = 'night';

    return {
      timeOfDay,
      emotionalState: emotionalTrend,
      conversationIntent: 'general',
      isWeekend,
      dayPart,
    };
  }, [emotionalTrend]);

  /**
   * Detect intent from message
   */
  const detectIntent = useCallback((message: string): string => {
    for (const [intent, patterns] of Object.entries(INTENT_PATTERNS)) {
      if (patterns.some(p => p.test(message))) {
        return intent;
      }
    }
    return 'casual';
  }, []);

  /**
   * Determine the best persona based on context
   */
  const determinePersona = useCallback((message: string): SilentPersona => {
    const context = getCurrentContext();
    const intent = detectIntent(message);

    // Late night always gets night companion
    if (context.timeOfDay === 'late_night') {
      return 'night_companion';
    }

    // Night time with emotional intent
    if (context.timeOfDay === 'night' && (intent === 'emotional' || emotionalTrend === 'low')) {
      return 'night_companion';
    }

    // Intent-based switching
    if (intent === 'learning') return 'mentor';
    if (intent === 'building') return 'coach';
    if (intent === 'thinking') return 'thinker';
    if (intent === 'creative') return 'creative';
    if (intent === 'emotional') return 'companion';

    // Energy-based defaults
    if (currentEnergy === 'depleted' || currentEnergy === 'low') {
      return 'companion';
    }

    // Weekend defaults
    if (context.isWeekend) {
      return 'companion';
    }

    // Default based on time
    if (context.dayPart === 'peak_hours') return 'mentor';
    if (context.dayPart === 'evening' || context.dayPart === 'night') return 'companion';

    return 'companion';
  }, [getCurrentContext, detectIntent, emotionalTrend, currentEnergy]);

  /**
   * Get persona behavior configuration
   */
  const getPersonaBehavior = useCallback((persona: SilentPersona): PersonaBehavior => {
    const behaviors: Record<SilentPersona, PersonaBehavior> = {
      companion: {
        responseLength: 'medium',
        tone: 'warm and conversational',
        energy: 'medium',
        suggestions: false,
        questionStyle: 'gentle',
      },
      mentor: {
        responseLength: 'medium',
        tone: 'clear and educational',
        energy: 'medium',
        suggestions: true,
        questionStyle: 'probing',
      },
      coach: {
        responseLength: 'short',
        tone: 'direct and action-oriented',
        energy: 'high',
        suggestions: true,
        questionStyle: 'probing',
      },
      thinker: {
        responseLength: 'medium',
        tone: 'thoughtful and analytical',
        energy: 'medium',
        suggestions: false,
        questionStyle: 'probing',
      },
      creative: {
        responseLength: 'medium',
        tone: 'playful and imaginative',
        energy: 'high',
        suggestions: true,
        questionStyle: 'gentle',
      },
      night_companion: {
        responseLength: 'short',
        tone: 'soft and calming',
        energy: 'low',
        suggestions: false,
        questionStyle: 'none',
      },
    };
    return behaviors[persona];
  }, []);

  /**
   * Silently switch persona based on message
   */
  const processMessage = useCallback((message: string): { persona: SilentPersona; behavior: PersonaBehavior } => {
    const newPersona = determinePersona(message);
    const behavior = getPersonaBehavior(newPersona);
    
    // Update the persona context if different (silently)
    // We map our silent personas to the existing persona types
    const personaMap: Record<SilentPersona, string> = {
      companion: 'companion',
      mentor: 'mentor',
      coach: 'builder',
      thinker: 'thinker',
      creative: 'companion',
      night_companion: 'companion',
    };
    
    const mappedPersona = personaMap[newPersona] as 'companion' | 'mentor' | 'thinker' | 'builder' | 'mirror';
    if (mappedPersona !== currentPersona) {
      setPersona(mappedPersona);
    }

    return { persona: newPersona, behavior };
  }, [determinePersona, getPersonaBehavior, currentPersona, setPersona]);

  /**
   * Get full persona context for AI prompt
   */
  const getPersonaContextForAI = useCallback((message: string): string => {
    const { persona, behavior } = processMessage(message);
    const context = getCurrentContext();
    const basePrompt = getPersonaPromptAdditions();

    const personaDescriptions: Record<SilentPersona, string> = {
      companion: 'You are a warm, supportive friend. Focus on listening and being present.',
      mentor: 'You are a patient teacher. Explain clearly, break down concepts, encourage learning.',
      coach: 'You are an action-focused coach. Be direct, suggest next steps, build momentum.',
      thinker: 'You are a thinking partner. Help analyze, explore options, ask good questions.',
      creative: 'You are a creative collaborator. Be playful, suggest ideas, encourage imagination.',
      night_companion: 'You are a calm night presence. Speak softly, keep responses brief, prioritize rest.',
    };

    return `
${basePrompt}

CURRENT PERSONA: ${persona.toUpperCase()}
${personaDescriptions[persona]}

BEHAVIOR SETTINGS:
- Response length: ${behavior.responseLength}
- Tone: ${behavior.tone}
- Energy level: ${behavior.energy}
- Include suggestions: ${behavior.suggestions ? 'yes, when relevant' : 'no, just respond'}
- Question style: ${behavior.questionStyle === 'none' ? 'avoid questions' : behavior.questionStyle === 'gentle' ? 'gentle, optional questions' : 'thoughtful follow-up questions'}

CONTEXT:
- Time: ${context.timeOfDay}
- Weekend: ${context.isWeekend ? 'yes' : 'no'}
- User energy: ${currentEnergy}
- Emotional state: ${emotionalTrend}

CRITICAL: Never announce persona or mode changes. Just embody the persona naturally.
`;
  }, [processMessage, getCurrentContext, getPersonaPromptAdditions, currentEnergy, emotionalTrend]);

  /**
   * Get current active persona info (for UI if needed)
   */
  const currentPersonaInfo = useMemo(() => {
    const context = getCurrentContext();
    const defaultPersona = context.timeOfDay === 'late_night' || context.timeOfDay === 'night' 
      ? 'night_companion' 
      : 'companion';
    return {
      persona: defaultPersona,
      behavior: getPersonaBehavior(defaultPersona),
    };
  }, [getCurrentContext, getPersonaBehavior]);

  return {
    processMessage,
    getPersonaContextForAI,
    determinePersona,
    getPersonaBehavior,
    currentPersonaInfo,
    detectIntent,
  };
};
