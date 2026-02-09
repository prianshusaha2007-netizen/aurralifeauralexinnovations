import { useState, useCallback, useEffect, useMemo } from 'react';

export interface CulturalContext {
  // Inferred signals (built over time)
  detectedRegion: string | null;
  languageMixing: 'none' | 'light' | 'heavy';
  culturalCues: string[]; // e.g. ['exam_pressure', 'festival_awareness', 'family_oriented']
  // User-set preferences
  preferredTone: 'local' | 'global' | 'auto';
  correctionHistory: string[]; // tracks user corrections for tone
}

const CULTURAL_STORAGE_KEY = 'aurra-cultural-context';

// Patterns that hint at cultural context (soft, never labeling)
const CULTURAL_SIGNAL_PATTERNS: { pattern: RegExp; cue: string; region?: string }[] = [
  // Indian cultural signals
  { pattern: /\b(?:diwali|holi|durga\s*puja|navratri|eid|rakhi|ganesh|onam|pongal|baisakhi|lohri|makar\s*sankranti)\b/i, cue: 'festival_awareness', region: 'south_asia' },
  { pattern: /\b(?:jee|neet|boards?|cbse|icse|iit|upsc|cat\s+exam|gate\s+exam|ssc)\b/i, cue: 'exam_pressure', region: 'south_asia' },
  { pattern: /\b(?:mummy|papa|bhaiya|didi|chacha|mausi|nani|dadi|bhai|behen)\b/i, cue: 'family_oriented', region: 'south_asia' },
  { pattern: /\b(?:chai|roti|dal|biryani|samosa|paratha|idli|dosa|paneer|chapati)\b/i, cue: 'food_culture', region: 'south_asia' },
  { pattern: /\b(?:tiffin|tuition|coaching|batch|backlog|semester|viva|practical)\b/i, cue: 'academic_culture', region: 'south_asia' },
  { pattern: /\b(?:yaar|bro|dude|arrey|achha|theek|bas|chalo|kya)\b/i, cue: 'casual_hindi_mix', region: 'south_asia' },
  { pattern: /\b(?:pooja|mandir|namaz|church|temple|mosque|gurudwara)\b/i, cue: 'spiritual_context' },
  // Late night study culture
  { pattern: /\b(?:studying\s+(?:at|till|until)\s+(?:\d+\s*(?:am|pm)|night|late))\b/i, cue: 'late_study_culture' },
  { pattern: /\b(?:raat\s+ko\s+padh|late\s+night\s+study|all\s*night(?:er)?)\b/i, cue: 'late_study_culture' },
  // Family pressure / expectations
  { pattern: /\b(?:parents?\s+(?:want|expect|pressure|force)|family\s+(?:expect|pressure)|log\s+kya\s+kahenge)\b/i, cue: 'social_expectations' },
  // Work culture signals
  { pattern: /\b(?:startup|hustle\s+culture|side\s+project|freelanc)/i, cue: 'work_culture' },
];

// Detect user corrections about tone/style
const CORRECTION_PATTERNS = [
  /(?:that'?s?\s+not\s+how\s+(?:it|we|i)\s+(?:work|say|do))/i,
  /(?:don'?t\s+(?:say|talk|speak)\s+(?:it\s+)?like\s+that)/i,
  /(?:i\s+prefer\s+(?:a\s+)?different\s+(?:style|tone|way))/i,
  /(?:change\s+how\s+you\s+(?:talk|speak|respond))/i,
  /(?:too\s+(?:formal|casual|western|indian|american))/i,
  /(?:speak\s+(?:more\s+)?(?:casually|formally|naturally|simply))/i,
];

export const useCulturalContext = () => {
  const [context, setContext] = useState<CulturalContext>(() => {
    try {
      const saved = localStorage.getItem(CULTURAL_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch { /* ignore */ }
    return {
      detectedRegion: null,
      languageMixing: 'none',
      culturalCues: [],
      preferredTone: 'auto',
      correctionHistory: [],
    };
  });

  // Persist changes
  useEffect(() => {
    localStorage.setItem(CULTURAL_STORAGE_KEY, JSON.stringify(context));
  }, [context]);

  // Analyze a message for cultural signals (called on each user message)
  const analyzeCulturalSignals = useCallback((message: string) => {
    const newCues: string[] = [];
    let detectedRegion: string | null = null;

    for (const { pattern, cue, region } of CULTURAL_SIGNAL_PATTERNS) {
      if (pattern.test(message)) {
        if (!context.culturalCues.includes(cue)) {
          newCues.push(cue);
        }
        if (region && !detectedRegion) {
          detectedRegion = region;
        }
      }
    }

    // Detect language mixing level
    const hinglishWords = (message.match(/\b(?:hai|hoon|kya|aaj|tumhara|kaise|achha|nahi|bohot|karna|raha|rahe|ho|main|tum|mujhe|yaar|theek|bas|chalo|arrey|accha|matlab|lekin)\b/gi) || []).length;
    const totalWords = message.split(/\s+/).length;
    const mixRatio = totalWords > 0 ? hinglishWords / totalWords : 0;

    let newMixing = context.languageMixing;
    if (mixRatio > 0.3) newMixing = 'heavy';
    else if (mixRatio > 0.1) newMixing = 'light';

    // Check for tone corrections
    const isCorrection = CORRECTION_PATTERNS.some(p => p.test(message));

    if (newCues.length > 0 || detectedRegion || newMixing !== context.languageMixing || isCorrection) {
      setContext(prev => ({
        ...prev,
        culturalCues: [...new Set([...prev.culturalCues, ...newCues])].slice(0, 20),
        detectedRegion: detectedRegion || prev.detectedRegion,
        languageMixing: newMixing,
        correctionHistory: isCorrection 
          ? [...prev.correctionHistory, message].slice(-5) 
          : prev.correctionHistory,
      }));
    }
  }, [context]);

  // User explicitly sets tone preference
  const setPreferredTone = useCallback((tone: 'local' | 'global' | 'auto') => {
    setContext(prev => ({ ...prev, preferredTone: tone }));
  }, []);

  // Reset cultural context
  const resetCulturalContext = useCallback(() => {
    setContext({
      detectedRegion: null,
      languageMixing: 'none',
      culturalCues: [],
      preferredTone: 'auto',
      correctionHistory: [],
    });
  }, []);

  // Generate context for AI system prompt
  const getCulturalContextForAI = useMemo(() => {
    if (context.culturalCues.length === 0 && !context.detectedRegion && context.languageMixing === 'none') {
      return null; // No cultural context detected yet
    }

    return {
      detectedRegion: context.detectedRegion,
      languageMixing: context.languageMixing,
      culturalCues: context.culturalCues,
      preferredTone: context.preferredTone,
      hasCorrections: context.correctionHistory.length > 0,
      recentCorrections: context.correctionHistory.slice(-2),
    };
  }, [context]);

  return {
    culturalContext: context,
    analyzeCulturalSignals,
    setPreferredTone,
    resetCulturalContext,
    getCulturalContextForAI,
  };
};
