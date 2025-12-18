import { useRef, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useVoiceFeedback = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const speak = useCallback(async (text: string): Promise<void> => {
    if (isSpeaking) {
      audioRef.current?.pause();
      audioRef.current = null;
      setIsSpeaking(false);
      return;
    }

    // Clean text for speech (remove emojis and special chars)
    const cleanText = text
      .replace(/[\u{1F300}-\u{1F9FF}]/gu, '')
      .replace(/[*_~`#]/g, '')
      .replace(/\[.*?\]/g, '') // Remove markdown links
      .replace(/!\[.*?\]\(.*?\)/g, '') // Remove images
      .trim();

    if (!cleanText || cleanText.length < 2) return;

    try {
      setIsSpeaking(true);
      
      // Try ElevenLabs first (better quality)
      const { data, error } = await supabase.functions.invoke('elevenlabs-tts', {
        body: { text: cleanText }
      });

      if (error) {
        console.error('ElevenLabs TTS error:', error);
        // Fallback to OpenAI TTS
        const fallbackResponse = await supabase.functions.invoke('text-to-voice', {
          body: { text: cleanText, voice: 'nova' }
        });
        
        if (fallbackResponse.data?.audioContent) {
          const audio = new Audio(`data:audio/mp3;base64,${fallbackResponse.data.audioContent}`);
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
        setIsSpeaking(false);
        return;
      }

      if (data?.requiresSetup) {
        console.log('Voice feedback requires API key setup');
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
          audio.play().catch((err) => {
            console.error('Audio playback error:', err);
            setIsSpeaking(false);
            resolve();
          });
        });
      } else {
        setIsSpeaking(false);
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

