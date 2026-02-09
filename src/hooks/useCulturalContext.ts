/**
 * useCulturalContext - Cultural & Regional Adaptation for AURRA
 * 
 * Learns culture from conversation, adapts tone/timing/suggestions.
 * Never stereotypes. Allows correction anytime.
 */

import { useState, useCallback, useEffect } from 'react';

interface CulturalProfile {
  region?: string;
  language?: string;
  festivals?: string[];
  dietaryPreferences?: string[];
  greetingStyle?: 'formal' | 'casual' | 'warm';
  timeZoneOffset?: number;
}

const CULTURAL_STORAGE_KEY = 'aurra-cultural-profile';

export const useCulturalContext = () => {
  const [culturalProfile, setCulturalProfile] = useState<CulturalProfile>(() => {
    try {
      const saved = localStorage.getItem(CULTURAL_STORAGE_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Save profile changes
  useEffect(() => {
    localStorage.setItem(CULTURAL_STORAGE_KEY, JSON.stringify(culturalProfile));
  }, [culturalProfile]);

  // Detect cultural signals from conversation
  const detectCulturalSignals = useCallback((message: string): Partial<CulturalProfile> | null => {
    const lower = message.toLowerCase();
    const signals: Partial<CulturalProfile> = {};
    let detected = false;

    // Festival/holiday mentions
    const festivalPatterns: Record<string, string> = {
      'diwali': 'South Asian',
      'eid': 'Islamic',
      'christmas': 'Western',
      'holi': 'South Asian',
      'ramadan': 'Islamic',
      'lunar new year': 'East Asian',
      'pongal': 'South Indian',
      'onam': 'South Indian',
      'navratri': 'South Asian',
      'thanksgiving': 'North American',
    };

    for (const [festival, region] of Object.entries(festivalPatterns)) {
      if (lower.includes(festival)) {
        signals.region = region;
        signals.festivals = [...(culturalProfile.festivals || []), festival];
        detected = true;
        break;
      }
    }

    // Dietary signals
    const dietPatterns: Record<string, string> = {
      'vegetarian': 'vegetarian',
      'vegan': 'vegan',
      'halal': 'halal',
      'kosher': 'kosher',
      'jain': 'jain',
      'no beef': 'no-beef',
      'no pork': 'no-pork',
    };

    for (const [pattern, pref] of Object.entries(dietPatterns)) {
      if (lower.includes(pattern)) {
        signals.dietaryPreferences = [...(culturalProfile.dietaryPreferences || []), pref];
        detected = true;
        break;
      }
    }

    // Language signals (Hindi/Hinglish)
    if (/(?:bhai|yaar|accha|kya|hai|nahi|haan|theek|चलो|अच्छा|क्या)/i.test(lower)) {
      signals.language = 'hindi-english';
      signals.greetingStyle = 'warm';
      detected = true;
    }

    return detected ? signals : null;
  }, [culturalProfile]);

  // Update cultural profile from detected signals
  const updateFromSignals = useCallback((signals: Partial<CulturalProfile>) => {
    setCulturalProfile(prev => ({
      ...prev,
      ...signals,
      festivals: [...new Set([...(prev.festivals || []), ...(signals.festivals || [])])],
      dietaryPreferences: [...new Set([...(prev.dietaryPreferences || []), ...(signals.dietaryPreferences || [])])],
    }));
  }, []);

  // Process a message for cultural signals
  const processMessage = useCallback((message: string) => {
    const signals = detectCulturalSignals(message);
    if (signals) {
      updateFromSignals(signals);
    }
  }, [detectCulturalSignals, updateFromSignals]);

  // Get cultural context string for AI prompt
  const getCulturalContextForAI = useCallback((): string => {
    const parts: string[] = [];
    
    if (culturalProfile.region) {
      parts.push(`Cultural background: ${culturalProfile.region}`);
    }
    if (culturalProfile.language) {
      parts.push(`Language preference: ${culturalProfile.language}`);
    }
    if (culturalProfile.dietaryPreferences?.length) {
      parts.push(`Dietary preferences: ${culturalProfile.dietaryPreferences.join(', ')}`);
    }
    if (culturalProfile.festivals?.length) {
      parts.push(`Known festivals: ${culturalProfile.festivals.join(', ')}`);
    }
    if (culturalProfile.greetingStyle) {
      parts.push(`Greeting style: ${culturalProfile.greetingStyle}`);
    }

    if (parts.length === 0) return '';

    return `\nCULTURAL CONTEXT (learned from conversation):\n${parts.join('\n')}\n- Adapt suggestions to respect these preferences\n- Never stereotype or assume beyond what's been shared\n- Allow correction anytime`;
  }, [culturalProfile]);

  // Allow user to correct cultural assumptions
  const correctProfile = useCallback((corrections: Partial<CulturalProfile>) => {
    setCulturalProfile(prev => ({ ...prev, ...corrections }));
  }, []);

  const resetProfile = useCallback(() => {
    setCulturalProfile({});
    localStorage.removeItem(CULTURAL_STORAGE_KEY);
  }, []);

  return {
    culturalProfile,
    processMessage,
    getCulturalContextForAI,
    correctProfile,
    resetProfile,
    detectCulturalSignals,
  };
};
