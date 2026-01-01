import { useCallback } from 'react';
import { SettingsCardType } from '@/components/InlineSettingsCards';

interface SettingsIntentResult {
  type: SettingsCardType;
  shouldShowCard: boolean;
  confirmationMessage: string;
}

// Patterns to detect settings-related intents
const APPEARANCE_PATTERNS = [
  /appearance/i,
  /theme/i,
  /dark mode/i,
  /light mode/i,
  /switch to dark/i,
  /switch to light/i,
  /change (?:the )?(?:look|color|style)/i,
  /make it dark/i,
  /make it light/i,
  /auto(?:matic)? theme/i,
];

const VOICE_PATTERNS = [
  /voice (?:settings?|language)/i,
  /speech settings?/i,
  /speak(?:ing)? settings?/i,
  /audio settings?/i,
  /change (?:my )?voice/i,
  /turn (?:on|off) voice/i,
  /enable voice/i,
  /disable voice/i,
  /voice response/i,
  /auto.?speak/i,
];

const PERSONALITY_PATTERNS = [
  /personality/i,
  /relationship/i,
  /persona/i,
  /communication style/i,
  /how you (?:talk|speak|respond)/i,
  /be (?:more )?(?:direct|gentle|simple)/i,
  /change (?:your )?style/i,
  /avatar/i,
  /aurra.?s (?:personality|style)/i,
];

export const useSettingsIntent = () => {
  const detectSettingsIntent = useCallback((message: string): SettingsIntentResult => {
    const lowerMessage = message.toLowerCase();
    
    // Check for appearance intent
    if (APPEARANCE_PATTERNS.some(pattern => pattern.test(message))) {
      return {
        type: 'appearance',
        shouldShowCard: true,
        confirmationMessage: "Here are your appearance settings. Pick a theme that feels right! 🎨",
      };
    }
    
    // Check for voice intent
    if (VOICE_PATTERNS.some(pattern => pattern.test(message))) {
      return {
        type: 'voice',
        shouldShowCard: true,
        confirmationMessage: "Here are your voice settings. Adjust how I sound! 🎤",
      };
    }
    
    // Check for personality intent
    if (PERSONALITY_PATTERNS.some(pattern => pattern.test(message))) {
      return {
        type: 'personality',
        shouldShowCard: true,
        confirmationMessage: "Here's my personality panel. Shape how I communicate with you! ✨",
      };
    }
    
    return {
      type: null,
      shouldShowCard: false,
      confirmationMessage: '',
    };
  }, []);

  return { detectSettingsIntent };
};