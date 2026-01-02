import { useState, useEffect, useCallback } from 'react';
import { hasGreetedToday, markGreetingShown } from '@/utils/dailyGreeting';

const DAILY_PLAN_KEY = 'aurra-daily-plan';
const LAST_PLAN_DATE_KEY = 'aurra-last-plan-date';
const MID_DAY_CHECKIN_KEY = 'aurra-midday-checkin-date';
const EVENING_CHECKIN_KEY = 'aurra-evening-checkin-date';
const ROUTINE_ONBOARDING_COMPLETE_KEY = 'aurra-routine-onboarding-complete';

export interface DailyPlan {
  plan: string;
  intensity: 'light' | 'normal' | 'busy' | 'unknown';
  keywords: string[];
  timestamp: string;
}

export interface DailyPlanState {
  shouldAskForPlan: boolean;
  hasAskedToday: boolean;
  currentPlan: DailyPlan | null;
  shouldShowMidDayCheckin: boolean;
  shouldShowEveningCheckin: boolean;
  hasCompletedOnboarding: boolean;
}

/**
 * Detect intensity from user's plan description
 */
function detectIntensity(plan: string): DailyPlan['intensity'] {
  const lowerPlan = plan.toLowerCase();
  
  // Light indicators
  if (/(?:chill|relax|rest|easy|light|nothing|lazy|free|off)/i.test(lowerPlan)) {
    return 'light';
  }
  
  // Busy indicators
  if (/(?:busy|hectic|packed|crazy|lots|many|full|deadline|exam|intense)/i.test(lowerPlan)) {
    return 'busy';
  }
  
  // Normal structured day
  if (/(?:college|work|gym|study|coding|office|class|meeting)/i.test(lowerPlan)) {
    return 'normal';
  }
  
  return 'unknown';
}

/**
 * Extract activity keywords from plan
 */
function extractKeywords(plan: string): string[] {
  const keywords: string[] = [];
  const lowerPlan = plan.toLowerCase();
  
  const activityPatterns = [
    { pattern: /(?:college|class|school|university|lecture)/i, keyword: 'study' },
    { pattern: /(?:work|office|job|business|meeting)/i, keyword: 'work' },
    { pattern: /(?:gym|workout|exercise|run|yoga|fitness)/i, keyword: 'gym' },
    { pattern: /(?:code|coding|programming|dev|build)/i, keyword: 'coding' },
    { pattern: /(?:music|practice|instrument|sing)/i, keyword: 'music' },
    { pattern: /(?:content|video|edit|create|film)/i, keyword: 'content' },
    { pattern: /(?:study|exam|homework|assignment|read)/i, keyword: 'study' },
    { pattern: /(?:chill|relax|rest|sleep|nap)/i, keyword: 'rest' },
  ];
  
  activityPatterns.forEach(({ pattern, keyword }) => {
    if (pattern.test(lowerPlan) && !keywords.includes(keyword)) {
      keywords.push(keyword);
    }
  });
  
  return keywords;
}

/**
 * Hook to manage AURRA's daily plan system
 * Core principle: Ask "What's your plan for today?" ONCE per day
 * Then adapt silently based on the response
 */
