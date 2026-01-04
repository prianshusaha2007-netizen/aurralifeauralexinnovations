/**
 * AURRA Focus Mode + Life Rhythm Integration
 * 
 * Connects focus mode to user's typical schedule patterns
 * Suggests study/gym focus based on user's life rhythm
 */

import { useCallback, useMemo } from 'react';
import { useLifeRhythm } from './useLifeRhythm';
import { useFocusModeAI, FocusType } from './useFocusModeAI';
import { useBurnoutDetection } from './useBurnoutDetection';

interface FocusSuggestion {
  type: FocusType;
  reason: string;
  duration: number;
  confidence: 'high' | 'medium' | 'low';
}

export const useFocusModeWithRhythm = () => {
  const { rhythm, getRhythmContextForAI } = useLifeRhythm();
  const focusModeAI = useFocusModeAI();
  const { burnoutState, logSession } = useBurnoutDetection();

  /**
   * Get focus suggestion based on current time and rhythm patterns
   */
  const getFocusSuggestion = useCallback((): FocusSuggestion | null => {
    if (!rhythm.onboardingComplete) return null;

    const now = new Date();
    const hour = now.getHours();
    const isWeekend = now.getDay() === 0 || now.getDay() === 6;

    // Don't suggest focus if burnout detected
    if (burnoutState.level === 'rest_needed') {
      return null;
    }

    // Weekend handling
    if (isWeekend) {
      if (rhythm.weekendPattern.pace === 'relaxed') {
        // Only suggest if user explicitly seems productive
        if (rhythm.weekendPattern.flexibility !== 'high') {
          return {
            type: 'quiet',
            reason: "Weekend, but you mentioned being productive sometimes",
            duration: 25, // Shorter duration for weekends
            confidence: 'low',
          };
        }
        return null; // Don't interrupt relaxed weekends
      }
    }

    // Weekday patterns
    const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : hour < 21 ? 'evening' : 'night';
    const pattern = rhythm.weekdayPattern[timeOfDay];

    // Map patterns to focus types
    const suggestions: Record<string, FocusSuggestion | null> = {
      busy: {
        type: 'work',
        reason: `Your ${timeOfDay}s are usually busy`,
        duration: 45,
        confidence: 'high',
      },
      study: {
        type: 'study',
        reason: `Study time based on your rhythm`,
        duration: 45,
        confidence: 'high',
      },
      focused: {
        type: 'work',
        reason: `This is your focused time`,
        duration: 50,
        confidence: 'high',
      },
      gym: {
        type: 'gym',
        reason: `Your workout window`,
        duration: 60,
        confidence: 'high',
      },
      rest: null,
      flexible: {
        type: 'quiet',
        reason: `Flexible time - light focus?`,
        duration: 25,
        confidence: 'low',
      },
      'wind down': null,
    };

    return suggestions[pattern] || null;
  }, [rhythm, burnoutState]);

  /**
   * Get suggested focus duration based on time of day and pattern
   */
  const getSuggestedDuration = useCallback((focusType: FocusType): number => {
    const now = new Date();
    const hour = now.getHours();
    const isWeekend = now.getDay() === 0 || now.getDay() === 6;

    // Base durations by type
    const baseDurations: Record<FocusType, number> = {
      study: 45,
      work: 50,
      coding: 60,
      creative: 45,
      gym: 45,
      quiet: 25,
    };

    let duration = baseDurations[focusType] || 30;

    // Adjust for time of day
    if (hour >= 21) {
      duration = Math.min(duration, 25); // Shorter at night
    } else if (hour < 10 && isWeekend) {
      duration = Math.min(duration, 30); // Shorter early weekend
    }

    // Adjust for burnout level
    if (burnoutState.level === 'concern') {
      duration = Math.min(duration, 30);
    }

    return duration;
  }, [burnoutState]);

  /**
   * Start focus with rhythm awareness
   */
  const startRhythmAwareFocus = useCallback((
    type: FocusType,
    goal: string,
    customDuration?: number
  ) => {
    const duration = customDuration || getSuggestedDuration(type);
    
    focusModeAI.selectFocusType(type);
    focusModeAI.setFocusGoal(goal, duration);
    
    // Log for burnout detection
    logSession(duration);
  }, [focusModeAI, getSuggestedDuration, logSession]);

  /**
   * Check if it's a good time for focus
   */
  const isGoodTimeForFocus = useCallback((): { 
    isGood: boolean; 
    reason: string 
  } => {
    const now = new Date();
    const hour = now.getHours();
    const isWeekend = now.getDay() === 0 || now.getDay() === 6;

    // Late night - not ideal
    if (hour >= 23 || hour < 6) {
      return { 
        isGood: false, 
        reason: "It's late. Maybe rest instead?" 
      };
    }

    // Burnout detected
    if (burnoutState.level === 'rest_needed') {
      return { 
        isGood: false, 
        reason: "You've been working hard. Consider a lighter day." 
      };
    }

    // Relaxed weekend
    if (isWeekend && rhythm.onboardingComplete && rhythm.weekendPattern.pace === 'relaxed') {
      return { 
        isGood: true, 
        reason: "It's your relaxed weekend, but focus is fine if you want." 
      };
    }

    // Wind down time
    if (rhythm.onboardingComplete && rhythm.weekdayPattern.night === 'wind down' && hour >= 21) {
      return { 
        isGood: false, 
        reason: "This is your wind-down time. Short session only?" 
      };
    }

    return { isGood: true, reason: "" };
  }, [rhythm, burnoutState]);

  /**
   * Get focus context with rhythm information for AI
   */
  const getFocusWithRhythmContext = useCallback((): string => {
    const rhythmContext = getRhythmContextForAI();
    const focusContext = focusModeAI.getFocusContext();
    const suggestion = getFocusSuggestion();

    let context = rhythmContext;

    if (focusContext) {
      context += `\n\nACTIVE FOCUS SESSION:
- Type: ${focusContext.type}
- Goal: ${focusContext.goal || 'General focus'}
- Time remaining: ${focusContext.remainingMinutes} minutes
- Persona: ${focusContext.persona}`;
    } else if (suggestion) {
      context += `\n\nFOCUS SUGGESTION AVAILABLE:
- Suggested type: ${suggestion.type}
- Reason: ${suggestion.reason}
- Duration: ${suggestion.duration} minutes
- Confidence: ${suggestion.confidence}`;
    }

    return context;
  }, [getRhythmContextForAI, focusModeAI, getFocusSuggestion]);

  /**
   * Generate smart focus prompt based on rhythm
   */
  const getSmartFocusPrompt = useCallback((): string | null => {
    const suggestion = getFocusSuggestion();
    const timeCheck = isGoodTimeForFocus();

    if (!timeCheck.isGood && timeCheck.reason) {
      return timeCheck.reason;
    }

    if (suggestion) {
      const prompts: Record<FocusType, string> = {
        study: "Ready for some study time? You usually focus around now.",
        work: "Time to focus? Your rhythm suggests this is a good window.",
        coding: "Coding session? This seems like your focused time.",
        creative: "Creative time? Your rhythm shows this works for you.",
        gym: "Gym time? You typically work out around now.",
        quiet: "Want some quiet focus time?",
      };
      return prompts[suggestion.type] || null;
    }

    return null;
  }, [getFocusSuggestion, isGoodTimeForFocus]);

  return {
    // Original focus mode AI
    ...focusModeAI,
    
    // Rhythm-aware additions
    getFocusSuggestion,
    getSuggestedDuration,
    startRhythmAwareFocus,
    isGoodTimeForFocus,
    getFocusWithRhythmContext,
    getSmartFocusPrompt,
    
    // Burnout awareness
    burnoutLevel: burnoutState.level,
  };
};
