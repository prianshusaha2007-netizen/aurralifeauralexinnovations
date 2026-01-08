/**
 * AURRA Emotional Detection System
 * 
 * Real-time mood/stress detection from message content.
 * Adapts AURRA's tone automatically without announcing it.
 */

import { useState, useCallback, useMemo, useEffect } from 'react';

export type EmotionalState = 'calm' | 'stressed' | 'tired' | 'anxious' | 'happy' | 'frustrated' | 'low' | 'neutral';
export type EnergyLevel = 'high' | 'medium' | 'low' | 'depleted';
export type ToneAdaptation = 'warm' | 'supportive' | 'energetic' | 'calm' | 'mentor' | 'companion';

interface EmotionalPattern {
  patterns: RegExp[];
  state: EmotionalState;
  weight: number;
}

interface DetectedEmotion {
  state: EmotionalState;
  energy: EnergyLevel;
  confidence: number;
  toneAdaptation: ToneAdaptation;
  suggestedResponseStyle: string;
}

const EMOTIONAL_PATTERNS: EmotionalPattern[] = [
  // Stressed patterns
  { 
    patterns: [
      /so much to do/i, /overwhelmed/i, /stressed/i, /pressure/i, 
      /deadline/i, /too much/i, /can't handle/i, /panicking/i,
      /freaking out/i, /behind on/i
    ], 
    state: 'stressed', 
    weight: 1.5 
  },
  // Tired patterns
  { 
    patterns: [
      /tired/i, /exhausted/i, /drained/i, /sleepy/i, /no energy/i,
      /burnt out/i, /worn out/i, /haven't slept/i, /up all night/i,
      /so tired/i, /need sleep/i, /can't focus/i
    ], 
    state: 'tired', 
    weight: 1.4 
  },
  // Anxious patterns
  { 
    patterns: [
      /worried/i, /anxious/i, /nervous/i, /scared/i, /afraid/i,
      /what if/i, /can't stop thinking/i, /overthinking/i,
      /panic/i, /fear/i
    ], 
    state: 'anxious', 
    weight: 1.4 
  },
  // Frustrated patterns
  { 
    patterns: [
      /frustrated/i, /annoyed/i, /angry/i, /irritated/i, /pissed/i,
      /ugh/i, /hate this/i, /stupid/i, /doesn't work/i, /broken/i
    ], 
    state: 'frustrated', 
    weight: 1.3 
  },
  // Happy patterns
  { 
    patterns: [
      /happy/i, /excited/i, /great/i, /awesome/i, /amazing/i,
      /love it/i, /perfect/i, /wonderful/i, /fantastic/i, /yay/i,
      /🎉|😊|😄|🙌|✨/
    ], 
    state: 'happy', 
    weight: 1.2 
  },
  // Low/sad patterns
  { 
    patterns: [
      /sad/i, /down/i, /depressed/i, /lonely/i, /miss/i,
      /empty/i, /hopeless/i, /worthless/i, /crying/i, /tear/i,
      /😢|😭|💔/
    ], 
    state: 'low', 
    weight: 1.5 
  },
  // Calm patterns
  { 
    patterns: [
      /relaxed/i, /peaceful/i, /calm/i, /good day/i, /chill/i,
      /feeling good/i, /all good/i, /fine/i, /okay/i
    ], 
    state: 'calm', 
    weight: 1.0 
  },
];

// Time-based energy patterns
const TIME_ENERGY_MAP = (): EnergyLevel => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 10) return 'medium'; // Morning warmup
  if (hour >= 10 && hour < 14) return 'high';  // Peak hours
  if (hour >= 14 && hour < 17) return 'medium'; // Afternoon dip
  if (hour >= 17 && hour < 21) return 'medium'; // Evening
  if (hour >= 21 || hour < 5) return 'low';    // Night
  return 'medium';
};

const STORAGE_KEY = 'aurra-emotional-state';

