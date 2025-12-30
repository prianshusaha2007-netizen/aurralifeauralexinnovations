import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UseVoiceGreetingReturn {
  playGreeting: (text: string) => Promise<void>;
  isPlaying: boolean;
  error: string | null;
}

export const useVoiceGreeting = (): UseVoiceGreetingReturn => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const playGreeting = useCallback(async (text: string) => {
    if (isPlaying) return;
    
    setIsPlaying(true);
    setError(null);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.log('No session, skipping voice greeting');
        setIsPlaying(false);
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-tts`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ text }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.log('TTS response not ok:', errorData);
        setIsPlaying(false);
        return;
      }

      const data = await response.json();
      
      if (data.audioContent) {
        const audioUrl = `data:audio/mpeg;base64,${data.audioContent}`;
        const audio = new Audio(audioUrl);
        
        audio.onended = () => setIsPlaying(false);
        audio.onerror = () => {
          console.error('Audio playback error');
          setIsPlaying(false);
        };
        
        await audio.play();
      } else {
        setIsPlaying(false);
      }
    } catch (err) {
      console.error('Voice greeting error:', err);
      setError(err instanceof Error ? err.message : 'Failed to play greeting');
      setIsPlaying(false);
    }
  }, [isPlaying]);

  return { playGreeting, isPlaying, error };
};

// Morning greeting messages based on time
export const getMorningGreeting = (userName: string, aiName: string = 'AURRA'): string => {
  const hour = new Date().getHours();
  
  if (hour >= 5 && hour < 12) {
    const greetings = [
      `Good morning, ${userName}. ${aiName} here. Hope you slept well.`,
      `Morning, ${userName}. Ready for today?`,
      `Hey ${userName}, good morning. Let's make today count.`,
      `Rise and shine, ${userName}. ${aiName}'s here when you need me.`,
    ];
    return greetings[Math.floor(Math.random() * greetings.length)];
  } else if (hour >= 12 && hour < 17) {
    return `Good afternoon, ${userName}. How's your day going?`;
  } else if (hour >= 17 && hour < 21) {
    return `Good evening, ${userName}. How was your day?`;
  } else {
    return `Hey ${userName}. Still up? I'm here if you need to talk.`;
  }
};

// Onboarding naming step greeting
export const getOnboardingNamingGreeting = (): string => {
  return "This is completely optional, but giving me a name can make our conversations feel more personal. What would you like to call me?";
};
