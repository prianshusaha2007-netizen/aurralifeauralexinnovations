import { useCallback } from 'react';

// Master intent types for AURRA's "Chat is the OS" approach
export type IntentType = 
  | 'chat'           // Normal conversation
  | 'reminder'       // Setting reminders
  | 'routine'        // Routine management (start, skip, shift, edit)
  | 'memory'         // Saving/recalling memories
  | 'skill'          // Skill sessions (coding, gym, design, music)
  | 'emotion'        // Emotional support needed
  | 'planning'       // Planning help
  | 'settings'       // Settings changes
  | 'subscription'   // Subscription queries
  | 'media'          // Image/document generation
  | 'navigation'     // Find places, explore
  | 'reflection'     // Progress, weekly review
  | 'focus'          // Focus mode, music
  | 'persona';       // Relationship/persona changes

export type ConfidenceLevel = 'clear' | 'vague' | 'emotional';
export type UrgencyLevel = 'now' | 'soon' | 'later';

export interface IntentResult {
  type: IntentType;
  confidence: ConfidenceLevel;
  urgency: UrgencyLevel;
  subAction?: string;
  extractedData?: Record<string, any>;
  shouldPrioritizeEmotion: boolean;
}

// Emotion detection patterns
const EMOTIONAL_PATTERNS = {
  sad: /(?:sad|down|crying|upset|hurt|lonely|depressed|दुखी|दुख|rona|dukhi)/i,
  anxious: /(?:anxious|worried|nervous|scared|panic|fear|darr|डर|tension|stressed)/i,
  tired: /(?:tired|exhausted|drained|burnout|थका|thaka|no energy|sleepy)/i,
  overwhelmed: /(?:overwhelmed|too much|can'?t handle|drowning|परेशान)/i,
  angry: /(?:angry|frustrated|mad|annoyed|irritated|gussa|गुस्सा)/i,
  happy: /(?:happy|excited|great|amazing|awesome|खुश|maza|मज़ा)/i,
  grateful: /(?:grateful|thankful|blessed|appreciate)/i,
  confused: /(?:confused|lost|don'?t know|stuck|समझ नहीं)/i,
};

// Intent detection patterns with confidence scoring
const INTENT_PATTERNS: Record<IntentType, { patterns: RegExp[]; weight: number }> = {
  reminder: {
    patterns: [
      /remind(?:er)?\s+(?:me\s+)?(?:to|about|at)/i,
      /(?:set|create|add)\s+(?:a\s+)?reminder/i,
      /(?:don'?t\s+)?(?:let me\s+)?forget/i,
      /yaad\s+dilana|याद\s+दिलाना/i,
      /in\s+\d+\s+(?:min|hour|minute)/i,
    ],
    weight: 90,
  },
  routine: {
    patterns: [
      /(?:move|shift|change|update|edit|skip|start|begin)\s+(?:my\s+)?(?:gym|study|coding|work|routine)/i,
      /(?:routine|schedule)\s+(?:badlo|change|edit)/i,
      /(?:let'?s|want to)\s+(?:start|do|begin)\s+(?:gym|study|coding|work)/i,
      /(?:skip|not\s+doing)\s+(?:today|now)/i,
      /push\s+(?:it\s+)?(?:by|to)/i,
    ],
    weight: 85,
  },
  memory: {
    patterns: [
      /(?:remember|save|note)\s+(?:that|this)/i,
      /(?:my|i)\s+(?:like|prefer|love|hate|am allergic)/i,
      /(?:my)\s+(?:birthday|anniversary|goal)/i,
      /yaad\s+rakhna|याद\s+रखना/i,
      /(?:don'?t\s+)?forget\s+(?:that|about)/i,
    ],
    weight: 80,
  },
  skill: {
    patterns: [
      /(?:help|teach|guide)\s+(?:me\s+)?(?:with|in|about)\s+(?:coding|gym|design|video|music)/i,
      /(?:coding|gym|workout|design|video editing|music)\s+(?:session|help|time)/i,
      /(?:debug|fix|solve)\s+(?:this|my)\s+(?:code|error|bug)/i,
      /(?:today'?s?)\s+(?:workout|coding|practice)/i,
      /explain\s+(?:this|how)/i,
    ],
    weight: 85,
  },
  emotion: {
    patterns: [
      /(?:i\s+)?feel(?:ing)?\s+(?:so\s+)?(?:sad|low|down|bad|terrible|awful)/i,
      /(?:i'?m|i am)\s+(?:so\s+)?(?:stressed|anxious|worried|scared|tired|exhausted)/i,
      /(?:having|had)\s+(?:a\s+)?(?:bad|rough|hard|tough)\s+(?:day|time)/i,
      /(?:need|want)\s+(?:to\s+)?(?:talk|vent|share)/i,
      /मन\s+खराब|man\s+kharab|dil\s+nahi/i,
    ],
    weight: 95, // Highest priority
  },
  planning: {
    patterns: [
      /(?:plan|help\s+me\s+plan)\s+(?:my|the|today)/i,
      /(?:what|how)\s+should\s+(?:i|we)\s+(?:do|plan|approach)/i,
      /(?:organize|schedule)\s+(?:my|the)/i,
      /(?:make|create)\s+(?:a\s+)?(?:plan|schedule|todo)/i,
    ],
    weight: 75,
  },
  settings: {
    patterns: [
      /(?:change|update|set)\s+(?:my\s+)?(?:name|profile|preference|notification|theme)/i,
      /(?:be\s+)?(?:more|less)\s+(?:formal|casual|chill|serious)/i,
      /(?:turn|switch)\s+(?:on|off)\s+(?:notification|reminder|dark mode)/i,
      /(?:call me|my name is)/i,
    ],
    weight: 70,
  },
  subscription: {
    patterns: [
      /(?:what|tell me about)\s+(?:plus|premium|subscription|upgrade)/i,
      /(?:how\s+to\s+)?(?:upgrade|subscribe|get\s+plus)/i,
      /(?:subscription|plan)\s+(?:details|benefits|price)/i,
    ],
    weight: 70,
  },
  media: {
    patterns: [
      /(?:generate|create|make)\s+(?:an?\s+)?(?:image|picture|photo)/i,
      /(?:create|make|write)\s+(?:a\s+)?(?:document|doc|pdf|resume)/i,
      /(?:draw|design)\s+(?:me\s+)?(?:a|an)/i,
      /image\s+(?:banao|bana)/i,
    ],
    weight: 80,
  },
  navigation: {
    patterns: [
      /(?:find|show|where\s+is)\s+(?:a\s+)?(?:cafe|restaurant|gym|place|store)/i,
      /(?:near|nearby|around)\s+(?:me|here)/i,
      /(?:direction|route|how\s+to\s+get)\s+to/i,
    ],
    weight: 75,
  },
  reflection: {
    patterns: [
      /(?:how\s+was|show\s+me)\s+(?:my\s+)?(?:week|progress|performance)/i,
      /(?:weekly|daily)\s+(?:summary|report|review)/i,
      /(?:what|how much)\s+(?:did\s+i|have\s+i)\s+(?:do|done|complete)/i,
    ],
    weight: 75,
  },
  focus: {
    patterns: [
      /(?:start|enable|turn on)\s+(?:focus|pomodoro|deep work)/i,
      /(?:need|want)\s+(?:to\s+)?(?:focus|concentrate)/i,
      /(?:play|start)\s+(?:focus|calm|ambient)\s+(?:music|sounds)/i,
    ],
    weight: 80,
  },
  persona: {
    patterns: [
      /(?:be\s+)?(?:more|less)\s+(?:friendly|formal|chill|warm|professional)/i,
      /(?:talk|speak)\s+(?:to\s+me\s+)?(?:like|as)/i,
      /(?:call|treat)\s+(?:me\s+)?(?:as|like)/i,
      /(?:you'?re|be)\s+(?:my)\s+(?:friend|mentor|coach)/i,
    ],
    weight: 70,
  },
  chat: {
    patterns: [],
    weight: 50, // Default fallback
  },
};

export const useMasterIntentEngine = () => {
  // Detect emotional state from message
  const detectEmotionalState = useCallback((message: string): { 
    isEmotional: boolean; 
    emotion: string | null;
    intensity: 'low' | 'medium' | 'high';
  } => {
    const lowerMessage = message.toLowerCase();
    
    // Check for emotional patterns
    for (const [emotion, pattern] of Object.entries(EMOTIONAL_PATTERNS)) {
      if (pattern.test(lowerMessage)) {
        // Check intensity markers
        const intensityMarkers = {
          high: /(?:so|very|really|extremely|super|बहुत|bohot)/i,
          medium: /(?:quite|pretty|somewhat|थोड़ा|thoda)/i,
        };
        
        let intensity: 'low' | 'medium' | 'high' = 'medium';
        if (intensityMarkers.high.test(lowerMessage)) intensity = 'high';
        else if (intensityMarkers.medium.test(lowerMessage)) intensity = 'low';
        
        return { isEmotional: true, emotion, intensity };
      }
    }
    
    return { isEmotional: false, emotion: null, intensity: 'low' };
  }, []);

  // Main intent classification
  const classifyIntent = useCallback((message: string): IntentResult => {
    const lowerMessage = message.toLowerCase();
    const emotionalState = detectEmotionalState(message);
    
    // If highly emotional, prioritize emotion intent
    if (emotionalState.isEmotional && emotionalState.intensity === 'high') {
      return {
        type: 'emotion',
        confidence: 'emotional',
        urgency: 'now',
        shouldPrioritizeEmotion: true,
        extractedData: { emotion: emotionalState.emotion },
      };
    }
    
    // Score each intent type
    let bestIntent: IntentType = 'chat';
    let bestScore = 0;
    let extractedData: Record<string, any> = {};
    
    for (const [intentType, config] of Object.entries(INTENT_PATTERNS)) {
      for (const pattern of config.patterns) {
        const match = lowerMessage.match(pattern);
        if (match) {
          const score = config.weight + (match[0].length / lowerMessage.length) * 10;
          if (score > bestScore) {
            bestScore = score;
            bestIntent = intentType as IntentType;
            extractedData = { match: match[0] };
          }
        }
      }
    }
    
    // Determine confidence
    let confidence: ConfidenceLevel = 'vague';
    if (bestScore >= 85) confidence = 'clear';
    else if (emotionalState.isEmotional) confidence = 'emotional';
    
    // Determine urgency
    let urgency: UrgencyLevel = 'soon';
    if (/(?:now|immediately|right now|abhi|अभी)/i.test(lowerMessage)) urgency = 'now';
    else if (/(?:later|tomorrow|sometime|baad mein)/i.test(lowerMessage)) urgency = 'later';
    else if (bestIntent === 'emotion') urgency = 'now';
    
    // Extract sub-actions for routine
    if (bestIntent === 'routine') {
      if (/(?:start|begin|let'?s|chalo)/i.test(lowerMessage)) extractedData.subAction = 'start';
      else if (/(?:skip|not today|nahi)/i.test(lowerMessage)) extractedData.subAction = 'skip';
      else if (/(?:shift|push|delay|later)/i.test(lowerMessage)) extractedData.subAction = 'shift';
      else if (/(?:change|edit|update)/i.test(lowerMessage)) extractedData.subAction = 'edit';
    }
    
    // Extract time for reminders
    if (bestIntent === 'reminder') {
      const timeMatch = lowerMessage.match(/(?:in\s+)?(\d+)\s*(min|minute|hour|hr)/i);
      if (timeMatch) {
        extractedData.timeAmount = parseInt(timeMatch[1]);
        extractedData.timeUnit = timeMatch[2].startsWith('h') ? 'hour' : 'minute';
      }
    }
    
    return {
      type: bestIntent,
      confidence,
      urgency,
      subAction: extractedData.subAction,
      extractedData,
      shouldPrioritizeEmotion: emotionalState.isEmotional,
    };
  }, [detectEmotionalState]);

  // Get appropriate response strategy based on intent
  const getResponseStrategy = useCallback((intent: IntentResult): {
    systemPersona: string;
    responseLength: 'short' | 'medium' | 'long';
    shouldActivateFeature: boolean;
    featureHint: string;
  } => {
    const strategies: Record<IntentType, { persona: string; length: 'short' | 'medium' | 'long'; feature: string }> = {
      chat: { persona: 'companion', length: 'medium', feature: '' },
      reminder: { persona: 'assistant', length: 'short', feature: 'reminder' },
      routine: { persona: 'coach', length: 'short', feature: 'routine' },
      memory: { persona: 'companion', length: 'short', feature: 'memory' },
      skill: { persona: 'mentor', length: 'medium', feature: 'skill' },
      emotion: { persona: 'companion', length: 'short', feature: '' },
      planning: { persona: 'cofounder', length: 'medium', feature: 'planning' },
      settings: { persona: 'assistant', length: 'short', feature: 'settings' },
      subscription: { persona: 'companion', length: 'medium', feature: 'subscription' },
      media: { persona: 'creative', length: 'short', feature: 'media' },
      navigation: { persona: 'assistant', length: 'short', feature: 'navigation' },
      reflection: { persona: 'coach', length: 'medium', feature: 'reflection' },
      focus: { persona: 'coach', length: 'short', feature: 'focus' },
      persona: { persona: 'companion', length: 'short', feature: 'settings' },
    };
    
    const strategy = strategies[intent.type];
    
    // Override for emotional messages
    if (intent.shouldPrioritizeEmotion) {
      return {
        systemPersona: 'companion',
        responseLength: 'short',
        shouldActivateFeature: false,
        featureHint: '',
      };
    }
    
    return {
      systemPersona: strategy.persona,
      responseLength: strategy.length,
      shouldActivateFeature: !!strategy.feature,
      featureHint: strategy.feature,
    };
  }, []);

  return {
    classifyIntent,
    detectEmotionalState,
    getResponseStrategy,
  };
};
