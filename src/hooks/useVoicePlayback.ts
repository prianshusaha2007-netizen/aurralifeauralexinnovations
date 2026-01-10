import { useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AurraGender } from '@/contexts/AuraContext';

// ElevenLabs voice IDs mapped to gender
const VOICE_MAP: Record<AurraGender, string> = {
  neutral: 'SAz9YHcvj6GT2YYXdXww', // River - calm, balanced
  feminine: 'EXAVITQu4vr4xnSDxMaL', // Sarah - warm, friendly
  masculine: 'JBFqnCBsd6RMkjVDRZzb', // George - steady, grounded
};

export const useVoicePlayback = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isPlayingRef = useRef(false);

  const getVoiceIdForGender = useCallback((gender: AurraGender): string => {
    return VOICE_MAP[gender] || VOICE_MAP.neutral;
  }, []);

  const playText = useCallback(async (text: string, gender: AurraGender = 'neutral'): Promise<void> => {
    // Don't play if already playing
    if (isPlayingRef.current) {
      return;
    }

    // Don't play very short messages
    if (text.length < 5) {
      return;
    }

    // Truncate very long text for TTS (keep under 500 chars)
    const truncatedText = text.length > 500 ? text.slice(0, 497) + '...' : text;

    try {
      isPlayingRef.current = true;
      
      const voiceId = getVoiceIdForGender(gender);
      
      // Get session for auth
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        console.warn('No session for TTS');
        return;
      }

      // Use text-to-voice function which falls back to OpenAI TTS
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/text-to-voice`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ 
            text: truncatedText, 
            voice: 'alloy' // OpenAI TTS voice
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('TTS error:', errorData);
        return;
      }

      const data = await response.json();
      
      if (data.audioContent) {
        // Stop any existing audio
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current = null;
        }

        // Create and play audio
        const audioUrl = `data:audio/mpeg;base64,${data.audioContent}`;
        const audio = new Audio(audioUrl);
        audioRef.current = audio;

        audio.onended = () => {
          isPlayingRef.current = false;
          audioRef.current = null;
        };

        audio.onerror = () => {
          isPlayingRef.current = false;
          audioRef.current = null;
        };

        await audio.play();
      }
    } catch (error) {
      console.error('Voice playback error:', error);
      isPlayingRef.current = false;
    }
  }, [getVoiceIdForGender]);

  const stopPlayback = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    isPlayingRef.current = false;
  }, []);

  const isPlaying = useCallback(() => isPlayingRef.current, []);

  return {
    playText,
    stopPlayback,
    isPlaying,
    getVoiceIdForGender,
    VOICE_MAP,
  };
};