export const useEmotionalDetection = () => {
  const [recentEmotions, setRecentEmotions] = useState<{ state: EmotionalState; timestamp: number }[]>([]);
  const [messageHistory, setMessageHistory] = useState<string[]>([]);

  // Load from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const data = JSON.parse(stored);
        setRecentEmotions(data.recentEmotions || []);
        setMessageHistory(data.messageHistory || []);
      } catch (e) {
        console.error('Failed to parse emotional state:', e);
      }
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ recentEmotions, messageHistory }));
  }, [recentEmotions, messageHistory]);

  /**
   * Analyze a message for emotional content
   */
  const analyzeMessage = useCallback((message: string): EmotionalState => {
    const scores: Record<EmotionalState, number> = {
      calm: 0, stressed: 0, tired: 0, anxious: 0, 
      happy: 0, frustrated: 0, low: 0, neutral: 0
    };

    // Check each pattern
    for (const pattern of EMOTIONAL_PATTERNS) {
      for (const regex of pattern.patterns) {
        if (regex.test(message)) {
          scores[pattern.state] += pattern.weight;
        }
      }
    }

    // Find highest scoring emotion
    let maxScore = 0;
    let detectedState: EmotionalState = 'neutral';
    
    for (const [state, score] of Object.entries(scores)) {
      if (score > maxScore) {
        maxScore = score;
        detectedState = state as EmotionalState;
      }
    }

    // Add to recent emotions with timestamp
    if (detectedState !== 'neutral') {
      setRecentEmotions(prev => [
        ...prev.slice(-20),
        { state: detectedState, timestamp: Date.now() }
      ]);
    }

    // Add to message history
    setMessageHistory(prev => [...prev.slice(-10), message]);

    return detectedState;
  }, []);

  /**
   * Get the current emotional trend (from recent messages)
   */
  const emotionalTrend = useMemo((): EmotionalState => {
    const recent = recentEmotions.filter(
      e => Date.now() - e.timestamp < 30 * 60 * 1000 // Last 30 minutes
    );

    if (recent.length === 0) return 'neutral';

    // Count occurrences
    const counts: Record<string, number> = {};
    for (const emotion of recent) {
      counts[emotion.state] = (counts[emotion.state] || 0) + 1;
    }

    // Find most common
    let maxCount = 0;
    let trend: EmotionalState = 'neutral';
    for (const [state, count] of Object.entries(counts)) {
      if (count > maxCount) {
        maxCount = count;
        trend = state as EmotionalState;
      }
    }

    return trend;
  }, [recentEmotions]);

  /**
   * Get current energy level (time + emotional state based)
   */
  const currentEnergy = useMemo((): EnergyLevel => {
    const baseEnergy = TIME_ENERGY_MAP();
    
    // Adjust based on emotional trend
    if (emotionalTrend === 'tired' || emotionalTrend === 'low') {
      return baseEnergy === 'high' ? 'medium' : baseEnergy === 'medium' ? 'low' : 'depleted';
    }
    if (emotionalTrend === 'happy' || emotionalTrend === 'calm') {
      return baseEnergy === 'low' ? 'medium' : baseEnergy;
    }

    return baseEnergy;
  }, [emotionalTrend]);

  /**
   * Get tone adaptation based on emotional state
   */
  const getToneAdaptation = useCallback((state: EmotionalState): ToneAdaptation => {
    switch (state) {
      case 'stressed':
      case 'anxious':
        return 'calm';
      case 'tired':
      case 'low':
        return 'supportive';
      case 'frustrated':
        return 'companion';
      case 'happy':
        return 'energetic';
      case 'calm':
        return 'mentor';
      default:
        return 'warm';
    }
  }, []);

  /**
   * Get the full emotional detection result
   */
  const detectEmotion = useCallback((message: string): DetectedEmotion => {
    const state = analyzeMessage(message);
    const energy = currentEnergy;
    const tone = getToneAdaptation(state);

    // Calculate confidence based on pattern matches
    let confidence = 0.5;
    if (state !== 'neutral') {
      confidence = 0.7 + (recentEmotions.filter(e => e.state === state).length * 0.05);
      confidence = Math.min(confidence, 0.95);
    }

    const styleGuides: Record<EmotionalState, string> = {
      stressed: 'Keep responses brief and calming. Offer to break things down.',
      tired: 'Gentle, supportive responses. Suggest rest if appropriate.',
      anxious: 'Reassuring tone. Help ground the user with simple steps.',
      frustrated: 'Acknowledge the frustration. Be patient and helpful.',
      happy: 'Match the positive energy. Be encouraging.',
      low: 'Warm and understanding. No forced positivity.',
      calm: 'Conversational and natural. Match their pace.',
      neutral: 'Standard warm interaction.',
    };

    return {
      state,
      energy,
      confidence,
      toneAdaptation: tone,
      suggestedResponseStyle: styleGuides[state],
    };
  }, [analyzeMessage, currentEnergy, getToneAdaptation, recentEmotions]);

  /**
   * Get context string for AI prompt injection
   */
  const getEmotionalContextForAI = useCallback((): string => {
    const trend = emotionalTrend;
    const energy = currentEnergy;
    const hour = new Date().getHours();
    const isLateNight = hour >= 22 || hour < 5;

    if (trend === 'neutral' && energy === 'medium') {
      return ''; // No special context needed
    }

    let context = `
EMOTIONAL CONTEXT (DO NOT MENTION DIRECTLY):
- Current emotional trend: ${trend}
- Energy level: ${energy}
- Time context: ${isLateNight ? 'Late night (be gentler, suggest rest if needed)' : 'Normal hours'}
`;

    if (trend === 'stressed' || trend === 'anxious') {
      context += `
RESPONSE ADAPTATION:
- Use shorter, calmer sentences
- Offer to break down complex topics
- Don't add pressure or urgency
- "One thing at a time" approach`;
    } else if (trend === 'tired' || energy === 'depleted') {
      context += `
RESPONSE ADAPTATION:
- Keep responses brief
- Suggest rest as a valid option
- Don't push productivity
- Acknowledge their state indirectly`;
    } else if (trend === 'low') {
      context += `
RESPONSE ADAPTATION:
- Warm, understanding tone
- No forced positivity
- Simply be present
- Gentle acknowledgment`;
    } else if (trend === 'frustrated') {
      context += `
RESPONSE ADAPTATION:
- Acknowledge the difficulty
- Be solution-focused but patient
- Don't be overly cheerful
- Help troubleshoot calmly`;
    }

    return context;
  }, [emotionalTrend, currentEnergy]);

  /**
   * Check if the user seems to need extra support
   */
  const needsSupport = useMemo((): boolean => {
    const concerning = ['stressed', 'tired', 'anxious', 'low'];
    const recentConcerning = recentEmotions.filter(
      e => concerning.includes(e.state) && Date.now() - e.timestamp < 60 * 60 * 1000
    );
    return recentConcerning.length >= 3;
  }, [recentEmotions]);

  /**
   * Reset emotional tracking (new day)
   */
  const resetEmotionalState = useCallback(() => {
    setRecentEmotions([]);
    setMessageHistory([]);
  }, []);

  return {
    analyzeMessage,
    detectEmotion,
    emotionalTrend,
    currentEnergy,
    getEmotionalContextForAI,
    needsSupport,
    resetEmotionalState,
    getToneAdaptation,
  };
};