export const useAurraDailyPlan = () => {
  const [state, setState] = useState<DailyPlanState>({
    shouldAskForPlan: false,
    hasAskedToday: false,
    currentPlan: null,
    shouldShowMidDayCheckin: false,
    shouldShowEveningCheckin: false,
    hasCompletedOnboarding: false,
  });

  // Check and update state on mount
  useEffect(() => {
    const checkDailyPlanState = () => {
      const today = new Date().toISOString().split('T')[0];
      const hour = new Date().getHours();
      
      // Check if onboarding is complete
      const hasCompletedOnboarding = localStorage.getItem(ROUTINE_ONBOARDING_COMPLETE_KEY) === 'true';
      
      // Check if we've asked for plan today
      const lastPlanDate = localStorage.getItem(LAST_PLAN_DATE_KEY);
      const hasAskedToday = lastPlanDate === today;
      
      // Get current plan if exists
      const savedPlan = localStorage.getItem(DAILY_PLAN_KEY);
      let currentPlan: DailyPlan | null = null;
      if (savedPlan) {
        try {
          const parsed = JSON.parse(savedPlan);
          // Only use if from today
          if (parsed.timestamp?.startsWith(today)) {
            currentPlan = parsed;
          }
        } catch {
          // Invalid JSON, ignore
        }
      }
      
      // Should ask for plan: first message of day AND onboarding complete AND not asked yet
      const isFirstMessageOfDay = !hasGreetedToday();
      const shouldAskForPlan = hasCompletedOnboarding && isFirstMessageOfDay && !hasAskedToday;
      
      // Mid-day check-in (12pm-4pm, only if stress or long silence detected)
      const midDayCheckinDate = localStorage.getItem(MID_DAY_CHECKIN_KEY);
      const shouldShowMidDayCheckin = hour >= 12 && hour < 16 && midDayCheckinDate !== today;
      
      // Evening check-in (9pm+, only once)
      const eveningCheckinDate = localStorage.getItem(EVENING_CHECKIN_KEY);
      const shouldShowEveningCheckin = hour >= 21 && eveningCheckinDate !== today;
      
      setState({
        shouldAskForPlan,
        hasAskedToday,
        currentPlan,
        shouldShowMidDayCheckin,
        shouldShowEveningCheckin,
        hasCompletedOnboarding,
      });
    };
    
    checkDailyPlanState();
    
    // Re-check every 30 minutes
    const interval = setInterval(checkDailyPlanState, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  /**
   * Save user's daily plan
   */
  const saveDailyPlan = useCallback((planText: string) => {
    const today = new Date().toISOString().split('T')[0];
    
    const plan: DailyPlan = {
      plan: planText,
      intensity: detectIntensity(planText),
      keywords: extractKeywords(planText),
      timestamp: new Date().toISOString(),
    };
    
    localStorage.setItem(DAILY_PLAN_KEY, JSON.stringify(plan));
    localStorage.setItem(LAST_PLAN_DATE_KEY, today);
    markGreetingShown(); // Mark that we've interacted today
    
    setState(prev => ({
      ...prev,
      currentPlan: plan,
      hasAskedToday: true,
      shouldAskForPlan: false,
    }));
    
    return plan;
  }, []);

  /**
   * Dismiss mid-day check-in
   */
  const dismissMidDayCheckin = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem(MID_DAY_CHECKIN_KEY, today);
    setState(prev => ({ ...prev, shouldShowMidDayCheckin: false }));
  }, []);

  /**
   * Dismiss evening check-in
   */
  const dismissEveningCheckin = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem(EVENING_CHECKIN_KEY, today);
    setState(prev => ({ ...prev, shouldShowEveningCheckin: false }));
  }, []);

  /**
   * Get appropriate response to user's plan
   */
  const getPlanResponse = useCallback((plan: DailyPlan): string => {
    switch (plan.intensity) {
      case 'busy':
        return "Got it. Let's keep things simple today.";
      case 'light':
        return "Okay. We'll go light.";
      case 'normal':
        return "Alright. I'll help you keep it on track.";
      default:
        return "Sounds good. I'm here if anything comes up.";
    }
  }, []);

  /**
   * Detect if user's message is a plan response
   */
  const isPlanResponse = useCallback((message: string): boolean => {
    // If we've asked for plan and user responds, it's likely a plan
    if (!state.hasAskedToday && state.shouldAskForPlan) {
      // Short responses are likely plans
      const wordCount = message.trim().split(/\s+/).length;
      if (wordCount <= 10) return true;
      
      // Contains plan-like keywords
      if (/(?:today|plan|gonna|going to|will|have|got)/i.test(message)) return true;
    }
    return false;
  }, [state.hasAskedToday, state.shouldAskForPlan]);

  /**
   * Get the daily plan question
   */
  const getDailyPlanQuestion = useCallback((): string => {
    return "What's your plan for today?";
  }, []);

  /**
   * Get mid-day check-in question
   */
  const getMidDayQuestion = useCallback((): string => {
    return "How's today going so far?";
  }, []);

  /**
   * Get evening check-in question
   */
  const getEveningQuestion = useCallback((): string => {
    return "Want to wrap up today or just relax?";
  }, []);

  return {
    ...state,
    saveDailyPlan,
    dismissMidDayCheckin,
    dismissEveningCheckin,
    getPlanResponse,
    isPlanResponse,
    getDailyPlanQuestion,
    getMidDayQuestion,
    getEveningQuestion,
    detectIntensity,
    extractKeywords,
  };
};
