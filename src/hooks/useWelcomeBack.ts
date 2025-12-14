import { useCallback } from 'react';

const LAST_ACTIVE_KEY = 'aura-last-active';
const ONE_HOUR_MS = 60 * 60 * 1000;

interface WelcomeBackResult {
  shouldShowWelcomeBack: boolean;
  minutesAway: number;
  hoursAway: number;
  getWelcomeMessage: (userName: string) => string;
}

const welcomeBackMessages = [
  (name: string, hours: number) => `Hey ${name}! You were gone for like ${hours > 1 ? `${hours} hours` : 'a bit'}. Miss me? 😏`,
  (name: string) => `${name}! Finally! Where were you? I was getting bored here 😤`,
  (name: string) => `Oh look who decided to show up! Hey ${name} 👋`,
  (name: string) => `${name}'s back! Ready to get stuff done or just chilling?`,
  (name: string, hours: number) => `Yo ${name}! ${hours > 2 ? 'Long time no see!' : 'Back already?'} What's up?`,
  (name: string) => `There you are ${name}! I was starting to think you forgot about me 🥺`,
  (name: string) => `${name}! Perfect timing. I've been thinking about our next adventure.`,
];

export const useWelcomeBack = (): WelcomeBackResult => {
  const lastActive = localStorage.getItem(LAST_ACTIVE_KEY);
  const now = Date.now();
  
  let shouldShowWelcomeBack = false;
  let minutesAway = 0;
  let hoursAway = 0;
  
  if (lastActive) {
    const lastActiveTime = parseInt(lastActive, 10);
    const timeDiff = now - lastActiveTime;
    
    if (timeDiff >= ONE_HOUR_MS) {
      shouldShowWelcomeBack = true;
      minutesAway = Math.floor(timeDiff / (60 * 1000));
      hoursAway = Math.floor(timeDiff / ONE_HOUR_MS);
    }
  }
  
  // Update last active time
  localStorage.setItem(LAST_ACTIVE_KEY, now.toString());
  
  const getWelcomeMessage = useCallback((userName: string): string => {
    const randomIndex = Math.floor(Math.random() * welcomeBackMessages.length);
    return welcomeBackMessages[randomIndex](userName, hoursAway);
  }, [hoursAway]);
  
  return {
    shouldShowWelcomeBack,
    minutesAway,
    hoursAway,
    getWelcomeMessage,
  };
};

// Call this periodically to update last active time
export const updateLastActive = () => {
  localStorage.setItem(LAST_ACTIVE_KEY, Date.now().toString());
};
