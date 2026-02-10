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

    // Language signals - Indian regional languages
    const languagePatterns: { pattern: RegExp; lang: string; region: string }[] = [
      { pattern: /(?:bhai|yaar|accha|kya|hai|nahi|haan|theek|चलो|अच्छा|क्या|बहुत|कैसे)/i, lang: 'hindi-english', region: 'North Indian' },
      { pattern: /[\u0980-\u09FF]|(?:ki korcho|kemon acho|bhalo|ache|আমি|তুমি|কেমন)/i, lang: 'bengali', region: 'Bengali' },
      { pattern: /[\u0B80-\u0BFF]|(?:vanakkam|nandri|eppadi|irukinga|நன்றி|வணக்கம்)/i, lang: 'tamil', region: 'Tamil' },
      { pattern: /[\u0C00-\u0C7F]|(?:namaskaram|ela unnaru|baagunnara|మీరు|నేను|ధన్యవాదాలు)/i, lang: 'telugu', region: 'Telugu' },
      { pattern: /[\u0C80-\u0CFF]|(?:namaskara|hegiddira|dhanyavada|ನಮಸ್ಕಾರ|ಹೇಗಿದ್ದೀರ)/i, lang: 'kannada', region: 'Kannada' },
      { pattern: /[\u0D00-\u0D7F]|(?:namaskaram|sugham|nanni|നമസ്കാരം|സുഖം|നന്ദി)/i, lang: 'malayalam', region: 'Malayalam' },
      { pattern: /[\u0A80-\u0AFF]|(?:kem cho|majama|aabhar|આભાર|કેમ છો|મજામાં)/i, lang: 'gujarati', region: 'Gujarati' },
      { pattern: /[\u0900-\u097F].*(?:कसं|काय|आहे|नमस्कार|धन्यवाद)|(?:kasa|kay ahe|majhya)/i, lang: 'marathi', region: 'Marathi' },
      { pattern: /[\u0A00-\u0A7F]|(?:sat sri akal|ki haal|vadiya|ਸਤ ਸ੍ਰੀ|ਕੀ ਹਾਲ|ਵਧੀਆ)/i, lang: 'punjabi', region: 'Punjabi' },
      { pattern: /[\u0B00-\u0B7F]|(?:namaskar|kemiti achhi|dhanyabad|ନମସ୍କାର|କେମିତି)/i, lang: 'odia', region: 'Odia' },
    ];

    for (const { pattern, lang, region } of languagePatterns) {
      if (pattern.test(lower) || pattern.test(message)) {
        signals.language = lang;
        signals.region = region;
        signals.greetingStyle = 'warm';
        detected = true;
        break;
      }
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
