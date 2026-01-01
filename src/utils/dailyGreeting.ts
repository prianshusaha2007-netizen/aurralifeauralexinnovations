// Daily greeting tracker to ensure AURRA only greets once per day

const GREETING_KEY = 'aura-last-greeting-date';

/**
 * Check if a greeting has already been shown today
 */
export const hasGreetedToday = (): boolean => {
  const lastGreeting = localStorage.getItem(GREETING_KEY);
  if (!lastGreeting) return false;
  
  const today = new Date().toDateString();
  return lastGreeting === today;
};

/**
 * Mark that a greeting was shown today
 */
export const markGreetingShown = (): void => {
  const today = new Date().toDateString();
  localStorage.setItem(GREETING_KEY, today);
};

/**
 * Get appropriate presence message based on context
 * Use presence instead of repeated greetings
 */
export const getPresenceMessage = (): string => {
  const hour = new Date().getHours();
  const hasGreeted = hasGreetedToday();
  
  if (!hasGreeted) {
    // First interaction of the day - actual greeting
    if (hour < 12) {
      return "Morning 🙂 Ready when you are.";
    } else if (hour < 17) {
      return "Hey. What's on your mind?";
    } else if (hour < 21) {
      return "Evening. Want to chat or just chill?";
    } else {
      return "Hey. Still up?";
    }
  }
  
  // Already greeted today - use presence instead
  const presenceMessages = [
    "Here with you.",
    "Ready when you are.",
    "What's up?",
    "I'm here.",
    "Want to continue from earlier?",
  ];
  
  return presenceMessages[Math.floor(Math.random() * presenceMessages.length)];
};

/**
 * Reset greeting state (useful for testing or new day logic)
 */
export const resetGreetingState = (): void => {
  localStorage.removeItem(GREETING_KEY);
};
