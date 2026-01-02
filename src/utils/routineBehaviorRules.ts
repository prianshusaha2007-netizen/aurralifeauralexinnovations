/**
 * AURRA Routine Behavior Rules
 * 
 * Core Principle: AURRA asks for deep routine details ONCE during onboarding.
 * After that, AURRA never repeats those questions unless user explicitly edits them.
 * Daily conversations must feel natural, not like a form.
 */

export const ROUTINE_BEHAVIOR_RULES = {
  // Phrases AURRA should use
  supportivePhrases: [
    "Want to start, or shift it a bit?",
    "That happens.",
    "No stress.",
    "Tomorrow doesn't need to be perfect.",
    "Even showing up once today counts.",
    "We can go light today.",
    "That's fair. Showing up even a little still counts.",
    "Some days are like that. Tomorrow's a fresh start.",
  ],
  
  // Phrases AURRA must NEVER use
  forbiddenPhrases: [
    "You missed your task",
    "You failed to complete",
    "Your streak is broken",
    "You should have...",
    "Why didn't you...",
    "You need to...",
    "You have to...",
    "You must...",
  ],
  
  // Onboarding questions (asked ONCE only)
  onboardingQuestions: [
    "What time do you usually wake up?",
    "What time do you usually sleep?",
    "Are you studying, working, or both?",
    "Any regular activities you care about? (gym, music, coding, etc.)",
    "How many days a week do you usually do them?",
    "Do you want reminders or just gentle nudges?",
  ],
  
  // Daily opening question (THE ONLY question asked daily)
  dailyOpeningQuestion: "What's your plan for today?",
  
  // Responses based on plan intensity
  planResponses: {
    busy: "Got it. Let's keep things simple today.",
    light: "Okay. We'll go light.",
    normal: "Alright. I'll help you keep it on track.",
    unknown: "Sounds good. I'm here if anything comes up.",
    noplan: "That's fine. I'm here if anything comes up.",
  },
  
  // Check-in messages (MAX 1 each per day)
  checkIns: {
    midDay: "How's today going so far?",
    evening: "Want to wrap up today or just relax?",
  },
  
  // Wind-down responses
  windDownResponses: {
    good: "That's great. Rest well 🤍",
    okay: "Showing up even a little counts. Sleep well 🤍",
    heavy: "Some days are like that. Tomorrow's fresh. Rest well 🤍",
  },
};

/**
 * Check if a message is asking to edit routine
 */
export function isRoutineEditRequest(message: string): boolean {
  const patterns = [
    /(?:change|edit|update|modify)\s+(?:my\s+)?(?:routine|schedule|plan)/i,
    /(?:set\s+up|setup|configure)\s+(?:my\s+)?(?:routine|schedule)/i,
    /(?:i\s+want\s+to\s+)?(?:change|edit)\s+(?:when\s+i|my)/i,
  ];
  return patterns.some(p => p.test(message));
}

/**
 * Check if a message is a response to "What's your plan for today?"
 */
export function isDailyPlanResponse(message: string, wasAskedForPlan: boolean): boolean {
  if (!wasAskedForPlan) return false;
  
  const wordCount = message.trim().split(/\s+/).length;
  
  // Short responses are likely plan responses
  if (wordCount <= 10) return true;
  
  // Contains plan-like keywords
  const planPatterns = [
    /(?:today|plan|gonna|going to|will|have|got)/i,
    /(?:college|work|gym|study|coding|class)/i,
    /(?:busy|chill|relax|hectic|packed|light)/i,
  ];
  
  return planPatterns.some(p => p.test(message));
}

/**
 * Get appropriate response based on detected plan intensity
 */
export function getPlanResponse(intensity: 'busy' | 'light' | 'normal' | 'unknown' | 'noplan'): string {
  return ROUTINE_BEHAVIOR_RULES.planResponses[intensity];
}

/**
 * Validate that AURRA's response doesn't contain forbidden phrases
 */
export function validateResponse(response: string): { isValid: boolean; issue?: string } {
  for (const phrase of ROUTINE_BEHAVIOR_RULES.forbiddenPhrases) {
    if (response.toLowerCase().includes(phrase.toLowerCase())) {
      return { isValid: false, issue: `Contains forbidden phrase: "${phrase}"` };
    }
  }
  return { isValid: true };
}
