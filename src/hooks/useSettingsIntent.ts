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
  /aurra.?s (?:personality|style)/i,
];

const HYDRATION_PATTERNS = [
  /hydration/i,
  /water reminder/i,
  /drink water/i,
  /hydrat(?:e|ion) (?:settings?|reminder)/i,
  /health reminder/i,
  /stay hydrated/i,
];

const REMINDERS_PATTERNS = [
  /(?:my |show |what )reminder/i,
  /reminder(?:s)? (?:list|settings?)/i,
  /what (?:do i have|reminders)/i,
  /show (?:my )?reminders/i,
  /reminder management/i,
];

const ROUTINE_PATTERNS = [
  /(?:my |today.?s |show )?routine/i,
  /daily (?:routine|schedule|plan)/i,
  /routine (?:settings?|blocks?)/i,
  /show (?:my )?(?:routine|schedule)/i,
  /what.?s on (?:my )?schedule/i,
];

const SUBSCRIPTION_PATTERNS = [
  /subscription/i,
  /credits?/i,
  /(?:my )?plan/i,
  /usage/i,
  /upgrade/i,
  /billing/i,
  /show (?:my )?(?:plan|usage|credits)/i,
];

const PROFILE_PATTERNS = [
  /(?:my )?profile/i,
  /personal details/i,
  /my (?:info|information|details)/i,
  /account (?:settings?|details)/i,
  /who am i/i,
  /what do you know about me/i,
];

export const useSettingsIntent = () => {
  const detectSettingsIntent = useCallback((message: string): SettingsIntentResult => {
    // Check for appearance intent
    if (APPEARANCE_PATTERNS.some(pattern => pattern.test(message))) {
      return {
        type: 'appearance',
        shouldShowCard: true,
        confirmationMessage: "Here are your appearance settings 🎨",
      };
    }
    
    // Check for voice intent
    if (VOICE_PATTERNS.some(pattern => pattern.test(message))) {
      return {
        type: 'voice',
        shouldShowCard: true,
        confirmationMessage: "Here are your voice settings 🎤",
      };
    }
    
    // Check for personality intent
    if (PERSONALITY_PATTERNS.some(pattern => pattern.test(message))) {
      return {
        type: 'personality',
        shouldShowCard: true,
        confirmationMessage: "Here's my personality panel ✨",
      };
    }

    // Check for hydration intent
    if (HYDRATION_PATTERNS.some(pattern => pattern.test(message))) {
      return {
        type: 'hydration',
        shouldShowCard: true,
        confirmationMessage: "Here are your hydration settings 💧",
      };
    }

    // Check for reminders intent
    if (REMINDERS_PATTERNS.some(pattern => pattern.test(message))) {
      return {
        type: 'reminders',
        shouldShowCard: true,
        confirmationMessage: "Here are your reminders 🔔",
      };
    }

    // Check for routine intent
    if (ROUTINE_PATTERNS.some(pattern => pattern.test(message))) {
      return {
        type: 'routine',
        shouldShowCard: true,
        confirmationMessage: "Here's today's routine 📅",
      };
    }

    // Check for subscription intent
    if (SUBSCRIPTION_PATTERNS.some(pattern => pattern.test(message))) {
      return {
        type: 'subscription',
        shouldShowCard: true,
        confirmationMessage: "Here's your current plan and usage 👇",
      };
    }

    // Check for profile intent
    if (PROFILE_PATTERNS.some(pattern => pattern.test(message))) {
      return {
        type: 'profile',
        shouldShowCard: true,
        confirmationMessage: "Here's what I know about you 👤",
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