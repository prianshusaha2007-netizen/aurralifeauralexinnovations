/**
 * AURRA Routine Behavior Rules
 * 
 * Core Principle: AURRA asks for life rhythm ONCE during onboarding.
 * The question: "How is your life Mon-Fri, and how are weekends different?"
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
    "Cool, adjusting just for today 👍",
    "Want this change only for today or going forward?",
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
    "What time do you wake up?", // Never ask after onboarding
    "What are your hobbies?", // Never ask after onboarding
    "Tell me about your routine", // Never ask after onboarding
  ],
  
  // The ONE life rhythm question (asked ONCE only during onboarding)
  lifeRhythmQuestion: `Before we plan anything, tell me a little about how your days usually look 🙂

How is your life from Monday to Friday?
And how are Saturday & Sunday different?`,
  
  // Daily opening question (THE ONLY question asked daily)
  dailyOpeningQuestion: "What's your plan for today?",
  
  // Responses based on plan intensity
  planResponses: {
    busy: "Got it. Let's keep things simple today.",
    light: "Okay. We'll go light.",
    normal: "Alright. I'm here if anything comes up.",
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
  
  // Rhythm edit triggers - user must explicitly request
  rhythmEditTriggers: [
    "change my routine",
    "edit my routine",
    "update my schedule",
    "change my weekdays",
    "change my weekends",
    "my schedule changed",
    "new routine",
    "reset my routine",
  ],
};

/**
 * Check if a message is asking to edit routine
 */
export function isRoutineEditRequest(message: string): boolean {
  const lowerMessage = message.toLowerCase();
  return ROUTINE_BEHAVIOR_RULES.rhythmEditTriggers.some(trigger => 
    lowerMessage.includes(trigger)
  );
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
 * Detect plan intensity from user's response
 */
export function detectPlanIntensity(message: string): 'busy' | 'light' | 'normal' | 'unknown' | 'noplan' {
  const lowerMessage = message.toLowerCase();
  
  const busyKeywords = ['busy', 'packed', 'hectic', 'lot', 'tons', 'full', 'meetings', 'deadline'];
  const lightKeywords = ['light', 'chill', 'relax', 'easy', 'nothing', 'free', 'rest', 'lazy'];
  const noPlanKeywords = ['no plan', 'not sure', 'don\'t know', 'no idea', 'whatever'];
  
  if (noPlanKeywords.some(kw => lowerMessage.includes(kw))) return 'noplan';
  if (busyKeywords.some(kw => lowerMessage.includes(kw))) return 'busy';
  if (lightKeywords.some(kw => lowerMessage.includes(kw))) return 'light';
  
  // Check for activity mentions = normal day
  const activityKeywords = ['work', 'study', 'gym', 'college', 'office', 'class'];
  if (activityKeywords.some(kw => lowerMessage.includes(kw))) return 'normal';
  
  return 'unknown';
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

/**
 * Check if it's an appropriate time for a mid-day or evening check-in
 */
export function shouldDoCheckIn(lastCheckInTime: Date | null): 'midDay' | 'evening' | null {
  const now = new Date();
  const hour = now.getHours();
  const today = now.toISOString().split('T')[0];
  
  // Already checked in today
  if (lastCheckInTime && lastCheckInTime.toISOString().split('T')[0] === today) {
    return null;
  }
  
  // Mid-day check-in: 12-15
  if (hour >= 12 && hour < 15) {
    return 'midDay';
  }
  
  // Evening check-in: 18-21
  if (hour >= 18 && hour < 21) {
    return 'evening';
  }
  
  return null;
}
