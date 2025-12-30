import { useState, useCallback } from 'react';

type HumorState = 'idle' | 'offered' | 'confirmed' | 'delivered';

export const useHumorSystem = () => {
  const [humorState, setHumorState] = useState<HumorState>('idle');
  const [lastJokeTime, setLastJokeTime] = useState<Date | null>(null);

  // Check if we can offer humor (not too frequent)
  const canOfferHumor = useCallback((): boolean => {
    if (humorState !== 'idle') return false;
    if (lastJokeTime) {
      const minutesSinceLast = (Date.now() - lastJokeTime.getTime()) / (1000 * 60);
      if (minutesSinceLast < 30) return false; // Don't offer jokes within 30 minutes
    }
    return true;
  }, [humorState, lastJokeTime]);

  // Mark that humor was offered
  const markHumorOffered = useCallback(() => {
    setHumorState('offered');
  }, []);

  // Check if user confirmed they want a joke
  const detectHumorConfirmation = useCallback((message: string): boolean => {
    if (humorState !== 'offered') return false;
    
    const confirmPatterns = [
      /^(?:yes|yeah|yep|yup|sure|ok|okay|go|go ahead|please|tell me|do it)$/i,
      /^(?:yes please|sure thing|let's hear it|go on|tell me a joke|haan|ha|bol|bolo)$/i,
      /(?:yes|yeah|sure).{0,20}(?:joke|funny|laugh)/i,
    ];
    
    const isConfirmation = confirmPatterns.some(p => p.test(message.toLowerCase().trim()));
    
    if (isConfirmation) {
      setHumorState('confirmed');
      return true;
    }
    
    // If they said no or changed topic, reset
    const declinePatterns = [
      /^(?:no|nah|nope|not now|maybe later|skip|later)$/i,
      /(?:no thanks|not really|I'm good|focus|stay focused)/i,
    ];
    
    if (declinePatterns.some(p => p.test(message.toLowerCase().trim()))) {
      setHumorState('idle');
    }
    
    return false;
  }, [humorState]);

  // Mark joke as delivered
  const markJokeDelivered = useCallback(() => {
    setHumorState('idle');
    setLastJokeTime(new Date());
  }, []);

  // Check if user is explicitly requesting a joke
  const detectJokeRequest = useCallback((message: string): boolean => {
    const jokePatterns = [
      /(?:tell|give|share)\s+(?:me\s+)?(?:a\s+)?(?:joke|something funny)/i,
      /(?:make me laugh|cheer me up|I need a laugh)/i,
      /(?:joke|mazak|funny)\s+(?:sunao|batao|karo)/i,
      /(?:got any jokes|know any jokes)/i,
    ];
    
    const isRequest = jokePatterns.some(p => p.test(message.toLowerCase()));
    
    if (isRequest) {
      setHumorState('confirmed');
      return true;
    }
    
    return false;
  }, []);

  // Reset humor state
  const resetHumorState = useCallback(() => {
    setHumorState('idle');
  }, []);

  return {
    humorState,
    canOfferHumor,
    markHumorOffered,
    detectHumorConfirmation,
    markJokeDelivered,
    detectJokeRequest,
    resetHumorState,
  };
};
