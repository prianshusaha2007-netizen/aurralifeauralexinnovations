import { useRef, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useVoiceFeedback = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const speak = useCallback(async (text: string): Promise<void> => {
    if (isSpeaking) {
      audioRef.current?.pause();
      setIsSpeaking(false);
    }

    // Clean text for speech (remove emojis and special chars)
    const cleanText = text
      .replace(/[\u{1F300}-\u{1F9FF}]/gu, '')
      .replace(/[*_~`#]/g, '')
      .trim();

    if (!cleanText) return;

    try {
      setIsSpeaking(true);
      
      const { data, error } = await supabase.functions.invoke('text-to-voice', {
        body: { text: cleanText, voice: 'nova' }
      });

      if (error) throw error;

      if (data?.requiresSetup) {
        console.log('Voice feedback requires OpenAI API key setup');
        setIsSpeaking(false);
        return;
      }

      if (data?.audioContent) {
        const audio = new Audio(`data:audio/mp3;base64,${data.audioContent}`);
        audioRef.current = audio;
        
        return new Promise((resolve) => {
          audio.onended = () => {
            setIsSpeaking(false);
            resolve();
          };
          audio.onerror = () => {
            setIsSpeaking(false);
            resolve();
          };
          audio.play().catch(() => {
            setIsSpeaking(false);
            resolve();
          });
        });
      }
    } catch (error) {
      console.error('Voice feedback error:', error);
      setIsSpeaking(false);
    }
  }, [isSpeaking]);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsSpeaking(false);
  }, []);

  return { speak, stop, isSpeaking };
};
